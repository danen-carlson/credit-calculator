# CreditStud.io GEO Sprint Plan
> Generated 2026-05-01 by Hank 🐕

## Overview

Two GEO task lists merged and reorganized into **5 sprints** prioritized by:
1. **Impact × effort** — highest ROI first
2. **Dependencies** — some items block others
3. **Logical grouping** — related work batched together

**Total items:** 32 (8 done, 24 to-do)
**Timeline:** ~5 weeks (1 sprint/week), assuming Dane has 3–5 hrs/week

**Vikunja Task IDs:** Tasks #118–#144 in CreditStud.io project (ID 3)
**Labels:** geo-sprint-1 through geo-sprint-5

---

## ✅ Already Done (8 items) — Sprint 0

| # | Item | Status |
|---|------|--------|
| 1 | /llms.txt for AI crawlers | ✅ Live |
| 2 | robots.txt LLM directives | ✅ Live |
| 3 | .well-known/ai-plugin.json | ✅ Live |
| 4 | .well-known/openapi.json | ✅ Live |
| 5 | FAQPage + Article schema on pages | ✅ Partial (FAQPage on calc pages, Article on some) |
| 6 | Sitemap includes llms.txt | ✅ Live |
| 7 | Deep-link URL params for all calculators | ✅ Live |
| 8 | llms.txt LLM permission statement | ✅ Live |

---

## Sprint 1: Authority Foundations (Week 1)
> **Goal:** Get CreditStud.io verified by the 3 major AI citation sources + fix schema gaps

### Critical path items — these are the biggest unlocks:

| # | Item | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 9 | Submit to Perplexity | 🔴 High | 15min | #1 thing for LLM visibility. Go to perplexity.ai/settings/privacy. **Dane owns** |
| 10 | Submit to Bing Webmaster Tools | 🔴 High | 30min | Powers Copilot citations. Need MS account. **Dane owns** |
| 11 | Submit to Google Search Console | 🔴 High | 30min | AI Overviews pull from well-structured sites. Need DNS verification. **Dane owns** |
| 3-P2 | Add BreadcrumbList schema everywhere | 🔴 High | 2hr | Only debt-planner has it. Home > Cards > Amex Gold etc. |

**Why first:** These 4 items create the foundation that everything else builds on. Perplexity/Bing/Google verification gets you *into* the AI citation pipeline. BreadcrumbList is the simplest schema gap that signals site structure.

**Vikunja tasks:** #118 (Perplexity), #119 (Bing), #120 (GSC), #121 (BreadcrumbList)

---

## Sprint 2: Schema & API (Week 2)
> **Goal:** Complete all structured data + create the JSON API (biggest single unlock)

| # | Item | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 1-P2 | Add Review schema to card pages | 🔴 High | 3hr | Cards have Product + AggregateRating, need Review |
| 2-P2 | Add Article schema to blog posts | 🔴 High | 2hr | Blogs only have FAQPage, need headline/author/datePublished |
| 4-P2 | Add HowTo schema to calculator pages | 🟡 Medium | 2hr | debt-planner has it; extend to compare, rewards, min-payment |
| 6-P2 | Create JSON API endpoint | 🔴 High | 4hr | /api/compare?amount=2000&months=12&score=720 → JSON. **Biggest unlock** — LLMs with tool use can call directly |
| 12 | Write for AI citation patterns | 🟡 Medium | 2hr | Direct answers first, "Is X worth it?" phrasing in new content |

**Why this order:** JSON API is the single biggest unlock (LLMs call it as a tool). Schema completion ensures citations display rich data. Content patterns ensure the *text* is citation-worthy.

---

## Sprint 3: Distribution & Freshness (Week 3)
> **Goal:** Get indexed by AI directories + make sure crawlers see fresh data

| # | Item | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 5-P2 | Create RSS/Atom feed for /blog/ | 🔴 High | 2hr | Full article content, not excerpts. LLM crawlers index RSS |
| 7-P2 | Add /tools/ or /api/ documentation page | 🟡 Medium | 2hr | Human-readable. Link from llms.txt |
| 13 | Submit to AI directories | 🟡 Medium | 1hr | thereisanaiforthat.com, futurepedia.io, toolify.ai |
| 14 | Build backlinks | 🟡 Medium | Ongoing | Finance/credit subreddits, forum answers, blog mentions |
| 14-P2 | Add dateModified to all schema | 🟡 Medium | 1hr | reviewDate on cards, dateModified on blogs = freshness signal |
| 15-P2 | Ping search engines on updates | 🟡 Medium | 1hr | Post-commit hook to submit updated sitemaps |
| 16 | Add /blog/ RSS feed | ⬆️ Merged with #5-P2 | — | Duplicate of item 5-P2 |
| 16-P2 | Add changefreq hints to sitemap | 🟢 Low | 30min | /compare/ = weekly, /cards/ = monthly |

---

## Sprint 4: Trust & Authority Signals (Week 4)
> **Goal:** Make CreditStud.io look like a canonical data source, not just another calculator site

| # | Item | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 11-P2 | Add SameAs links in card Product schema | 🟡 Medium | 2hr | Link to official issuer pages — signals data matches canonical source |
| 12-P2 | Create /data/cards.json endpoint | 🟡 Medium | 1hr | Expose cards-data.js as clean JSON |
| 9-P2 | Generate OG images for all pages | 🟡 Medium | 3hr | Only compare.png + debt-planner.png exist. Need 28 cards + 16 blogs |
| 15 | Verify og:title/description/image on all pages | 🟡 Medium | 1hr | Quick audit + fix |
| 10-P2 | Add Dataset schema to comparison tables | 🟡 Medium | 1hr | Signals verifiable, structured data |
| 13-P2 | Submit to Google Dataset Search | 🟢 Low | 30min | datasetsearch.research.google.com |
| 18-P2 | Landing page about methodology | 🟡 Medium | 2hr | /about — data collection, calculation methods, FTC disclosure, update frequency |

---

## Sprint 5: Monitoring & Optimization (Week 5)
> **Goal:** Close the loop — measure what's working and optimize

| # | Item | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 17 | Schema.org HowTo on calculator pages | ⬆️ Already in Sprint 2 (#4-P2) | — | |
| 19-P2 | Monitor AI citations | 🟢 Low | 1hr | Set up alerts for creditstud.io in AI responses |
| 20 | A/B test llms.txt formats | 🟢 Low | 2hr | Monitor AI crawler frequency |
| 20-P2 | Monitor AI user agents | 🟢 Low | 1hr | Watch server logs for GPTBot, ClaudeBot, PerplexityBot |
| 17-P2 | Create ChatGPT custom GPT | 🟢 Low | 2hr | Uses URL params as a tool. Every conversation = citation |
| 19 | Monitor LLM citations | ⬆️ Merged with #19-P2 | — | Duplicate |

---

## Consolidated Backlog (No Sprint Assigned Yet)

These are lower priority and can be picked up ad-hoc:

| Original # | Item | Reason |
|------------|------|--------|
| 18 | Methodology landing page | Moved to Sprint 4 as #18-P2 |

---

## Key Decisions for Dane

1. **JSON API (item 6-P2)** — This is the single biggest GEO unlock. An LLM can *call* it directly vs. just reading text. Recommend building early (Sprint 2) even though it's 4hrs effort.

2. **Backlinks (#14)** — Ongoing effort, not a one-time task. Start in Sprint 3 but continue indefinitely. Reddit, finance forums, blog comments.

3. **ChatGPT Custom GPT (#17-P2)** — Low priority but high novelty. Each conversation creates a citation. Can wait until Sprint 5.

4. **OG images (#9-P2)** — Tedious (28 cards + 16 blogs) but matters for social + AI citation thumbnails. Can be partially automated with a script.

5. **Methodology page (#18-P2)** — Trust signal for both Google's E-E-A-T and LLMs. Important but not blocking — do in Sprint 4.

---

## Task Creation Plan for Vikunja

Will create tasks under **CreditStud.io project (ID 3)** with sprint labels:

- `geo-sprint-1` — Authority Foundations
- `geo-sprint-2` — Schema & API  
- `geo-sprint-3` — Distribution & Freshness
- `geo-sprint-4` — Trust & Authority
- `geo-sprint-5` — Monitoring & Optimization

Each task = one item from the lists, with description referencing original numbering.