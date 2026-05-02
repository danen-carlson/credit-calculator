# CreditStud.io Multi-Language Support — Technical Specification

**Version:** 2.0  
**Date:** 2026-05-02  
**Author:** Hank (AI Assistant)  
**Audience:** Dane Carlson — approved, implementation in progress  
**Status:** ✅ Approved, building Phase 0

---

## 1. Executive Summary

CreditStud.io currently serves a US-only, English-only audience. Adding multi-language support targets five non-English languages: **Spanish (es), Chinese Simplified (zh), Tagalog/Filipino (tl), Korean (ko), and Hindi (hi)**. This is an SEO and accessibility play, not a geographic expansion — all content remains US-focused (US credit cards, US BNPL services, US dollars, US tax rates).

Arabic and Vietnamese were considered and dropped: Vietnamese due to weak LLM quality, Arabic due to RTL layout complexity that adds significant dev work for V1.

The scope is substantial: ~94 source HTML pages across card reviews, blog posts, calculators, merchant guides, and learn pages, plus JavaScript UI strings in multiple calculator files. Translating into 5 languages yields ~470 additional HTML pages plus localized JS assets.

**This spec covers:**
- URL architecture (directory-based)
- What gets translated vs. what stays English
- Translation pipeline (LLM multi-model + human review)
- Technical build system changes
- SEO/AI citation impact
- Maintenance and update workflows
- Compressed 6-week timeline

---

## 2. Architecture Decision: Directory-Based URLs

### 2.1 Options Considered

| Approach | Example | Pros | Cons |
|----------|---------|------|------|
| **Directory-based** ✅ | `/es/cards/chase-sapphire-preferred/` | Clean URLs, SEO-friendly, easy to map, works with static hosting, hreflang is intuitive, concentrates domain authority | Requires directory structure per language; more files |
| Subdomain | `es.creditstud.io/cards/...` | Technically isolated, can point to separate deployments | Splits domain authority across subdomains; requires DNS/CORS management; overkill for static site |
| URL parameter | `/cards/chase-sapphire-preferred/?lang=es` | No file duplication | Poor SEO — Google ignores params for canonicalization; no clean hreflang support |
| JavaScript i18n | `/cards/chase-sapphire-preferred/` with JS locale switch | Zero file duplication | Unindexable content — Googlebot sees only English; kills SEO; poor AI citation |

**Decision: Directory-based (`/es/`, `/zh/`, `/tl/`, `/ko/`, `/hi/`)**

**Rationale:**
- Google explicitly recommends this for multilingual sites
- Each language version is a real, crawlable HTML page — critical for AI citations
- Works with existing static hosting (GitHub Pages / Cloudflare Pages)
- `hreflang` mapping is trivial: `/es/page.html` ↔ `/zh/page.html` ↔ `/page.html`
- All domain authority stays on `creditstud.io` (unlike subdomains)
- Easy to implement with the existing build.js injection system

### 2.2 URL Mapping Rules

```
English (canonical)              Spanish                         Hindi
/cards/chase-sapphire-preferred/ /es/cards/chase-sapphire-preferred/ /hi/cards/chase-sapphire-preferred/
/blog/best-0-apr-credit-cards.html /es/blog/best-0-apr-credit-cards.html /hi/blog/best-0-apr-credit-cards.html
/compare/                        /es/compare/                    /hi/compare/
/debt-planner/                   /es/debt-planner/               /hi/debt-planner/
```

**Rules:**
- All translated pages live under `/{lang}/` directory
- File paths and slugs remain identical to English (preserves mapping logic, prevents broken relative links)
- Card name slugs (e.g., `chase-sapphire-preferred`) are NOT translated — they are proper noun identifiers
- `index.html` files remain `index.html` in all languages

---

## 3. Content Categorization: What Translates vs. What Stays English

### 3.1 Categories That MUST Be Translated

| Category | Scope | Priority | Notes |
|----------|-------|----------|-------|
| Navigation & UI labels | Header, footer, dropdown menus, buttons | P0 | High-frequency user touchpoints |
| Calculator UI strings | `app.js`, `calc.js`, `planner.js`, `rewards.js`, `sim.js`, `min-payment/calc.js` | P0 | Without these, calculators are unusable |
| Page titles & meta descriptions | `<title>`, `<meta name="description">` | P0 | Directly impacts CTR from search |
| OG/Twitter meta tags | `og:title`, `og:description`, `twitter:*` | P0 | Social sharing appearance |
| Disclosure & legal text | `disclosure-banner.html`, `disclosure.html`, affiliate disclaimers | P0 | Compliance risk if wrong |
| Schema.org JSON-LD | FAQPage answers, Product descriptions, BreadcrumbList names | P0 | AI citations pull from this |
| Main body content | Blog posts, card review prose, learn pages, merchant guides | P0 | The actual value proposition |
| Calculator labels & placeholders | Input labels, slider labels, result cards, alerts | P0 | "Monthly Payment", "Interest / Fees", etc. |
| Email capture copy | `shared/email-capture.js` | P1 | Conversion element |
| PWA manifest strings | `manifest.webmanifest` | P2 | Minor touchpoint |
| Offline page | `offline.html` | P2 | Fallback page |

### 3.2 Categories That Stay in English

| Category | Rationale |
|----------|-----------|
| **Card names** (Chase Sapphire Preferred®, Amex Gold, etc.) | Proper nouns. Issuer branding. Translating them breaks affiliate links, confuses users, and looks unprofessional. |
| **BNPL service names** (Klarna, Afterpay, Affirm) | Brand names. |
| **Bank/issuer names** (Chase, Citi, Capital One) | Proper nouns. |
| **Credit score brand names** (FICO, VantageScore) | Trademarked proper nouns. |
| **Common financial terms that don't translate well** | APR, cash back, BNPL — kept as-is in target language where speakers use the English term (especially Taglish). |
| **US state abbreviations** (CA, NY, TX) | Universal codes. |
| **Currency symbols** ($, USD) | Universal. |
| **URL slugs** | Technical identifiers. Must remain consistent for hreflang mapping. |
| **Internal IDs, CSS classes, JSON-LD `@id` values** | Technical. Never user-visible. |
| **Code comments in JS** | Internal documentation. |
| **Affiliate link URLs and tracking parameters** | Functional. Must remain intact. |
| **Image `alt` text on card logos** | Usually card name — stays English. |

### 3.3 Special Cases

| Case | Treatment |
|------|-----------|
| **Card review page content** (prose, FAQs) | Full translation. Prose, pros/cons, verdict, and FAQ answers all translate. |
| **Schema FAQ answers** | Full translation. Heavily used by AI for citation. |
| **Schema Product descriptions** | Full translation. |
| **BreadcrumbList names** | Translate the `name` fields ("Home" → "Inicio", etc.). |
| **Credit score brackets** (Poor/Fair/Good/Very Good/Excellent) | Translate. User-facing labels. |
| **Calculator result labels** | Translate. Hardcoded in `app.js` template literals. |
| **Alert messages** | Translate. Critical for UX. |
| **Sales tax state names** | Keep English ("California") — these are US place names. |

---

## 4. Translation Pipeline

### 4.1 Scale

- **~94 source HTML pages** × **5 languages** = **~470 translated HTML pages**
- Plus **~6 JavaScript files** with embedded UI strings, each needing per-language locale files
- Plus **~5 shared partials** × **5 languages** = **~25 partial files**

**Total: ~500+ files.** Automation is required.

### 4.2 LLM Translation Pipeline

**Three-model approach for maximum quality:**

| Role | Model | Venice ID | Why |
|------|-------|-----------|-----|
| **Primary translator** (pass 1) | Claude Sonnet 4.6 | `venice/claude-sonnet-4-6` | Best at following translation rules, preserving HTML structure, multilingual quality |
| **LLM reviewer** (pass 2) | Gemini 3.1 Pro | `venice/gemini-3-1-pro-preview` | Pro-tier review. Different model catches different errors. Strong multilingual training |
| **Spot-checker** (10% sample) | GPT-5.4 | `venice/openai-gpt-54` | Independent model, catches errors the other two miss |
| **Tier 1 auto-approve** (nav/UI labels only) | GPT-5.4 Mini | `venice/openai-gpt-54-mini` | Very cheap, good enough for simple strings |

**Process:**

1. **Pass 1 — Translate**: Sonnet 4.6 with master translation prompt (temperature 0.3)
2. **Pass 2 — Review**: Gemini 3.1 Pro reads translation + original, flags errors, suggests fixes
3. **Pass 3 — Spot-check**: GPT-5.4 reviews 10% of content (random sample across all tiers)
4. **Tier 1 auto-approve**: GPT-5.4 Mini handles nav labels and UI strings — no human needed
5. **Human review**: Only Tier 3 content (disclosures, financial claims) and flagged items from passes 2-3

**Per-language LLM quality assessment:**

| Language | Sonnet 4.6 | Gemini 3.1 Pro | GPT-5.4 | Notes |
|----------|-----------|---------------|---------|-------|
| **Spanish (es)** | Excellent | Excellent | Excellent | Best LLM coverage of any non-English language |
| **Chinese Simplified (zh)** | Very good | Very good | Very good | Mainland terms preferred; check for US-Chinese community usage |
| **Korean (ko)** | Very good | Very good | Good | Honorifics critical — must use 존댓말 (~습니다) throughout |
| **Tagalog (tl)** | Good | Good | Good | Use Taglish hybrid; pure Tagalog sounds unnatural for financial terms |
| **Hindi (hi)** | Very good | Very good | Very good | Strong LLM coverage; large training corpus. Use formal register throughout |

### 4.3 Prompt Engineering for Consistent Financial Translation

Create a **master translation prompt** (`docs/translation-prompt.md`) used for every batch:

```markdown
# CreditStud.io Translation Instructions

## Context
You are translating content for CreditStud.io, a US credit card comparison and
financial calculator website. The audience is US residents who speak [TARGET LANGUAGE].
All financial products, rates, and terms are US-specific.

## Rules
1. NEVER translate proper nouns: credit card names (Chase Sapphire Preferred,
   Amex Gold), bank names (Chase, Citi), BNPL brand names (Klarna, Afterpay),
   credit score brands (FICO, VantageScore), or US government agency names.
2. NEVER translate common financial abbreviations where the English term is
   commonly used in the target language community (APR, BNPL, cash back, etc.).
3. Keep all dollar amounts, percentages, and numerical values exactly as written.
4. For financial terms, use the most common term in the US [TARGET LANGUAGE]
   speaking community, not necessarily the term used in the home country.
5. For Korean: use formal honorifics (존댓말, ~습니다) throughout.
6. For Tagalog: use Taglish for technical financial terms where English is
   commonly used in Filipino-American communities. Example: "credit card" stays
   "credit card" rather than forcing "tarheta ng pagkredito."
7. For Hindi: use formal register (आदरणीय/औपचारिक) throughout. Use Devanagari 
   script for all prose, but keep English financial terms commonly used by 
   Hindi-speaking US residents.
8. Preserve all HTML tags, attributes, JSON-LD structure, and href values exactly.
   Only translate text content.
9. Preserve all affiliate link URLs and tracking parameters unchanged.
10. Maintain the same tone: helpful, direct, slightly informal but trustworthy.
11. For FAQ answers: keep them concise and factual, same length as the original.

## Terminology Glossary (per language)
[Language-specific glossary of 50-100 critical financial terms with approved translations]
```

### 4.4 Handling Template Literal Strings in app.js

**Problem:** `app.js` has ~100+ UI strings embedded in template literals.

**Solution: Extract strings to locale JSON files**

```
locales/
├── en.js                    # English (source of truth)
├── es.js                    # Spanish
├── zh.js                    # Chinese Simplified
├── tl.js                    # Tagalog
├── ko.js                    # Korean
├── hi.js                    # Hindi
├── en/                      # Per-tool namespaces
│   ├── debt-planner.json
│   ├── rewards.json
│   ├── score-simulator.json
│   └── min-payment.json
├── es/
│   └── ... (same structure)
└── ... (per language)
```

**Helper function injected in all pages:**

```javascript
const t = (key, params = {}) => {
  const val = window.LOCALE?.[key] || key;
  return Object.entries(params).reduce((s, [k, v]) => s.replace(`{${k}}`, v), val);
};

// Usage:
alert(t('alerts.enterPurchaseAmount'));
const rankLabels = [t('results.bestChoice'), t('results.secondChoice'), ...];
```

**Fallback:** If a translation key is missing, fall back to English.

### 4.5 Translation Review Tool (`translate.js --extract-review`)

**Auto-extracts every translatable string** into a review-friendly format per language:

```
review/
├── es-review.json
├── zh-review.json
├── tl-review.json
├── ko-review.json
└── hi-review.json
```

Each entry:

```json
{
  "page": "/cards/chase-sapphire-preferred/",
  "type": "faq-answer",
  "id": "faq-1",
  "english": "Is the Chase Sapphire Preferred worth the $95 annual fee?",
  "translation": "¿Vale la pena la tarjeta Chase Sapphire Preferred por la cuota anual de $95?",
  "source": "schema",
  "tier": 2,
  "reviewed": false
}
```

A reviewer opens the JSON file, marks `reviewed: true`, and notes any corrections. The build system reads these back to validate and commit.

**Tier classification in review files:**
- **Tier 1** (auto-approved): Nav labels, UI strings, button text, breadcrumb names
- **Tier 2** (spot-check 20%): Blog prose, card review text, learn pages
- **Tier 3** (mandatory human review): Disclosures, affiliate disclaimers, FAQ schema with financial claims

### 4.6 Quality Tiers

| Tier | Content Types | LLM Process | Human Review |
|------|---------------|-------------|--------------|
| **Tier 1** (Auto) | Nav labels, UI strings, breadcrumb names, button text | Sonnet 4.6 → auto-approve | None |
| **Tier 2** (Spot-check) | Blog prose, card reviews, learn pages, meta descriptions | Sonnet 4.6 translate → Gemini 3.1 Pro review → GPT-5.4 10% spot-check | Human reviews ~20% |
| **Tier 3** (Mandatory review) | Disclosures, affiliate disclaimers, FAQ schema answers, financial claims | Sonnet 4.6 translate → Gemini 3.1 Pro review → GPT-5.4 10% spot-check | Human reviews 100% |

---

## 5. Technical Implementation

### 5.1 File Structure

```
credit-calculator/
├── index.html                    # English (canonical)
├── es/
│   ├── index.html
│   ├── cards/
│   │   ├── index.html
│   │   ├── chase-sapphire-preferred/
│   │   │   └── index.html
│   │   └── ...
│   ├── blog/
│   │   ├── index.html
│   │   └── best-0-apr-credit-cards.html
│   └── ... (mirror of English structure)
├── zh/
│   └── ... (same structure)
├── tl/
│   └── ... (same structure)
├── ko/
│   └── ... (same structure)
├── hi/
│   └── ... (same structure)
├── shared/
│   ├── header.html               # English
│   ├── header-es.html
│   ├── header-zh.html
│   ├── header-tl.html
│   ├── header-ko.html
│   ├── header-hi.html
│   ├── footer.html / footer-{lang}.html
│   ├── disclosure-banner.html / disclosure-banner-{lang}.html
│   └── ga4.html                  # Same for all (tracking)
├── locales/
│   ├── en.js
│   ├── es.js
│   ├── zh.js
│   ├── tl.js
│   ├── ko.js
│   ├── hi.js
│   ├── en/                       # Per-tool namespaces
│   │   ├── debt-planner.json
│   │   ├── rewards.json
│   │   ├── score-simulator.json
│   │   └── min-payment.json
│   └── es/
│       └── ... (same structure, per language)
├── review/                       # Translation review files (gitignored)
│   ├── es-review.json
│   ├── zh-review.json
│   ├── tl-review.json
│   ├── ko-review.json
│   └── hi-review.json
├── .translation-state.json       # Hash tracking (gitignored)
├── build.js                      # Updated build system
├── translate.js                  # Translation orchestration
└── scripts/
    ├── check-translations.js     # Stale detection
    └── generate-sitemaps.js       # Per-language sitemaps
```

### 5.2 Build System Changes (build.js)

Extend existing `build.js` to support i18n:

**New responsibilities:**
1. Accept `--lang` parameter (default: `en`)
2. Load `shared/header-{lang}.html`, `shared/footer-{lang}.html`, `shared/disclosure-banner-{lang}.html`
3. Inject `locales/{lang}.js` and per-tool locale files as `<script>` tags
4. Update `<html lang="en">` to `<html lang="{lang}">`
5. For non-English builds, output to `/{lang}/` directory
6. Inject full-mesh hreflang links in `<head>`

**Build commands:**

```bash
# Build English (default)
node build.js

# Build Spanish only
node build.js --lang es

# Build all languages
node build.js --all-langs

# Check for stale translations
node scripts/check-translations.js

# Translate only stale pages
node translate.js --stale-only

# Translate all pages (full rebuild)
node translate.js --all

# Extract review files
node translate.js --extract-review

# Generate sitemaps
node scripts/generate-sitemaps.js
```

### 5.3 Language Switcher Component

```html
<div class="language-switcher">
  <button class="lang-toggle" aria-label="Select language" aria-expanded="false">
    🌐 <span class="current-lang">EN</span>
  </button>
  <div class="lang-dropdown">
    <a href="/" hreflang="en" lang="en">English</a>
    <a href="/es/" hreflang="es" lang="es">Español</a>
    <a href="/zh/" hreflang="zh" lang="zh">简体中文</a>
    <a href="/tl/" hreflang="tl" lang="tl">Tagalog</a>
    <a href="/ko/" hreflang="ko" lang="ko">한국어</a>
    <a href="/hi/" hreflang="hi" lang="hi">हिन्दी</a>
  </div>
</div>
```

**Behavior:**
- Preserves current page path when switching languages (e.g., `/cards/chase-sapphire-preferred/` → `/es/cards/chase-sapphire-preferred/`)
- Stores preferred language in `localStorage`
- Mobile-friendly dropdown

### 5.4 hreflang Implementation

Every page includes full-mesh hreflang links:

```html
<!-- On any page, all 6 language versions linked -->
<link rel="alternate" hreflang="en" href="https://creditstud.io/cards/chase-sapphire-preferred/">
<link rel="alternate" hreflang="es" href="https://creditstud.io/es/cards/chase-sapphire-preferred/">
<link rel="alternate" hreflang="zh" href="https://creditstud.io/zh/cards/chase-sapphire-preferred/">
<link rel="alternate" hreflang="tl" href="https://creditstud.io/tl/cards/chase-sapphire-preferred/">
<link rel="alternate" hreflang="ko" href="https://creditstud.io/ko/cards/chase-sapphire-preferred/">
<link rel="alternate" hreflang="hi" href="https://creditstud.io/hi/cards/chase-sapphire-preferred/">
<link rel="alternate" hreflang="x-default" href="https://creditstud.io/cards/chase-sapphire-preferred/">
```

**Injected automatically by build system** based on page's relative path. No manual management.

### 5.5 Sitemap Structure

**Per-language sitemaps** with a sitemap index:

- `sitemap-en.xml` — English pages
- `sitemap-es.xml` — Spanish pages
- `sitemap-zh.xml` — Chinese pages
- `sitemap-tl.xml` — Tagalog pages
- `sitemap-ko.xml` — Korean pages
- `sitemap-hi.xml` — Hindi pages
- `sitemap-index.xml` — Index of all sitemaps

Each sitemap URL includes `xhtml:link` alternates for all languages.

---

## 6. Compressed Timeline: 6 Weeks

| Week | Timeline | What |
|------|----------|------|
| **1** | May 5-9 | **Foundation**: Extract JS strings to locale files, update build system, create locale directory structure, add hreflang injection, language switcher, create glossaries for all 5 languages |
| **2** | May 12-16 | **Spanish pilot (10 pages)** — translate shared partials, locale JS, and top 10 pages; deploy `/es/` section. Start all other languages in parallel |
| **3** | May 19-23 | **All 5 languages deployed** (pilot pages + shared partials). Extract review tool running. Human review begins on Tier 3 content |
| **4-5** | May 26 - Jun 6 | **Full content translation** — all 94 pages × 5 languages via batch LLM. Gemini 3.1 Pro reviewing. GPT-5.4 spot-checking |
| **6** | Jun 9-13 | **Polish**: Schema audit, hreflang validation, sitemap generation, review queue cleanup, deploy full site |

**Why 6 weeks instead of 24:**
- LLM translation runs in parallel (not sequential)
- All 5 languages built simultaneously after Spanish pilot validates the pipeline
- Human review focused only on Tier 3 (disclosures/financial claims), not everything
- Build automation reduces manual overhead

---

## 7. Ongoing Translation Infrastructure

### 7.1 Git-Triggered Pipeline

```
English page edited → Git commit/push → GitHub Action triggers
       ↓
  check-translations.js
  - Compute SHA-256 hash of translatable content
  - Compare to stored hashes in .translation-state.json
  - Generate stale report
       ↓ (if stale pages found)
  translate.js --stale-only
  - Sonnet 4.6 translates changed pages
  - Gemini 3.1 Pro reviews output
  - GPT-5.4 spot-checks 10%
  - Outputs to review/ directory
  - Tier 1 items auto-approved
  - Tier 2-3 flagged for review
       ↓
  build.js --all-langs
  - Injects shared partials
  - Adds hreflang tags
  - Generates locale JS
  - Outputs to /es/, /zh/, etc.
       ↓
  [Auto-deploy to GitHub Pages]
       ↓
  [Ping search engines]
```

### 7.2 Stale Translation Detection

```json
// .translation-state.json (gitignored)
{
  "cards/chase-sapphire-preferred/index.html": {
    "en_hash": "a3f7c2...",
    "translations": {
      "es": { "hash": "a3f7c2...", "translated_at": "2026-05-15" },
      "zh": { "hash": "a3f7c2...", "translated_at": "2026-05-15" },
      "tl": { "hash": "a3f7c2...", "translated_at": "2026-05-15" },
      "ko": { "hash": "a3f7c2...", "translated_at": "2026-05-15" },
      "hi": { "hash": "a3f7c2...", "translated_at": "2026-05-15" }
    }
  }
}
```

### 7.3 New Page Workflow

```
1. Create English page (existing workflow)
2. node translate.js --new-only
   → Detects pages without translations
   → Runs Sonnet 4.6 translation for all 5 languages
   → Outputs to review/ directory
3. Auto-approve Tier 1; flag Tier 2-3
4. node build.js --all-langs
5. Deploy
```

### 7.4 Update Workflow

```
1. Edit English page
2. node scripts/check-translations.js
   → Lists stale translations (hash mismatch)
3. node translate.js --stale-only
   → Re-translates only changed pages
4. node build.js --all-langs
5. Deploy
```

### 7.5 Ongoing Maintenance (Monthly)

| Activity | Hours/Month | Notes |
|----------|-------------|-------|
| Stale translation check & regeneration | 2-4 | Automated; human reviews flagged pages |
| New page translation | 1-3 | Variable based on publishing cadence |
| Human spot-checks (Tier 2-3) | 2-4 | Ongoing quality assurance |
| SEO monitoring per language | 1-2 | Google Search Console, AI citation tracking |
| **Total** | **6-13 hrs/month** | ~1.5-3 hrs/week |

---

## 8. SEO & AI Citation Considerations

### 8.1 Google's Multilingual Site Guidelines

- **hreflang must be bidirectional** — our full-mesh approach satisfies this
- **No machine translation penalty** — Google doesn't penalize quality MT, but low-quality auto-translation can be flagged as spam. LLM + review pipeline is our defense
- **One URL per language** — directory approach satisfies this
- **x-default is required** — points to English

### 8.2 AI Citation Impact

| Factor | Impact |
|--------|--------|
| **Translated FAQ schema** | High — AI models heavily use FAQ schema for direct answers |
| **Translated meta descriptions** | Medium — influences AI summary generation |
| **Translated body content** | High — models ingest and cite translated content directly |
| **hreflang correctness** | Medium — helps AI crawlers understand language relationships |
| **Card names staying English** | Neutral/positive — Spanish/Chinese speakers searching for "Chase Sapphire Preferred" match both |

**Expected outcome:** Within 2-4 months, search queries in target languages about US credit cards should start surfacing CreditStud.io pages.

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM mistranslates financial compliance text | Medium | **High** (legal) | Mandatory human review for Tier 3; glossary of approved terms |
| Tagalog translations sound unnatural | High | Medium | Use Taglish hybrid; native speaker review |
| Korean honorific level wrong | Medium | Medium | Explicit prompt instruction (존댓말); Gemini 3.1 Pro review |
| Hindi formal register inconsistent | Low | Medium | Explicit prompt instruction (औपचारिक); Gemini 3.1 Pro review |
| hreflang errors hurt SEO | Medium | Medium | Automated build injection; validate with Search Console |
| 470 new pages overwhelm build/deploy | Low | Low | Static files are cheap; build time manageable |
| English content changes faster than translations | High | Medium | Hash-based diff tracking; 30-day stale grace period |
| Card names get "helpfully" translated by LLM | Medium | Medium | Explicit prompt rule; post-translation regex validation |
| Maintenance burden unsustainable | Medium | **High** | Automated pipeline; only Tier 3 needs human review |

---

## 10. Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| All 5 language directories indexed by Google | 100% of pages | 4 weeks post-launch |
| hreflang errors in Search Console | 0 | Ongoing |
| Organic traffic from non-English queries | >5% of total | 3 months post-full-launch |
| AI citations in Spanish/Chinese/etc. | >10/month | 3 months post-full-launch |
| Translation freshness | <10% stale at any time | Ongoing |
| Page speed (Lighthouse) | Same as English (±5%) | Ongoing |
| User-reported translation errors | <2/month | Ongoing |

---

## 11. Appendix A: Financial Terminology Glossary (Sample)

### Spanish (es)

| English | Spanish (US) | Notes |
|---------|--------------|-------|
| Credit Card | Tarjeta de Crédito | Standard |
| Annual Fee | Cuota Anual | Common US Spanish term |
| APR | TASA or APR | Many US Spanish speakers know "APR" |
| Balance Transfer | Transferencia de Saldo | Standard |
| Cash Back | Reembolso en Efectivo or "cash back" | Often untranslated |
| Credit Score | Puntaje de Crédito | "Score de Crédito" also used |
| Intro APR | TASA de Introducción or "intro APR" | |
| Late Fee | Cargo por Pago Tardío | |
| Minimum Payment | Pago Mínimo | Standard |
| Net Cost | Costo Neto | |
| Rewards | Recompensas or "rewards" | |
| Sign-up Bonus | Bono de Apertura or "sign-up bonus" | |
| Zero Interest | 0% de Interés or Sin Interés | |

### Hindi (hi)

| English | Hindi | Notes |
|---------|-------|-------|
| Credit Card | क्रेडिट कार्ड | Commonly used as-is in transliteration |
| Annual Fee | वार्षिक शुल्क | |
| APR | APR | Keep English — commonly used |
| Balance Transfer | बैलेंस ट्रांसफर | Commonly transliterated |
| Cash Back | कैशबैक | Commonly used as-is |
| Credit Score | क्रेडिट स्कोर | Transliteration, not कर्ज़ स्कोर |
| Intro APR | शुरुआती APR | |
| Late Fee | लेट फीस or विलंब शुल्क | Both used |
| Minimum Payment | न्यूनतम भुगतान | |
| Rewards | रिवॉर्ड्स | Commonly transliterated |

**Full glossaries for all 5 languages must be created before translation begins.**

---

## 12. Appendix B: Build Command Reference

```bash
# Build English only (default)
node build.js

# Build Spanish only
node build.js --lang es

# Build all languages
node build.js --all-langs

# Check which translations are stale
node scripts/check-translations.js

# Translate stale pages only
node translate.js --stale-only

# Translate all pages (full rebuild)
node translate.js --all

# Extract review files for human review
node translate.js --extract-review

# Generate sitemaps for all languages
node scripts/generate-sitemaps.js
```

---

## Decisions Log

| Decision | Made By | Date |
|----------|---------|------|
| Directory-based URLs (`/es/`, `/zh/`, etc.) | Dane | 2026-05-02 |
| 5 target languages: es, zh, tl, ko, hi | Dane | 2026-05-02 |
| Dropped Vietnamese (weak LLM quality) | Dane | 2026-05-02 |
| Dropped Arabic (RTL layout complexity for V1) | Dane | 2026-05-02 |
| Card names/terms stay English | Dane | 2026-05-02 |
| Taglish hybrid for Tagalog | Dane | 2026-05-02 |
| Primary translator: Sonnet 4.6 | Hank/Dane | 2026-05-02 |
| LLM reviewer: Gemini 3.1 Pro | Hank/Dane | 2026-05-02 |
| Spot-checker: GPT-5.4 | Hank/Dane | 2026-05-02 |
| Tier 1 auto: GPT-5.4 Mini | Hank/Dane | 2026-05-02 |
| Compressed 6-week timeline | Dane | 2026-05-02 |
| Auto-extract review tool | Dane | 2026-05-02 |
| Git-triggered translation pipeline | Dane | 2026-05-02 |

---

*End of specification — v2.0, approved 2026-05-02*