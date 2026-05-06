#!/usr/bin/env node
// translate-faq-es.js — Re-translate Spanish FAQ questions/answers using Sonnet 4.6
// Usage: node scripts/translate-faq-es.js [--dry-run] [--batch-size N]
//
// Reads English FAQ source from .states/en-faq-source.json
// Re-translates to Spanish using venice/claude-sonnet-4-6
// Updates locales/es-seo.json with new translations

const fs = require('fs');
const path = require('path');

const VENICE_API_KEY = process.env.VENICE_API_KEY || fs.readFileSync(path.join(process.env.HOME || '/root', '.openclaw/.env'), 'utf8').match(/VENICE_API_KEY=(.+)/)?.[1];
const VENICE_MODEL = 'claude-sonnet-4-6';
const BASE = path.resolve(__dirname, '..');
const ES_SEO_PATH = path.join(BASE, 'locales/es-seo.json');
const EN_FAQ_PATH = path.join(BASE, '.states/en-faq-source.json');

const dryRun = process.argv.includes('--dry-run');
const batchSize = parseInt(process.argv.find(a => a.startsWith('--batch-size'))?.split('=')[1] || '5', 10);

const TRANSLATION_PROMPT = `You are translating FAQ questions and answers for CreditStud.io from English to US Spanish.

RULES:
- NEVER translate: card names (Chase Sapphire Preferred, Amex Gold, etc.), bank names (Chase, Citi, Capital One, Wells Fargo, Discover), BNPL names (Klarna, Afterpay, Affirm, Sezzle, Zip), FICO, VantageScore
- Keep APR, BNPL, cash back in English  
- Keep dollar amounts ($XX), percentages (XX%), and numbers exactly as written
- Use US Spanish: "puntaje de crédito", "transferencia de saldo", "cuota anual", "pago mínimo"
- "debt snowball" → "método bola de nieve", "debt avalanche" → "método avalancha"
- Keep answers concise and factual — same approximate length as the English
- Don't add information not in the English version, don't remove information either
- Translate naturally, not word-for-word

Return a JSON array with objects having "name" (translated question) and "acceptedAnswer" (translated answer).
Return ONLY valid JSON, no markdown, no explanation.`;

async function callVenice(messages) {
  const resp = await fetch('https://api.venice.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VENICE_API_KEY}`
    },
    body: JSON.stringify({
      model: VENICE_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 8192
    })
  });
  
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Venice API error ${resp.status}: ${body.substring(0, 500)}`);
  }
  
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in response');
  return content;
}

function parseJSON(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned);
}

async function translateBatch(enFaqs) {
  const userContent = enFaqs.map((faq, i) => 
    `[${i+1}] Question: ${faq.name}\nAnswer: ${faq.acceptedAnswer}`
  ).join('\n\n');
  
  const messages = [
    { role: 'system', content: TRANSLATION_PROMPT },
    { role: 'user', content: `Translate these ${enFaqs.length} FAQ Q&A pairs to US Spanish:\n\n${userContent}` }
  ];
  
  if (dryRun) {
    console.log(`[DRY RUN] Would translate ${enFaqs.length} FAQs`);
    return enFaqs.map(faq => ({
      name: `[ES] ${faq.name}`,
      acceptedAnswer: `[ES] ${faq.acceptedAnswer.substring(0, 50)}...`
    }));
  }
  
  const response = await callVenice(messages);
  const parsed = parseJSON(response);
  
  if (!Array.isArray(parsed) || parsed.length !== enFaqs.length) {
    throw new Error(`Expected ${enFaqs.length} items, got ${Array.isArray(parsed) ? parsed.length : 'non-array'}`);
  }
  
  return parsed;
}

async function main() {
  console.log(`Loading English FAQ source from ${EN_FAQ_PATH}`);
  const enFaqs = JSON.parse(fs.readFileSync(EN_FAQ_PATH, 'utf8'));
  console.log(`Found ${Object.keys(enFaqs).length} English pages with ${Object.values(enFaqs).reduce((s, v) => s + v.length, 0)} total FAQs`);

  console.log(`Loading Spanish SEO translations from ${ES_SEO_PATH}`);
  const esSeo = JSON.parse(fs.readFileSync(ES_SEO_PATH, 'utf8'));
  
  let translated = 0;
  let failed = 0;
  const errors = [];
  
  const pages = Object.keys(enFaqs);
  
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    console.log(`\n--- Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pages.length/batchSize)}: ${batch.length} pages ---`);
    
    // Translate each page in the batch one at a time (API rate limits)
    for (const page of batch) {
      const faqs = enFaqs[page];
      try {
        console.log(`  Translating ${page} (${faqs.length} FAQs)...`);
        const translatedFaqs = await translateBatch(faqs);
        
        // Validate each translation
        for (let j = 0; j < translatedFaqs.length; j++) {
          if (!translatedFaqs[j].name || !translatedFaqs[j].acceptedAnswer) {
            throw new Error(`Missing name or acceptedAnswer in translation ${j}`);
          }
        }
        
        // Update es-seo.json
        if (!esSeo[page]) esSeo[page] = {};
        esSeo[page].faq = translatedFaqs;
        esSeo[page]._faqTranslator = 'sonnet-4.6';
        esSeo[page]._faqTranslatedAt = new Date().toISOString();
        
        translated++;
        console.log(`  ✅ ${page} — ${translatedFaqs.length} FAQs translated`);
        
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        failed++;
        errors.push({ page, error: err.message });
        console.error(`  ❌ ${page} — ${err.message}`);
      }
    }
    
    // Save progress after each batch
    if (!dryRun) {
      fs.writeFileSync(ES_SEO_PATH, JSON.stringify(esSeo, null, 2));
      console.log(`  💾 Progress saved (${translated} pages translated)`);
    }
    
    // Longer delay between batches
    if (i + batchSize < pages.length) {
      console.log('  ⏳ Waiting 2s before next batch...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log(`\n=== FINAL RESULTS ===`);
  console.log(`Translated: ${translated} pages`);
  console.log(`Failed: ${failed} pages`);
  if (errors.length > 0) {
    console.log(`\nErrors:`);
    errors.forEach(e => console.log(`  ${e.page}: ${e.error}`));
  }
  
  if (!dryRun) {
    // Final save
    fs.writeFileSync(ES_SEO_PATH, JSON.stringify(esSeo, null, 2));
    console.log(`\n✅ Saved to ${ES_SEO_PATH}`);
  } else {
    console.log(`\n[DRY RUN] No changes saved`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});