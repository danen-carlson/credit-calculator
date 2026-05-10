#!/usr/bin/env node
// translate-body-es.js — Translate page body content from English to Spanish using Sonnet 4.6
// Usage: node scripts/translate-body-es.js [--dry-run] [--start-from N] [--skip N]
//
// Reads English HTML pages, extracts body content, translates via Venice API (Sonnet 4.6),
// and writes translated HTML to es/ directory. Then rebuilds with build.js.
//
// IMPORTANT: Only translates BODY content (between <!-- CONTENT --> markers or main content area).
// SEO meta tags, JSON-LD, and shared partials are handled by build.js.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VENICE_API_KEY = process.env.VENICE_API_KEY || fs.readFileSync(path.join(process.env.HOME || '/root', '.openclaw/.env'), 'utf8').match(/VENICE_API_KEY=(.+)/)?.[1];
const VENICE_MODEL = 'claude-sonnet-4-6';
const BASE = path.resolve(__dirname, '..');
const PROGRESS_FILE = path.join(BASE, '.states/translate-body-progress.json');

const dryRun = process.argv.includes('--dry-run');
const startFrom = parseInt(process.argv.find(a => a.startsWith('--start-from'))?.split('=')[1] || '0', 10);
const skipCount = parseInt(process.argv.find(a => a.startsWith('--skip'))?.split('=')[1] || '0', 10);

const TRANSLATION_PROMPT = `You are translating web page content for CreditStud.io from English to US Spanish.

RULES:
- NEVER translate: card names (Chase Sapphire Preferred, Amex Gold, Capital One Quicksilver, etc.), bank names (Chase, Citi, Capital One, Wells Fargo, Discover, Amex), BNPL names (Klarna, Afterpay, Affirm, Sezzle, Zip), credit score brands (FICO, VantageScore)
- Keep APR, BNPL, cash back in English (widely understood by US Spanish speakers)
- Keep ALL dollar amounts ($XX), percentages (XX%), and numbers exactly as written
- Use US Spanish: "puntaje de crédito", "transferencia de saldo", "cuota anual", "pago mínimo"
- "debt snowball" → "método bola de nieve", "debt avalanche" → "método avalancha"
- Keep ALL HTML tags, attributes, classes, IDs, data-* attributes exactly as-is
- Keep ALL URLs (href, src) exactly as-is — DO NOT translate URLs
- Keep ALL JavaScript in <script> tags exactly as-is
- Keep style attributes, CSS classes unchanged
- Translate ONLY the visible text content between tags
- For <img alt="..."> — translate the alt text
- For <a href="..." title="..."> — translate the title text
- For <label>, <button>, <option> — translate the text
- Keep the same tone: helpful, direct, slightly informal but trustworthy
- Do NOT add or remove any HTML elements

Return the COMPLETE translated HTML. Do not truncate, do not summarize, do not skip sections.`;

async function callVenice(messages, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch('https://api.venice.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VENICE_API_KEY}`
        },
        body: JSON.stringify({
          model: VENICE_MODEL,
          messages,
          temperature: 0.2,
          max_tokens: 16384
        })
      });
      
      if (!resp.ok) {
        const body = await resp.text();
        if (resp.status === 429 && attempt < retries) {
          const waitTime = (attempt + 1) * 5000;
          console.log(`  Rate limited, waiting ${waitTime/1000}s...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        throw new Error(`Venice API error ${resp.status}: ${body.substring(0, 500)}`);
      }
      
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in response');
      return content;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`  Retrying... (${err.message})`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

function extractBody(html) {
  // Extract content between <body> tags
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return null;
  return bodyMatch[1];
}

function reconstructPage(originalHtml, translatedBody) {
  // Replace body content in original HTML
  return originalHtml.replace(
    /<body[^>]*>([\s\S]*)<\/body>/i,
    `<body>\n${translatedBody}\n</body>`
  );
}

// Skip pages that are manually translated
const MANUALLY_TRANSLATED = new Set([
  'blog/best-balance-transfer-credit-cards.html',
  'blog/minimum-payment-trap.html',
  'blog/snowball-vs-avalanche.html',
  'blog/credit-card-benefits-youre-not-using.html',
  'blog/credit-card-points-offset-interest.html',
]);

// Skip non-content pages
const SKIP_PAGES = new Set([
  'disclosure.html',
  'offline.html',
  'tools/api.html',
]);

async function main() {
  // Load progress
  let progress = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  
  // Find all English HTML files
  const skipDirs = new Set(['es', 'zh', 'tl', 'ko', 'hi', 'shared', 'node_modules', '.git', '.states', 'docs', 'locales']);
  const htmlFiles = [];
  
  function findHtml(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || skipDirs.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findHtml(fullPath);
      } else if (entry.name.endsWith('.html')) {
        const rel = path.relative(BASE, fullPath);
        htmlFiles.push(rel);
      }
    }
  }
  
  findHtml(BASE);
  htmlFiles.sort();
  
  // Filter out skipped pages
  const toTranslate = htmlFiles.filter(f => {
    if (MANUALLY_TRANSLATED.has(f)) return false;
    if (SKIP_PAGES.has(f)) return false;
    if (progress[f]?.done) return false;
    return true;
  });
  
  console.log(`Found ${htmlFiles.length} total pages, ${toTranslate.length} to translate`);
  
  let translated = 0;
  let failed = 0;
  const startIdx = startFrom || 0;
  const processing = skipCount > 0 ? toTranslate.slice(startIdx, startIdx + skipCount) : toTranslate.slice(startIdx);
  
  console.log(`Processing ${processing.length} pages (starting from index ${startIdx})`);
  
  for (const relPath of processing) {
    const enPath = path.join(BASE, relPath);
    const esPath = path.join(BASE, 'es', relPath);
    
    console.log(`\nTranslating: ${relPath}`);
    
    // Read English source
    const enHtml = fs.readFileSync(enPath, 'utf8');
    const body = extractBody(enHtml);
    
    if (!body) {
      console.log(`  ⚠️ No body content, skipping`);
      continue;
    }
    
    // Check word count
    const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = text.split(/\s+/).length;
    console.log(`  Body: ${wordCount} words`);
    
    if (dryRun) {
      console.log(`  [DRY RUN] Would translate ${wordCount} words`);
      progress[relPath] = { done: false, words: wordCount, dryRun: true };
      translated++;
      continue;
    }
    
    try {
      // For very long pages, we might need to chunk
      // But most pages are < 2000 words, so single API call should work
      
      const messages = [
        { role: 'system', content: TRANSLATION_PROMPT },
        { role: 'user', content: `Translate this HTML body content to US Spanish. Keep ALL HTML tags and attributes exactly as-is, only translate the visible text:\n\n${body}` }
      ];
      
      const translatedBody = await callVenice(messages);
      
      // Clean up any markdown fences
      let cleanBody = translatedBody.trim();
      if (cleanBody.startsWith('```html')) {
        cleanBody = cleanBody.replace(/^```html\n?/, '').replace(/\n?```$/, '');
      } else if (cleanBody.startsWith('```')) {
        cleanBody = cleanBody.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Validate: must contain some common HTML tags
      if (!cleanBody.includes('<') || !cleanBody.includes('>')) {
        throw new Error('Translation does not contain HTML tags');
      }
      
      // Read existing ES file if it exists (to preserve build-system changes)
      let esHtml;
      if (fs.existsSync(esPath)) {
        // Use existing ES file as the base (it already has correct lang, hreflang, etc.)
        esHtml = fs.readFileSync(esPath, 'utf8');
        // Replace body content
        esHtml = esHtml.replace(
          /<body[^>]*>([\s\S]*)<\/body>/i,
          `<body>\n${cleanBody}\n</body>`
        );
      } else {
        // Create from English source with body replaced
        esHtml = reconstructPage(enHtml, cleanBody);
      }
      
      // Ensure directory exists
      fs.mkdirSync(path.dirname(esPath), { recursive: true });
      fs.writeFileSync(esPath, esHtml, 'utf8');
      
      progress[relPath] = { done: true, words: wordCount, translator: 'sonnet-4.6', date: new Date().toISOString() };
      translated++;
      console.log(`  ✅ Translated (${wordCount} words) → ${esPath}`);
      
      // Rate limit: wait 1s between requests
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (err) {
      failed++;
      progress[relPath] = { done: false, error: err.message, date: new Date().toISOString() };
      console.error(`  ❌ Error: ${err.message}`);
    }
    
    // Save progress every 5 pages
    if (translated % 5 === 0 || failed > 0) {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    }
  }
  
  // Final save
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  
  console.log(`\n=== RESULTS ===`);
  console.log(`Translated: ${translated} pages`);
  console.log(`Failed: ${failed} pages`);
  console.log(`Progress saved to: ${PROGRESS_FILE}`);
  
  if (!dryRun && translated > 0) {
    console.log(`\n🔄 Now run: cd ${BASE} && node build.js --lang es`);
    console.log(`This rebuilds all ES pages with correct SEO tags, hreflang, and locale injection.`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});