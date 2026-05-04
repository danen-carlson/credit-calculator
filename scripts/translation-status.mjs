#!/usr/bin/env node
/**
 * Translation Status Tracker for CreditStud.io
 *
 * Tracks which pages have been translated, reviewed, and spot-checked
 * for each target language. Detects source changes that need re-translation.
 *
 * Usage:
 *   node scripts/translation-status.mjs scan [--lang es]    — Re-scan, detect changes & new pages
 *   node scripts/translation-status.mjs status [--lang es]   — Show summary table
 *   node scripts/translation-status.mjs update <page> --lang es --stage reviewed [--by "gemini-3.1-pro"]
 *   node scripts/translation-status.mjs outdated [--lang es] — Show pages where source changed
 *   node scripts/translation-status.mjs new-pages [--lang es] — Show untranslated pages
 *   node scripts/translation-status.mjs init [--lang es]    — Initialize tracking for a language
 *   node scripts/translation-status.mjs dashboard            — Generate docs/translation-dashboard.html
 *   node scripts/translation-status.mjs rebuild-cache [--lang es] — Rebuild SEO JSON from files
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'translation-manifest.json');
const DASHBOARD_PATH = path.join(ROOT, 'docs', 'translation-dashboard.html');

// Directories containing translatable HTML pages
const SOURCE_DIRS = ['blog', 'cards', 'learn', 'merchant'];
const STATIC_PAGES = [
  'index.html', 'about/index.html', 'af-worth-it/index.html',
  'compare/index.html', 'debt-planner/index.html', 'disclosure.html',
  'loan-vs-bt/index.html', 'min-payment/index.html', 'offline.html',
  'rewards/index.html', 'score-simulator/index.html', 'tools/api.html',
  'tools/index.html'
];

// Stages in progression order
const STAGES = ['pending', 'translated', 'reviewed', 'spot-checked'];

// Manually-translated blog pages (full Spanish body content)
const MANUAL_PAGES = [
  'blog/best-balance-transfer-credit-cards.html',
  'blog/credit-card-benefits-youre-not-using.html',
  'blog/credit-card-points-offset-interest.html',
  'blog/minimum-payment-trap.html',
  'blog/snowball-vs-avalanche.html',
];

// ── Helpers ──

function getManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  }
  return { version: 2, languages: {} };
}

function saveManifest(manifest) {
  manifest.version = 2;
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

function fileHash(filepath) {
  if (!fs.existsSync(filepath)) return null;
  const content = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function getSourcePath(relPath) {
  return path.join(ROOT, relPath);
}

function getTargetPath(lang, relPath) {
  return path.join(ROOT, lang, relPath);
}

function discoverSourcePages() {
  const pages = [];
  for (const sp of STATIC_PAGES) {
    if (fs.existsSync(path.join(ROOT, sp))) pages.push(sp);
  }
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

function isManualPage(relPath) {
  return MANUAL_PAGES.includes(relPath);
}

function ensureNewFields(entry) {
  // Migrate v1 → v2 fields
  if (!entry.type) entry.type = isManualPage(entry._relPath || '') ? 'manual' : 'i18n';
  if (!entry.translatedBy) entry.translatedBy = entry.stage === 'reviewed' && isManualPage(entry._relPath || '') ? 'sonnet-4.6' : (entry.stage !== 'pending' ? 'build-system' : null);
  if (!entry.reviewedBy) entry.reviewedBy = entry.reviewPass || null;
  if (!entry.spotCheckedBy) entry.spotCheckedBy = entry.spotCheckPass || null;
  if (entry.sourceChanged === undefined) entry.sourceChanged = false;
  // Clean up old fields
  delete entry.reviewPass;
  delete entry.spotCheckPass;
  return entry;
}

// ── Commands ──

function cmdScan(lang) {
  const manifest = getManifest();
  const langs = lang ? [lang] : Object.keys(manifest.languages).length > 0 ? Object.keys(manifest.languages) : ['es'];
  const sourcePages = discoverSourcePages();
  let totalNew = 0;
  let totalChanged = 0;

  for (const l of langs) {
    if (!manifest.languages[l]) manifest.languages[l] = { pages: {} };
    const pages = manifest.languages[l].pages;
    let newCount = 0;
    let changedCount = 0;

    for (const srcPage of sourcePages) {
      const currentHash = fileHash(getSourcePath(srcPage));

      if (!pages[srcPage]) {
        // New page
        const targetPath = getTargetPath(l, srcPage);
        const targetExists = fs.existsSync(targetPath);
        pages[srcPage] = {
          stage: targetExists ? 'translated' : 'pending',
          translatedBy: targetExists ? (isManualPage(srcPage) ? 'sonnet-4.6' : 'build-system') : null,
          reviewedBy: null,
          spotCheckedBy: null,
          lastTranslated: targetExists ? new Date().toISOString() : null,
          sourceHash: currentHash,
          targetHash: fileHash(targetPath) || null,
          sourceChanged: false,
          issues: [],
          type: isManualPage(srcPage) ? 'manual' : 'i18n'
        };
        newCount++;
      } else {
        // Existing page — check for source changes
        const entry = pages[srcPage];
        entry._relPath = srcPage; // for migration

        if (currentHash && entry.sourceHash && currentHash !== entry.sourceHash && entry.stage !== 'pending') {
          entry.sourceChanged = true;
          entry.sourceChangedAt = new Date().toISOString();
          changedCount++;
        }

        // Update hash even if no change detected
        if (currentHash) entry.sourceHash = currentHash;

        // Re-hash target if it exists
        const targetPath = getTargetPath(l, srcPage);
        if (fs.existsSync(targetPath)) {
          entry.targetHash = fileHash(targetPath);
          if (entry.stage === 'pending') {
            entry.stage = 'translated';
            entry.translatedBy = isManualPage(srcPage) ? 'sonnet-4.6' : 'build-system';
            entry.lastTranslated = entry.lastTranslated || new Date().toISOString();
          }
        }

        ensureNewFields(entry);
      }
    }

    // Clean up temporary _relPath
    for (const [p, entry] of Object.entries(pages)) {
      delete entry._relPath;
    }

    totalNew += newCount;
    totalChanged += changedCount;
    console.log(`${l.toUpperCase()}: ${newCount} new, ${changedCount} source-changed, ${Object.keys(pages).length} total`);
  }

  saveManifest(manifest);
  console.log(`\nScan complete: ${totalNew} new pages, ${totalChanged} source changes detected`);
  return manifest;
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
    const counts = { pending: 0, translated: 0, reviewed: 0, 'spot-checked': 0 };
    let sourceChangedCount = 0;
    let issuesCount = 0;
    const manualCount = Object.values(pages).filter(p => p.type === 'manual').length;
    const i18nCount = Object.values(pages).filter(p => p.type === 'i18n').length;

    for (const info of Object.values(pages)) {
      if (counts[info.stage] !== undefined) counts[info.stage]++;
      if (info.sourceChanged) sourceChangedCount++;
      if (info.issues && info.issues.length > 0) issuesCount++;
    }

    const total = Object.keys(pages).length;
    console.log(`\n=== ${l.toUpperCase()} ===`);
    console.log(`  Total pages:     ${total}`);
    console.log(`  Manual:          ${manualCount}`);
    console.log(`  i18n:            ${i18nCount}`);
    console.log(`  ─────────────────────`);
    console.log(`  Pending:         ${counts.pending}`);
    console.log(`  Translated:      ${counts.translated}`);
    console.log(`  Reviewed:        ${counts.reviewed}`);
    console.log(`  Spot-checked:    ${counts['spot-checked']}`);
    console.log(`  ─────────────────────`);
    console.log(`  Source changed:  ${sourceChangedCount}`);
    console.log(`  With issues:     ${issuesCount}`);

    if (sourceChangedCount > 0) {
      console.log(`\n  ⚠️  Pages with source changes:`);
      for (const [p, info] of Object.entries(pages)) {
        if (info.sourceChanged) console.log(`    - ${p}`);
      }
    }

    console.log(`\n  Pages needing review:`);
    let reviewNeeded = 0;
    for (const [p, info] of Object.entries(pages)) {
      if (info.stage === 'translated') { console.log(`    - ${p}`); reviewNeeded++; }
    }
    if (!reviewNeeded) console.log('    (none)');

    console.log(`  Pages needing spot-check:`);
    let spotCheckNeeded = 0;
    for (const [p, info] of Object.entries(pages)) {
      if (info.stage === 'reviewed') { console.log(`    - ${p}`); spotCheckNeeded++; }
    }
    if (!spotCheckNeeded) console.log('    (none)');
  }
}

function cmdUpdate(pagePath, lang, stage, by) {
  const manifest = getManifest();
  if (!manifest.languages[lang]) {
    console.error(`Language ${lang} not initialized.`);
    process.exit(1);
  }

  const pages = manifest.languages[lang].pages;
  if (!pages[pagePath]) {
    console.error(`Page "${pagePath}" not found in manifest. Run scan first.`);
    process.exit(1);
  }

  const info = pages[pagePath];
  const stageIdx = STAGES.indexOf(stage);
  const currentIdx = STAGES.indexOf(info.stage);

  if (stageIdx < currentIdx && stage !== info.stage) {
    console.warn(`Warning: Regressing from "${info.stage}" to "${stage}".`);
  }

  info.stage = stage;
  info.lastTranslated = new Date().toISOString();

  if (stage === 'translated') {
    info.translatedBy = by || info.translatedBy;
    info.sourceHash = fileHash(getSourcePath(pagePath));
    info.targetHash = fileHash(getTargetPath(lang, pagePath));
    info.sourceChanged = false;
    delete info.sourceChangedAt;
  }
  if (stage === 'reviewed') {
    info.reviewedBy = by || 'gemini-3.1-pro';
  }
  if (stage === 'spot-checked') {
    info.spotCheckedBy = by || 'gpt-5.4';
  }

  saveManifest(manifest);
  console.log(`Updated ${lang}/${pagePath} → ${stage}` + (by ? ` (by ${by})` : ''));
}

function cmdOutdated(lang) {
  const manifest = getManifest();
  const langs = lang ? [lang] : Object.keys(manifest.languages);
  let total = 0;

  for (const l of langs) {
    const config = manifest.languages[l];
    if (!config) continue;
    const pages = config.pages || {};

    console.log(`\n=== ${l.toUpperCase()} Outdated Pages ===`);
    let found = false;

    for (const [pagePath, info] of Object.entries(pages)) {
      if (info.sourceChanged || (info.stage !== 'pending' && info.lastTranslated)) {
        const currentHash = fileHash(getSourcePath(pagePath));
        if (currentHash && info.sourceHash && currentHash !== info.sourceHash) {
          console.log(`  - ${pagePath} (last translated: ${info.lastTranslated?.slice(0,10) || 'unknown'})`);
          found = true;
          total++;
        } else if (info.sourceChanged) {
          console.log(`  - ${pagePath} (flagged as changed)`);
          found = true;
          total++;
        }
      }
    }

    if (!found) console.log('  (none — all translations up to date)');
  }

  console.log(`\nTotal outdated: ${total}`);
}

function cmdNewPages(lang) {
  const manifest = getManifest();
  const langs = lang ? [lang] : Object.keys(manifest.languages);

  for (const l of langs) {
    const config = manifest.languages[l];
    if (!config) continue;
    const pages = config.pages || {};
    const sourcePages = discoverSourcePages();

    console.log(`\n=== ${l.toUpperCase()} Pages Without Translation Entry ===`);
    let found = false;

    for (const sp of sourcePages) {
      if (!pages[sp]) {
        console.log(`  - ${sp}`);
        found = true;
      }
    }

    // Also check for pending
    for (const [p, info] of Object.entries(pages)) {
      if (info.stage === 'pending') {
        console.log(`  - ${p} (pending)`);
        found = true;
      }
    }

    if (!found) console.log('  (none — all pages have entries)');
  }
}

function cmdRebuildCache(lang) {
  const langs = lang ? [lang] : ['es'];

  for (const l of langs) {
    const seoPath = path.join(ROOT, 'locales', `${l}-seo.json`);
    if (!fs.existsSync(seoPath)) {
      console.log(`No SEO file found at ${seoPath}`);
      continue;
    }

    console.log(`Rebuilding cache for ${l}...`);
    // Just re-scan, which will update hashes
    cmdScan(l);
    console.log(`Cache for ${l} updated.`);
  }
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
      const sourcePath = getSourcePath(srcPage);

      pages[srcPage] = {
        stage: targetExists ? 'translated' : 'pending',
        translatedBy: targetExists ? (isManualPage(srcPage) ? 'sonnet-4.6' : 'build-system') : null,
        reviewedBy: null,
        spotCheckedBy: null,
        lastTranslated: targetExists ? new Date().toISOString() : null,
        sourceHash: fileHash(sourcePath),
        targetHash: fileHash(targetPath) || null,
        sourceChanged: false,
        issues: [],
        type: isManualPage(srcPage) ? 'manual' : 'i18n'
      };
      added++;
    }
  }

  manifest.languages[lang].pages = pages;
  saveManifest(manifest);
  console.log(`Initialized ${lang}: ${added} new pages, ${Object.values(pages).filter(p => p.stage !== 'pending').length} already translated.`);
}

// ── Dashboard Generator ──

function cmdDashboard() {
  const manifest = getManifest();
  const now = new Date().toISOString();

  for (const [lang, config] of Object.entries(manifest.languages)) {
    const pages = config.pages || {};
    const total = Object.keys(pages).length;
    if (total === 0) continue;

    // Compute stats
    const counts = { pending: 0, translated: 0, reviewed: 0, 'spot-checked': 0 };
    let sourceChangedCount = 0;
    let issuesCount = 0;
    let manualCount = 0;
    let i18nCount = 0;

    for (const info of Object.values(pages)) {
      if (counts[info.stage] !== undefined) counts[info.stage]++;
      if (info.sourceChanged) sourceChangedCount++;
      if (info.issues && info.issues.length > 0) issuesCount++;
      if (info.type === 'manual') manualCount++;
      else i18nCount++;
    }

    // Build rows
    const rows = Object.entries(pages).map(([pagePath, info]) => {
      const stageClass = info.stage === 'spot-checked' ? 'stage-spot-checked' :
                         info.stage === 'reviewed' ? 'stage-reviewed' :
                         info.stage === 'translated' ? 'stage-translated' : 'stage-pending';
      const changedBadge = info.sourceChanged
        ? '<span class="badge changed">⚠️ Source Changed</span>'
        : '';
      const issuesBadges = (info.issues || []).length > 0
        ? `<span class="badge issues" title="${escHtml(info.issues.join('\n'))}">${info.issues.length} issue${info.issues.length > 1 ? 's' : ''}</span>`
        : '';
      const lastUpdated = info.lastTranslated ? info.lastTranslated.slice(0, 10) : '—';

      return `<tr class="${stageClass}" data-page="${escHtml(pagePath)}" data-detail="${escHtml(JSON.stringify(info))}" onclick="showDetail(this)">
        <td class="page-path">${escHtml(pagePath)}</td>
        <td><span class="badge type-${info.type || 'i18n'}">${info.type || 'i18n'}</span></td>
        <td><span class="badge ${stageClass}">${info.stage}</span></td>
        <td>${info.translatedBy || '—'}</td>
        <td>${info.reviewedBy || '—'}</td>
        <td>${info.spotCheckedBy || '—'}</td>
        <td>${changedBadge}</td>
        <td>${lastUpdated}</td>
        <td>${issuesBadges}</td>
      </tr>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CreditStud.io Translation Dashboard — ${lang.toUpperCase()}</title>
<style>
  :root {
    --bg: #0f172a;
    --surface: #1e293b;
    --surface2: #334155;
    --text: #e2e8f0;
    --text2: #94a3b8;
    --green: #22c55e;
    --blue: #3b82f6;
    --yellow: #eab308;
    --red: #ef4444;
    --orange: #f97316;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 20px; }
  h1 { font-size: 1.5rem; margin-bottom: 4px; }
  .subtitle { color: var(--text2); font-size: 0.85rem; margin-bottom: 20px; }
  .stats { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
  .stat-card { background: var(--surface); border-radius: 8px; padding: 12px 16px; min-width: 130px; }
  .stat-label { color: var(--text2); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-value { font-size: 1.4rem; font-weight: 700; margin-top: 2px; }
  .stat-value.green { color: var(--green); }
  .stat-value.blue { color: var(--blue); }
  .stat-value.yellow { color: var(--yellow); }
  .stat-value.red { color: var(--red); }
  .stat-value.orange { color: var(--orange); }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: 8px; overflow: hidden; }
  th { background: var(--surface2); padding: 10px 12px; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text2); white-space: nowrap; }
  td { padding: 8px 12px; font-size: 0.85rem; border-top: 1px solid var(--surface2); }
  tr.stage-pending td:first-child { border-left: 3px solid var(--red); }
  tr.stage-translated td:first-child { border-left: 3px solid var(--yellow); }
  tr.stage-reviewed td:first-child { border-left: 3px solid var(--blue); }
  tr.stage-spot-checked td:first-child { border-left: 3px solid var(--green); }
  tr:hover { background: rgba(255,255,255,0.03); cursor: pointer; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
  .badge.stage-pending { background: rgba(239,68,68,0.2); color: var(--red); }
  .badge.stage-translated { background: rgba(234,179,8,0.2); color: var(--yellow); }
  .badge.stage-reviewed { background: rgba(59,130,246,0.2); color: var(--blue); }
  .badge.stage-spot-checked { background: rgba(34,197,94,0.2); color: var(--green); }
  .badge.type-manual { background: rgba(249,115,22,0.2); color: var(--orange); }
  .badge.type-i18n { background: rgba(148,163,184,0.2); color: var(--text2); }
  .badge.changed { background: rgba(239,68,68,0.3); color: #fca5a5; }
  .badge.issues { background: rgba(234,179,8,0.2); color: var(--yellow); cursor: help; }
  .page-path { font-family: 'SF Mono', Menlo, monospace; font-size: 0.8rem; }
  .detail-panel { display: none; position: fixed; top: 0; right: 0; width: 420px; max-width: 90vw; height: 100vh; background: var(--surface); border-left: 1px solid var(--surface2); padding: 20px; overflow-y: auto; z-index: 100; box-shadow: -4px 0 20px rgba(0,0,0,0.4); }
  .detail-panel.open { display: block; }
  .detail-close { cursor: pointer; float: right; font-size: 1.2rem; color: var(--text2); }
  .detail-close:hover { color: var(--text); }
  .detail-page { font-family: 'SF Mono', Menlo, monospace; font-size: 0.9rem; margin-bottom: 12px; word-break: break-all; }
  .detail-row { margin-bottom: 8px; }
  .detail-label { color: var(--text2); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .detail-value { font-size: 0.9rem; }
  .detail-issues { margin-top: 12px; }
  .detail-issues li { font-size: 0.8rem; color: var(--yellow); margin-left: 16px; list-style: disc; }
  .refresh-btn { background: var(--surface2); color: var(--text); border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
  .refresh-btn:hover { background: #475569; }
  @media (max-width: 768px) {
    body { padding: 10px; }
    .stat-card { min-width: 100px; padding: 8px 10px; }
    .stat-value { font-size: 1.1rem; }
    th, td { padding: 6px 8px; font-size: 0.75rem; }
    .detail-panel { width: 100vw; }
  }
</style>
</head>
<body>
<h1>📊 CreditStud.io Translation Dashboard</h1>
<p class="subtitle">${lang.toUpperCase()} — ${total} pages • Generated ${now.slice(0,19).replace('T',' ')} UTC
  <button class="refresh-btn" onclick="location.reload()">↻ Refresh</button>
</p>

<div class="stats">
  <div class="stat-card"><div class="stat-label">Total Pages</div><div class="stat-value">${total}</div></div>
  <div class="stat-card"><div class="stat-label">Manual</div><div class="stat-value orange">${manualCount}</div></div>
  <div class="stat-card"><div class="stat-label">i18n</div><div class="stat-value">${i18nCount}</div></div>
  <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value red">${counts.pending}</div></div>
  <div class="stat-card"><div class="stat-label">Translated</div><div class="stat-value yellow">${counts.translated}</div></div>
  <div class="stat-card"><div class="stat-label">Reviewed</div><div class="stat-value blue">${counts.reviewed}</div></div>
  <div class="stat-card"><div class="stat-label">Spot-checked</div><div class="stat-value green">${counts['spot-checked']}</div></div>
  <div class="stat-card"><div class="stat-label">Source Changed</div><div class="stat-value red">${sourceChangedCount}</div></div>
  <div class="stat-card"><div class="stat-label">With Issues</div><div class="stat-value yellow">${issuesCount}</div></div>
</div>

<div class="table-wrap">
<table>
<thead>
<tr>
  <th>Page</th>
  <th>Type</th>
  <th>Stage</th>
  <th>Translated By</th>
  <th>Reviewed By</th>
  <th>Spot-Checked By</th>
  <th>Changed?</th>
  <th>Last Updated</th>
  <th>Issues</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</div>

<div class="detail-panel" id="detail">
  <span class="detail-close" onclick="document.getElementById('detail').classList.remove('open')">✕</span>
  <div id="detail-content"></div>
</div>

<script>
function showDetail(row) {
  const page = row.dataset.page;
  const detail = JSON.parse(row.dataset.detail);
  const panel = document.getElementById('detail');
  const content = document.getElementById('detail-content');

  let html = '<div class="detail-page">' + page + '</div>';
  html += '<div class="detail-row"><div class="detail-label">Stage</div><div class="detail-value">' + detail.stage + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Type</div><div class="detail-value">' + (detail.type || 'i18n') + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Translated By</div><div class="detail-value">' + (detail.translatedBy || '—') + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Reviewed By</div><div class="detail-value">' + (detail.reviewedBy || '—') + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Spot-Checked By</div><div class="detail-value">' + (detail.spotCheckedBy || '—') + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Last Translated</div><div class="detail-value">' + (detail.lastTranslated || '—') + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Source Hash</div><div class="detail-value">' + (detail.sourceHash || '—') + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Target Hash</div><div class="detail-value">' + (detail.targetHash || '—') + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Source Changed</div><div class="detail-value">' + (detail.sourceChanged ? '⚠️ Yes' : 'No') + '</div></div>';
  if (detail.sourceChangedAt) {
    html += '<div class="detail-row"><div class="detail-label">Changed At</div><div class="detail-value">' + detail.sourceChangedAt + '</div></div>';
  }

  if (detail.issues && detail.issues.length > 0) {
    html += '<div class="detail-issues"><div class="detail-label">Issues</div><ul>';
    for (const issue of detail.issues) {
      html += '<li>' + issue + '</li>';
    }
    html += '</ul></div>';
  }

  content.innerHTML = html;
  panel.classList.add('open');
}

// Close panel on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.getElementById('detail').classList.remove('open');
});

// Close panel on click outside
document.addEventListener('click', (e) => {
  const panel = document.getElementById('detail');
  if (panel.classList.contains('open') && !panel.contains(e.target) && !e.target.closest('tr[data-page]')) {
    panel.classList.remove('open');
  }
});
</script>
</body>
</html>`;

    // Ensure docs/ directory exists
    const docsDir = path.dirname(DASHBOARD_PATH);
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(DASHBOARD_PATH, html);
    console.log(`Dashboard generated: ${DASHBOARD_PATH}`);
  }
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Arg Parsing ──

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log(`Usage: node translation-status.mjs <command> [options]

Commands:
  scan [--lang es]       Re-scan all source/target files, detect changes
  status [--lang es]     Show summary table with stage counts
  update <page> --lang es --stage reviewed [--by "gemini-3.1-pro"]
                          Update a page's tracking info
  outdated [--lang es]    Show pages where source has changed since translation
  new-pages [--lang es]   Show English pages with no translation entry
  dashboard               Generate docs/translation-dashboard.html
  rebuild-cache [--lang es] Rebuild SEO JSON from current files
  init [--lang es]        Initialize or reinitialize tracking data
`);
  process.exit(0);
}

const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : null;
};

switch (command) {
  case 'scan':
    cmdScan(getArg('lang'));
    break;
  case 'init':
    cmdInit(getArg('lang') || 'es');
    break;
  case 'status':
    cmdStatus(getArg('lang'));
    break;
  case 'update':
    cmdUpdate(args[1], getArg('lang'), getArg('stage'), getArg('by') || getArg('reviewer'));
    break;
  case 'outdated':
    cmdOutdated(getArg('lang'));
    break;
  case 'new-pages':
    cmdNewPages(getArg('lang'));
    break;
  case 'dashboard':
    cmdDashboard();
    break;
  case 'rebuild-cache':
    cmdRebuildCache(getArg('lang'));
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}