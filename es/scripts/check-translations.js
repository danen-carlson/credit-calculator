#!/usr/bin/env node
/**
 * check-translations.js — CreditStud.io Translation Staleness Checker
 *
 * Computes SHA-256 hash of each English page's translatable content,
 * compares to stored hashes in .translation-state.json,
 * and reports stale and missing translations.
 *
 * Usage:
 *   node scripts/check-translations.js            # Check all pages
 *   node scripts/check-translations.js --json      # Output as JSON (for CI)
 *   node scripts/check-translations.js --update     # Update hashes (after changes)
 *
 * Exit codes:
 *   0 — All translations fresh
 *   1 — Stale or missing translations found
 *   2 — Error
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoDir = path.resolve(__dirname, '..');
const STATE_FILE = path.join(repoDir, '.translation-state.json');
const SUPPORTED_LANGS = ['es', 'zh', 'tl', 'ko', 'hi'];

// ── CLI args ──
const args = process.argv.slice(2);
let outputJson = false;
let updateHashes = false;

for (const arg of args) {
  if (arg === '--json') outputJson = true;
  if (arg === '--update') updateHashes = true;
  if (arg === '--help') {
    console.log(`Usage: node scripts/check-translations.js [--json] [--update]

  (no flags)    Human-readable report
  --json        Output as JSON (for CI pipelines)
  --update      Update .translation-state.json with current hashes
`);
    process.exit(0);
  }
}

// ── Utility: compute SHA-256 hash ──
function hashContent(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// ── Extract translatable text content from HTML ──
function extractTranslatableHTML(html) {
  const texts = [];
  
  // Remove scripts, styles, and code blocks (not translatable)
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<code[\s\S]*?<\/code>/gi, '')
    .replace(/<pre[\s\S]*?<\/pre>/gi, '');
  
  // Extract text from title, headings, paragraphs, list items, links, buttons, labels
  const textTags = /<(title|h[1-6]|p|li|a|button|label|span|figcaption|summary|option|legend|td|th|dt|dd|strong|em|b|i)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = textTags.exec(clean)) !== null) {
    // Strip inner HTML tags to get just the text
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (text.length > 1 && text.length < 5000 && !text.match(/^[\d$.,+%]+$/)) {
      texts.push(text);
    }
  }
  
  // Extract meta content
  const metaRegex = /<meta\s+(?:name|property)=["']([^"']+)["']\s+content=["']([^"']+)["']/gi;
  while ((match = metaRegex.exec(clean)) !== null) {
    const name = match[1];
    const content = match[2];
    if (['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description'].includes(name)) {
      texts.push(content);
    }
  }

  // Extract alt text
  const altRegex = /alt=["']([^"']+)["']/gi;
  while ((match = altRegex.exec(clean)) !== null) {
    if (match[1].length > 2) texts.push(match[1]);
  }

  // Extract aria-label attributes
  const ariaRegex = /aria-label=["']([^"']+)["']/gi;
  while ((match = ariaRegex.exec(clean)) !== null) {
    texts.push(match[1]);
  }
  
  return texts;
}

// ── Find all English HTML files ──
function findHtmlFiles(dir, isRoot = true) {
  const files = [];
  const skipDirs = ['node_modules', '.next', 'shared', 'review'];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (skipDirs.includes(entry.name)) continue;
    if (isRoot && SUPPORTED_LANGS.includes(entry.name) && entry.isDirectory()) continue;
    
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(fullPath, false));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// ── Main check logic ──
function check() {
  // Load or create state
  let state;
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } else {
    state = { version: '2.0', languages: SUPPORTED_LANGS, pages: {} };
  }

  const htmlFiles = findHtmlFiles(repoDir);
  const results = {
    fresh: [],
    stale: [],
    missing: [],
    total: htmlFiles.length
  };

  for (const filePath of htmlFiles) {
    const relPath = '/' + path.relative(repoDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const translatableTexts = extractTranslatableHTML(content);
    const currentHash = hashContent(translatableTexts.join('\n'));

    const pageState = state.pages[relPath];
    
    if (!pageState) {
      results.missing.push({
        page: relPath,
        en_hash: currentHash,
        stringCount: translatableTexts.length,
        translations: {}
      });
    } else if (pageState.en_hash !== currentHash) {
      results.stale.push({
        page: relPath,
        old_hash: pageState.en_hash,
        new_hash: currentHash,
        stringCount: translatableTexts.length,
        last_translated: pageState.translations
      });
      
      // Update hash if --update flag
      if (updateHashes) {
        pageState.en_hash = currentHash;
      }
    } else {
      results.fresh.push({
        page: relPath,
        en_hash: currentHash,
        stringCount: translatableTexts.length
      });
    }

    // Ensure page exists in state for --update
    if (updateHashes && !state.pages[relPath]) {
      state.pages[relPath] = {
        en_hash: currentHash,
        stringCount: translatableTexts.length,
        translations: {}
      };
      for (const lang of SUPPORTED_LANGS) {
        state.pages[relPath].translations[lang] = {
          hash: null,
          translated_at: null
        };
      }
    }
  }

  // Save updated state if --update
  if (updateHashes) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    console.log(`Updated ${STATE_FILE} with ${Object.keys(state.pages).length} page hashes.`);
  }

  // Also check locale files
  const enLocalePath = path.join(repoDir, 'locales', 'en.js');
  if (fs.existsSync(enLocalePath)) {
    const localeContent = fs.readFileSync(enLocalePath, 'utf8');
    const localeHash = hashContent(localeContent);
    results.localeHash = localeHash;
  }

  // Per-tool locale files
  const enDir = path.join(repoDir, 'locales', 'en');
  if (fs.existsSync(enDir)) {
    results.toolLocales = {};
    for (const file of fs.readdirSync(enDir).filter(f => f.endsWith('.json'))) {
      const content = fs.readFileSync(path.join(enDir, file), 'utf8');
      results.toolLocales[file] = hashContent(content);
    }
  }

  return results;
}

// ── Run ──
const results = check();

if (outputJson) {
  // JSON output for CI
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.stale.length > 0 || results.missing.length > 0 ? 1 : 0);
} else {
  // Human-readable output
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   CreditStud.io Translation Staleness Report    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log();
  console.log(`Total English pages: ${results.total}`);
  console.log(`  ✅ Fresh:    ${results.fresh.length}`);
  console.log(`  ⚠️  Stale:   ${results.stale.length}`);
  console.log(`  ❌ Missing:  ${results.missing.length}`);
  console.log();
  
  if (results.stale.length > 0) {
    console.log('Stale translations (English source has changed):');
    for (const item of results.stale) {
      console.log(`  ⚠️  ${item.page} (${item.stringCount} strings)`);
    }
    console.log();
  }
  
  if (results.missing.length > 0) {
    console.log('Missing translations (new pages not yet tracked):');
    for (const item of results.missing) {
      console.log(`  ❌ ${item.page} (${item.stringCount} strings)`);
    }
    console.log();
  }

  if (results.fresh.length > 0 && results.stale.length === 0 && results.missing.length === 0) {
    console.log('🎉 All translations are up to date!');
  }
  
  if (results.stale.length > 0 || results.missing.length > 0) {
    console.log('To update hashes: node scripts/check-translations.js --update');
    console.log('To translate: node translate.js --stale-only');
    process.exit(1);
  }
}