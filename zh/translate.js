#!/usr/bin/env node
/**
 * translate.js — CreditStud.io Translation Orchestration
 * Phase 0: Scaffold with extract-review functionality
 *
 * Usage:
 *   node translate.js --extract-review [lang]   Extract all translatable strings into review/{lang}-review.json
 *   node translate.js --stale-only              Re-translate only pages with stale hashes
 *   node translate.js --all                      Full re-translation of all pages (placeholder)
 *   node translate.js --new-only                 Detect pages without translations, translate only those (placeholder)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoDir = __dirname;
const SUPPORTED_LANGS = ['es', 'zh', 'tl', 'ko', 'hi'];
const STATE_FILE = path.join(repoDir, '.translation-state.json');
const REVIEW_DIR = path.join(repoDir, 'review');

// ── CLI arg parsing ──
const args = process.argv.slice(2);
let mode = null;
let targetLang = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--extract-review') {
    mode = 'extract-review';
    // Optional language filter follows
    if (args[i + 1] && !args[i + 1].startsWith('--')) {
      targetLang = args[++i];
    }
  } else if (args[i] === '--stale-only') {
    mode = 'stale-only';
  } else if (args[i] === '--all') {
    mode = 'all';
  } else if (args[i] === '--new-only') {
    mode = 'new-only';
  } else if (args[i] === '--help') {
    console.log(`Usage: node translate.js <mode> [options]

Modes:
  --extract-review [lang]   Extract translatable strings into review/{lang}-review.json
  --stale-only              Re-translate only pages with changed English source (placeholder)
  --all                     Full re-translation of all pages (placeholder)
  --new-only                Translate only pages without translations (placeholder)

Options:
  [lang]                    Language code (es, zh, tl, ko, hi) — filters extract-review
`);
    process.exit(0);
  }
}

if (!mode) {
  console.error('Error: No mode specified. Use --extract-review, --stale-only, --all, or --new-only');
  process.exit(1);
}

// ── Utility: compute SHA-256 hash of text content ──
function hashContent(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

// ── Utility: extract translatable text nodes from HTML ──
function extractTranslatableText(html) {
  const strings = [];
  
  // Extract text from common HTML elements (excluding scripts, styles, code)
  const tagRegex = /<(title|meta\s+name="description"|meta\s+property="og:title"|meta\s+property="og:description"|meta\s+name="twitter:title"|meta\s+name="twitter:description"|h[1-6]|p|li|a|button|label|span|td|th|figcaption|summary|option|legend)[^>]*>([\s\S]*?)<\/\1>/gi;
  
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2].trim();
    if (content && content.length > 0 && !content.startsWith('<') && content.length < 2000) {
      strings.push({
        type: 'html-text',
        tag: tag,
        text: content
      });
    }
  }

  // Extract alt text from images
  const altRegex = /<img[^>]+alt="([^"]+)"/gi;
  while ((match = altRegex.exec(html)) !== null) {
    if (match[1] && match[1].length > 2) {
      strings.push({
        type: 'html-attr',
        attr: 'alt',
        text: match[1]
      });
    }
  }

  // Extract aria-label attributes
  const ariaRegex = /\baria-label="([^"]+)"/gi;
  while ((match = ariaRegex.exec(html)) !== null) {
    if (match[1]) {
      strings.push({
        type: 'html-attr',
        attr: 'aria-label',
        text: match[1]
      });
    }
  }

  return strings;
}

// ── Utility: extract strings from JS locale files ──
function extractLocaleStrings(localeContent) {
  const strings = [];
  // Match key: "value" patterns
  const kvRegex = /"([^"]+)":\s*"([^"]*)"/g;
  let match;
  while ((match = kvRegex.exec(localeContent)) !== null) {
    strings.push({
      type: 'locale-key',
      key: match[1],
      text: match[2]
    });
  }
  return strings;
}

// ── Find all HTML files ──
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

// ── Find all JS source files with translatable strings ──
function findJsSourceFiles() {
  const jsFiles = [];
  const sourceDirs = ['.', 'debt-planner', 'rewards', 'score-simulator', 'min-payment', 'loan-vs-bt', 'af-worth-it', 'shared'];
  for (const dir of sourceDirs) {
    const dirPath = path.join(repoDir, dir);
    if (!fs.existsSync(dirPath)) continue;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.includes('.min.')) {
        jsFiles.push(path.join(dirPath, entry.name));
      }
    }
  }
  return jsFiles;
}

// ── Classify content tier ──
function classifyTier(text, type, page) {
  // Tier 1: Auto-approved (nav, UI strings, labels)
  if (type === 'locale-key') {
    const key = arguments[1] || '';
    if (key.startsWith('nav.') || key.startsWith('btn.') || key.startsWith('credit.') || 
        key.startsWith('lang.') || key.startsWith('scenario.')) {
      return 1;
    }
  }
  if (type === 'html-attr') return 1;
  
  // Tier 3: Mandatory review (disclosures, financial claims, legal)
  const lowerText = text.toLowerCase();
  if (lowerText.includes('affiliate') || lowerText.includes('disclosure') || 
      lowerText.includes('legal') || lowerText.includes('compliance') ||
      lowerText.includes('for informational purposes')) {
    return 3;
  }
  
  // Check if page is a disclosure/legal page
  if (page && (page.includes('disclosure') || page.includes('privacy') || page.includes('terms'))) {
    return 3;
  }
  
  // Tier 2: Everything else (blog, reviews, learn pages)
  return 2;
}

// ── MODE: extract-review ──
function extractReview() {
  console.log('Extracting translatable strings for review...\n');
  
  const langs = targetLang ? [targetLang] : SUPPORTED_LANGS;
  const htmlFiles = findHtmlFiles(repoDir);
  const jsFiles = findJsSourceFiles();
  const enLocale = fs.readFileSync(path.join(repoDir, 'locales', 'en.js'), 'utf8');
  
  // Create review directory
  fs.mkdirSync(REVIEW_DIR, { recursive: true });

  for (const lang of langs) {
    const review = [];
    
    // Process each HTML page
    for (const filePath of htmlFiles) {
      const relPath = '/' + path.relative(repoDir, filePath).replace(/\\/g, '/');
      const content = fs.readFileSync(filePath, 'utf8');
      const strings = extractTranslatableText(content);
      
      // Compute content hash for stale detection
      const translatableTexts = strings.map(s => s.text).join('\n');
      const hash = hashContent(translatableTexts);
      
      for (const str of strings) {
        const tier = classifyTier(str.text, str.type, relPath);
        review.push({
          page: relPath,
          type: str.type,
          ...(str.key ? { id: str.key } : {}),
          english: str.text,
          translation: '',  // To be filled by translator
          source: str.type === 'locale-key' ? 'locale' : 'html',
          tier: tier,
          reviewed: false,
          hash: hash
        });
      }
    }
    
    // Process locale strings
    const localeStrings = extractLocaleStrings(enLocale);
    for (const str of localeStrings) {
      const tier = classifyTier(str.text, 'locale-key', '', str.key);
      review.push({
        page: '/locales/en.js',
        type: 'locale-key',
        id: str.key,
        english: str.text,
        translation: '',
        source: 'locale',
        tier: tier,
        reviewed: false
      });
    }
    
    // Process per-tool locale files
    const enDir = path.join(repoDir, 'locales', 'en');
    if (fs.existsSync(enDir)) {
      const toolLocaleFiles = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));
      for (const file of toolLocaleFiles) {
        const toolName = file.replace('.json', '');
        const content = fs.readFileSync(path.join(enDir, file), 'utf8');
        try {
          const json = JSON.parse(content);
          for (const [key, value] of Object.entries(json)) {
            const tier = classifyTier(value, 'locale-key', '', key);
            review.push({
              page: `/locales/en/${file}`,
              type: 'locale-key',
              id: `${toolName}.${key}`,
              english: value,
              translation: '',
              source: 'locale',
              tier: tier,
              reviewed: false
            });
          }
        } catch (e) {
          console.warn(`Warning: Could not parse ${file}: ${e.message}`);
        }
      }
    }
    
    // Deduplicate (same english text may appear in multiple places)
    const seen = new Set();
    const deduped = review.filter(item => {
      const key = `${item.page}|${item.english}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    const outputPath = path.join(REVIEW_DIR, `${lang}-review.json`);
    fs.writeFileSync(outputPath, JSON.stringify(deduped, null, 2), 'utf8');
    
    const tier1 = deduped.filter(i => i.tier === 1).length;
    const tier2 = deduped.filter(i => i.tier === 2).length;
    const tier3 = deduped.filter(i => i.tier === 3).length;
    
    console.log(`${lang.toUpperCase()}: ${deduped.length} translatable strings written to review/${lang}-review.json`);
    console.log(`  Tier 1 (auto-approve): ${tier1}`);
    console.log(`  Tier 2 (spot-check): ${tier2}`);
    console.log(`  Tier 3 (mandatory review): ${tier3}`);
  }
}

// ── MODE: stale-only ──
function staleOnly() {
  console.log('Checking for stale translations...\n');
  
  let state;
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } else {
    console.log('No .translation-state.json found. Run --extract-review first to create baseline.');
    process.exit(1);
  }

  const htmlFiles = findHtmlFiles(repoDir);
  let staleCount = 0;
  
  for (const filePath of htmlFiles) {
    const relPath = '/' + path.relative(repoDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const translatableTexts = extractTranslatableText(content).map(s => s.text).join('\n');
    const currentHash = hashContent(translatableTexts);
    
    const pageState = state.pages[relPath];
    if (!pageState) {
      console.log(`  NEW: ${relPath}`);
      staleCount++;
    } else if (pageState.en_hash !== currentHash) {
      console.log(`  STALE: ${relPath}`);
      staleCount++;
    }
  }
  
  if (staleCount === 0) {
    console.log('All translations are up to date!');
  } else {
    console.log(`\n${staleCount} pages need translation updates.`);
    console.log('Run: node translate.js --stale-only (with LLM translation enabled in Phase 1)');
  }
  
  // Placeholder: actual LLM translation will be wired in Phase 1
  console.log('\n⚠️  LLM translation is a placeholder in Phase 0. Wire up translation models in Phase 1.');
}

// ── MODE: all ──
function translateAll() {
  console.log('Full re-translation requested...\n');
  console.log('⚠️  LLM translation is a placeholder in Phase 0. Wire up translation models in Phase 1.');
  console.log('For now, run --extract-review to generate review files for manual translation.');
}

// ── MODE: new-only ──
function translateNewOnly() {
  console.log('Checking for pages without translations...\n');
  
  let state;
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } else {
    state = { version: '2.0', languages: SUPPORTED_LANGS, pages: {} };
  }

  const htmlFiles = findHtmlFiles(repoDir);
  let newCount = 0;
  
  for (const filePath of htmlFiles) {
    const relPath = '/' + path.relative(repoDir, filePath).replace(/\\/g, '/');
    if (!state.pages[relPath]) {
      console.log(`  NEW: ${relPath}`);
      newCount++;
    }
  }
  
  if (newCount === 0) {
    console.log('All pages already have translations tracked.');
  } else {
    console.log(`\n${newCount} new pages found.`);
  }
  
  console.log('\n⚠️  LLM translation is a placeholder in Phase 0. Wire up translation models in Phase 1.');
}

// ── Run ──
switch (mode) {
  case 'extract-review':
    extractReview();
    break;
  case 'stale-only':
    staleOnly();
    break;
  case 'all':
    translateAll();
    break;
  case 'new-only':
    translateNewOnly();
    break;
  default:
    console.error(`Unknown mode: ${mode}`);
    process.exit(1);
}