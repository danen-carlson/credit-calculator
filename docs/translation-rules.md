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
| **Reviewer** | Sonnet 4.6 | `venice/claude-sonnet-4-6` | Reviews ALL translated pages — lightweight checks, ~15s/page |
| **Spot-Checker** | GPT-5.4 | `venice/openai-gpt-54` | Spot-checks ~5 pages per batch for quality assurance |
| **Tier 1 Auto-approve** | GPT-5.4 Mini | `venice/openai-gpt-54-mini` | Fast, cheap check for navigation labels, UI strings, button text |

**Why Gemini for translation?** Sonnet 4.6 takes 90+ seconds per page on Venice (too slow for 77 pages). Gemini 3.1 Pro does it in ~50s with comparable quality. Sonnet 4.6 is better used as reviewer where it only needs to read and check (~15s/page). Swapped 2026-05-05 per Dane's direction.

## What NOT to Use for Translations

❌ **Sonnet 4.6 for bulk translation** — Too slow on Venice (90+ seconds per page). OK as reviewer.
❌ **Grok 4.1** — Not a translation model. Wrong for this work.

❌ **Grok 4.1** — Not a translation model. Wrong for this work.
❌ **glm-4.7-flash** — Too cheap, quality isn't good enough for customer-facing content. OK for internal tooling/scripts, NOT for translations.
❌ **deepseek-v4-flash** — China-hosted, no PII. Also too low-quality for this work.
❌ **Any ollama/local model** — Not suitable for high-quality translations.

## Pipeline

1. **Translate** with `translation-runner.mjs translate es` (Gemini 3.1 Pro)
2. **Review** with Sonnet 4.6 (`translation-runner.mjs review es`)
3. **Spot-check** 5 pages/batch with GPT-5.4 (`translation-runner.mjs spot-check es`)
4. Run `node build.js --lang es` after each stage
5. `node scripts/translation-status.mjs dashboard` for live status (`venice/claude-sonnet-4-6`)
2. **Review** with Gemini 3.1 Pro (`venice/gemini-3-1-pro-preview`) — must pass review before proceeding
3. **Spot-check** with GPT-5.4 (`venice/gpt-54`) — 5 pages per batch
4. **Tier 1 strings** → GPT-5.4 Mini auto-approves nav/buttons/UI

## Rationale

- Sonnet 4.6 has the best balance of translation quality, multilingual fluency, and cost for this workload
- Gemini 3.1 Pro is great at catching translation errors and ensuring completeness
- GPT-5.4 provides an independent quality gate on a different model family
- Using the same model to translate AND review defeats the purpose of review

---

*Created 2026-05-04 per Dane's directive. Do not change without Dane's approval.*