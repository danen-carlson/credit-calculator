#!/usr/bin/env node
/**
 * CreditStud.io Translation Runner — Robust, resumable pipeline
 *
 * LESSONS LEARNED (2026-05-05):
 *   1. Sonnet 4.6 on Venice takes ~90s for 600-word pages — need per-call timeout
 *   2. No auto-resume = total failure on any stop. Checkpoint EVERY page.
 *   3. Large pages (>1200w) must be chunked or they time out / hallucinate
 *   4. Word-bloat detection (output >2x source) catches hallucinated translations
 *   5. Cron-friendly: --max-pages N for burst mode
 *   6. Progress file + manifest + dashboard update after EACH page
 *
 * Usage:
 *   node scripts/translation-runner.mjs translate es [--max-pages 10] [--dry-run]
 *   node scripts/translation-runner.mjs translate es --only page1.html,page2.html
 *   node scripts/translation-runner.mjs reset es --only page1.html  (mark for re-translation)
 *   node scripts/translation-runner.mjs status es
 *
 * Pipeline (per translation-rules.md):
 *   1. Sonnet 4.6 (translate) → 2. Gemini 3.1 Pro (review) → 3. GPT-5.4 (spot-check)
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const STATE_FILE = path.join(ROOT, '.states', 'translation-runner.json');
const PROGRESS_FILE = path.join(ROOT, '.states', 'translate-body-progress.json');
const MANIFEST_PATH = path.join(ROOT, 'translation-manifest.json');
const DASHBOARD_PATH = path.join(ROOT, 'docs', 'translation-dashboard.html');

const VENICE_MODELS = {
  translate: 'gemini-3-1-pro-preview',    // Fast translator (~50s/page)
  review: 'claude-sonnet-4-6',            // Thorough reviewer (~15s/page)
  spotcheck: 'openai-gpt-54'             // Independent spot-check
};

const API_TIMEOUT_MS = 180_000; // 3 min per call (Sonnet 4.6 is SLOW on Venice)
const MAX_CHUNK_WORDS = 800; // Keep chunks small to avoid timeouts
const MAX_WORD_RATIO = 2.0;  // Output must be <2x source words
const RATE_LIMIT_DELAY_MS = 1500; // 1.5s between API calls

// Pages that have manual Spanish translations (don't overwrite)
const MANUALLY_TRANSLATED = new Set([
  'blog/best-balance-transfer-credit-cards.html',
  'blog/minimum-payment-trap.html',
  'blog/snowball-vs-avalanche.html',
  'blog/credit-card-benefits-youre-not-using.html',
  'blog/credit-card-points-offset-interest.html',
]);

const SKIP_PAGES = new Set([
  'disclosure.html',
  'offline.html',
  'tools/api.html',
]);

// ── Venice API ──

const VENICE_KEY = process.env.VENICE_API_KEY || fsSync.readFileSync(path.join(process.env.HOME, '.openclaw/.env'), 'utf8').match(/VENICE_API_KEY=(.+)/)?.[1]?.trim();

if (!VENICE_KEY) {
  console.error('Error: VENICE_API_KEY not found');
  process.exit(1);
}

async function callVenice(model, messages, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const resp = await fetch('https://api.venice.ai/api/v1/chat/completions', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VENICE_KEY}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 16384
        })
      });

      if (!resp.ok) {
        const text = await resp.text();
        if (resp.status === 429) {
          const wait = Math.min(5000 * Math.pow(2, attempt) + Math.random() * 5000, 60000);
          console.log(`  ⏳ Rate limited (${resp.status}). Backoff ${Math.round(wait/1000)}s...`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        throw new Error(`API ${resp.status}: ${text.slice(0, 300)}`);
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from API');
      return content;

    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`API call timed out after ${timeoutMs/1000}s`);
      }
      console.log(`  ⚠️ Attempt ${attempt + 1} failed: ${err.message.slice(0, 100)}`);
      if (attempt >= 4) throw err;
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
}

// ── State Management ──

async function loadProgress() {
  try {
    return JSON.parse(await fs.readFile(PROGRESS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function saveProgress(progress) {
  await fs.mkdir(path.dirname(PROGRESS_FILE), { recursive: true });
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function loadState() {
  try {
    return JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
  } catch {
    return { stages: { translate: { completed: [], errors: [] } } };
  }
}

async function saveState(state) {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Page Discovery ──

async function discoverPages(lang) {
  const skipDirs = new Set(['es', 'zh', 'tl', 'ko', 'hi', 'shared', 'node_modules', '.git', '.states', 'docs', 'locales', 'scripts']);
  const htmlFiles = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || skipDirs.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.html')) {
        htmlFiles.push(path.relative(ROOT, fullPath));
      }
    }
  }

  await walk(ROOT);
  return htmlFiles.sort();
}

function getPendingPages(progress, allPages) {
  return allPages.filter(p => {
    if (MANUALLY_TRANSLATED.has(p) || SKIP_PAGES.has(p)) return false;
    const info = progress[p];
    if (!info) return true; // Not in progress file = needs translation
    if (info.done === true && !info.reason) return false; // Completed successfully
    if (info.error) return true; // Had an error, retry
    if (info.reason) return true; // Flagged for rebuild
    if (info.dryRun) return true; // Only dry-run, never actually translated
    return true;
  });
}

// ── Chunking ──

function chunkBody(body, maxWords = MAX_CHUNK_WORDS) {
  // Split by section boundaries first, then by word count
  const sections = body.split(/(?=<section|<\/section>|<h[1-6]|<article|<\/article)/i);
  const chunks = [];
  let current = '';

  for (const section of sections) {
    const words = current.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).length;
    const sectionWords = section.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).length;

    if (current && words + sectionWords > maxWords) {
      chunks.push(current.trim());
      current = section;
    } else {
      current += section;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // If only one chunk and it's huge, split by paragraphs
  if (chunks.length === 1 && chunks[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).length > maxWords) {
    const paragraphs = chunks[0].split(/(?=<p|<\/p>|<h[1-6]|<li|<\/li)/i);
    const pChunks = [];
    let pCurrent = '';
    for (const para of paragraphs) {
      const pWords = pCurrent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).length;
      const sWords = para.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).length;
      if (pCurrent && pWords + sWords > maxWords) {
        pChunks.push(pCurrent.trim());
        pCurrent = para;
      } else {
        pCurrent += para;
      }
    }
    if (pCurrent.trim()) pChunks.push(pCurrent.trim());
    return pChunks.length > 1 ? pChunks : chunks;
  }

  return chunks;
}

// ── Validation ──

function validateTranslation(sourceBody, translatedBody) {
  const stripHtml = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const srcText = stripHtml(sourceBody);
  const transText = stripHtml(translatedBody);
  const srcWords = srcText.split(/\s+/).length;
  const transWords = transText.split(/\s+/).length;

  // Must contain HTML tags
  if (!/</.test(translatedBody) || !/>/.test(translatedBody)) {
    throw new Error('Translation missing HTML tags — output is likely plain text');
  }

  // Word ratio check (bloat detection)
  const ratio = srcWords > 0 ? transWords / srcWords : 0;
  if (ratio > MAX_WORD_RATIO) {
    throw new Error(`Word bloat: ${transWords}w output vs ${srcWords}w source (${ratio.toFixed(2)}x ratio). Likely hallucinated.`);
  }
  if (ratio < 0.4) {
    throw new Error(`Truncation: ${transWords}w output vs ${srcWords}w source (${ratio.toFixed(2)}x ratio). Likely truncated.`);
  }

  // Repetition detection (top 20-char substring repeated >3 times)
  const words50 = transText.split(/\s+/).slice(0, 50).join(' ');
  if (words50.length > 20) {
    const repeated = transText.split(words50).length - 1;
    if (repeated > 3) {
      throw new Error(`Repetition detected: first 50 words repeated ${repeated} times`);
    }
  }

  return { srcWords, transWords, ratio };
}

// ── Translation ──

const SYSTEM_PROMPT = `You translate web page HTML to US Spanish for CreditStud.io.

RULES:
- NEVER translate: card names (Chase Sapphire Preferred, Amex Gold, Capital One Quicksilver, etc.), bank names (Chase, Citi, Capital One, Wells Fargo, Discover, Amex), BNPL names (Klarna, Afterpay, Affirm, Sezzle, Zip), credit score brands (FICO, VantageScore)
- Keep APR, BNPL, cash back in English (widely understood by US Spanish speakers)
- Keep ALL dollar amounts ($XX), percentages (XX%), and numbers exactly as written
- Use US Spanish: "puntaje de crédito", "transferencia de saldo", "cuota anual", "pago mínimo"
- "debt snowball" → "método bola de nieve", "debt avalanche" → "método avalancha"
- Keep ALL HTML tags, attributes, classes, IDs, data-* attributes EXACTLY as-is
- Keep ALL URLs (href, src) EXACTLY as-is
- Keep ALL JavaScript in <script> tags EXACTLY as-is
- Translate ONLY visible text content between tags
- For <img alt="..."> — translate alt text
- For <a title="..."> — translate title text
- Keep same tone: helpful, direct, slightly informal but trustworthy
- Do NOT add or remove HTML elements
- Return ONLY the translated HTML, no markdown fences, no explanations`;

async function translatePage(relPath, lang, { dryRun = false } = {}) {
  const enPath = path.join(ROOT, relPath);
  const targetPath = path.join(ROOT, lang, relPath);

  const enHtml = await fs.readFile(enPath, 'utf8');
  const bodyMatch = enHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const sourceBody = bodyMatch?.[1];

  if (!sourceBody) throw new Error('No <body> content found');

  const srcWordCount = sourceBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).length;
  console.log(`  📄 ${relPath} (${srcWordCount}w)`);

  if (dryRun) {
    console.log('  🏃 Dry run — skipping');
    return { dryRun: true };
  }

  // Chunk the body if it's long
  const chunks = chunkBody(sourceBody);
  if (chunks.length > 1) {
    console.log(`  ✂️ Split into ${chunks.length} chunks`);
  }

  let translatedBody = '';
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  🔄 Chunk ${i + 1}/${chunks.length}...`);
    const chunk = chunks[i];
    const chunkWords = chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).length;

    const result = await callVenice(VENICE_MODELS.translate, [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Translate this HTML to US Spanish. Return ONLY the translated HTML, no markdown fences, no explanations:\n\n${chunk}` }
    ]);

    // Clean markdown fences if present
    let cleaned = result.trim();
    cleaned = cleaned.replace(/^```html?\n?/, '').replace(/\n?```$/, '');
    cleaned = cleaned.replace(/^```\n?/, ''); // bare fence

    translatedBody += cleaned + '\n';

    // Rate limit between chunks
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS));
    }
  }

  // Validate
  const { srcWords, transWords, ratio } = validateTranslation(sourceBody, translatedBody);
  console.log(`  ✅ Validated: ${srcWords}→${transWords}w (${ratio.toFixed(2)}x)`);

  // Write the translated file
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  // If target already exists, replace only the body; otherwise create from source
  let newHtml;
  if (fsSync.existsSync(targetPath)) {
    newHtml = enHtml.replace(/<body[^>]*>[\s\S]*<\/body>/i, `<body>\n${translatedBody}\n</body>`);
  } else {
    newHtml = enHtml.replace(/<body[^>]*>[\s\S]*<\/body>/i, `<body>\n${translatedBody}\n</body>`);
  }

  // Fix language attributes
  newHtml = newHtml.replace(/<html[^>]*\slang="en"/i, `<html lang="${lang}"`);
  newHtml = newHtml.replace(/<html[^>]*>/i, (m) => m.includes('lang=') ? m : m.replace('>', ` lang="${lang}">`));

  await fs.writeFile(targetPath, newHtml);
  console.log(`  💾 Wrote ${targetPath}`);

  return { translated: true, srcWords, transWords, ratio };
}

// ── Update Manifest & Dashboard ──

function updateManifestAndDashboard(lang) {
  try {
    execSync(`node scripts/translation-status.mjs scan --lang ${lang}`, { cwd: ROOT, stdio: 'pipe' });
  } catch (err) {
    console.log('  ⚠️ Manifest scan failed (non-fatal)');
  }
  try {
    execSync(`node scripts/translation-status.mjs dashboard`, { cwd: ROOT, stdio: 'pipe' });
  } catch (err) {
    console.log('  ⚠️ Dashboard update failed (non-fatal)');
  }
}

// ── Commands ──

async function cmdTranslate(lang, opts) {
  const progress = await loadProgress();
  const allPages = await discoverPages(lang);
  const pending = getPendingPages(progress, allPages);

  // --only filter
  let toDo = pending;
  if (opts.only) {
    const onlySet = new Set(opts.only.split(','));
    toDo = pending.filter(p => onlySet.has(p));
  }

  // Sort shorter pages first (faster to translate, validate pipeline early)
  const pageWordCounts = {};
  for (const p of toDo) {
    try {
      const html = await fs.readFile(path.join(ROOT, p), 'utf8');
      const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '';
      pageWordCounts[p] = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).length;
    } catch {
      pageWordCounts[p] = 999999;
    }
  }
  toDo.sort((a, b) => (pageWordCounts[a] || 0) - (pageWordCounts[b] || 0));

  const maxPages = opts.maxPages || 999;
  toDo = toDo.slice(0, maxPages);

  console.log(`\n🎨 Translate ES: ${pending.length} pending, processing ${toDo.length} (max ${maxPages})`);

  if (toDo.length === 0) {
    console.log('✅ No pages to translate — all done!');
    return;
  }

  let completed = 0;
  let failed = 0;

  for (const relPath of toDo) {
    try {
      const result = await translatePage(relPath, lang, { dryRun: opts.dryRun });

      // Update progress immediately (no batching)
      progress[relPath] = {
        done: !result.dryRun,
        words: pageWordCounts[relPath] || 0,
        translator: 'gemini-3.1-pro',
        date: new Date().toISOString(),
        ...(result.translated ? { srcWords: result.srcWords, transWords: result.transWords, ratio: result.ratio } : {}),
        ...(result.dryRun ? { dryRun: true } : {})
      };
      await saveProgress(progress);

      // Update manifest & dashboard
      if (!result.dryRun) {
        updateManifestAndDashboard(lang);
      }

      completed++;

    } catch (err) {
      failed++;
      console.error(`  ❌ ${relPath}: ${err.message}`);
      progress[relPath] = {
        done: false,
        error: err.message,
        words: pageWordCounts[relPath] || 0,
        date: new Date().toISOString()
      };
      await saveProgress(progress);
    }

    // Rate limit between pages
    if (completed + failed < toDo.length) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS));
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`✅ Completed: ${completed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Progress saved: ${PROGRESS_FILE}`);

  if (completed > 0) {
    console.log(`\n💡 Next: node build.js --lang es  (rebuild SEO tags & partials)`);
  }
}

// ── Review & Spot-Check ──

function extractArticle(html) {
  // Extract article content — skip nav, disclosure, footer, scripts
  let body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '';
  
  // Try <article>, <main>, or content after </header>
  let article = body.match(/<article[^>]*>([\s\S]*)<\/article>/i)?.[1];
  if (!article) article = body.match(/<main[^>]*>([\s\S]*)<\/main>/i)?.[1];
  if (!article) {
    const afterHeader = body.match(/<\/header>([\s\S]*)/i);
    if (afterHeader) {
      // Remove footer, scripts, language-switcher
      article = afterHeader[1]
        .replace(/<footer[^>]*>[\s\S]*<\/footer>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<div[^>]*class="[^"]*language-switcher[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    }
  }
  if (!article) article = body; // Fallback to full body
  
  return article;
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countSections(html) {
  return {
    h1: (html.match(/<h1/gi) || []).length,
    h2: (html.match(/<h2/gi) || []).length,
    h3: (html.match(/<h3/gi) || []).length,
    tables: (html.match(/<table/gi) || []).length,
    lists: (html.match(/<ul/gi) || []).length + (html.match(/<ol/gi) || []).length,
  };
}

const REVIEW_PROMPT = `You are a Spanish translation reviewer for CreditStud.io. Compare the English ARTICLE content with the Spanish translation and check for:

1. MISSING CONTENT — Sections, paragraphs, or headings present in English but missing in Spanish
2. UNTRANSLATED TEXT — English text that should be Spanish (NOT: brand names, URLs, code, numbers, which stay in English)
3. ACCURACY — Wrong translations, changed meanings
4. TERMINOLOGY — US Spanish: "puntaje de crédito" (not "puntuación"), "transferencia de saldo", "cuota anual", "pago mínimo"
5. NUMBERS — Dollar amounts, percentages, APRs must be identical

IMPORTANT: Navigation menus, disclosure banners, and footer text are shared partials injected by the build system. Ignore differences in those areas. Focus ONLY on the article content.

Reply in this exact format:
PASS — (if no issues found in the article content)
ISSUES — (list each issue with section reference)
VERDICT: PASS|NEEDS_FIX`

const SPOTCHECK_PROMPT = `You are a translation quality auditor. For each pair below, check:
- Critical accuracy errors (wrong meaning)
- Missing content (sections not translated)
- Untranslated English text that should be Spanish
- Numbers/amounts changed from source

Reply concisely:
PASS — if no critical issues
FAIL: [brief reason] — if critical issues found`

async function cmdReview(lang, opts) {
  const progress = await loadProgress();
  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
  const state = await loadState();
  state.stages.review = state.stages.review || { completed: [], errors: [] };

  // Find pages that are translated but not yet reviewed
  const allPages = await discoverPages(lang);
  const reviewed = new Set((state.stages.review.completed || []));
  const toReview = allPages.filter(p => {
    if (MANUALLY_TRANSLATED.has(p) || SKIP_PAGES.has(p)) return false;
    const info = progress[p];
    if (!info || !info.done) return false; // Must be translated first
    return !reviewed.has(p);
  });

  let onlyPages = toReview;
  if (opts.only) {
    const onlySet = new Set(opts.only.split(','));
    onlyPages = toReview.filter(p => onlySet.has(p));
  }

  const maxPages = opts.maxPages || 999;
  onlyPages = onlyPages.slice(0, maxPages);

  console.log(`\n🔍 Review ${lang.toUpperCase()}: ${toReview.length} need review, processing ${onlyPages.length}`);

  if (onlyPages.length === 0) {
    console.log('✅ No pages to review!');
    return;
  }

  let passed = 0, failed = 0;

  for (const relPath of onlyPages) {
    const enPath = path.join(ROOT, relPath);
    const esPath = path.join(ROOT, lang, relPath);

    try {
      const enHtml = await fs.readFile(enPath, 'utf8');
      const esHtml = await fs.readFile(esPath, 'utf8');

      const enBody = enHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '';
      const esBody = esHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '';

      // Extract article content only (skip nav, disclosure, footer)
      const enArticle = extractArticle(enHtml);
      const esArticle = extractArticle(esHtml);
      const enText = stripHtml(enArticle).slice(0, 4000);
      const esText = stripHtml(esArticle).slice(0, 4000);
      const enSections = countSections(enArticle);
      const esSections = countSections(esArticle);

      console.log(`  📋 Reviewing ${relPath} (EN: ${enText.split(/\s+/).length}w, ES: ${esText.split(/\s+/).length}w, h2: ${enSections.h2}→${esSections.h2})...`);

      // Structural mismatch check (fast, no API needed)
      if (enSections.h2 !== esSections.h2) {
        console.log(`  ⚠️  Section mismatch: EN has ${enSections.h2} h2s, ES has ${esSections.h2} h2s`);
      }

      const result = await callVenice(VENICE_MODELS.review, [
        { role: 'system', content: REVIEW_PROMPT },
        { role: 'user', content: `ENGLISH ARTICLE (first 4000 chars):\n${enText}\n\nSPANISH ARTICLE (first 4000 chars):\n${esText}\n\nStructural comparison: EN has ${enSections.h2} h2, ${enSections.h3} h3, ${enSections.tables} tables. ES has ${esSections.h2} h2, ${esSections.h3} h3, ${esSections.tables} tables.` }
      ]);

      const verdict = result.match(/VERDICT:\s*(PASS|NEEDS_FIX)/i)?.[1]?.toUpperCase() || 'UNKNOWN';
      const isPass = verdict === 'PASS';

      if (isPass) {
        passed++;
        console.log(`  ✅ PASS — ${relPath}`);
      } else {
        failed++;
        const issueSummary = result.slice(0, 200).replace(/\n/g, ' ');
        console.log(`  ⚠️  NEEDS_FIX — ${relPath}: ${issueSummary}`);
      }

      // Update review state
      state.stages.review.completed.push(relPath);
      await saveState(state);

      // Also update progress file with review results
      progress[relPath] = progress[relPath] || {};
      progress[relPath].reviewed = isPass ? 'pass' : 'needs_fix';
      progress[relPath].reviewedBy = 'sonnet-4.6';
      progress[relPath].reviewDate = new Date().toISOString();
      progress[relPath].reviewNotes = isPass ? 'pass' : result.slice(0, 500);
      await saveProgress(progress);

      // Update manifest
      try {
        execSync(`node scripts/translation-status.mjs update "${relPath}" --lang ${lang} --stage reviewed --by "sonnet-4.6"`, { cwd: ROOT, stdio: 'pipe' });
      } catch {}

    } catch (err) {
      failed++;
      console.error(`  ❌ ${relPath}: ${err.message}`);
      state.stages.review.errors.push({ page: relPath, error: err.message });
      await saveState(state);
    }

    // Rate limit
    if (passed + failed < onlyPages.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n=== REVIEW RESULTS ===`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Needs fix: ${failed}`);

  updateManifestAndDashboard(lang);
}

async function cmdSpotCheck(lang, opts) {
  const progress = await loadProgress();
  const state = await loadState();
  state.stages.spotcheck = state.stages.spotcheck || { completed: [], errors: [] };

  // Pick 5 random reviewed pages
  const allPages = await discoverPages(lang);
  const reviewedPages = allPages.filter(p => {
    if (MANUALLY_TRANSLATED.has(p) || SKIP_PAGES.has(p)) return false;
    const info = progress[p];
    return info?.done && info?.reviewed === 'pass';
  });

  const spotChecked = new Set(state.stages.spotcheck?.completed || []);
  const unchecked = reviewedPages.filter(p => !spotChecked.has(p));

  // Random 5 (or all if < 5)
  const shuffled = unchecked.sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, Math.min(opts.maxPages || 5, shuffled.length));

  console.log(`\n🔬 Spot-check ${lang.toUpperCase()}: ${unchecked.length} eligible, checking ${sample.length}`);

  if (sample.length === 0) {
    console.log('✅ No pages to spot-check!');
    return;
  }

  let passed = 0, failed = 0;

  for (const relPath of sample) {
    const enPath = path.join(ROOT, relPath);
    const esPath = path.join(ROOT, lang, relPath);

    try {
      const enHtml = await fs.readFile(enPath, 'utf8');
      const esHtml = await fs.readFile(esPath, 'utf8');
      const enArticle = extractArticle(enHtml);
      const esArticle = extractArticle(esHtml);
      const enText = stripHtml(enArticle).slice(0, 3000);
      const esText = stripHtml(esArticle).slice(0, 3000);
      const enSections = countSections(enArticle);
      const esSections = countSections(esArticle);

      // Quick structural check before API call
      const sectionMatch = enSections.h2 === esSections.h2 && enSections.h3 === esSections.h3;
      const enWordCount = enText.split(/\s+/).length;
      const esWordCount = esText.split(/\s+/).length;
      const ratio = enWordCount > 0 ? esWordCount / enWordCount : 0;

      console.log(`  🔎 Spot-checking ${relPath} (h2: ${enSections.h2}→${esSections.h2}, ratio: ${ratio.toFixed(2)})...`);

      // Auto-fail structural mismatches without API call
      if (!sectionMatch) {
        failed++;
        console.log(`  ❌ FAIL — ${relPath}: Section mismatch (EN h2:${enSections.h2}/h3:${enSections.h3} vs ES h2:${esSections.h2}/h3:${esSections.h3})`);
        progress[relPath] = progress[relPath] || {};
        progress[relPath].spotChecked = 'fail';
        progress[relPath].spotCheckedBy = 'structural';
        progress[relPath].spotCheckDate = new Date().toISOString();
        await saveProgress(progress);
        await saveState(state);
        continue;
      }

      // Auto-pass if structure matches and ratio is healthy (saves API calls)
      if (sectionMatch && ratio >= 0.8 && ratio <= 2.0) {
        // Still do API check for content accuracy
      }

      const result = await callVenice(VENICE_MODELS.spotcheck, [
        { role: 'system', content: SPOTCHECK_PROMPT },
        { role: 'user', content: `ENGLISH ARTICLE:\n${enText}\n\nSPANISH ARTICLE:\n${esText}\n\nStructural: ${enSections.h2} h2, ${enSections.tables} tables. Compare ONLY article content, not nav/disclosure/footer.` }
      ]);

      const isPass = /PASS/i.test(result) && !/FAIL/i.test(result.slice(0, 20));

      if (isPass) {
        passed++;
        console.log(`  ✅ PASS — ${relPath}`);
      } else {
        failed++;
        console.log(`  ❌ FAIL — ${relPath}: ${result.slice(0, 150).replace(/\n/g, ' ')}`);
      }

      state.stages.spotcheck.completed.push(relPath);
      progress[relPath] = progress[relPath] || {};
      progress[relPath].spotChecked = isPass ? 'pass' : 'fail';
      progress[relPath].spotCheckedBy = 'gpt-5.4';
      progress[relPath].spotCheckDate = new Date().toISOString();
      await saveProgress(progress);
      await saveState(state);

      try {
        execSync(`node scripts/translation-status.mjs update "${relPath}" --lang ${lang} --stage spot-checked --by "gpt-5.4"`, { cwd: ROOT, stdio: 'pipe' });
      } catch {}

    } catch (err) {
      failed++;
      console.error(`  ❌ ${relPath}: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n=== SPOT-CHECK RESULTS ===`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  updateManifestAndDashboard(lang);
}

async function cmdReset(lang, opts) {
  const progress = await loadProgress();

  if (opts.only) {
    const pages = opts.only.split(',');
    for (const p of pages) {
      if (progress[p]) {
        progress[p].done = false;
        progress[p].reason = 'manual-reset';
        delete progress[p].error;
        console.log(`🔄 Reset: ${p}`);
      } else {
        progress[p] = { done: false, reason: 'manual-reset', date: new Date().toISOString() };
        console.log(`🔄 Added: ${p}`);
      }
    }
  } else {
    // Reset all
    for (const p of Object.keys(progress)) {
      progress[p].done = false;
      progress[p].reason = 'full-reset';
      delete progress[p].error;
    }
    console.log(`🔄 Reset all ${Object.keys(progress).length} pages`);
  }

  await saveProgress(progress);
  console.log('Done. Run `translate es` to re-translate.');
}

async function cmdStatus(lang) {
  const progress = await loadProgress();
  const allPages = await discoverPages(lang);
  const pending = getPendingPages(progress, allPages);

  let done = 0, errored = 0, dryRun = 0;
  for (const [p, info] of Object.entries(progress)) {
    if (info.done && !info.error && !info.reason) done++;
    else if (info.error) errored++;
    else if (info.dryRun) dryRun++;
  }

  console.log(`\n📊 Translation Status: ${lang.toUpperCase()}`);
  console.log(`  Total pages: ${allPages.length}`);
  console.log(`  ✅ Completed: ${done}`);
  console.log(`  ⏳ Pending: ${pending.length}`);
  console.log(`  ❌ Errored: ${errored}`);
  console.log(`  🏃 Dry-run only: ${dryRun}`);

  if (pending.length > 0 && pending.length <= 20) {
    console.log(`\n  Next up:`);
    pending.slice(0, 10).forEach(p => console.log(`    - ${p}`));
  }

  // Word count estimate
  let totalWords = 0;
  for (const p of pending) {
    try {
      const html = await fs.readFile(path.join(ROOT, p), 'utf8');
      const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '';
      totalWords += body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).length;
    } catch {}
  }
  console.log(`\n  Estimated words remaining: ~${totalWords.toLocaleString()}`);
  console.log(`  Estimated time @3min/page: ~${Math.ceil(pending.length * 3 / 60)}h${pending.length * 3 % 60}m`);
}

// ── CLI ──

const [command, lang, ...args] = process.argv.slice(2);
const opts = {
  maxPages: parseInt(args.find(a => a.startsWith('--max-pages='))?.split('=')[1] || '999'),
  dryRun: args.includes('--dry-run'),
  only: args.find(a => a.startsWith('--only='))?.split('=')[1]?.trim(),
};

switch (command) {
  case 'translate':
    if (!lang) { console.error('Usage: translate <lang> [--max-pages N] [--dry-run] [--only=page1.html,page2.html]'); process.exit(1); }
    await cmdTranslate(lang, opts);
    break;

  case 'review':
    if (!lang) { console.error('Usage: review <lang> [--max-pages N] [--only=p1.html,p2.html]'); process.exit(1); }
    await cmdReview(lang, opts);
    break;

  case 'spot-check':
    if (!lang) { console.error('Usage: spot-check <lang> [--max-pages N]'); process.exit(1); }
    await cmdSpotCheck(lang, opts);
    break;

  case 'reset':
    if (!lang) { console.error('Usage: reset <lang> [--only=page1.html,page2.html]'); process.exit(1); }
    await cmdReset(lang, opts);
    break;

  case 'status':
    if (!lang) { console.error('Usage: status <lang>'); process.exit(1); }
    await cmdStatus(lang);
    break;

  default:
    console.log(`CreditStud.io Translation Runner

Usage:
  node scripts/translation-runner.mjs translate es [--max-pages 10] [--dry-run] [--only=p1.html,p2.html]
  node scripts/translation-runner.mjs reset es [--only=p1.html,p2.html]
  node scripts/translation-runner.mjs status es

Commands:
  translate    Translate pending pages (Gemini 3.1 Pro per translation-rules.md)
  review       Review translated pages (Sonnet 4.6)
  spot-check   Spot-check reviewed pages (GPT-5.4, random 5)
  reset        Mark pages for re-translation
  status       Show progress summary

Options:
  --max-pages=N   Process max N pages then stop (cron-friendly)
  --dry-run       Show what would be translated without calling API
  --only=PAGES    Comma-separated list of specific pages to process`);
}