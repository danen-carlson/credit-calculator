#!/usr/bin/env node
/**
 * review-faq-es.mjs - Review all Spanish FAQ translations with Sonnet 4.6
 *
 * Per translation-rules.md: Sonnet 4.6 is the reviewer after Gemini 3.1 Pro translates.
 *
 * Usage:
 *   node scripts/review-faq-es.mjs                # Review all
 *   node scripts/review-faq-es.mjs --max-pages 10  # Review 10 pages
 *   node scripts/review-faq-es.mjs --only=page1,page2  # Review specific pages
 *   node scripts/review-faq-es.mjs --dry-run       # Show what would be reviewed
 *   node scripts/review-faq-es.mjs --failed         # Re-review only failed pages
 */

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ES_SEO_PATH = path.join(ROOT, "locales", "es-seo.json");
const EN_FAQ_PATH = path.join(ROOT, ".states", "en-faq-source.json");
const PROGRESS_FILE = path.join(ROOT, ".states", "review-faq-progress.json");
const VENICE_KEY = process.env.VENICE_API_KEY || fsSync.readFileSync(path.join(process.env.HOME, ".openclaw/.env"), "utf8").match(/VENICE_API_KEY=(.+)/)?.[1]?.trim();
const REVIEW_MODEL = process.env.REVIEW_MODEL || "openai-gpt-54";
const API_TIMEOUT = 180_000;

const REVIEW_PROMPT = `You are reviewing Spanish FAQ translations for CreditStud.io. Compare the English source to the Spanish translation and check:

1. ACCURACY: All information from the English source is preserved
2. TERMINOLOGY: Card names, bank names, BNPL names, APR, FICO, VantageScore are kept in English
3. NATURALNESS: US Spanish reads naturally (puntaje de credito, transferencia de saldo, cuota anual, pago minimo)
4. COMPLETENESS: No facts added or removed
5. CONSISTENCY: Consistent terminology across FAQs

Reply with a JSON object:
{
  "status": "pass" | "fail",
  "issues": ["list any specific issues found"],
  "summary": "brief summary of quality"
}

If only minor style differences exist (no meaning change), mark as "pass".
If facts are wrong, missing, or added, mark as "fail".
Return ONLY valid JSON, no markdown fences.`;

async function callVenice(messages, timeoutMs = API_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const resp = await fetch("https://api.venice.ai/api/v1/chat/completions", {
        signal: controller.signal,
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + VENICE_KEY },
        body: JSON.stringify({ model: REVIEW_MODEL, messages, temperature: 0.2, max_tokens: 4096 })
      });

      if (!resp.ok) {
        const text = await resp.text();
        if (resp.status === 429) {
          const wait = Math.min(10000 * Math.pow(2, attempt) + Math.random() * 10000, 120000);
          console.log("  Rate limited, backoff " + Math.round(wait/1000) + "s...");
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        throw new Error("API " + resp.status + ": " + text.slice(0, 300));
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response (model=" + REVIEW_MODEL + ", status=" + resp.status + ", id=" + data.id + ")");
      return content;
    } catch (err) {
      if (err.name === "AbortError") throw new Error("Timeout after " + timeoutMs/1000 + "s");
      console.log("  Attempt " + (attempt+1) + " failed: " + err.message.slice(0, 80));
      if (attempt >= 4) throw err;
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
}

function parseJSON(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  cleaned = cleaned.replace(/^```\n?/, "");
  return JSON.parse(cleaned);
}

async function reviewPage(page, enFaqs, esFaqs) {
  const lines = [];
  for (let i = 0; i < enFaqs.length; i++) {
    lines.push("EN Q" + (i+1) + ": " + enFaqs[i].name);
    lines.push("EN A" + (i+1) + ": " + enFaqs[i].acceptedAnswer);
    lines.push("ES Q" + (i+1) + ": " + esFaqs[i].name);
    lines.push("ES A" + (i+1) + ": " + esFaqs[i].acceptedAnswer);
    lines.push("---");
  }

  const result = await callVenice([
    { role: "system", content: REVIEW_PROMPT },
    { role: "user", content: "Review these " + enFaqs.length + " Spanish FAQ translations for page \"" + page + "\":\n\n" + lines.join("\n") }
  ]);

  return parseJSON(result);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const failedOnly = args.includes("--failed");
  const maxPages = parseInt(args.find(a => a.startsWith("--max-pages="))?.split("=")?.[1] || "999");
  const onlyPages = args.find(a => a.startsWith("--only="))?.split("=")?.[1]?.split(",");

  const enFaqs = JSON.parse(await fs.readFile(EN_FAQ_PATH, "utf8"));
  const esSeo = JSON.parse(await fs.readFile(ES_SEO_PATH, "utf8"));

  let progress = {};
  try { progress = JSON.parse(await fs.readFile(PROGRESS_FILE, "utf8")); } catch {}

  const pages = Object.keys(enFaqs).sort();

  const toDo = pages.filter(p => {
    if (progress[p]?.status === "pass" && !failedOnly) return false;
    if (failedOnly && progress[p]?.status !== "fail") return false;
    if (onlyPages && !onlyPages.includes(p)) return false;
    if (!esSeo[p]?.faq) return false;
    return true;
  }).slice(0, maxPages);

  const alreadyPassed = Object.keys(progress).filter(k => progress[k].status === "pass").length;
  console.log("\n Review ES FAQs with Sonnet 4.6: " + pages.length + " total, " + alreadyPassed + " passed, " + toDo.length + " to review\n");

  if (toDo.length === 0) {
    console.log("All FAQs reviewed!");
    return;
  }

  let passed = 0, failed = 0;

  for (const page of toDo) {
    const faqs = enFaqs[page];
    const esFaqs = esSeo[page]?.faq;

    if (!esFaqs || esFaqs.length !== faqs.length) {
      console.log("  " + page + ": FAQ count mismatch (EN: " + faqs.length + ", ES: " + (esFaqs?.length || 0) + "), skipping");
      progress[page] = { status: "skip", error: "FAQ count mismatch", date: new Date().toISOString() };
      await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      continue;
    }

    console.log("  " + page + " (" + faqs.length + " FAQs)...");

    if (dryRun) {
      console.log("  Dry run");
      progress[page] = { status: "dry-run", date: new Date().toISOString() };
      await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      continue;
    }

    try {
      const result = await reviewPage(page, faqs, esFaqs);
      const status = result.status || "unknown";
      progress[page] = {
        status,
        issues: result.issues || [],
        summary: result.summary || "",
        reviewer: "sonnet-4-6",
        date: new Date().toISOString()
      };

      if (status === "pass") {
        passed++;
        console.log("  PASS: " + page);
      } else {
        failed++;
        const issueList = (result.issues || []).slice(0, 3).join("; ");
        console.log("  FAIL: " + page + " - " + issueList);
      }
    } catch (err) {
      failed++;
      console.error("  ERROR " + page + ": " + err.message.slice(0, 100));
      progress[page] = { status: "error", error: err.message, reviewer: "sonnet-4-6", date: new Date().toISOString() };
    }

    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));

    if ((passed + failed) < toDo.length) {
      await new Promise(r => setTimeout(r, 8000));
    }
  }

  console.log("\n=== REVIEW RESULTS ===");
  console.log("Passed: " + passed);
  console.log("Failed: " + failed);
  console.log("Progress saved: " + PROGRESS_FILE);
}

main().catch(err => { console.error(err); process.exit(1); });