#!/usr/bin/env node
/**
 * Comprehensive translation review checker for CreditStud.io
 * Supports: es (Spanish), zh (Chinese), tl (Tagalog), ko (Korean), hi (Hindi)
 * 
 * Usage:
 *   node scripts/translation-review-check.mjs [--lang es|zh|tl|ko|hi] [--verbose] [--json]
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SUPPORTED_LANGS = ['es', 'zh', 'tl', 'ko', 'hi'];

// Language-specific detection functions
const LANG_DETECTORS = {
  es: (str) => /[áéíóúñ¿¡]/.test(str) || (/(Planificador|Calculadora[cs]?|Mejores|Mejor|recompensas?|efectivo|Gratuita[cs]?|Gratuitamente|Financiera[cs]?|Comparar?|Maximiza|Entendiendo|Ahorros?|Reembolso|transferencia|hipoteca|seguros?|primas?|Anual|Mensual|Inicio|Página|¿Cómo|¿Cuál|¿Debería|¿Puedo|¿Cuánto|¿Vale|¿Es|para|por|sin|con|del|tarjetas?)/i.test(str) && str.split(/\s+/).filter(w => w.length > 2).length >= 3),
  zh: (str) => /[\u4e00-\u9fff]/.test(str),
  tl: (str) => /[áéíóúñ¿¡]/.test(str) || /(ng|nang|sa|ngayon|para|kung|ano|paano|kailan|bakit|huwag|maging|gawin|pinaka|mas|mga|ay|na|ang)/i.test(str),
  ko: (str) => /[\uac00-\ud7af]/.test(str),
  hi: (str) => /[\u0900-\u097f]/.test(str),
};

const SKIP_DESC_CHECK = new Set(['offline.html']);

const args = process.argv.slice(2);
let targetLang = null;
let verbose = false;
let jsonOutput = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--lang' && args[i + 1]) targetLang = args[++i];
  else if (args[i] === '--verbose' || args[i] === '-v') verbose = true;
  else if (args[i] === '--json') jsonOutput = true;
}

const langs = targetLang ? [targetLang] : SUPPORTED_LANGS;
const results = {};
let totalPass = 0;
let totalFail = 0;

const manuallyTranslated = {
  es: new Set([
    'blog/best-balance-transfer-credit-cards.html',
    'blog/minimum-payment-trap.html',
    'blog/snowball-vs-avalanche.html',
    'blog/credit-card-benefits-youre-not-using.html',
    'blog/credit-card-points-offset-interest.html',
  ]),
  zh: new Set(), // No manually-translated zh pages yet
  tl: new Set(),
  ko: new Set(),
  hi: new Set(),
};

function isLikelyTranslated(str, lang) {
  const detector = LANG_DETECTORS[lang];
  return detector ? detector(str) : false;
}

function checkPage(filePath, lang, relPath) {
  const issues = [];
  const warnings = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const isManual = manuallyTranslated[lang]?.has(relPath) || false;
  
  const title = content.match(/<title>(.*?)<\/title>/s)?.[1] || '';
  const metaDesc = content.match(/<meta\s+name="description"\s+content="(.*?)"/s)?.[1] 
    || content.match(/<meta\s+content="(.*?)"\s+name="description"/s)?.[1] || '';
  const ogTitle = content.match(/<meta\s+property="og:title"\s+content="(.*?)"/s)?.[1]
    || content.match(/<meta\s+content="(.*?)"\s+property="og:title"/s)?.[1] || '';
  const ogDesc = content.match(/<meta\s+property="og:description"\s+content="(.*?)"/s)?.[1]
    || content.match(/<meta\s+content="(.*?)"\s+property="og:description"/s)?.[1] || '';
  const ogUrl = content.match(/<meta\s+property="og:url"\s+content="(.*?)"/s)?.[1]
    || content.match(/<meta\s+content="(.*?)"\s+property="og:url"/s)?.[1] || '';
  const twTitle = content.match(/<meta\s+name="twitter:title"\s+content="(.*?)"/s)?.[1]
    || content.match(/<meta\s+content="(.*?)"\s+name="twitter:title"/s)?.[1] || '';
  const twDesc = content.match(/<meta\s+name="twitter:description"\s+content="(.*?)"/s)?.[1]
    || content.match(/<meta\s+content="(.*?)"\s+name="twitter:description"/s)?.[1] || '';
  const canonical = content.match(/<link\s+rel="canonical"\s+href="(.*?)"/s)?.[1] || '';
  const langAttr = content.match(/<html\s+[^>]*lang="([^"]+)"/s)?.[1] || '';
  
  // 1. Check lang attribute
  if (langAttr !== lang) {
    issues.push(`lang attribute is "${langAttr}", expected "${lang}"`);
  }
  
  // 2. Check title is translated
  if (!title) {
    issues.push('Missing <title> tag');
  } else if (!isLikelyTranslated(title, lang) && title !== 'Offline — CreditStud.io') {
    issues.push(`Title may be untranslated: "${title.substring(0, 80)}"`);
  }
  
  // 3. Check meta description is translated
  if (!metaDesc && !SKIP_DESC_CHECK.has(relPath)) {
    issues.push('Missing meta description');
  } else if (!isLikelyTranslated(metaDesc, lang) && metaDesc) {
    issues.push(`Meta description may be untranslated: "${metaDesc.substring(0, 80)}"`);
  }
  
  // 4. Check og:title is translated
  if (!ogTitle) {
    warnings.push('Missing og:title');
  } else if (!isLikelyTranslated(ogTitle, lang)) {
    issues.push(`og:title may be untranslated: "${ogTitle.substring(0, 80)}"`);
  }
  
  // 5. Check og:description is translated
  if (!ogDesc) {
    warnings.push('Missing og:description');
  } else if (!isLikelyTranslated(ogDesc, lang)) {
    issues.push(`og:description may be untranslated: "${ogDesc.substring(0, 80)}"`);
  }
  
  // 6. Check og:url points to /lang/ version
  if (ogUrl && !ogUrl.includes(`/${lang}/`)) {
    issues.push(`og:url doesn't point to /${lang}/: ${ogUrl}`);
  }
  
  // 7. Check twitter:title and twitter:description
  if (twTitle && !isLikelyTranslated(twTitle, lang)) {
    issues.push(`twitter:title may be untranslated: "${twTitle.substring(0, 80)}"`);
  }
  if (twDesc && !isLikelyTranslated(twDesc, lang)) {
    issues.push(`twitter:description may be untranslated: "${twDesc.substring(0, 80)}"`);
  }
  
  // 8. Check canonical URL points to /lang/ version
  if (canonical && !canonical.includes(`/${lang}/`)) {
    issues.push(`Canonical URL doesn't point to /${lang}/: ${canonical}`);
  }
  
  // 9. Check hreflang tags
  const hreflangTags = content.match(/<link\s+rel="alternate"\s+hreflang="([^"]+)"[^>]*>/g) || [];
  if (hreflangTags.length === 0) {
    warnings.push('No hreflang tags found');
  } else {
    if (!hreflangTags.some(t => t.includes('hreflang="x-default"'))) {
      warnings.push('Missing hreflang x-default');
    }
    if (!hreflangTags.some(t => t.includes(`hreflang="${lang}"`))) {
      warnings.push(`Missing hreflang="${lang}" tag`);
    }
  }
  
  // 10. Check JSON-LD translations
  const ldMatches = content.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
  for (const ldMatch of ldMatches) {
    try {
      const ld = JSON.parse(ldMatch[1]);
      const items = Array.isArray(ld) ? ld : [ld];
      for (const item of items) {
        if (item['@type'] === 'BreadcrumbList') {
          for (const elem of item.itemListElement || []) {
            // Check breadcrumb "Home" is translated
            if (elem.name === 'Home') {
              const homeTranslations = { es: 'Inicio', zh: '首页', tl: 'Home', ko: '홈', hi: 'होम' };
              issues.push(`Breadcrumb name "Home" not translated to "${homeTranslations[lang] || lang}"`);
            }
            if (elem.item && !elem.item.includes(`/${lang}/`) && elem.item !== 'https://creditstud.io/') {
              issues.push(`Breadcrumb item URL not /${lang}/: ${elem.item}`);
            }
          }
        }
        if (item['@type'] === 'Article' || item['@type'] === 'FAQPage') {
          if (item.headline && !isLikelyTranslated(item.headline, lang)) {
            issues.push(`JSON-LD headline may be untranslated: "${item.headline.substring(0, 80)}"`);
          }
          if (item.description && !isLikelyTranslated(item.description, lang)) {
            issues.push(`JSON-LD description may be untranslated: "${item.description.substring(0, 80)}"`);
          }
        }
        if (item['@type'] === 'FAQPage') {
          for (const q of item.mainEntity || []) {
            if (q.name && !isLikelyTranslated(q.name, lang)) {
              issues.push(`FAQ question may be untranslated: "${q.name.substring(0, 80)}"`);
            }
          }
        }
      }
    } catch (e) {}
  }
  
  // 11. Check i18n setup
  if (!isManual) {
    if (!content.includes(`window.__lang = '${lang}'`) && !content.includes(`window.__lang="${lang}"`)) {
      issues.push(`Missing window.__lang = '${lang}' declaration`);
    }
    if (!content.includes(`/locales/${lang}.js`)) {
      issues.push(`Missing /locales/${lang}.js script`);
    }
  }
  
  // 12. For manual pages, check body has translated content
  if (isManual) {
    const paragraphs = content.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || [];
    const contentParas = paragraphs.map(p => p.replace(/<[^>]+>/g, '').trim()).filter(p => p.length > 40);
    const translatedParas = contentParas.filter(p => isLikelyTranslated(p, lang));
    if (translatedParas.length < contentParas.length * 0.8) {
      issues.push(`Manual page has only ${translatedParas.length}/${contentParas.length} translated paragraphs`);
    }
  }
  
  return { issues, warnings };
}

function discoverPages(lang) {
  const pages = [];
  function walk(dir, relDir = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SUPPORTED_LANGS.includes(entry.name) || ['node_modules', '.git', 'shared', 'scripts', 'docs', 'locales'].includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        pages.push(relPath);
      }
    }
  }
  walk(ROOT);
  return pages.sort();
}

for (const lang of langs) {
  const langDir = path.join(ROOT, lang);
  if (!fs.existsSync(langDir)) {
    console.log(`Skipping ${lang}: directory not found`);
    continue;
  }
  
  const pages = discoverPages(lang);
  results[lang] = { pass: [], fail: [] };
  
  for (const relPath of pages) {
    const filePath = path.join(langDir, relPath);
    if (!fs.existsSync(filePath)) continue;
    
    const { issues, warnings } = checkPage(filePath, lang, relPath);
    const status = issues.length === 0 ? 'PASS' : 'FAIL';
    
    if (status === 'PASS') {
      totalPass++;
      results[lang].pass.push(relPath);
    } else {
      totalFail++;
      results[lang].fail.push({ page: relPath, issues });
    }
    
    if (verbose || status === 'FAIL') {
      if (status === 'FAIL') {
        console.log(`❌ ${lang}/${relPath}`);
        issues.forEach(i => console.log(`   ${i}`));
      } else if (verbose) {
        console.log(`✅ ${lang}/${relPath}`);
      }
    }
  }
}

// Summary
console.log('\n=== Review Check Summary ===');
for (const lang of langs) {
  if (!results[lang]) continue;
  const pass = results[lang].pass.length;
  const fail = results[lang].fail.length;
  const faqOnlyCount = results[lang].fail.filter(f => f.issues.every(i => i.includes('FAQ question'))).length;
  const realIssuesCount = fail - faqOnlyCount;
  console.log(`\n${lang.toUpperCase()}: ${pass} PASS, ${fail} FAIL (of ${pass + fail} total)`);
  console.log(`  FAQ-only issues: ${faqOnlyCount}`);
  console.log(`  Other issues: ${realIssuesCount}`);
  
  const realIssues = results[lang].fail.filter(f => !f.issues.every(i => i.includes('FAQ question')));
  if (realIssues.length > 0 && !verbose) {
    console.log('\n  Non-FAQ failures:');
    realIssues.forEach(f => {
      const nonFaq = f.issues.filter(i => !i.includes('FAQ question'));
      console.log(`    ❌ ${f.page}:`);
      nonFaq.forEach(i => console.log(`       ${i}`));
    });
  }
}

console.log(`\nTotal: ${totalPass} PASS, ${totalFail} FAIL`);

if (jsonOutput) {
  const jsonPath = path.join(ROOT, 'scripts', 'review-check-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${jsonPath}`);
}

process.exit(totalFail > 0 ? 1 : 0);