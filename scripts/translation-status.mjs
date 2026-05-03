#!/usr/bin/env node
/**
 * Translation Status Tracker for CreditStud.io
 *
 * Tracks which pages have been translated, reviewed, and spot-checked
 * for each target language. Detects source changes that need re-translation.
 *
 * Usage:
 *   node scripts/translation-status.mjs scan          — Scan for new/changed pages
 *   node scripts/translation-status.mjs status         — Show status for all languages
 *   node scripts/translation-status.mjs status --lang es  — Show status for Spanish
 *   node scripts/translation-status.mjs update <page> --lang es --stage translated  — Update a page's stage
 *   node scripts/translation-status.mjs outdated       — Show pages needing re-translation
 *   node scripts/translation-status.mjs init           — Initialize tracking for all existing translations
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'translation-manifest.json');

// Directories containing translatable HTML pages
const SOURCE_DIRS = ['blog', 'cards', 'learn', 'merchant'];
const STATIC_PAGES = [
  'index.html', 'about/index.html', 'af-worth-it/index.html',
  'compare/index.html', 'debt-planner/index.html', 'disclosure.html',
  'loan-vs-bt/index.html', 'min-payment/index.html', 'offline.html',
  'rewards/index.html', 'score-simulator/index.html', 'tools/api.html',
  'tools/index.html'
];

// Stages: pending → translated → reviewed → spot-checked
const STAGES = ['pending', 'translated', 'reviewed', 'spot-checked'];

function getManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  }
  return { version: 1, languages: {} };
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

function fileHash(filepath) {
  if (!fs.existsSync(filepath)) return null;
  const content = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function getSourcePath(lang, relPath) {
  // For /es/blog/page.html → source is /blog/page.html
  // For /es/cards/xyz/index.html → source is /cards/xyz/index.html
  return path.join(ROOT, relPath);
}

function getTargetPath(lang, relPath) {
  return path.join(ROOT, lang, relPath);
}

function discoverSourcePages() {
  const pages = [];

  // Static pages
  for (const sp of STATIC_PAGES) {
    const fullPath = path.join(ROOT, sp);
    if (fs.existsSync(fullPath)) {
      pages.push(sp);
    }
  }

  // Directory-based pages
  for (const dir of SOURCE_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;
    const entries = fs.readdirSync(fullDir).sort();
    for (const entry of entries) {
      if (entry.endsWith('.html')) {
        pages.push(`${dir}/${entry}`);
      } else {
        const indexPath = path.join(fullDir, entry, 'index.html');
        if (fs.existsSync(indexPath)) {
          pages.push(`${dir}/${entry}/index.html`);
        }
      }
    }
  }

  return pages;
}

function cmdScan() {
  const manifest = getManifest();
  const sourcePages = discoverSourcePages();
  let newCount = 0;

  for (const [lang, config] of Object.entries(manifest.languages)) {
    const pages = config.pages || {};
    for (const srcPage of sourcePages) {
      const targetPath = getTargetPath(lang, srcPage);
      if (!pages[srcPage]) {
        if (fs.existsSync(targetPath)) {
          pages[srcPage] = {
            stage: 'translated',
            lastTranslated: new Date().toISOString(),
            sourceHash: fileHash(getSourcePath(lang, srcPage)),
            targetHash: fileHash(targetPath),
            reviewPass: null,
            spotCheckPass: null,
            issues: []
          };
          newCount++;
        } else {
          pages[srcPage] = {
            stage: 'pending',
            lastTranslated: null,
            sourceHash: fileHash(getSourcePath(lang, srcPage)),
            targetHash: null,
            reviewPass: null,
            spotCheckPass: null,
            issues: []
          };
          newCount++;
        }
      }
    }
    config.pages = pages;
  }

  saveManifest(manifest);
  console.log(`Scanned. Added ${newCount} new page entries.`);
  return manifest;
}

function cmdInit(lang) {
  const manifest = getManifest();
  if (!manifest.languages[lang]) {
    manifest.languages[lang] = { pages: {} };
  }
  const pages = manifest.languages[lang].pages;
  const sourcePages = discoverSourcePages();
  let added = 0;

  for (const srcPage of sourcePages) {
    if (!pages[srcPage]) {
      const targetPath = getTargetPath(lang, srcPage);
      const targetExists = fs.existsSync(targetPath);
      const sourcePath = getSourcePath(lang, srcPage);

      pages[srcPage] = {
        stage: targetExists ? 'translated' : 'pending',
        lastTranslated: targetExists ? new Date().toISOString() : null,
        sourceHash: fileHash(sourcePath),
        targetHash: fileHash(targetPath) || null,
        reviewPass: null,
        spotCheckPass: null,
        issues: []
      };
      added++;
    }
  }

  manifest.languages[lang].pages = pages;
  saveManifest(manifest);
  console.log(`Initialized ${lang}: ${added} pages discovered, ${Object.values(pages).filter(p => p.stage !== 'pending').length} already translated.`);
}

function cmdStatus(lang) {
  const manifest = getManifest();
  const langs = lang ? [lang] : Object.keys(manifest.languages);

  if (langs.length === 0) {
    console.log('No languages tracked. Run: node translation-status.mjs init --lang es');
    return;
  }

  for (const l of langs) {
    const config = manifest.languages[l];
    if (!config) {
      console.log(`\n=== ${l.toUpperCase()} === Not initialized`);
      continue;
    }

    const pages = config.pages || {};
    const stages = { pending: 0, translated: 0, reviewed: 0, 'spot-checked': 0 };
    const outdated = [];
    const issues = [];

    for (const [pagePath, info] of Object.entries(pages)) {
      stages[info.stage] = (stages[info.stage] || 0) + 1;

      // Check if source changed since translation
      const currentSourceHash = fileHash(getSourcePath(l, pagePath));
      if (currentSourceHash && info.sourceHash && currentSourceHash !== info.sourceHash) {
        outdated.push({ page: pagePath, oldHash: info.sourceHash, newHash: currentSourceHash });
      }

      if (info.issues && info.issues.length > 0) {
        issues.push({ page: pagePath, issues: info.issues });
      }
    }

    console.log(`\n=== ${l.toUpperCase()} ===`);
    console.log(`  Pending:      ${stages.pending || 0}`);
    console.log(`  Translated:   ${stages.translated || 0}`);
    console.log(`  Reviewed:     ${stages.reviewed || 0}`);
    console.log(`  Spot-checked: ${stages['spot-checked'] || 0}`);
    console.log(`  Total:        ${Object.keys(pages).length}`);

    if (outdated.length > 0) {
      console.log(`\n  ⚠️  Outdated (source changed since translation):`);
      for (const o of outdated) {
        console.log(`    - ${o.page}`);
      }
    }

    if (issues.length > 0) {
      console.log(`\n  ⚠️  Pages with issues:`);
      for (const i of issues) {
        console.log(`    - ${i.page}: ${i.issues.join(', ')}`);
      }
    }

    // Show pages by stage
    console.log(`\n  Pages needing review:`);
    for (const [p, info] of Object.entries(pages)) {
      if (info.stage === 'translated') console.log(`    - ${p}`);
    }
    console.log(`  Pages needing spot-check:`);
    for (const [p, info] of Object.entries(pages)) {
      if (info.stage === 'reviewed') console.log(`    - ${p}`);
    }
  }
}

function cmdUpdate(pagePath, lang, stage, extra) {
  const manifest = getManifest();
  if (!manifest.languages[lang]) {
    console.error(`Language ${lang} not initialized.`);
    process.exit(1);
  }

  const pages = manifest.languages[lang].pages;
  if (!pages[pagePath]) {
    console.error(`Page ${pagePath} not found in manifest. Run scan first.`);
    process.exit(1);
  }

  const info = pages[pagePath];
  const stageIdx = STAGES.indexOf(stage);
  const currentIdx = STAGES.indexOf(info.stage);

  if (stageIdx <= currentIdx && stage !== info.stage) {
    console.warn(`Warning: Page is already at stage "${info.stage}", cannot regress to "${stage}".`);
  }

  info.stage = stage;
  if (stage === 'translated') {
    info.lastTranslated = new Date().toISOString();
    info.sourceHash = fileHash(getSourcePath(lang, pagePath));
    info.targetHash = fileHash(getTargetPath(lang, pagePath));
  }
  if (stage === 'reviewed') {
    info.reviewPass = extra || 'gemini-3.1-pro';
  }
  if (stage === 'spot-checked') {
    info.spotCheckPass = extra || 'gpt-5.4';
  }

  saveManifest(manifest);
  console.log(`Updated ${lang}/${pagePath} → ${stage}`);
}

function cmdOutdated(lang) {
  const manifest = getManifest();
  const langs = lang ? [lang] : Object.keys(manifest.languages);

  for (const l of langs) {
    const config = manifest.languages[l];
    if (!config) continue;
    const pages = config.pages || {};

    console.log(`\n=== ${l.toUpperCase()} Outdated Pages ===`);
    let found = false;

    for (const [pagePath, info] of Object.entries(pages)) {
      if (info.stage === 'pending') continue;
      const currentSourceHash = fileHash(getSourcePath(l, pagePath));
      if (currentSourceHash && info.sourceHash && currentSourceHash !== info.sourceHash) {
        console.log(`  - ${pagePath} (translated: ${info.lastTranslated?.slice(0,10) || 'unknown'})`);
        found = true;
      }
    }

    if (!found) console.log('  (none)');
  }
}

function cmdBatchUpdate(lang, stage, extra) {
  const manifest = getManifest();
  if (!manifest.languages[lang]) {
    console.error(`Language ${lang} not initialized.`);
    process.exit(1);
  }

  const pages = manifest.languages[lang].pages;
  const prevStage = STAGES[STAGES.indexOf(stage) - 1];
  let updated = 0;

  for (const [pagePath, info] of Object.entries(pages)) {
    if (info.stage === prevStage || (stage === 'translated' && info.stage === 'pending')) {
      info.stage = stage;
      if (stage === 'reviewed') info.reviewPass = extra || 'gemini-3.1-pro';
      if (stage === 'spot-checked') info.spotCheckPass = extra || 'gpt-5.4';
      if (stage === 'translated') {
        info.lastTranslated = new Date().toISOString();
        info.sourceHash = fileHash(getSourcePath(lang, pagePath));
        info.targetHash = fileHash(getTargetPath(lang, pagePath));
      }
      updated++;
    }
  }

  saveManifest(manifest);
  console.log(`Updated ${updated} pages in ${lang} → ${stage}`);
}

// Parse args
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log('Usage: node translation-status.mjs <scan|status|init|update|outdated|batch-update> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  scan                          Scan for new/changed pages');
  console.log('  init --lang <lang>             Initialize tracking for a language');
  console.log('  status [--lang <lang>]         Show translation status');
  console.log('  update <page> --lang <lang> --stage <stage>  Update a page status');
  console.log('  outdated [--lang <lang>]       Show pages needing re-translation');
  console.log('  batch-update --lang <lang> --stage <stage>   Update all pages at prev stage');
  process.exit(0);
}

const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : null;
};

switch (command) {
  case 'scan':
    cmdScan();
    break;
  case 'init':
    cmdInit(getArg('lang') || 'es');
    break;
  case 'status':
    cmdStatus(getArg('lang'));
    break;
  case 'update':
    cmdUpdate(args[1], getArg('lang'), getArg('stage'), getArg('reviewer'));
    break;
  case 'outdated':
    cmdOutdated(getArg('lang'));
    break;
  case 'batch-update':
    cmdBatchUpdate(getArg('lang'), getArg('stage'), getArg('reviewer'));
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}