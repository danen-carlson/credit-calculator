#!/usr/bin/env node
// translate-faq-zh.mjs — Re-translate Spanish FAQs using Gemini 3.1 Pro
// Usage: node scripts/translate-faq-zh.mjs [--dry-run] [--max-pages N] [--only=page1,page2]
//
// Resumes from progress file. Cron-friendly with --max-pages.

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PROGRESS_FILE = path.join(ROOT, '.states', 'translate-faq-ko-progress.json');
const EN_FAQ_PATH = path.join(ROOT, '.states', 'en-faq-source.json');
const SEO_PATH = path.join(ROOT, 'locales', 'ko-seo.json');
const VENICE_KEY = process.env.VENICE_API_KEY || fsSync.readFileSync(path.join(process.env.HOME, '.openclaw/.env'), 'utf8').match(/VENICE_API_KEY=(.+)/)?.[1]?.trim();
const MODEL = 'gemini-3-1-pro-preview'; // Per translation-rules.md
const API_TIMEOUT = 120_000;

const TRANSLATION_PROMPT = `You are translating FAQ questions and answers for CreditStud.io from English to Korean (ko-KR) for a US-based financial website.

RULES:
- NEVER translate: card names (Chase Sapphire Preferred, Amex Gold, etc.), bank names (Chase, Citi, Capital One, Wells Fargo, Discover), BNPL names (Klarna, Afterpay, Affirm, Sezzle, Zip), FICO, VantageScore
- Keep APR, BNPL, cash back, points, miles in English
- Keep dollar amounts ($XX), percentages (XX%), and numbers exactly as written
- Use natural Simplified Chinese for US Chinese-speaking audience:
  - credit score → 신용점수, balance transfer → 잔액이체, annual fee → 연회비
  - minimum payment → 최소결제, signup bonus → 가입 보너스, cash back → 캐시백
  - debt snowball → 雪球法, debt avalanche → 雪崩法
  - interest rate → 이자율, APR → 年이자율, credit limit → 신용한도
  - foreign transaction fee → 해외거래수수료, statement credit → 스테이트먼트 크레딧
- Questions should end with ？not ?
- Use 。instead of . for sentence endings
- Keep answers concise and factual — same approximate length as the English
- Don't add information not in the English version, don't remove information either

Return a JSON array with objects having "name" (translated question) and "acceptedAnswer" (translated answer).
Return ONLY valid JSON, no markdown fences, no explanation.`;

async function callVenice(messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const resp = await fetch('https://api.venice.ai/api/v1/chat/completions', {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${VENICE_KEY}` },
        body: JSON.stringify({ model: MODEL, messages, temperature: 0.3, max_tokens: 16384 })
      });

      if (!resp.ok) {
        const text = await resp.text();
        if (resp.status === 429) {
          const wait = Math.min(5000 * Math.pow(2, attempt) + Math.random() * 5000, 60000);
          console.log(`  ⏳ Rate limited, backoff ${Math.round(wait/1000)}s...`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        throw new Error(`API ${resp.status}: ${text.slice(0, 300)}`);
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response');
      return content;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error(`Timeout after ${API_TIMEOUT/1000}s`);
      console.log(`  ⚠️ Attempt ${attempt+1} failed: ${err.message.slice(0, 80)}`);
      if (attempt >= 4) throw err;
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
}

function parseJSON(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  cleaned = cleaned.replace(/^```\n?/, '');
  return JSON.parse(cleaned);
}

async function translatePageFAQs(page, enFaqs) {
  // Build prompt with all FAQs for this page
  const faqLines = enFaqs.map((faq, i) => `Q${i+1}: ${faq.name}\nA${i+1}: ${faq.acceptedAnswer}`).join('\n\n');

  const result = await callVenice([
    { role: 'system', content: TRANSLATION_PROMPT },
    { role: 'user', content: `Translate these ${enFaqs.length} FAQs to Korean (ko-KR):\n\n${faqLines}` }
  ]);

  const translated = parseJSON(result);

  if (!Array.isArray(translated)) throw new Error(`Expected array, got ${typeof translated}`);
  if (translated.length !== enFaqs.length) throw new Error(`Expected ${enFaqs.length} FAQs, got ${translated.length}`);

  // Validate each FAQ
  for (let i = 0; i < translated.length; i++) {
    if (!translated[i].name || !translated[i].acceptedAnswer) {
      throw new Error(`FAQ ${i+1} missing name or acceptedAnswer`);
    }
  }

  return translated;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const maxPages = parseInt(args.find(a => a.startsWith('--max-pages='))?.split('=')[1] || '999');
  const onlyPages = args.find(a => a.startsWith('--only='))?.split('=')[1]?.split(',');

  const enFaqs = JSON.parse(await fs.readFile(EN_FAQ_PATH, 'utf8'));
  const zhSeo = JSON.parse(await fs.readFile(SEO_PATH, 'utf8'));

  // Load progress
  let progress = {};
  try { progress = JSON.parse(await fs.readFile(PROGRESS_FILE, 'utf8')); } catch {}

  const pages = Object.keys(enFaqs).sort();
  const toDo = pages.filter(p => {
    if (progress[p]?.done) return false;
    if (onlyPages && !onlyPages.includes(p)) return false;
    return true;
  }).slice(0, maxPages);

  console.log(`\n📝 Translate ES FAQs: ${pages.length} total, ${Object.keys(progress).filter(k => progress[k].done).length} done, ${toDo.length} to process\n`);

  if (toDo.length === 0) {
    console.log('✅ All FAQs translated!');
    return;
  }

  let completed = 0, failed = 0;

  for (const page of toDo) {
    const faqs = enFaqs[page];
    console.log(`  📄 ${page} (${faqs.length} FAQs)...`);

    if (dryRun) {
      console.log('  🏃 Dry run');
      progress[page] = { done: false, count: faqs.length, dryRun: true, date: new Date().toISOString() };
      await fs.mkdir(path.dirname(PROGRESS_FILE), { recursive: true });
      await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      completed++;
      continue;
    }

    try {
      const translated = await translatePageFAQs(page, faqs);

      // Update ko-seo.json
      if (!zhSeo[page]) zhSeo[page] = {};
      // FAQ translations go into ko-seo.json under "faq" key
      for (let i = 0; i < translated.length; i++) {
        if (zhSeo[page].faq && zhSeo[page].faq[i]) {
          zhSeo[page].faq[i].name = translated[i].name;
          zhSeo[page].faq[i].acceptedAnswer = translated[i].acceptedAnswer;
        }
      }

      progress[page] = { done: true, count: faqs.length, translator: 'gemini-3.1-pro', date: new Date().toISOString() };
      completed++;
      console.log(`  ✅ ${page}: ${translated.length} FAQs translated`);

      // Save progress after each page
      await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));

    } catch (err) {
      failed++;
      console.error(`  ❌ ${page}: ${err.message}`);
      progress[page] = { done: false, error: err.message, date: new Date().toISOString() };
      await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    }

    // Rate limit
    if (completed + failed < toDo.length) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // Save ko-seo.json
  await fs.writeFile(SEO_PATH, JSON.stringify(zhSeo, null, 2));
  console.log(`\n=== RESULTS ===`);
  console.log(`✅ Completed: ${completed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Updated: ${SEO_PATH}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });