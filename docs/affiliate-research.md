# CreditStud.io Affiliate Research Guide

*Last updated: 2026-04-21*

---

## 1. Affiliate Networks for Credit Cards

### CJ Affiliate (Commission Junction)

- **What:** The largest affiliate network for financial products. Chase, Capital One, Amex, Discover, and most major issuers are here.
- **Commission:** $50–$200+ per approved application (varies by card and issuer)
- **Cookie duration:** 7–30 days (varies by advertiser)
- **How to apply:**
  1. Create a publisher account at cj.com
  2. Apply to the "Credit Cards" category
  3. Individual card issuers must approve you (Chase, Capital One, etc. each have their own programs)
  4. You need a live website with original content (calculators, reviews, comparisons — we have all of these ✅)
  5. Approval typically takes 3–7 business days per advertiser
- **Best for:** Chase credit cards, Capital One, most major bank cards
- **Our status:** Applied (task #62). Pending approval.

### Impact.com

- **What:** Major performance marketing platform. Has credit card offers plus fintech/banking products.
- **Commission:** $25–$150 per approved app; also has CPA and revenue-share models
- **Cookie duration:** 30–90 days (generous)
- **How to apply:**
  1. Sign up as a partner at impact.com
  2. Apply to individual brands (many auto-approve finance sites)
  3. Discovery platform makes it easy to find relevant offers
- **Best for:** SoFi, Upgrade, personal loans, fintech products, banking products
- **Our status:** Applied (task #63). Pending approval.

### FlexOffers

- **What:** Mid-size network with credit card and financial product offers.
- **Commission:** $20–$100 per approved application (generally lower than CJ)
- **Cookie duration:** 30–90 days
- **Payout:** Net-60 standard, Net-30 or Net-7 for top performers
- **How to apply:**
  1. Apply at flexoffers.com
  2. Browse their Credit Cards category
  3. Apply to individual offers
- **Best for:** Supplemental offers, some exclusive card programs, banking products
- **Our status:** Applied (task #64). Pending approval.

### Bankrate / CreditCards.com Publisher Program

- **What:** Bankrate runs one of the largest credit card comparison sites and has a publisher/affiliate program.
- **Commission:** $50–$200 per approved application (competitive with CJ)
- **How it works:** You embed Bankrate's comparison tools on your site, or use their API/widget
- **Pros:** High commissions, trusted brand, pre-built comparison widgets
- **Cons:** Less control over the user experience; your site becomes more of a thin affiliate wrapper
- **Fit for us:** **Low priority.** We already have our own calculators which is better for differentiation. Consider only as a supplemental revenue stream.

### NerdWallet Affiliate Program

- **What:** NerdWallet doesn't have a public affiliate program. They're a competitor, not a network.
- **Skip this one.**

### Direct Issuer Programs

| Issuer | Program | Commission | Notes |
|--------|---------|-----------|-------|
| Discover | Direct program via Discover.com/affiliates | $50–$100 per approval | Relatively easy to get approved |
| Capital One | CJ Affiliate | $75–$150 per approval | Must apply through CJ |
| Chase | CJ Affiliate | $100–$200 per approval | Strict approval process, good for established sites |
| Amex | CJ Affiliate + Direct | $100–$200 per approval | Has both in-house and CJ programs |
| Synchrony (Amazon Store Card) | No public program | $100/year cap (refer-a-friend only) | Not viable for publishers |

### Other Networks Worth Knowing

| Network | Commission | Credit Card Selection | Notes |
|---------|-----------|----------------------|-------|
| ShareASale | $20–$75 | Limited | Better for retail/ecommerce |
| Rakuten (LinkShare) | $25–$100 | Some financial offers | Declining relevance for finance |
| Awin | $30–$100 | Growing financial vertical | European focus, some US cards |
| PeerFly | $30–$150 | Mixed quality | Smaller network |


---

## 2. Application Best Practices

### What Networks Look For

1. **Live website with original content** — Calculators, reviews, comparisons (we have all three ✅)
2. **Professional design** — Clean, fast, mobile-friendly (✅)
3. **FTC-compliant disclosures** — Affiliate disclosure page and on-page notices (we have disclosure.html ✅, but need to add affiliate link disclosures)
4. **Privacy policy** — Required by most networks
5. **Terms of service** — Must be present on site
6. **No prohibited content** — gambling, adult, hate speech, etc.
7. **Traffic minimums** — Some networks want 10K+ monthly visitors; others accept newer sites
8. **No thin affiliate sites** — Sites that are just link farms get rejected

### What We Need to Add Before Approval

- [ ] **Affiliate Disclosure Page** — Update `/disclosure.html` to include specific language about affiliate commissions (we have the page but need to expand it)
- [ ] **Privacy Policy** — Add a `/privacy.html` page if we don't have one
- [ ] **Terms of Service** — Add a `/terms.html` page
- [ ] **On-page disclosure** — Add "We may earn a commission when you apply" near affiliate links (we already have this in the apply button area ✅)
- [ ] **rel="nofollow sponsored"** on all affiliate links — We already do this ✅

### Typical Timeline

| Step | Time |
|------|------|
| Apply to network | 1 day |
| Network approval | 1–7 days |
| Apply to individual advertisers | 1–3 days per advertiser |
| Advertiser approval | 3–14 days |
| Get tracking links | Same day |
| First commission | 1–3 months (depends on traffic) |


---

## 3. Common Mistakes to Avoid

### 🚨 FTC Disclosure Failures
- **Mistake:** Hiding the affiliate relationship or burying it in fine print
- **Rule:** FTC requires clear, conspicuous disclosure **before** the first affiliate link on each page
- **Fix:** We already have a disclosure notice near the apply buttons. Make sure it's prominent enough (not tiny gray text)

### 🚨 Cookie Stuffing / Forced Clicks
- **Mistake:** Dropping affiliate cookies without the user clicking a link (e.g., iframe loading, pop-under)
- **Rule:** Strictly prohibited by every network. Instant ban if caught.
- **Fix:** Only fire tracking on actual user clicks. Never auto-load affiliate links.

### 🚨 Not Using rel="nofollow sponsored"
- **Mistake:** Leaving affiliate links as regular dofollow links
- **Rule:** Google requires `rel="nofollow sponsored"` on paid links. Networks and FTC both expect this.
- **Fix:** We already add `rel="nofollow sponsored noopener"` ✅

### 🚨 Misleading Claims About Card Benefits
- **Mistake:** Exaggerating bonuses, hiding annual fees, misstating APR ranges
- **Rule:** All claims must be accurate and current. If an offer changes, update within 24–48 hours.
- **Fix:** Our scraper + manual check system keeps data current. Add "last updated" timestamps visible to users.

### 🚨 Not Tracking Conversions Properly
- **Mistake:** Not verifying that affiliate links track correctly
- **Rule:** Test every link after setup. Use sub IDs for different placements.
- **Fix:** Add `subid` parameters to affiliate links (e.g., `?sid=compare_btn_amazon-prime-visa`) to track which placement drives conversions.

### 🚨 Ignoring Compliance Audits
- **Mistake:** Setting up links once and never checking them again
- **Rule:** Networks audit publishers regularly. Broken or redirected links get flagged.
- **Fix:** Monthly link check + quarterly review of all affiliate content.

### 🚨 Bid Rigging / Trademark Bidding
- **Mistake:** Bidding on the issuer's branded keywords (e.g., "Chase Sapphire Preferred apply") in Google Ads
- **Rule:** Most issuers prohibit trademark bidding in their affiliate terms. They'll ban you.
- **Fix:** Don't run ads targeting branded terms. Focus on comparison terms like "best travel credit card" or "Chase Sapphire vs Amex Gold."


---

## 4. Best Practices

### Content Structure for Conversions
- **Comparison tables** (we have these ✅) — highest converting format for credit cards
- **Calculators with outcomes** (we have these ✅) — users who see "$347 saved" convert at 3–5x
- **"Apply Now" vs "Learn More"** — Use "Apply Now" when the card details are already clear. Use "Learn More" when the user needs more context first.
- **Placement matters** — Put the top-recommended card above the fold. Most conversions come from the first 2 cards users see.

### A/B Testing Opportunities
- Button text: "Apply Now" vs "See Offer" vs "Check My Rate"
- CTA color: Green vs Blue vs Orange
- Disclosure placement: Top of page vs next to button
- Card ordering: Best overall vs Best for specific use case

### Tracking & Attribution
- Use **sub IDs** (subid/sid parameter) for every placement to track:
  - Which page the click came from (compare vs debt-planner)
  - Which button position (top card vs bottom)
  - Which device (mobile vs desktop)
- Most networks provide real-time reporting; check weekly

### Revenue Optimization Without Sacrificing Trust
- **Never recommend a card just because it pays more** — users will notice and trust will erode
- **Always show the cheapest/best option first** regardless of commission
- **Disclose the affiliate relationship clearly** — transparent sites convert better long-term
- **Update data regularly** — stale rates kill credibility


---

## 5. Unconventional Affiliate Products

These are products and services that complement a credit card comparison site. Listed by priority (best fit first).

### 🟢 High Fit — Directly Complements Credit Cards

| Product | Affiliate Program | Network | Est. Commission | Notes |
|---------|-------------------|----------|-----------------|-------|
| **Personal Loans** | SoFi, LendingClub, Upgrade, Prosper | Impact, CJ | $50–$200 per funded loan | Perfect for users who don't qualify for 0% APR cards |
| **Debt Relief/ Settlement** | National Debt Relief, Freedom Debt Relief | CJ, Impact, direct | $50–$150 per qualified lead | Natural fit for Debt Planner users |
| **Credit Repair** | Lexington Law, Credit Saint, Sky Blue | CJ, ShareASale | $50–$125 per signup | Users checking credit scores may need repair first |
| **Credit Monitoring** | Experian, TransUnion, Identity Guard | CJ, Impact, FlexOffers | $5–$30 per signup | Low commission but high volume |
| **Identity Theft Protection** | LifeLock, IdentityGuard, Aura | CJ, Impact | $15–$50 per signup | Bundles well with credit card recommendations |
| **Auto Insurance** | Progressive, Geico, Liberty Mutual, State Farm | Various (mostly Impact) | $5–$25 per quote | Car insurance is something every driver needs alongside their credit card |
| **Tax Software** | TurboTax, H&R Block, FreeTaxUSA | CJ, Impact, ShareASale | $10–$25 per sale | "Use your rewards card to pay taxes" angle |
| **Budgeting Apps** | YNAB ($6/signup), Monarch Money, EveryDollar | Direct programs | $5–$15 per signup | Pair with "track your credit card spending" |

### 🟡 Medium Fit — Adjacent Financial Products

| Product | Affiliate Program | Network | Est. Commission | Notes |
|---------|-------------------|----------|-----------------|-------|
| **Mortgage / Refinance** | Rocket Mortgage, Better.com, LendingTree | Impact, CJ, direct | $50–$500 per qualified lead | High commission, long funnel |
| **Banking Products** | Chime, SoFi Money, Ally, Axos | Impact, CJ | $25–$75 per account | Checking/savings to pair with credit cards |
| **Student Loan Refinancing** | SoFi, Earnest, CommonBond | Impact | $50–$150 per funded loan | Young professional audience overlap |
| **Home Warranty** | American Home Shield, Choice Home Warranty | CJ, Impact | $25–$50 per sale | Homeowners with credit cards |
| **Cell Phone Insurance** | Protect Your Bubble, Allstate Protection Plans | CJ, FlexOffers | $5–$15 per sale | Niche — "use your card's cell phone protection instead" angle |
| **Investment Platforms** | Robinhood, Webull, Public, M1 Finance | Direct | $5–$75 per funded account | "Invest your credit card rewards" angle |

### 🔵 Creative / Unconventional

| Product | Affiliate Program | Network | Est. Commission | Notes |
|---------|-------------------|----------|-----------------|-------|
| **Used Car Loans** | Carvana, CarMax, LendingTree Auto | CJ, Impact | $25–$100 per funded loan | "Best credit card for a car down payment" |
| **Travel Insurance** | SafetyWing, World Nomads, Allianz | CJ, Impact, FlexOffers | $10–$40 per sale | Natural fit with travel credit cards |
| **Airport Lounge Access** | Priority Pass, LoungeBuddy | Direct, CJ | $5–$15 per signup | Pair with travel card recommendations |
| **Hotel/Flight Booking** | Booking.com, Expedia, Hotels.com | CJ, Impact, ShareASale | 3–6% of booking | Travel card users book travel |
| **Furniture/Rent Financing** | Affirm, Klarna (merchant side), Wayfair | CJ, Impact | $1–$25 per sale | BNPL vs credit card comparison angle |
| **Pet Insurance** | Lemonade, Embrace, Fetch | CJ, Impact | $10–$30 per sale | "Your credit card may cover pet emergencies, but insurance is better" |
| **Gym/Fitness Memberships** | ClassPass, Peloton, Mirror | Various | $15–$50 per signup | Pair with fitness credit cards |
| **Car Rental** | Turo, Enterprise, Hertz | CJ, Impact | 3–8% per booking | Travel credit card ecosystem |
| **Business Credit Cards** | Capital One Spark, Amex Business, Chase Ink | CJ | $100–$300 per approval | **Underserved niche!** Very high commissions, less competition |
| **Crypto Exchanges** | Coinbase, Binance, Kraken | Direct + CJ | $10–$40 per signup | We already have crypto cards — natural extension |
| **Stimulus/Benefits Tools** | N/A (government) | N/A | $0 | Not monetizable, but high-traffic content |

### 🔴 Highest Commission Products (Best ROI per visitor)

| Product | Avg Commission | Conversion Rate | Est. RPM |
|---------|---------------|-----------------|----------|
| Business credit cards | $100–$300 | 0.5–1% | $5–$30 |
| Personal loans | $50–$200 | 1–3% | $5–$60 |
| Mortgage/refinance | $50–$500 | 0.1–0.5% | $5–$25 |
| Credit cards (consumer) | $50–$200 | 0.5–2% | $2.5–$40 |
| Credit repair | $50–$125 | 2–5% | $10–$62.5 |
| Debt relief | $50–$150 | 1–3% | $5–$45 |
| Banking products | $25–$75 | 2–5% | $5–$37.5 |


---

## 6. Recommended Priority for CreditStud.io

Based on our audience (credit card comparison users), here's the recommended order for setting up affiliate programs:

1. **CJ Affiliate** — Chase, Capital One, Discover, Amex (most of our cards are here)
2. **Impact.com** — SoFi, Upgrade, personal loans (supplement for non-qualifying users)
3. **FlexOffers** — Fill gaps CJ doesn't cover
4. **Business credit cards** — High commission, underserved niche (Capital One Spark, Chase Ink, Amex Business)
5. **Debt relief / credit repair** — Natural fit for debt planner users
6. **Travel insurance / booking** — Pair with our travel card recs
7. **Tax software** — Seasonal (Jan–Apr) but high volume

###Immediate Action Items
- [ ] Complete CJ Affiliate application (in progress — task #62)
- [ ] Complete Impact.com application (in progress — task #63)
- [ ] Complete FlexOffers application (in progress — task #64)
- [ ] Add FTC affiliate disclosure text to all pages with affiliate links
- [ ] Add privacy policy page
- [ ] Add terms of service page
- [ ] Add sub-ID tracking to affiliate links (e.g., `?sid=compare_vs_debt_btn`)
- [ ] Research business credit card affiliate programs (Chase Ink, Amex Business, Capital One Spark)
- [ ] Consider adding debt relief / personal loan comparisons as secondary tool

---

*Research compiled 2026-04-21. Commission rates are estimates and vary by program, volume, and negotiation.*