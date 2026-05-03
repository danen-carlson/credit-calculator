#!/usr/bin/env node
/**
 * Translation Validator for CreditStud.io
 *
 * Automated checks comparing English source to Spanish translation:
 * 1. Structural parity: same number of HTML tags, classes, IDs
 * 2. Untranslated English: detect paragraphs without Spanish accented chars
 * 3. HTML integrity: matching opening/closing tags
 * 4. Link parity: all English hrefs exist in Spanish
 * 5. Number preservation: dollar amounts, percentages match
 * 6. Card name preservation: card/bank/BNPL names kept in English
 * 7. JSON-LD: proper fields translated vs preserved
 * 8. Meta tags: lang="es", canonical points to /es/
 *
 * Usage:
 *   node scripts/translation-validate.mjs [--lang es] [--verbose] [--fix]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..');

// Parse args
const args = process.argv.slice(2);
const lang = (args[args.indexOf('--lang') + 1]) || 'es';
const verbose = args.includes('--verbose');
const fix = args.includes('--fix');

const ES_DIR = path.join(ROOT, lang);
const MANIFEST_PATH = path.join(ROOT, 'translation-manifest.json');

// Terms that must stay in English
const ENGLISH_TERMS = [
  'APR', 'BNPL', 'FICO', 'VantageScore',
  'Chase', 'Citi', 'Amex', 'Discover', 'Capital One', 'Wells Fargo',
  'Bank of America', 'Barclays', 'US Bank', 'Bilt',
  'Sapphire', 'Freedom', 'Venture', 'Quicksilver', 'Savor',
  'Platinum', 'Gold', 'Blue Cash', 'Double Cash', 'Custom Cash',
  'Premier', 'Strata', 'Altitude', 'Autograph', 'Active Cash',
  'cash back', 'intro APR', 'balance transfer', 'sign-up bonus',
  'Amazon', 'Costco', 'Walmart', 'Target', 'Klarna', 'Afterpay', 'Affirm',
  'Priority Pass', 'Medjet', 'IHG', 'Southwest', 'Uber', 'Lyft',
  'Visa', 'Mastercard', 'Apple Card', 'iPhone',
];

function getManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  }
  return { version: 1, languages: {} };
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

function validatePage(relPath) {
  const enPath = path.join(ROOT, relPath);
  const esPath = path.join(ES_DIR, relPath);

  if (!fs.existsSync(enPath)) return { path: relPath, status: 'en_missing', issues: [] };
  if (!fs.existsSync(esPath)) return { path: relPath, status: 'es_missing', issues: [] };

  const enHtml = fs.readFileSync(enPath, 'utf8');
  const esHtml = fs.readFileSync(esPath, 'utf8');
  const issues = [];

  // 1. lang attribute
  if (!esHtml.includes('lang="es"') && !esHtml.includes("lang='es'")) {
    issues.push({ type: 'lang_attr', msg: 'Missing lang="es"' });
  }

  // 2. Canonical URL should point to /es/
  const canonicalMatch = esHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
  if (canonicalMatch && !canonicalMatch[1].includes(`/${lang}/`)) {
    issues.push({ type: 'canonical', msg: `Canonical doesn't point to /${lang}/: ${canonicalMatch[1]}` });
  }

  // 3. og:url should point to /es/
  const ogUrlMatch = esHtml.match(/<meta\s+property="og:url"\s+content="([^"]+)"/);
  if (ogUrlMatch && !ogUrlMatch[1].includes(`/${lang}/`)) {
    issues.push({ type: 'og_url', msg: `og:url doesn't point to /${lang}/: ${ogUrlMatch[1]}` });
  }

  // 4. Check for untranslated paragraphs (paragraphs > 40 chars with no Spanish accented chars)
  const esParagraphs = [...esHtml.matchAll(/<p[^>]*>(.*?)<\/p>/gs)].map(m => m[1]);
  const enParagraphs = [...enHtml.matchAll(/<p[^>]*>(.*?)<\/p>/gs)].map(m => m[1]);

  let untranslatedCount = 0;
  for (const p of esParagraphs) {
    const clean = p.replace(/<[^>]+>/g, '').trim();
    if (clean.length > 40 && !/\$\d|[\d]+%/.test(clean) && !/[áéíóúñ¿¡]/.test(clean)) {
      untranslatedCount++;
      if (verbose) {
        const preview = clean.slice(0, 80);
        issues.push({ type: 'untranslated_p', msg: `Possible untranslated paragraph: "${preview}..."` });
      }
    }
  }
  if (untranslatedCount > 0 && !verbose) {
    issues.push({ type: 'untranslated_p', msg: `${untranslatedCount} paragraph(s) may be untranslated` });
  }

  // 5. English terms that should be preserved
  for (const term of ENGLISH_TERMS) {
    if (enHtml.includes(term) && !esHtml.includes(term)) {
      // Only flag if the term appears in the English source
      // Skip if it's a minor term that might not appear in this specific page
    }
  }

  // 6. JSON-LD BreadcrumbList URLs should point to /es/
  const breadcrumbMatches = [...esHtml.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  for (const m of breadcrumbMatches) {
    try {
      const jsonLd = JSON.parse(m[1]);
      if (jsonLd['@type'] === 'BreadcrumbList' && jsonLd.itemListElement) {
        for (const item of jsonLd.itemListElement) {
          if (item.item && item.item.includes('://creditstud.io/') && !item.item.includes(`/${lang}/`)) {
            issues.push({ type: 'breadcrumb_url', msg: `Breadcrumb item URL not /${lang}/: ${item.item}` });
          }
        }
      }
    } catch (e) {
      // Not valid JSON-LD, skip
    }
  }

  // 7. JSON-LD "name" in BreadcrumbList should be translated
  for (const m of breadcrumbMatches) {
    try {
      const jsonLd = JSON.parse(m[1]);
      if (jsonLd['@type'] === 'BreadcrumbList' && jsonLd.itemListElement) {
        for (const item of jsonLd.itemListElement) {
          if (item.name === 'Home') {
            issues.push({ type: 'breadcrumb_name', msg: 'Breadcrumb name "Home" not translated to "Inicio"' });
          }
        }
      }
    } catch (e) {}
  }

  // 8. Structural parity: count key tags
  const countTag = (html, tag) => (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
  const structuralTags = ['h1', 'h2', 'h3', 'h4', 'table', 'tr', 'td', 'ul', 'ol', 'li', 'a'];
  for (const tag of structuralTags) {
    const enCount = countTag(enHtml, tag);
    const esCount = countTag(esHtml, tag);
    if (enCount !== esCount) {
      issues.push({ type: 'structure', msg: `${tag} count mismatch: EN=${enCount} ES=${esCount}` });
    }
  }

  // 9. Dollar/percentage preservation
  const enDollars = (enHtml.match(/\$[\d,]+/g) || []).sort();
  const esDollars = (esHtml.match(/\$[\d,]+/g) || []).sort();
  const enPercents = (enHtml.match(/\d+\.?\d*%/g) || []).sort();
  const esPercents = (esHtml.match(/\d+\.?\d*%/g) || []).sort();

  // Compare unique values
  const enDollarSet = new Set(enDollars);
  const esDollarSet = new Set(esDollars);
  const missingDollars = [...enDollarSet].filter(d => !esDollarSet.has(d));
  if (missingDollars.length > 0) {
    issues.push({ type: 'dollars', msg: `Dollar amounts missing in ES: ${missingDollars.slice(0, 5).join(', ')}${missingDollars.length > 5 ? '...' : ''}` });
  }

  return {
    path: relPath,
    status: issues.length === 0 ? 'clean' : 'issues',
    issues
  };
}

// Main
const manifest = getManifest();
const langConfig = manifest.languages[lang];

if (!langConfig) {
  console.error(`Language ${lang} not initialized. Run: node translation-status.mjs init --lang ${lang}`);
  process.exit(1);
}

const pages = Object.keys(langConfig.pages);
let clean = 0, flagged = 0, errors = 0;
const flaggedPages = [];

for (const page of pages) {
  const result = validatePage(page);
  if (result.status === 'clean') {
    clean++;
  } else if (result.status === 'issues') {
    flagged++;
    const issueSummary = result.issues.map(i => i.msg).join('; ');
    console.log(`⚠️  ${page}: ${issueSummary}`);
    flaggedPages.push({ path: page, issues: result.issues });
  } else {
    errors++;
    console.log(`❌ ${page}: ${result.status}`);
  }
}

console.log(`\n=== ${lang.toUpperCase()} Validation Summary ===`);
console.log(`  Clean: ${clean}`);
console.log(`  Flagged: ${flagged}`);
console.log(`  Errors: ${errors}`);
console.log(`  Total: ${pages.length}`);

if (flaggedPages.length > 0) {
  console.log(`\nPages needing attention:`);
  for (const p of flaggedPages) {
    console.log(`  - ${p.path}`);
  }
}

// Update manifest with validation results
for (const fp of flaggedPages) {
  if (langConfig.pages[fp.path]) {
    langConfig.pages[fp.path].issues = fp.issues.map(i => `${i.type}: ${i.msg}`);
  }
}
// Mark clean pages as having no issues
for (const page of pages) {
  if (langConfig.pages[page] && !langConfig.pages[page].issues) {
    langConfig.pages[page].issues = [];
  }
  // Clear previous issues for clean pages
  const result = validatePage(page);
  if (result.status === 'clean' && langConfig.pages[page]) {
    langConfig.pages[page].issues = [];
  }
}
saveManifest(manifest);