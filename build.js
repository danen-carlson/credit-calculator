const fs = require('fs');
const path = require('path');

const repoDir = __dirname;
const sharedDir = path.join(repoDir, 'shared');

// ── Parse CLI args ──
const args = process.argv.slice(2);
let targetLang = null;      // --lang es
let allLangs = false;        // --all-langs
const SUPPORTED_LANGS = ['es', 'zh', 'tl', 'ko', 'hi'];
const ALL_LANGS = ['en', ...SUPPORTED_LANGS];
const BASE_URL = 'https://creditstud.io';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--lang' && args[i + 1]) {
    targetLang = args[++i];
  } else if (args[i] === '--all-langs') {
    allLangs = true;
  } else if (args[i] === '--help') {
    console.log(`Usage: node build.js [--lang <code>] [--all-langs]

  (no flags)    Build English only (default)
  --lang es     Build Spanish translation output
  --all-langs   Build all languages (en + es/zh/tl/ko/hi)
  
English source files are always updated with shared partials.
Non-English files are generated into /{lang}/ directories.
`);
    process.exit(0);
  }
}

// ── Helper: read partial, optionally for a specific language ──
function readPartial(name, lang) {
  // Try lang-specific version first, fall back to English
  if (lang && lang !== 'en') {
    const langFile = path.join(sharedDir, `${name}-${lang}.html`);
    if (fs.existsSync(langFile)) {
      return fs.readFileSync(langFile, 'utf8').trim();
    }
  }
  // Fall back to English/default
  return fs.readFileSync(path.join(sharedDir, `${name}.html`), 'utf8').trim();
}

// ── Build partials for a given language ──
function buildPartials(lang) {
  return {
    header: readPartial('header', lang),
    footer: readPartial('footer', lang),
    disclosure: readPartial('disclosure-banner', lang),
    emailCaptureCSS: fs.readFileSync(path.join(sharedDir, 'email-capture.css'), 'utf8').trim(),
    ga4: fs.readFileSync(path.join(sharedDir, 'ga4.html'), 'utf8').trim(),
    langSwitcherCSS: fs.readFileSync(path.join(sharedDir, 'language-switcher.css'), 'utf8').trim(),
    langSwitcherJS: fs.readFileSync(path.join(sharedDir, 'language-switcher.js'), 'utf8').trim(),
    i18nJS: fs.readFileSync(path.join(sharedDir, 'i18n.js'), 'utf8').trim()
  };
}

// ── Generate hreflang links for a given page path ──
function generateHreflang(pagePath) {
  // pagePath should be like /cards/chase-sapphire-preferred/ or /index.html
  let links = '';
  for (const lang of ALL_LANGS) {
    const href = lang === 'en'
      ? `${BASE_URL}${pagePath}`
      : `${BASE_URL}/${lang}${pagePath}`;
    links += `<link rel="alternate" hreflang="${lang}" href="${href}">\n`;
  }
  // x-default points to English
  links += `<link rel="alternate" hreflang="x-default" href="${BASE_URL}${pagePath}">\n`;
  return links;
}

// ── Determine which pages use which per-tool locale scripts ──
const TOOL_LOCALE_MAP = {
  'debt-planner/': ['debt-planner'],
  'rewards/': ['rewards'],
  'score-simulator/': ['score-simulator'],
  'min-payment/': ['min-payment'],
  'loan-vs-bt/': ['loan-vs-bt'],
  'af-worth-it/': ['af-worth-it'],
};

function getToolLocalesForPath(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  for (const [prefix, tools] of Object.entries(TOOL_LOCALE_MAP)) {
    if (normalized.startsWith(prefix) || normalized.includes('/' + prefix)) {
      return tools;
    }
  }
  return [];
}

// ── Auto-discover all HTML files (except shared/ partials and lang dirs) ──
function findHtmlFiles(dir, isRoot) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    // Skip node_modules, .next, shared, and non-English lang dirs
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'shared') continue;
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

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── SEO meta translation cache ──
const seoCache = {};

function getSeoTranslations(lang) {
  if (seoCache[lang]) return seoCache[lang];
  const seoPath = path.join(repoDir, 'locales', `${lang}-seo.json`);
  if (fs.existsSync(seoPath)) {
    seoCache[lang] = JSON.parse(fs.readFileSync(seoPath, 'utf8'));
  } else {
    seoCache[lang] = {};
  }
  return seoCache[lang];
}

function htmlEncode(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function translateMetaTags(content, lang, relPath) {
  const seo = getSeoTranslations(lang);
  const pageKey = relPath.replace(/\\/g, '/');
  const trans = seo[pageKey];
  if (!trans) return content;

  // Replace <title>
  if (trans.title) {
    content = content.replace(/<title>[^<]*<\/title>/i, `<title>${htmlEncode(trans.title)}</title>`);
  }

  // Replace <meta name="description">
  if (trans.description) {
    content = content.replace(
      /<meta\s+name="description"\s+content="[^"]*">/gi,
      `<meta name="description" content="${htmlEncode(trans.description)}">`
    );
    content = content.replace(
      /<meta\s+content="[^"]*"\s+name="description">/gi,
      `<meta content="${htmlEncode(trans.description)}" name="description">`
    );
  }

  // Replace og:title
  if (trans.og_title) {
    content = content.replace(
      /<meta\s+property="og:title"\s+content="[^"]*">/gi,
      `<meta property="og:title" content="${htmlEncode(trans.og_title)}">`
    );
    content = content.replace(
      /<meta\s+content="[^"]*"\s+property="og:title">/gi,
      `<meta content="${htmlEncode(trans.og_title)}" property="og:title">`
    );
  }

  // Replace og:description
  if (trans.og_description) {
    content = content.replace(
      /<meta\s+property="og:description"\s+content="[^"]*">/gi,
      `<meta property="og:description" content="${htmlEncode(trans.og_description)}">`
    );
    content = content.replace(
      /<meta\s+content="[^"]*"\s+property="og:description">/gi,
      `<meta content="${htmlEncode(trans.og_description)}" property="og:description">`
    );
  }

  // Replace twitter:title
  if (trans.twitter_title) {
    content = content.replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*">/gi,
      `<meta name="twitter:title" content="${htmlEncode(trans.twitter_title)}">`
    );
    content = content.replace(
      /<meta\s+content="[^"]*"\s+name="twitter:title">/gi,
      `<meta content="${htmlEncode(trans.twitter_title)}" name="twitter:title">`
    );
  }

  // Replace twitter:description
  if (trans.twitter_description) {
    content = content.replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*">/gi,
      `<meta name="twitter:description" content="${htmlEncode(trans.twitter_description)}">`
    );
    content = content.replace(
      /<meta\s+content="[^"]*"\s+name="twitter:description">/gi,
      `<meta content="${htmlEncode(trans.twitter_description)}" name="twitter:description">`
    );
  }

  // Replace JSON-LD Article/FAQPage headline, description, and FAQ questions
  if (trans.ld_headline || trans.ld_description || trans.ld_breadcrumb_last || trans.faq) {
    content = content.replace(
      /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
      function(match, jsonBlock) {
        let fixed = jsonBlock;
        try {
          const data = JSON.parse(jsonBlock);
          if (data['@type'] === 'Article' || data['@type'] === 'FAQPage') {
            if (trans.ld_headline && data.headline) {
              data.headline = trans.ld_headline;
            }
            if (trans.ld_description && data.description) {
              data.description = trans.ld_description;
            }
          }
          // Translate FAQ questions and answers
          if (data['@type'] === 'FAQPage' && trans.faq && data.mainEntity) {
            for (let i = 0; i < data.mainEntity.length && i < trans.faq.length; i++) {
              if (trans.faq[i].name) {
                data.mainEntity[i].name = trans.faq[i].name;
              }
              if (trans.faq[i].acceptedAnswer && data.mainEntity[i].acceptedAnswer) {
                data.mainEntity[i].acceptedAnswer.text = trans.faq[i].acceptedAnswer;
              }
            }
          }
          if (data['@type'] === 'BreadcrumbList' && data.itemListElement && trans.ld_breadcrumb_last) {
            const last = data.itemListElement[data.itemListElement.length - 1];
            if (last && last.name) {
              last.name = trans.ld_breadcrumb_last;
            }
            // Fix breadcrumb URLs to point to /lang/ versions
            for (const elem of data.itemListElement) {
              if (elem.item && !elem.item.includes(`/${lang}/`) && elem.item !== 'https://creditstud.io/') {
                const path = elem.item.replace('https://creditstud.io/', '');
                elem.item = `https://creditstud.io/${lang}/${path}`;
              } else if (elem.item === 'https://creditstud.io/') {
                elem.item = `https://creditstud.io/${lang}/`;
              }
            }
          }
          fixed = JSON.stringify(data, null, 2);
        } catch (e) {
          // If JSON parsing fails, fall back to string replacement
          if (trans.ld_headline) {
            fixed = fixed.replace(/"headline"\s*:\s*"[^"]*"/g, `"headline": "${trans.ld_headline}"`);
          }
          if (trans.ld_description) {
            fixed = fixed.replace(/"description"\s*:\s*"[^"]*"/g, `"description": "${trans.ld_description}"`);
          }
          if (trans.ld_breadcrumb_last) {
            const items = fixed.match(/"itemListElement"\s*:\s*\[([\s\S]*?)\]/);
            if (items) {
              const lastItemMatch = items[1].match(/\{[\s\S]*?"name"\s*:\s*"([^"]*)"[\s\S]*?\}(?!.*\{)/);
              if (lastItemMatch) {
                fixed = fixed.replace(
                  new RegExp(`"name"\\s*:\\s*"${escapeRegex(lastItemMatch[1])}"(?!.*"name"\\s*:\\s*"${escapeRegex(lastItemMatch[1])}")`),
                  `"name": "${trans.ld_breadcrumb_last}"`
                );
              }
            }
          }
        }
        return match.replace(jsonBlock, fixed);
      }
    );
  }

  return content;
}

// ── Build English files (in-place update of source) ──
function buildEnglish() {
  console.log('\n=== Building English (in-place) ===\n');
  const partials = buildPartials('en');
  const htmlFiles = [...new Set(findHtmlFiles(repoDir, true))].sort();

  let updated = 0;
  let skipped = 0;

  for (const filePath of htmlFiles) {
    const relPath = path.relative(repoDir, filePath);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    for (const [name, partial] of Object.entries(partials)) {
      const start = `<!-- ${name.toUpperCase()} -->`;
      const end = `<!-- /${name.toUpperCase()} -->`;
      const startRegex = new RegExp(escapeRegex(start), 'i');
      const endRegex = new RegExp(escapeRegex(end), 'i');

      if (startRegex.test(content) && endRegex.test(content)) {
        const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, 'i');
        content = content.replace(regex, `${start}\n${partial}\n${end}`);
      } else if (name === 'header' && startRegex.test(content) && !endRegex.test(content)) {
        const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?</header>`, 'i');
        content = content.replace(regex, `${start}\n${partial}\n${end}`);
      } else if (name === 'footer' && startRegex.test(content) && !endRegex.test(content)) {
        const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?</script>\\s*(?=</body>)`, 'i');
        if (regex.test(content)) {
          content = content.replace(regex, `${start}\n${partial}\n${end}`);
        }
      }
    }

    // Inject language-switcher CSS if not already present
    if (!content.includes('language-switcher.css')) {
      content = content.replace('</head>', '  <link rel="stylesheet" href="/shared/language-switcher.css">\n</head>');
    }
    // Inject language-switcher JS + i18n before </body> if not already present
    if (!content.includes('language-switcher.js')) {
      content = content.replace('</body>', '  <script src="/shared/i18n.js"></script>\n<script src="/shared/language-switcher.js"></script>\n</body>');
    }

    // Inject hreflang links into <head> (remove old ones first)
    const hreflangRegex = /<link rel="alternate" hreflang="[^"]*"[^>]*>\n?/g;
    content = content.replace(hreflangRegex, '');
    const pagePath = '/' + relPath.replace(/\\/g, '/').replace(/index\.html$/, '');
    const hreflangBlock = generateHreflang(pagePath);
    content = content.replace('</head>', hreflangBlock + '</head>');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  Updated ${relPath}`);
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\nEnglish build: ${updated} updated, ${skipped} unchanged.`);
}

// ── Build non-English files (generate /{lang}/ directories) ──
function buildLang(lang) {
  console.log(`\n=== Building ${lang.toUpperCase()} ===\n`);
  const partials = buildPartials(lang);
  const htmlFiles = [...new Set(findHtmlFiles(repoDir, true))].sort();

  let generated = 0;
  let copied = 0;

  // Manually-translated pages should not be overwritten by the build.
  // These files have full Spanish content in the body (not just i18n partials).
  // List them relative to the repo root (without language prefix).
  const MANUALLY_TRANSLATED = new Set([
    'blog/best-balance-transfer-credit-cards.html',
    'blog/minimum-payment-trap.html',
    'blog/snowball-vs-avalanche.html',
    'blog/credit-card-benefits-youre-not-using.html',
    'blog/credit-card-points-offset-interest.html',
  ]);

  // Pages that have been body-translated by the translation runner.
  // These should use the translated file as base (not English source).
  function isBodyTranslated(relPath) {
    const progressFile = path.join(repoDir, '.states', `translate-body-${lang}-progress.json`);
    try {
      const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
      return progress[relPath]?.done === true && !progress[relPath]?.dryRun;
    } catch {
      return false;
    }
  }

  for (const filePath of htmlFiles) {
    const relPath = path.relative(repoDir, filePath);

    // Skip manually-translated pages — they already have full Spanish content
    if (MANUALLY_TRANSLATED.has(relPath) && fs.existsSync(path.join(repoDir, lang, relPath))) {
      console.log(`  Skipping ${lang}/${relPath} (manually translated)`);
      continue;
    }

    // Use the translated file as base if it exists and was body-translated,
    // so we don't overwrite Spanish body content with English source.
    const translatedPath = path.join(repoDir, lang, relPath);
    const useTranslated = isBodyTranslated(relPath) && fs.existsSync(translatedPath);
    let content;
    if (useTranslated) {
      content = fs.readFileSync(translatedPath, 'utf8');
      // Make sure lang attribute is correct (translated file might have been based on English)
      content = content.replace(/<html[^>]*\s+lang="[^"]*"/i, `<html lang="${lang}"`);
    } else {
      content = fs.readFileSync(filePath, 'utf8');
    }

    const langDir = path.join(repoDir, lang);
    const outPath = path.join(langDir, relPath);
    const outDir = path.dirname(outPath);

    // Create directory structure
    fs.mkdirSync(outDir, { recursive: true });

    // Replace shared partials with language-specific ones
    for (const [name, partial] of Object.entries(partials)) {
      const start = `<!-- ${name.toUpperCase()} -->`;
      const end = `<!-- /${name.toUpperCase()} -->`;
      const startRegex = new RegExp(escapeRegex(start), 'i');
      const endRegex = new RegExp(escapeRegex(end), 'i');

      if (startRegex.test(content) && endRegex.test(content)) {
        const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, 'i');
        content = content.replace(regex, `${start}\n${partial}\n${end}`);
      } else if (name === 'header' && startRegex.test(content) && !endRegex.test(content)) {
        const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?</header>`, 'i');
        content = content.replace(regex, `${start}\n${partial}\n${end}`);
      } else if (name === 'footer' && startRegex.test(content) && !endRegex.test(content)) {
        const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?</script>\\s*(?=</body>)`, 'i');
        if (regex.test(content)) {
          content = content.replace(regex, `${start}\n${partial}\n${end}`);
        }
      }
    }

    // Update <html lang="en"> to target language
    content = content.replace(/<html\s+lang="en"/i, `<html lang="${lang}"`);

    // Update <html lang> without value
    content = content.replace(/<html(?!\s+lang=)/i, `<html lang="${lang}"`);

    // Inject locale script + __lang before app.js
    // Find existing script tags and inject before app.js
    const localeScript = `<script>window.__lang = '${lang}';</script>\n<script src="/locales/${lang}.js"></script>`;

    // Add per-tool locale scripts
    const toolLocales = getToolLocalesForPath(relPath);
    let toolLocaleScripts = '';
    for (const tool of toolLocales) {
      toolLocaleScripts += `\n<script src="/locales/${lang}/${tool}.json" type="application/json" data-locale="${lang}" data-tool="${tool}"></script>`;
    }

    // Insert locale scripts before app.js (or before closing </head> if no app.js)
    if (content.includes('app.js')) {
      // Find the last script in head before </head>, or before the first app.js reference
      const appJsRegex = /<script[^>]*src="[^"]*app\.js"[^>]*><\/script>/i;
      if (appJsRegex.test(content)) {
        content = content.replace(appJsRegex, `${localeScript}${toolLocaleScripts}\n$&`);
      } else {
        content = content.replace('</head>', `${localeScript}${toolLocaleScripts}\n</head>`);
      }
    } else {
      content = content.replace('</head>', `${localeScript}${toolLocaleScripts}\n</head>`);
    }

    // Inject hreflang links
    const hreflangRegex = /<link rel="alternate" hreflang="[^"]*"[^>]*>\n?/g;
    content = content.replace(hreflangRegex, '');
    const pagePath = '/' + relPath.replace(/\\/g, '/').replace(/index\.html$/, '');
    const hreflangBlock = generateHreflang(pagePath);
    content = content.replace('</head>', hreflangBlock + '</head>');

    // Fix canonical URL to point to language-specific version
    content = fixCanonicalUrl(content, lang);

    // Translate SEO meta tags for this page
    content = translateMetaTags(content, lang, relPath);

    // Fix relative URLs: add /{lang}/ prefix to internal links
    // This handles href="/" → href="/{lang}/" etc.
    content = fixRelativeUrls(content, lang);

    // Write the file
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`  Generated ${lang}/${relPath}`);
    generated++;
  }

  // Copy static assets (CSS, JS files that don't need translation, images)
  copyStaticAssets(lang);

  console.log(`\n${lang.toUpperCase()} build: ${generated} pages generated, ${copied} assets copied.`);
}

// ── Fix canonical URL for non-English output ──
function fixCanonicalUrl(content, lang) {
  // Replace canonical URL to point to language-specific version
  content = content.replace(
    /<link rel="canonical" href="https:\/\/creditstud\.io(\/[^"]*)">/g,
    `<link rel="canonical" href="https://creditstud.io/${lang}$1">`
  );
  content = content.replace(
    /<link rel="canonical" href="\/([^"]*)">/g,
    `<link rel="canonical" href="/${lang}/$1">`
  );

  // Fix og:url to point to language-specific version
  content = content.replace(
    /<meta\s+property="og:url"\s+content="https:\/\/creditstud\.io(\/[^"]*)">/g,
    `<meta property="og:url" content="https://creditstud.io/${lang}$1">`
  );
  content = content.replace(
    /<meta\s+content="https:\/\/creditstud\.io(\/[^"]*)"\s+property="og:url">/g,
    `<meta content="https://creditstud.io/${lang}$1" property="og:url">`
  );

  // Fix JSON-LD BreadcrumbList: translate Home → Inicio and fix item URLs
  content = content.replace(
    /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    function(match, jsonBlock) {
      if (!jsonBlock.includes('BreadcrumbList')) return match;
      let fixed = jsonBlock.replace(/"name":\s*"Home"/g, '"name": "Inicio"');
      const langPrefix = `/${lang}/`;
      fixed = fixed.replace(
        /"item":\s*"https:\/\/creditstud\.io(\/[^"?]*)"/g,
        function(urlMatch, urlPath) {
          if (urlPath.startsWith(langPrefix)) return urlMatch;
          return `"item": "https://creditstud.io/${lang}${urlPath}"`;
        }
      );
      return match.replace(jsonBlock, fixed);
    }
  );

  return content;
}

// ── Fix relative URLs for non-English output ──
function fixRelativeUrls(content, lang) {
  // Replace href="/" with href="/{lang}/"
  content = content.replace(/href="\/"(?!\s*hreflang)/g, `href="/${lang}/"`);

  // Replace href="/path" (non-lang-prefixed internal links) but not already /{lang}/ or external
  content = content.replace(/href="\/(?!\/|es\/|zh\/|tl\/|ko\/|hi\/|http|mailto|tel|#|{)([^"]*)"/g, function(match, p1) {
    // Skip if it's an anchor link, template literal, or external
    if (p1 === '' || match.includes('hreflang')) return match;
    return `href="/${lang}/${p1}"`;
  });

  // Replace src="/locales/en.js" pattern (English locale) with target lang locale if present
  // Keep src="/ for shared assets (CSS, shared JS, images) — those are language-agnostic

  return content;
}

// ── Copy static assets to lang directory ──
function copyStaticAssets(lang) {
  const langDir = path.join(repoDir, lang);
  const assetExts = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webmanifest', '.json'];

  function copyDir(srcDir, destDir) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      // Skip lang dirs, node_modules, shared, review, .git
      if (['node_modules', '.next', '.git', 'shared', 'review', 'locales'].includes(entry.name)) continue;
      if (SUPPORTED_LANGS.includes(entry.name) && entry.isDirectory()) continue;
      if (entry.name === lang && entry.isDirectory()) continue;

      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        // Only copy static assets, not HTML (which we generate) or locale files
        if (assetExts.includes(ext) && !entry.name.endsWith('.html')) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }

  copyDir(repoDir, langDir);
}

// ── Main build execution ──
function main() {
  // Always build English first
  buildEnglish();

  // Build additional languages if requested
  if (allLangs) {
    for (const lang of SUPPORTED_LANGS) {
      buildLang(lang);
    }
  } else if (targetLang) {
    if (!SUPPORTED_LANGS.includes(targetLang)) {
      console.error(`Error: Unsupported language "${targetLang}". Supported: ${SUPPORTED_LANGS.join(', ')}`);
      process.exit(1);
    }
    buildLang(targetLang);
  }

  console.log('\n✅ Build complete.');
  if (!targetLang && !allLangs) {
    console.log('💡 Use --lang <code> or --all-langs to generate translated pages.');
  }
}

main();