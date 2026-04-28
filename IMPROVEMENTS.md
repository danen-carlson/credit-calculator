# CreditStud.io — Prioritized Improvements

_Generated 2026-04-28 from a four-track review (Compare, Debt Planner, Rewards, Cross-cutting)._

Severity: **P0** = trust/correctness/SEO blocker · **P1** = important UX/conversion · **P2** = nice-to-have polish.
Effort: **S** = a few hours · **M** = ~1 day · **L** = multi-day.

---

## 🚨 P0 — Fix First (correctness, trust, SEO blockers)

### 1. Empty Learn pages render as blank to crawlers and users — **L**
All five `learn/*.html` files (~2,775 bytes each) contain only JSON-LD schema. No visible HTML content. Search engines that don't execute JS see thin/empty pages, and users hitting them from search get nothing. **Action:** restore/author actual content on each page (1,000–1,500 words + embedded calculator widget). These are the SEO landing pages.

### 2. Citi Double Cash balance-transfer fee is hardcoded to 0% — **S**
`data.js` lists `transferFeePct: 0` for Citi Double Cash. Real-world fee is 3–5%. This silently makes the card look like the best balance transfer option in the Debt Planner. **Action:** correct fee to 3% (or 5% if intro fee), and audit every other card's transfer fee against current issuer terms.

### 3. Credit-score simulator mutates real debt APRs — **M**
`planner.js:765` (`updateDebtAPRsBasedOnCreditScore`) silently rewrites the user's actual entered debt APRs when they move the simulator slider. Users exploring "what if my score were 750?" lose their original data. **Action:** keep simulator inputs scoped to a separate state object; never write back to `debts[]`. Display "projected APR if score = X" alongside actual.

### 4. Compare math: amortization is flat, not standard — **M**
`evaluateCreditCardNoIntro` in `calc.js` uses `monthlyPmt = amount / targetMonths` with month-by-month accrual instead of standard amortization (`PMT` formula). Result: total interest is over- or under-stated vs. what users will actually pay. **Action:** replace with proper amortization formula `PMT = P · r / (1 − (1+r)^−n)` and update tests.

### 5. BNPL Pay-in-4 hidden whenever payoff target > 3 months — **S**
`calculateOptions` excludes Klarna/Afterpay/PayPal Pay-in-4 from any timeline > 3 months, even though they're 0% interest and the user could finish early. This routinely hides the cheapest option. **Action:** always include Pay-in-4 when amount fits min/max, and surface a "pays off in ~6 weeks, ahead of your goal" badge.

### 6. Brand inconsistency: "CreditStud.io" vs "CreditStudio" — **S**
Homepage uses `CreditStud.io`. `shared/header.html` and `shared/footer.html` use `CreditStudio`. Picks one, applies it sitewide (logo, title tags, meta, OG). **Action:** decide on canonical brand, mass-rename.

### 7. US Bank Cash+ hardcoded 5% categories — **S**
`rewards.js:244` forces gas/utilities/streaming as the user's 5% picks. The whole Cash+ value prop is *user choice*. **Action:** add a UI for picking the two 5% categories from the eligible list, then compute against user's spend.

---

## 🟠 P1 — Important (UX/conversion gaps)

### Cross-feature integration
8. **No cross-tool nav between Compare / Debt Planner / Rewards** — **S**
   Add "Already have debt? Plan your payoff →" CTA after Compare results, and "See which card maximizes rewards on this purchase →" between Compare and Rewards. Pass amount via query string.

9. **Header/footer nav inconsistent across pages** — **S**
   `shared/header.html` is missing the **Learn** link that homepage has. Footers diverge between homepage and shared template. Standardize the shared partials and rebuild.

10. **Blog "Try the Calculator →" links go to `/`** — **S**
    Most blog posts CTA to homepage instead of the relevant tool. Re-target each post's CTA to the specific calculator (debt blog → debt planner, BNPL blog → compare, rewards blog → rewards).

### Compare feature
11. **Define "Net Cost" on the page** — **S**
    Add a tooltip/inline explanation of `netCost` (purchase + interest + fees − rewards) at first appearance.

12. **Hero subtitle says "credit payment options" but tool covers BNPL** — **S**
    Rewrite subtitle to "Compare credit cards, BNPL, and payment plans side by side."

13. **Show purchase category** — **M**
    Lets the tool weight rewards correctly (groceries vs travel) and filter BNPL availability. Either dropdown or a "What are you buying?" smart-suggest.

14. **Reverse calc: "I can afford $X/month"** — **M**
    Many users think in monthly budget, not months. Add a toggle that converts months ↔ monthly payment.

15. **Sales-tax / location awareness** — **S**
    Optional "include sales tax" toggle with state lookup. CA users routinely under-budget by ~8%.

### Debt Planner
16. **Headline "debt-free date" callout** — **S**
    The most motivating number is buried. Promote the optimal-strategy debt-free date to a hero stat with countdown.

17. **Date-labeled charts instead of "Month 1, Month 2"** — **S**
    Use actual months ("Jun 2026") in chart axes/tooltips. Far more meaningful for life planning.

18. **Common card APR auto-suggest** — **M**
    Type "Chase Sapphire" → autofill 24.49%. Same for Amex, Capital One, Citi, Discover. Massive time-saver and accuracy improvement.

19. **Balance-transfer gotcha warnings** — **S**
    Warn explicitly: deferred interest if not paid in full by promo end, retroactive interest on store-card variants, post-promo APR cliff.

20. **"Extra payments" / windfall modeling** — **M**
    "What if I pay $200 extra in March (tax refund)?" — drop a one-time payment in and re-project.

### Rewards
21. **Wallet optimization engine** — **L**
    The wallet shows a sum of net values, which double-counts. Build the actual matcher: "Use Card A for groceries, Card B for travel" → real combined value with no double-counting. This is the killer feature most rewards calculators don't do.

22. **"No annual fee" filter** — **S**
    One of the most-requested filters. Add to the existing filter row.

23. **"Cards I already have" exclusion** — **S**
    Multi-select; results hide owned cards. Critical for repeat users.

24. **Add Chase Sapphire Reserve, Amex Platinum, Bilt** — **M**
    These three cards are foundational to any serious rewards conversation. Missing them undermines credibility.

25. **Explain WHY a card is recommended** — **S**
    Sentence per top result: "You'd earn $X more because Y% on groceries is your biggest category."

26. **Annual / monthly spending toggle** — **S**
    Travel and "everything else" especially are easier to reason about annually.

27. **Slider max too low ($2,000)** — **S**
    Bump to $5,000 (or unbounded with input). Heavy spenders get clipped.

28. **Bonus eligibility — "I had this card N months/years ago"** — **S**
    Already partially modeled; expose to UI as a "previously held" toggle per card.

### Email / Lead Gen
29. **Email capture has no backend** — **M**
    Currently writes to `localStorage` only — emails are lost on browser clear and can't be sent to. Wire to a real provider (ConvertKit / Mailchimp / Beehiiv / Resend), or at minimum a Cloudflare Worker → KV/D1 for capture.

30. **No actual lead magnet** — **M**
    "Get alerts" promises nothing concrete. Offer a real artifact: PDF "Your Personalized Debt Payoff Plan" generated from the planner's state, or weekly "Best Cards This Month" email.

### SEO / Sharing
31. **No `og:image` / Twitter cards anywhere** — **S**
    Social shares get generic previews. Build branded OG images per feature (compare, debt, rewards) and per blog post.

32. **Blog posts missing `Article` schema** — **S**
    Add author, datePublished, dateModified, publisher, and image. Pairs with the existing FAQPage schema.

33. **PWA: only SVG icon in manifest** — **S**
    Add PNG icons at 192×192 and 512×512. SVG-only PWA icons don't install on several browsers.

---

## 🟡 P2 — Polish

34. **Date-of-data / "rates current as of" stamp** on every calculator — **S** (trust signal)
35. **Print/PDF export improvements** — debt planner has print CSS; add a "Save as PDF" button labeled clearly. — **S**
36. **Service worker cache list incomplete** — missing `shared/share.js`, `share.css`, `email-capture.*`, `apply-button.js`. — **S**
37. **Google Fonts blocking render** — add `font-display: swap` and preload, or self-host. — **S**
38. **PWA install prompt only on homepage** — extend to calculator pages once the user has results. — **S**
39. **Hero CTA asymmetry** — Rewards has no CTA on the homepage; add one. — **S**
40. **Compare results: no "winner" connector** — Best Match card and the ranked list don't visually connect. Add a back-reference. — **S**
41. **Custom payment method missing annual-fee input** — `app.js` hardcodes `annualFee: 0`. Expose as input. — **S**
42. **Strategy comparison side-by-side mode** in Debt Planner (currently requires toggling). — **M**
43. **Snowball/avalanche explanation moved up** to where the strategy is selected (not bottom-of-page SEO content). — **S**
44. **Drag-to-reorder debts** in Debt Planner. — **M**
45. **Custom category** in Rewards (and "fitness", "rent", "drugstore"). — **M**
46. **Foreign transaction fee** indicator on rewards results. — **S**
47. **Compare table — limit of 3 cards** → bump to 5. — **S**
48. **Coinbase Card uniform 4%** is overstated; reflect real 1–4% range. — **S**
49. **Discover Cashback Match** — single-year view doesn't surface the year-2 cliff clearly. — **S**
50. **Amazon Prime Visa** — Prime $139/yr fee not netted from value. — **S**

---

## Suggested Sprint Plan

**Sprint 1 (Trust & Math) — 1 week**
Items 1–7 (all P0). Ship fixes for empty learn pages (or noindex them), Citi BT fee, score-sim mutation, amortization math, Pay-in-4 visibility, brand cleanup, Cash+ category picker.

**Sprint 2 (Cross-feature + Conversion) — 1 week**
Items 8–15, 31, 33. Cross-tool nav, blog→tool re-targeting, Net Cost tooltip, hero copy fix, OG images, PWA PNG icons.

**Sprint 3 (Rewards depth) — 1–2 weeks**
Items 21–28. Wallet optimizer, missing flagship cards, "no AF" + "I already have" filters, recommendation reasoning, annual/monthly toggle.

**Sprint 4 (Lead gen + Debt Planner polish) — 1 week**
Items 16–20, 29–30, 32. Real email backend with a real lead magnet (auto-generated PDF payoff plan), date-labeled charts, headline debt-free date, APR autosuggest.

**Sprint 5 (Polish & growth)** — pull from P2 list as time allows.

---

_Source reviews live in the workspace; this file is the consolidated action list._
