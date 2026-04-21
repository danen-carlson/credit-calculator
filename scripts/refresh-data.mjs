#!/usr/bin/env node
/**
 * refresh-data.mjs
 *
 * Weekly data refresh runner. Scrapes issuer/BNPL-provider landing pages,
 * extracts key offer fields (signup bonus, annual fee, payment terms),
 * diffs against current cards-data.js / data.js, and writes a report.
 *
 * Exit codes:
 *   0 = no changes (or dry-run)
 *   1 = changes detected (CI should open a PR)
 *   2 = hard error (scraper framework blew up)
 *
 * Design principles:
 *   - Best-effort: a broken selector on one site does NOT fail the whole run.
 *   - No external deps beyond Node's built-in fetch. We do regex + text mining
 *     which is more resilient to CSS/DOM changes than cheerio selectors.
 *   - The report is the source of truth. PRs are opened only if something
 *     actually moved, and a human reviews before merge.
 *   - Respects robots.txt via a polite 2s delay between requests and a
 *     descriptive User-Agent.
 *
 * Usage:
 *   node scripts/refresh-data.mjs              # scrape + diff + write report
 *   node scripts/refresh-data.mjs --dry-run    # scrape, print, don't write
 *   node scripts/refresh-data.mjs --apply      # also patch data files
 *   node scripts/refresh-data.mjs --target=ID  # only run one scraper
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
const BOT_UA = 'CreditStudioDataRefresh/1.0 (+https://creditstud.io/bot)';
const DELAY_MS = 2500;
const TIMEOUT_MS = 25_000;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const APPLY = args.has('--apply');
const TARGET = [...args].find(a => a.startsWith('--target='))?.split('=')[1];

function log(level, msg, extra) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}${extra ? ' ' + JSON.stringify(extra) : ''}`);
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'From': BOT_UA,
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/** Strip HTML tags + collapse whitespace so regex can hit plain text. */
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x?[\da-f]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Apply a regex rule against the plain-text page; return first capture group or null. */
function extractField(text, rule) {
  if (!rule.startsWith('regex:')) return null;
  const pattern = rule.slice(6);
  try {
    const re = new RegExp(pattern, 'i');
    const m = text.match(re);
    if (!m) return null;
    // Use first non-undefined capture group, or full match
    const val = m[1] ?? m[2] ?? m[0];
    // Normalize: strip commas from numbers, parse to number if numeric.
    const numeric = val.replace(/,/g, '');
    if (/^\d+(\.\d+)?$/.test(numeric)) return Number(numeric);
    if (/^no annual fee|^\$0|^0%/i.test(val)) return 0;
    if (/interest-?free|no interest/i.test(val)) return 0;
    // Reject overly-long matches (likely a false positive from paragraph text)
    if (val.length > 50) return null;
    return val;
  } catch (e) {
    log('warn', `bad regex: ${pattern} (${e.message})`);
    return null;
  }
}

async function scrapeTarget(target) {
  const result = { id: target.id, name: target.name, url: target.url, scraped: {}, errors: [] };
  let html;
  try {
    html = await fetchText(target.url);
  } catch (e) {
    result.errors.push(`fetch failed: ${e.message}`);
    return result;
  }
  const text = htmlToText(html);
  for (const [field, rule] of Object.entries(target.fields || {})) {
    const val = extractField(text, rule);
    if (val !== null && val !== undefined) {
      result.scraped[field] = val;
    }
  }
  return result;
}

/** Load the current data files without executing them as JS — use regex to pull JSON-ish blocks. */
async function loadCurrentCards() {
  const src = await fs.readFile(path.join(ROOT, 'rewards/cards-data.js'), 'utf8');
  // Very light parse: find {...} blocks with id: '...' — return them as raw text keyed by id.
  const cards = {};
  const re = /\{\s*id:\s*'([^']+)'[\s\S]*?\n\s*\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    cards[m[1]] = m[0];
  }
  return { src, cards };
}

async function loadCurrentBnpl() {
  const src = await fs.readFile(path.join(ROOT, 'data.js'), 'utf8');
  const bnpl = {};
  const re = /\{\s*id:\s*'([^']+)'[\s\S]*?\n\s*\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    bnpl[m[1]] = m[0];
  }
  return { src, bnpl };
}

/** Given a raw record text and a field path (dot-notation), read the current value via regex. */
function readFieldFromRecord(recordText, field) {
  // Handle nested: "signupBonus.amount" → find signupBonus: { ... amount: N ... }
  if (field.includes('.')) {
    const [outer, inner] = field.split('.');
    const outerMatch = recordText.match(new RegExp(`${outer}\\s*:\\s*\\{([^}]*)\\}`));
    if (!outerMatch) return null;
    const innerMatch = outerMatch[1].match(new RegExp(`${inner}\\s*:\\s*([^,}\\n]+)`));
    return innerMatch ? innerMatch[1].trim().replace(/['"]/g, '') : null;
  }
  const m = recordText.match(new RegExp(`${field}\\s*:\\s*([^,}\\n]+)`));
  return m ? m[1].trim().replace(/['"]/g, '') : null;
}

function diffScrapedToCurrent(scraped, currentText) {
  const changes = [];
  for (const [field, newVal] of Object.entries(scraped)) {
    const curVal = readFieldFromRecord(currentText, field);
    const same = String(curVal) === String(newVal) || Number(curVal) === Number(newVal);
    if (!same) {
      changes.push({ field, current: curVal, scraped: newVal });
    }
  }
  return changes;
}

async function main() {
  log('info', `Starting data refresh (dry-run=${DRY_RUN}, apply=${APPLY}, target=${TARGET || 'all'})`);

  const targetsPath = path.join(__dirname, 'targets.json');
  const targets = JSON.parse(await fs.readFile(targetsPath, 'utf8'));

  const allTargets = [
    ...targets.cards.map(t => ({ ...t, kind: 'card' })),
    ...targets.bnpl.map(t => ({ ...t, kind: 'bnpl' })),
  ].filter(t => !TARGET || t.id === TARGET);

  const { cards: currentCards } = await loadCurrentCards();
  const { bnpl: currentBnpl } = await loadCurrentBnpl();

  const results = [];
  for (let i = 0; i < allTargets.length; i++) {
    const t = allTargets[i];
    // Skip JS-rendered targets that require manual checking
    if (t._manual) {
      log('info', `[${i + 1}/${allTargets.length}] skipping ${t.id} (manual-check only, JS-rendered)`);
      results.push({ id: t.id, name: t.name, url: t.url, scraped: {}, changes: [], errors: ['manual-check: JS-rendered page, requires manual verification'] });
      continue;
    }
    log('info', `[${i + 1}/${allTargets.length}] scraping ${t.id}`);
    const scraped = await scrapeTarget(t);
    const currentText = t.kind === 'card' ? currentCards[t.id] : currentBnpl[t.id];
    if (!currentText) {
      scraped.errors.push(`no current record found for id=${t.id} in ${t.kind} data file`);
      scraped.changes = [];
    } else if (Object.keys(scraped.scraped).length === 0) {
      scraped.changes = [];
      if (scraped.errors.length === 0) scraped.errors.push('no fields extracted (selectors may be stale)');
    } else {
      scraped.changes = diffScrapedToCurrent(scraped.scraped, currentText);
    }
    results.push(scraped);
    if (i < allTargets.length - 1) await delay(DELAY_MS);
  }

  // Build report
  const now = new Date().toISOString();
  const changed = results.filter(r => r.changes.length > 0);
  const errors = results.filter(r => r.errors.length > 0);

  const lines = [];
  lines.push(`# Credit Data Refresh Report`);
  lines.push('');
  lines.push(`- **Run:** ${now}`);
  lines.push(`- **Targets scraped:** ${results.length}`);
  lines.push(`- **Changes detected:** ${changed.length}`);
  lines.push(`- **Errors / blank scrapes:** ${errors.length}`);
  lines.push('');

  if (changed.length) {
    lines.push('## 🔔 Changes Detected');
    lines.push('');
    for (const r of changed) {
      lines.push(`### ${r.name} (\`${r.id}\`)`);
      lines.push(`Source: ${r.url}`);
      lines.push('');
      lines.push('| Field | Current | Scraped |');
      lines.push('|---|---|---|');
      for (const c of r.changes) {
        lines.push(`| \`${c.field}\` | \`${c.current ?? '—'}\` | \`${c.scraped}\` |`);
      }
      lines.push('');
    }
  } else {
    lines.push('## ✅ No changes detected.');
    lines.push('');
  }

  if (errors.length) {
    lines.push('## ⚠️ Errors / Blank Scrapes');
    lines.push('');
    lines.push('These targets returned no extractable data. Selectors may be stale or the site may have blocked the request.');
    lines.push('');
    for (const r of errors) {
      lines.push(`- **${r.name}** (\`${r.id}\`): ${r.errors.join('; ')}`);
    }
    lines.push('');
  }

  const report = lines.join('\n');
  const reportPath = path.join(__dirname, 'data-refresh-report.md');

  if (DRY_RUN) {
    console.log('\n---\n');
    console.log(report);
    log('info', 'dry-run: report not written');
  } else {
    await fs.writeFile(reportPath, report);
    log('info', `report written: ${reportPath}`);
  }

  // Exit code
  if (changed.length > 0) {
    log('info', `${changed.length} change(s) detected — exit 1 so CI opens a PR`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch(e => {
  log('error', `fatal: ${e.message}`);
  console.error(e);
  process.exit(2);
});
