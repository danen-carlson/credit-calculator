# CreditStud.io Translation Rules (Permanent)

## Runner Script (MANDATORY)

Use `node scripts/translation-runner.mjs translate es --max-pages 5` for batches.
Auto-resumes, validates, chunks long pages, updates dashboard.

Cron: `10 16 * * * cd /path/to/project && node scripts/translation-runner.mjs translate es --max-pages 10` (post-DIEM reset)

## Model Assignment — MANDATORY

These roles are **locked in** and must not be changed without Dane's explicit approval.

| Role | Model | Venice ID | Notes |
|------|-------|-----------|-------|
| **Primary Translator** | Gemini 3.1 Pro | `venice/gemini-3-1-pro-preview` | Fast (~50s/page), good quality translations |
| **Reviewer** | GPT-5.4 | `venice/openai-gpt-54` | Reviews ALL translated pages — thorough checks, ~30s/page, no rate-limit issues |
| **Reviewer (backup)** | Sonnet 4.6 | `venice/claude-sonnet-4-6` | Alternative reviewer, but heavily rate-limited on Venice (unusable for batches) |
| **Spot-Checker** | GPT-5.4 | `venice/openai-gpt-54` | Spot-checks ~5 pages per batch for quality assurance |
| **Tier 1 Auto-approve** | GPT-5.4 Mini | `venice/openai-gpt-54-mini` | Fast, cheap check for navigation labels, UI strings, button text |

**Why Gemini for translation?** Sonnet 4.6 takes 90+ seconds per page on Venice (too slow for 77 pages). Gemini 3.1 Pro does it in ~50s with comparable quality. Swapped 2026-05-05 per Dane's direction.

**Why GPT-5.4 for review?** Sonnet 4.6 is heavily rate-limited on Venice (429s every 2nd-3rd call, even with 8s delays). GPT-5.4 has no rate-limit issues, is a different model family from Gemini (better for catching errors), and does thorough reviews. Swapped 2026-05-06.

## What NOT to Use for Translations

❌ **Sonnet 4.6 for bulk translation** — Too slow on Venice (90+ seconds per page). OK as reviewer.
❌ **Grok 4.1** — Not a translation model. Wrong for this work.

❌ **Grok 4.1** — Not a translation model. Wrong for this work.
❌ **glm-4.7-flash** — Too cheap, quality isn't good enough for customer-facing content. OK for internal tooling/scripts, NOT for translations.
❌ **deepseek-v4-flash** — China-hosted, no PII. Also too low-quality for this work.
❌ **Any ollama/local model** — Not suitable for high-quality translations.

## Pipeline

1. **Translate** with Gemini 3.1 Pro (`translation-runner.mjs translate es`)
2. **Review** with GPT-5.4 (`review-faq-es.mjs` for FAQs, `translation-runner.mjs review es` for body) — catches real issues well, no rate limits
3. **Spot-check** with Sonnet 4.6 or GPT-5.4 — 5 pages per batch
4. Run `node build.js --lang es` after each stage
5. `node scripts/translation-status.mjs dashboard` for live status

## Rationale

- Sonnet 4.6 has the best balance of translation quality, multilingual fluency, and cost for this workload
- Gemini 3.1 Pro is great at catching translation errors and ensuring completeness
- GPT-5.4 provides an independent quality gate on a different model family
- Using the same model to translate AND review defeats the purpose of review

---

*Created 2026-05-04 per Dane's directive. Do not change without Dane's approval.*