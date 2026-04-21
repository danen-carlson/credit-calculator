# CreditStud.io — Affiliate Program Setup Guide

Saved to Apple Notes (OpenClaw folder) on 2026-04-19.

---

## Part 1: What CreditStud.io Needs On-Site Before Applying

### ✅ What You Already Have
- Affiliate disclosure banner (hidden by default, toggled via JS)
- AdSense ads.txt configured
- robots.txt + sitemap.xml
- Disclaimer: "for informational purposes only"

### 🔧 What You Still Need

**1. Privacy Policy Page (/privacy)**
Every affiliate network REQUIRES this. Must include:
- What data you collect (analytics, cookies, affiliate tracking pixels)
- How you use it
- Third-party sharing (advertisers, affiliate networks)
- Cookie policy (duration, types, opt-out)
- User rights (opt-out, deletion)
- Contact email for privacy inquiries
- CCPA/California privacy rights section

**2. Terms of Service Page (/terms)**
- Site usage terms
- Limitation of liability
- Accuracy disclaimer for rates/terms
- Governing law (California)
- Arbitration clause (optional but recommended)

**3. Affiliate Disclosure Page (/affiliate-disclosure)**
This is SEPARATE from the banner on the main page. Networks want a dedicated page that:
- Clearly states you earn commissions from credit card referrals
- Lists which networks you're part of (CJ, Impact, FlexOffers)
- Explains how compensation does/doesn't affect editorial content
- States rankings are based on math, not payment
- FTC-mandated: "clear and conspicuous" — no hiding below the fold, tiny text, or confusing language

**4. Fix On-Page Disclosure**
Your current banner is `hidden` by default and toggled via JS. **This may not pass FTC/network review.** Requirements:
- Must be visible WITHOUT user interaction (no "click to see" buttons)
- Must appear ABOVE any affiliate links, not buried at the bottom
- Language must be plain English: "We may earn commissions when you click links on this site"
- No ambiguous phrasing like "advertiser disclosure" alone — say "affiliate" or "compensated"

**5. About Page (/about)**
- Who runs the site (or a credible persona)
- Site mission/purpose
- Editorial independence statement
- Contact information

**6. Contact Page (/contact)**
- Real email address (not just a form)
- Networks need a way to reach you

**7. Cookie Consent Banner**
- At minimum: a cookie/tracking notice
- EU traffic → full GDPR consent required

**8. Quality Content Beyond Tools**
- Networks review if your site is "substantial" — not just a calculator
- 2-3 blog articles about credit card comparison methodology
- Your /blog/ directory is a good start — make sure it has real content

### 📋 Pre-Application Checklist
- [ ] Privacy policy page live
- [ ] Terms of service page live
- [ ] Dedicated affiliate disclosure page
- [ ] On-page disclosure visible by default (not hidden/toggled)
- [ ] About page with site mission & editorial independence
- [ ] Contact page with real email
- [ ] Cookie/privacy consent banner
- [ ] At least 2-3 blog posts published
- [ ] Google Analytics (GA4) or similar installed
- [ ] Sitemap submitted to Google Search Console
- [ ] SSL/HTTPS (✅ already via Cloudflare)
- [ ] Working site, no 404s on main pages

---

## Part 2: Network-by-Network Gotchas

### CJ Affiliate (Commission Junction)

**Approval:** Moderate. They accept new publishers but review sites for quality.

**6-MONTH DORMANCY POLICY (THE BIG ONE):**
- Zero commissions in any rolling 6-month period → "Dormant" flag
- Monthly dormant fee (~$10/month) eats your balance
- Balance hits zero → DEACTIVATED
- Can reactivate within 180 days by logging in and re-accepting PSA
- **But accumulated commissions are GONE if eaten by fees**
- ⟹ **Strategy:** Generate at least ONE commission within 5 months. Even $0.01 counts. SET A CALENDAR REMINDER.
- ⟹ After CJ approval, apply to individual advertiser programs SEPARATELY (Capital One, Discover, etc.)

**Other CJ gotchas:**
- Advertiser approvals are separate from CJ approval
- Capital One is relatively easy; Chase and Amex are very picky
- Payment threshold: $50 ACH, $100 check → switch to direct deposit IMMEDIATELY
- No trademark terms in domains/subdomains (e.g., "chase-creditcards.creditstud.io" = banned)
- No cookie stuffing, forced clicks, or incentivized clicks
- Email marketing requires separate advertiser approval per CAN-SPAM

### Impact (formerly Impact Radius)

**Approval:** STRICTEST. Manual review, 3-7 business days. Wants professional, complete sites with real traffic.

**Key gotchas:**
- Calculator-only sites won't pass. Your blog content matters here.
- Partner tier system — new publishers start at lower tiers with less access
- Some programs are "Private" — need individual brand approval
- No dormancy fee, but WILL deactivate after ~12 months of inactivity
- Payment terms vary by advertiser (net-30, net-60)
- **Best for: Chase and Amex programs** — often ONLY available on Impact
- Apply AFTER you have traffic + content established

### FlexOffers

**Approval:** EASIEST. Approves new sites with minimal traffic. 2 business day review.

**Key gotchas:**
- Every traffic source (website, social, email) must be submitted separately for approval
- 2026 TOS update: stricter compliance, reserves right to change terms anytime
- All links become inactive on account termination
- Programs split into "Unrestricted" (auto-approved, 5 days) and "Restricted" (1-2 weeks)
- Good breadth of credit card/financial programs
- Lower CPA rates than CJ/Impact on average but great entry point
- Payment threshold: $50

### Suggested Application Order

1. **FlexOffers** — Easiest, fastest approval, gets you live with real links quickly
2. **CJ Affiliate** — Larger programs, starts the 6-month dormancy clock (generate a commission FAST)
3. **Impact** — Hardest approval but has Chase/Amex. Apply once site has traffic.

Skip Bankrate/CreditCards.com for now — they want established sites with significant traffic.

---

## Part 3: FTC & Network Compliance

### FTC Disclosure Requirements (2023 Endorsement Guides, effective 2024)

1. Every page with affiliate links MUST have a disclosure
2. Must be ABOVE the fold, BEFORE any affiliate link appears
3. Must use words like "affiliate," "commission," or "compensated"
4. Cannot be hidden behind toggles, accordions, or "read more" links
5. Plain English — no legalese
6. Applies to ALL channels: website, social, email

**Recommended disclosure text:**
> "CreditStudio earns affiliate commissions from some of the credit cards and services featured on this site. This compensation may influence which products appear, but our rankings are based on mathematical analysis of costs — not advertiser payment. We strive to keep information accurate, but terms change; always verify with the issuer."

### Financial-Specific Compliance

1. **Truth in Lending Act (Reg Z):** When displaying APR, fees, or terms, they must be accurate and current. Annual fee, intro APR period, balance transfer fees — all must match the issuer's current offer.

2. **CARD Act:** Cannot advertise credit cards to under-21 without showing ability-to-pay requirements. Don't target students without disclosure.

3. **"Apply Now" buttons:** Must present key terms (APR, annual fee, penalty APR) near the CTA. At minimum, include "See rates & fees" text alongside the affiliate link.

4. **Rate accuracy:** Add a prominent disclaimer that rates/terms change and users should verify with the issuer. Your existing line is good but should be more specific:
   > "Rates, fees, and terms shown are based on publicly available information and may not reflect current offers. Always verify terms directly with the card issuer before applying."

### Network-Specific TOS Requirements

**CJ:**
- Must include CJ tracking pixel on conversion pages
- Cannot modify, truncate, or cloak CJ affiliate links
- Cannot use advertiser trademarks in domain/page titles as if you ARE the brand
- Must display FTC-compliant disclosures
- Prohibited: cookie stuffing, typosquatting, toolbar injection, incentivized clicks

**Impact:**
- Similar anti-fraud policies, enforces more aggressively
- Accurate tracking parameters required (URMs for discrepancies)
- No bidding on advertiser trademarks in paid search
- Must use Impact's link format; no deep-linking to unapproved pages

**FlexOffers:**
- All traffic sources must be individually approved
- Cannot promote links on unregistered sites
- Cannot redistribute offers to third parties
- Must remove links within 24 hours if requested

### Practical Implementation Checklist
- [ ] Add visible (not toggled) affiliate disclosure to ALL pages
- [ ] Create /privacy page with full privacy policy
- [ ] Create /terms page with terms of service
- [ ] Create /affiliate-disclosure page with detailed disclosure
- [ ] Create /about page with editorial independence statement
- [ ] Create /contact page with real email
- [ ] Add cookie consent/privacy notice banner
- [ ] Add TILA-compliant disclaimers near every affiliate CTA
- [ ] Add "See rates & fees" text next to every affiliate link
- [ ] Publish 2-3 blog posts on credit card topics
- [ ] Install Google Analytics (GA4)
- [ ] Submit sitemap to Google Search Console
- [ ] Set CJ 5-month dormancy deadline calendar reminder
- [ ] Configure ACH/direct deposit in each network

## Part 4: Affiliate Data Schema (Updated Apr 21, 2026)

All cards in `rewards/cards-data.js` and BNPL providers in `data.js` now have:

```javascript
{
  // ... other fields ...
  affiliateLink: '',     // Full affiliate tracking URL (e.g. from CJ/Impact)
  affiliateNetwork: ''   // 'CJ', 'Impact', 'FlexOffers', or '' if none
}
```

**When you get approved:**
1. Paste the **exact** affiliate link into `affiliateLink`
2. Set `affiliateNetwork` to the network name
3. Commit with message like "feat: add [Card Name] affiliate link via [Network]"
4. Test the link works (opens issuer application with tracking)

**Apply Button Logic:**
- `affiliateLink` populated → "Apply Now" button with tracking
- Empty → "Learn More" links to issuer site
- FTC disclosure always shown below button

**Tasks #62-64: Apply to Networks**
1. **FlexOffers** (easiest): flexoffers.com → Sign up → Submit site → Approved in 2 days
2. **CJ Affiliate**: cj.com → Sign up → Site review → Capital One/Discover easy; Chase/Amex hard
3. **Impact**: impact.com → Sign up → Strict review (needs traffic/blog) → Chase/Amex here

After approval, search for programs by advertiser name (e.g. "Chase Sapphire", "Citi Double Cash"). Apply individually.