# zh Translation Review Results

## Scope
- Reviewed **87 user-facing zh pages** under `zh/` against their English source pages
- Also scanned the 4 non-user-facing/support pages under `zh/` (`docs/translation-dashboard.html`, `offline.html`, `tools/api.html`, `tools/index.html`) while focusing conclusions on the 87 public pages
- Wrote bulk scan script: `docs/zh_translation_scan.py`
- Saved raw scan output: `docs/zh-review-scan.json`

## Summary Statistics

### Public pages only (87 pages)
- Pages reviewed: **87**
- Pages with untranslated English: **87**
- Pages with Spanish body text: **0**
- Pages with broken HTML / structural issues: **12**
- Pages with brand-name translation issues: **0 major card/bank mistranslations found**
- Pages with number/currency inconsistencies worth checking: **32**

### Overall assessment
**Recommendation: NEEDS FIXES**

The zh site is **not ready to pass QA**. The dominant problem is not mistranslated core card names; it is **widespread untranslated English UI/schema text**, plus a handful of **serious HTML duplication / malformed-structure pages** and some **mixed-language terminology** inside content.

---

## Bulk Review Findings

## 1) Untranslated English — widespread
This is the biggest issue category.

### Site-wide untranslated navigation / UI strings
These appear across most or all zh pages:
- `Home`
- `Calculators`
- `Card Comparison`
- `Compare Credit Cards & BNPL`
- `Debt & Payoff`
- `Debt Payoff Planner`
- `Minimum Payment Calculator`
- `Loan vs Balance Transfer`
- `Card Finder`
- `Annual Fee Calculator`
- `Credit Score Simulator`
- `Learn`
- Header subtitle: `Compare credit cards, BNPL, and payment plans side by side`

### Mixed-language structured data / schema text
Many zh pages still contain English or even Spanish values in JSON-LD fields such as:
- `"name": "Inicio"` in breadcrumb schema on zh pages
- `"name": "Credit Cards"`
- English `Review` schema fields such as:
  - `reviewBody`
  - `description`
  - pros/cons `name` fields
- English `HowTo` schema fields on calculators
- English FAQ strings on some pages

### Common untranslated financial terminology still present in content/schema
Examples found across spot checks and bulk scan:
- `cash back`
- `Intro APR`
- `point` / `points`
- `signup bonus`
- `Credit Score`
- `Balance Transfer`
- `pre-qualify`

Per the project rules, key financial terms should be standardized in Chinese:
- cash back → **返现**
- credit score → **信用分**
- annual fee → **年费**
- balance transfer → **余额转移**
- signup bonus → **开卡奖励**

---

## 2) Wrong language / Spanish leakage
### Result
- **No Spanish body prose found**
- However, there is repeated **Spanish schema text** on zh pages, especially breadcrumb entries using **`Inicio`**

This is not visible body copy in most cases, but it is still a localization error and indicates template contamination.

---

## 3) Broken HTML / malformed structure
These are the most serious technical issues.

### High-severity broken pages
1. `zh/blog/minimum-payment-trap.html`
   - Header duplicated **36x**
   - Main duplicated **36x**
   - Footer duplicated **36x**
   - Very likely translation pipeline duplication / concatenation failure

2. `zh/blog/best-balance-transfer-credit-cards.html`
   - Header duplicated **10x**
   - Main duplicated **10x**
   - Footer duplicated **10x**
   - Clearly malformed and heavily repeated

### Other structural issues flagged
3. `zh/blog/amex-gold-worth-it.html`
   - duplicate `<header>`
4. `zh/blog/snowball-vs-avalanche.html`
   - duplicate `<header>`
5. `zh/blog/bnpl-vs-credit-card.html`
   - unexpected closing `</head>`
6. `zh/compare/index.html`
   - multiple unexpected closing `</div>` / `</section>`
7. `zh/debt-planner/index.html`
   - malformed `datalist` nesting
8. `zh/index.html`
   - mismatched closing around footer/container
9. `zh/merchant/insurance.html`
   - multiple unexpected closing tags
10. `zh/merchant/rent.html`
   - multiple unexpected closing tags
11. `zh/merchant/subscription.html`
   - multiple unexpected closing tags
12. `zh/merchant/utilities.html`
   - unexpected closing `</div>`

These are fix-before-launch issues.

---

## 4) Brand name issues
### Good news
I did **not** find major cases where card/bank brands were translated into Chinese equivalents like Chase→大通 or Amex→美国运通 in the main visible card naming.

### However
Brand handling is still inconsistent because many pages mix:
- English brand names correctly preserved
- Chinese surrounding text
- leftover English finance terms (`cash back`, `point`, `Intro APR`)

Also, merchant pages naturally keep merchant brands like Target, Amazon, Walmart, Costco in English, which is correct.

---

## 5) Number / currency issues
I did not find widespread catastrophic number corruption on the 5 spot-checked pages, but the bulk scan found **32 pages** with numeric/token mismatches worth auditing.

### Why many were flagged
Some flags come from tokenization differences like:
- `10+`
- `5+`
- `1.5¢/point`
- punctuation/spacing changes around `$` and `%`

### Pages most worth manually checking
- `zh/blog/minimum-payment-trap.html`
  - huge number inflation due to duplicated content
- `zh/blog/best-balance-transfer-credit-cards.html`
  - repeated sections create repeated numeric values
- several card/blog pages with small token mismatches around `+`, `%`, and point valuations

### Bottom line
- **No obvious numeric corruption on the 5 detailed spot-check pages**
- **Yes, numeric QA is still needed on the 32 flagged pages**, especially pages with structural duplication

---

## Specific Issues List

## Critical
- `zh/blog/minimum-payment-trap.html` — page content appears duplicated dozens of times; unusable in current state
- `zh/blog/best-balance-transfer-credit-cards.html` — page content duplicated repeatedly; unusable in current state

## High
- `zh/compare/index.html` — malformed closing tags
- `zh/index.html` — mismatched footer/container structure
- `zh/merchant/insurance.html` — unexpected closing tags
- `zh/merchant/rent.html` — unexpected closing tags
- `zh/merchant/subscription.html` — unexpected closing tags
- `zh/merchant/utilities.html` — unexpected closing tags
- `zh/blog/bnpl-vs-credit-card.html` — malformed head/body structure

## Medium
- Most zh pages still have untranslated nav/header/footer UI strings (`Home`, `Calculators`, `Learn`, etc.)
- Many zh pages contain English JSON-LD fields and mixed-language schema content
- Multiple zh pages use `Inicio` in breadcrumb schema
- Mixed Chinese/English finance terms remain in body/schema (`cash back`, `point(s)`, `Intro APR`, `signup bonus`)

## Low
- Brand names mostly preserved correctly
- No Spanish body prose found

---

## Detailed Spot-Check (5 Pages)

## 1) `merchant/target.html`
### Accuracy
Core meaning is mostly preserved. The zh page correctly describes:
- Target RedCard 5% savings
- comparison against general rewards cards
- online/retail coding
- monthly spend context

### Readability
Readable overall, but not natural in places. Examples:
- `便携价值` is awkward for “portable value”
- `类别优化器` feels machine-translated / unnatural
- `比较 RedCard 折扣与 返现 价值` has spacing + mixed-term awkwardness

### Terminology consistency
Inconsistent:
- `cash back` is translated in some places as `返现`
- but JSON-LD FAQ still leaves English: `not cash back`

### Missing content
No major missing visible body content on this page.

### Issues found
- Visible nav is largely untranslated (`Home`, `Calculators`, etc.)
- Header subtitle still English
- Breadcrumb schema uses **`Inicio`**
- FAQ schema contains English sentences (`Target RedCard offers 5% off...`)

### Quality score
**5/10**

---

## 2) `cards/chase-sapphire-preferred/index.html`
### Accuracy
Overall meaning is preserved well. Reward structure, fee, welcome bonus, approval guidance, downgrade advice, and comparison vs Reserve all match the English source.

### Readability
Fairly readable, but still machine-translated in tone. Examples:
- `固定比例 返现` spacing issue and unnatural phrasing
- `通过 Chase 兑换旅行积分时可获 25% 奖励` is understandable but not especially natural
- some finance language remains half-English/half-Chinese

### Terminology consistency
Mixed:
- `开卡奖励`, `年费`, `信用分` are good
- but `Intro APR`, `points`, `cash back`, `point`, `Credit Cards`, and English review schema remain

### Missing content
No major missing visible content found.

### Issues found
- Hero stat still says `Intro APR`
- Card title remains `Chase Sapphire Preferred® Card` rather than a fully localized heading around it
- Breadcrumb schema uses `Inicio`
- Review schema is still largely English:
  - `Chase Sapphire Preferred Review`
  - English `reviewBody`
  - English pros/cons labels like `Generous 60K signup bonus`

### Quality score
**6.5/10**

---

## 3) `loan-vs-bt/index.html`
### Accuracy
Visible calculator copy and FAQ content mostly match the English source accurately.

### Readability
Body copy is understandable, but the page is heavily mixed-language because many calculator labels and schema fields remain untranslated.

### Terminology consistency
Partially good in visible text:
- `余额转移`
- `贷款发放费`
- `信用分`

But inconsistent overall because English remains in the same page:
- `Home`
- `Calculators`
- `Loan vs Balance Transfer`
- `Compare Personal Loan vs Balance Transfer`
- English `HowTo` schema fields

### Missing content
No major visible omissions found.

### Issues found
- Main nav/header subtitle untranslated
- Breadcrumb schema uses `Inicio`
- `HowTo` schema is still English (`name`, `description`, `step` text)
- page subtitle/header remains English in places

### Quality score
**6/10**

---

## 4) `cards/capital-one-quicksilver/index.html`
### Accuracy
Substantive meaning is preserved: no-fee flat-rate rewards, easier approval, comparison with Double Cash, upgrade from QuicksilverOne, and BT offer all align with the English page.

### Readability
Readable but clearly machine-translated in several places:
- `介绍期APR`
- `在Capital One申请`
- `无需多想的卡` is acceptable colloquially, but mixed overall style remains uneven

### Terminology consistency
Mixed:
- visible body uses `返现`, `开卡奖励`, `信用分`
- but schema still includes English review copy (`Simple 1.5% cash back on everything`)
- FAQ uses `intro APR`, `ThankYou points`, `pre-qualify`

### Missing content
No major missing visible content.

### Issues found
- `Capital One Quicksilver Cash Rewards Credit Card` heading remains English
- `cash back` still appears in schema and some body/schema fragments
- breadcrumb schema uses `Inicio`
- review schema remains English

### Quality score
**6.5/10**

---

## 5) `cards/chase-ink-business-preferred/index.html`
### Accuracy
The main business-card guidance tracks the English source well: business eligibility, shipping/advertising categories, combining points, and Blue Business Plus comparison are all preserved.

### Readability
Readable, but not polished native Chinese. Examples:
- repeated use of `points`
- `cash back价值为每点1¢` is mixed-language and awkward
- some sentences are compressed in a translated-English way

### Terminology consistency
Mixed:
- card/bank names are correctly preserved in English
- but `points`, `cash back`, and some schema labels remain English

### Missing content
No obvious visible truncation or missing sections.

### Issues found
- Breadcrumb schema uses `Inicio`
- `Credit Cards` left untranslated in schema
- FAQ answers leave `points` and `cash back` in English
- page still feels mixed-language rather than fully localized

### Quality score
**6/10**

---

## Overall Recommendation
## Verdict: NEEDS FIXES

### Why it fails now
1. **Every public zh page still contains untranslated English** in visible UI and/or schema
2. **12 public pages have HTML/structure issues**, including 2 critically broken duplicated pages
3. **Mixed-language terminology** is widespread, especially in schema and card review metadata
4. The 5 spot-checked pages are **understandable but not publication-quality native zh localization**

### Suggested fix order
1. **Fix structural breakage first**
   - `zh/blog/minimum-payment-trap.html`
   - `zh/blog/best-balance-transfer-credit-cards.html`
   - then the other 10 malformed pages
2. **Translate shared layout strings globally**
   - nav/header/footer/site subtitle
3. **Clean zh JSON-LD/schema templates**
   - remove `Inicio`
   - localize breadcrumb labels, review bodies, descriptions, pros/cons, HowTo steps
4. **Normalize key terminology globally**
   - `cash back` → `返现`
   - `credit score` → `信用分`
   - `annual fee` → `年费`
   - `balance transfer` → `余额转移`
   - `signup bonus` → `开卡奖励`
5. **Do a second-pass editorial polish** on card/merchant pages for natural Chinese phrasing

---

## Deliverables Produced
- Review report: `docs/zh-review-results.md`
- Bulk scan script: `docs/zh_translation_scan.py`
- Raw scan data: `docs/zh-review-scan.json`
