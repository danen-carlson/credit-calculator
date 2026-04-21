/**
 * SmartPay Calculator — Payment Method Database
 * Last verified: April 2026 from provider websites
 */

/**
 * Affiliate link placeholders — replace with your tracked links from:
 * - CJ Affiliate (cj.com) → Klarna, AmEx, Chase, NerdWallet
 * - Impact (impact.com) → Credit Karma, Capital One, Robinhood
 * - FlexOffers (flexoffers.com) → PayPal, Credit Sesame
 * - Klarna Creator Platform (creator.klarna.com)
 *
 * Set a link to null or '' to hide the apply button for that method.
 */
const AFFILIATE_LINKS = {
  // BNPL
  'klarna-pay4':    '', // ~$100/sale via CJ or Klarna Creator Platform
  'afterpay':       '', // ~$10/referral via Block/Square partners
  'paypal-pay4':    '', // $10/signup via FlexOffers
  'affirm-pay4':    '', // $10-20/referral, direct partnership
  'zip':            '', // ~$5/referral, direct
  'sezzle':         '', // ~$5/referral, direct
  // Credit Cards
  'citi-simplicity':         '', // via CJ
  'chase-freedom-unlimited': '', // via CJ / Impact
  'discover-it':             '', // via CJ
  'citi-double-cash':        '', // via CJ
  'chase-sapphire-preferred':'', // via CJ / Impact
  'amex-blue-cash-everyday': '', // up to $200/approval via CJ
  'capital-one-venture':     '', // via Impact
};

// Supplementary affiliate links (credit score tools, etc.)
const SUPPLEMENTARY_LINKS = {
  'credit-karma':  '', // $2-12/signup via Impact
  'credit-sesame': '', // $6/signup via FlexOffers
  'nerdwallet':    '', // up to $100/card referral via CJ
};

/**
 * BNPL METHODS — Verified from provider websites April 2026
 *
 * Availability key:
 *   'partner'   = only at partner/integrated merchants
 *   'anywhere'  = virtual card works anywhere (Visa/Mastercard network)
 *   'both'      = partner checkout + virtual card option
 */
const BNPL_METHODS = [
  {
    id: 'klarna-pay4',
    name: 'Klarna',
    type: 'bnpl-4',
    detail: 'Pay in 4 · 0% interest · Works anywhere via virtual card',
    affiliateLink: '',
    affiliateNetwork: '',
    // Payment schedule: 25% down + 3 payments every 2 weeks
    // Service fee: $0.75–$3.00 per purchase
    downPaymentPct: 25,
    numPayments: 4,
    intervalDays: 14,
    interestRate: 0,
    serviceFeeMin: 0.75,
    serviceFeeMax: 3.00,
    lateFee: 7,
    lateFeeMaxPct: 25, // max 25% of order value
    minPurchase: 35,
    maxPurchase: 2500,
    pointsRate: 0,
    pointValue: 0,
    creditCheck: 'soft',
    availability: 'both', // 800K+ partner merchants + One-time virtual Visa card
    availabilityNote: 'Partner checkout at 800K+ merchants, OR use Klarna One-time virtual Visa card at any US online store',
    notes: 'Service fee $0.75–$3. Late fee up to $7 (capped at 25% of order). Klarna Card available for in-store (Visa network).',
    affiliateLink: '',
    affiliateNetwork: '',
    // Late fee information as of 2026 - Source: Klarna official website
    lateFees: {
      lateFeeAmount: 7, // $7 late fee per missed payment
      lateFeeCap: null, // No explicit cap mentioned
      retroactiveInterest: false, // No retroactive interest
      retroactiveApr: 0, // No retroactive APR
      gracePeriodDays: 7 // 7-day grace period before late fee is charged
    }
  },
  {
    id: 'afterpay',
    name: 'Afterpay',
    type: 'bnpl-4',
    detail: 'Pay in 4 · 0% interest at partner brands · Late fees apply',
    affiliateLink: '',
    affiliateNetwork: '',
    // Payment schedule: 25% down + 3 payments every 2 weeks
    downPaymentPct: 25,
    numPayments: 4,
    intervalDays: 14,
    interestRate: 0,
    serviceFeeMin: 0,
    serviceFeeMax: 0,
    lateFee: 10,
    lateFeeMax: 68, // initial $10 + $7/week up to $68 or 25%
    lateFeeMaxPct: 25,
    minPurchase: 35,
    maxPurchase: 2500,
    pointsRate: 0,
    pointValue: 0,
    creditCheck: 'soft',
    availability: 'both', // partner merchants + Afterpay Card (Visa)
    availabilityNote: 'Partner checkout at 100K+ merchants. Afterpay Card (Visa) can be used in-store. Online limited to partner merchants.',
    notes: 'No service fee. Late fee: initial $10, then $7/week up to $68 or 25% of purchase. Pay Monthly option available for $100+ (0–35.99% APR, 3–24 months).',
    affiliateLink: '',
    affiliateNetwork: '',
    // Late fee information as of 2026 - Source: Afterpay official website
    lateFees: {
      lateFeeAmount: 10, // Initial $10 late fee
      lateFeeAdditional: 7, // Additional $7 after 7 days
      lateFeeCap: 68, // Maximum late fee capped at $68 or 25% of order value
      retroactiveInterest: false, // No retroactive interest
      retroactiveApr: 0, // No retroactive APR
      gracePeriodDays: 10 // 10-day grace period before late fees kick in
    }
  },
  {
    id: 'paypal-pay4',
    name: 'PayPal Pay in 4',
    type: 'bnpl-4',
    detail: 'Pay in 4 · 0% APR · No fees · Online only',
    // Payment schedule: 25% down + 3 payments every 2 weeks
    downPaymentPct: 25,
    numPayments: 4,
    intervalDays: 14,
    interestRate: 0,
    serviceFeeMin: 0,
    serviceFeeMax: 0,
    lateFee: 0,
    minPurchase: 30,
    maxPurchase: 1500,
    pointsRate: 0,
    pointValue: 0,
    creditCheck: 'none',
    availability: 'partner', // only where PayPal is accepted at checkout
    availabilityNote: 'Only available at online merchants that accept PayPal at checkout. Not available in-store. Not available in Missouri or Nevada.',
    notes: 'Zero fees, zero interest. Must use at merchants with PayPal checkout integration. No virtual card for non-PayPal stores.',
    affiliateLink: '',
    affiliateNetwork: '',
    // Late fee information as of 2026 - Source: PayPal official website
    lateFees: {
      lateFeeAmount: 0, // No late fees
      lateFeeCap: 0, // No late fee cap
      retroactiveInterest: false, // No retroactive interest
      retroactiveApr: 0, // No retroactive APR
      gracePeriodDays: 0 // No grace period as no late fees apply
    }
  },
  {
    id: 'affirm-pay4',
    name: 'Affirm',
    type: 'bnpl-4',
    detail: 'Pay in 4 · 0% APR · Works anywhere via virtual card',
    affiliateLink: '',
    affiliateNetwork: '',
    // Pay in 4: 25% down + 3 biweekly payments
    // Monthly plans: 3–60 months, 0–36% APR
    downPaymentPct: 25,
    numPayments: 4,
    intervalDays: 14,
    interestRate: 0, // Pay-in-4 is 0%
    interestRateMonthlyMin: 0,
    interestRateMonthlyMax: 36, // monthly plans
    serviceFeeMin: 0,
    serviceFeeMax: 0,
    lateFee: 0,
    minPurchase: 50,
    maxPurchase: 30000,
    pointsRate: 0,
    pointValue: 0,
    creditCheck: 'soft',
    availability: 'both', // 358K+ partner merchants + one-time virtual Visa card
    availabilityNote: 'Partner checkout at 358K+ merchants (Amazon, Walmart, Target). Also offers one-time virtual Visa card usable at any online store.',
    notes: 'Pay in 4 is always 0% APR, $0 fees. Monthly plans (3–60 mo) range 0–36% APR. Reports to credit bureaus. Affirm Card (debit) for in-store.',
    affiliateLink: '',
    affiliateNetwork: '',
    // Late fee information as of 2026 - Source: Affirm official website
    lateFees: {
      lateFeeAmount: 0, // No late fees
      lateFeeCap: 0, // No late fee cap
      retroactiveInterest: false, // No retroactive interest
      retroactiveApr: 0, // No retroactive APR
      gracePeriodDays: 0 // No grace period as no late fees apply
    }
  },
  {
    id: 'zip',
    name: 'Zip',
    type: 'bnpl-4',
    detail: 'Pay in 4 · Origination fee ($4–$60) · ~30–35% APR',
    affiliateLink: '',
    affiliateNetwork: '',
    // Payment schedule: 25% down + 3 payments every 2 weeks
    // NOT interest-free — charges origination fee = 30-35% APR equivalent
    downPaymentPct: 25,
    numPayments: 4,
    intervalDays: 14,
    interestRate: 0, // no stated "interest" but origination fee makes effective APR 30-35%
    effectiveAprMin: 30,
    effectiveAprMax: 35,
    originationFeeMin: 4,
    originationFeeMax: 60,
    serviceFeeMin: 4,
    serviceFeeMax: 60,
    lateFee: 7,
    minPurchase: 35,
    maxPurchase: 1500,
    pointsRate: 0,
    pointValue: 0,
    creditCheck: 'none',
    availability: 'both', // partner merchants + Zip app works anywhere
    availabilityNote: 'Partner checkout at 82K+ merchants. Zip app creates virtual card usable anywhere Visa is accepted, online or in-store.',
    notes: '⚠️ NOT interest-free. Origination fee of $4–$60 (30–35% effective APR). Example: $400 purchase = $8 fee, $408 total. No credit check.',
    affiliateLink: '',
    affiliateNetwork: '',
    // Late fee information as of 2026 - Source: Zip official website
    lateFees: {
      lateFeeAmount: 7, // $7 late fee per missed payment
      lateFeeCap: null, // No explicit cap mentioned
      retroactiveInterest: false, // No retroactive interest
      retroactiveApr: 0, // No retroactive APR
      gracePeriodDays: 0 // No grace period mentioned
    }
  },
  {
    id: 'sezzle',
    name: 'Sezzle',
    type: 'bnpl-4',
    detail: 'Pay in 4 · 0% interest · 1 free reschedule',
    affiliateLink: '',
    affiliateNetwork: '',
    // Offers Pay in 2, Pay in 4, and Pay Monthly
    downPaymentPct: 25,
    numPayments: 4,
    intervalDays: 14,
    interestRate: 0,
    serviceFeeMin: 0,
    serviceFeeMax: 0,
    lateFee: 10, // $10 for failed payment
    rescheduleFee: 5, // $5 for 2nd+ reschedule (1st is free)
    minPurchase: 1,
    maxPurchase: 2500,
    pointsRate: 0,
    pointValue: 0,
    creditCheck: 'soft',
    availability: 'partner', // partner merchants only
    availabilityNote: 'Only at 47K+ Sezzle partner merchants (Target, GameStop, etc.). No virtual card for non-partner stores.',
    notes: '1 free payment reschedule per order. $10 failed payment fee. $5 for additional reschedules. Pay Monthly: 3–48 months, 0–34.99% APR for up to $15K.',
    affiliateLink: '',
    affiliateNetwork: '',
    // Late fee information as of 2026 - Source: Sezzle official website
    lateFees: {
      lateFeeAmount: 10, // $10 late fee for failed payment
      lateFeeCap: 16.95, // Maximum late fee up to $16.95
      retroactiveInterest: false, // No retroactive interest
      retroactiveApr: 0, // No retroactive APR
      gracePeriodDays: 0 // No grace period mentioned
    }
  }
];

const BNPL_MONTHLY_PLANS = [
  {
    id: 'klarna-monthly',
    name: 'Klarna Monthly',
    type: 'bnpl-monthly',
    detail: '6–36 months · 0–35.99% APR',
    affiliateLink: '',
    affiliateNetwork: '',
    aprMin: 0,
    aprMax: 35.99,
    aprTypical: 19.99,
    termOptions: [6, 12, 24, 36],
    minPurchase: 50,
    maxPurchase: 10000,
    lateFee: 7,
    availability: 'both',
    availabilityNote: 'Partner checkout + Klarna Card anywhere Visa accepted',
    notes: 'APR 0–35.99% based on creditworthiness. Terms 6–36 months.',
    // Late fee information as of 2026 - Source: Klarna official website
    lateFees: {
      lateFeeAmount: 7, // $7 late fee per missed payment
      lateFeeCap: null, // No explicit cap mentioned
      retroactiveInterest: false, // No retroactive interest
      retroactiveApr: 0, // No retroactive APR
      gracePeriodDays: 7 // 7-day grace period before late fee is charged
    }
  },
  {
    id: 'affirm-monthly',
    name: 'Affirm Monthly',
    type: 'bnpl-monthly',
    detail: '3–60 months · 0–36% APR',
    affiliateLink: '',
    affiliateNetwork: '',
    aprMin: 0,
    aprMax: 36,
    aprTypical: 15,
    termOptions: [3, 6, 12, 24, 36, 48, 60],
    minPurchase: 50,
    maxPurchase: 30000,
    lateFee: 0,
    availability: 'both',
    availabilityNote: '358K+ partners + virtual Visa card anywhere',
    notes: 'APR 0–36% based on credit. No late fees. Reports to credit bureaus.',
    // Late fee information as of 2026 - Source: Affirm official website
    lateFees: {
      lateFeeAmount: 0, // No late fees
      lateFeeCap: 0, // No late fee cap
      retroactiveInterest: true, // Deferred interest trap - retroactive interest applies if missed
      retroactiveApr: 36, // Up to 36% APR applied retroactively from purchase date if missed
      gracePeriodDays: 0 // No grace period as no late fees apply
    }
  },
  {
    id: 'afterpay-monthly',
    name: 'Afterpay Monthly',
    type: 'bnpl-monthly',
    detail: '3–24 months · 0–35.99% APR',
    affiliateLink: '',
    affiliateNetwork: '',
    aprMin: 0,
    aprMax: 35.99,
    aprTypical: 20,
    termOptions: [3, 6, 12, 24],
    minPurchase: 100,
    maxPurchase: 10000,
    lateFee: 10,
    availability: 'partner',
    availabilityNote: 'Afterpay partner merchants only',
    notes: 'Pay Monthly for purchases $100+. APR 0–35.99%.',
    // Late fee information as of 2026 - Source: Afterpay official website
    lateFees: {
      lateFeeAmount: 10, // Initial $10 late fee
      lateFeeAdditional: 7, // Additional $7 after 7 days
      lateFeeCap: 68, // Maximum late fee capped at $68 or 25% of order value
      retroactiveInterest: false, // No retroactive interest
      retroactiveApr: 0, // No retroactive APR
      gracePeriodDays: 10 // 10-day grace period before late fees kick in
    }
  },
  {
    id: 'sezzle-monthly',
    name: 'Sezzle Monthly',
    type: 'bnpl-monthly',
    detail: '3–48 months · 0–34.99% APR',
    affiliateLink: '',
    affiliateNetwork: '',
    aprMin: 0,
    aprMax: 34.99,
    aprTypical: 20,
    termOptions: [3, 6, 12, 24, 36, 48],
    minPurchase: 50,
    maxPurchase: 15000,
    lateFee: 10,
    availability: 'partner',
    availabilityNote: 'Sezzle partner merchants only (47K+)',
    notes: 'Monthly plans 3–48 months. APR 0–34.99% based on credit.',
    // Late fee information as of 2026 - Source: Sezzle official website
    lateFees: {
      lateFeeAmount: 10, // $10 late fee for failed payment
      lateFeeCap: 16.95, // Maximum late fee up to $16.95
      retroactiveInterest: false, // No retroactive interest
      retroactiveApr: 0, // No retroactive APR
      gracePeriodDays: 0 // No grace period mentioned
    }
  },
  {
    id: 'zip-monthly',
    name: 'Zip Monthly',
    type: 'bnpl-monthly',
    detail: '3–24 months · 30–35% APR',
    affiliateLink: '',
    affiliateNetwork: '',
    aprMin: 30,
    aprMax: 35,
    aprTypical: 32.5,
    termOptions: [3, 6, 12, 24],
    minPurchase: 49,
    maxPurchase: 5000,
    lateFee: 7,
    availability: 'both',
    availabilityNote: 'Partner merchants + Zip virtual card anywhere',
    notes: 'Origination fee applies. Effective APR 30–35%.',
    // Late fee information as of 2026 - Source: Zip official website
    lateFees: {
      lateFeeAmount: 7, // $7 late fee per missed payment
      lateFeeCap: null, // No explicit cap mentioned
      retroactiveInterest: false, // No retroactive interest
      retroactiveApr: 0, // No retroactive APR
      gracePeriodDays: 0 // No grace period mentioned
    }
  },
  {
    id: 'paypal-monthly',
    name: 'PayPal Pay Monthly',
    type: 'bnpl-monthly',
    detail: '6–24 months · 0–29.99% APR',
    affiliateLink: '',
    affiliateNetwork: '',
    aprMin: 0,
    aprMax: 29.99,
    aprTypical: 15,
    termOptions: [6, 12, 24],
    minPurchase: 199,
    maxPurchase: 10000,
    lateFee: 0,
    availability: 'partner',
    availabilityNote: 'PayPal checkout merchants only',
    notes: 'Monthly plans $199+. $0 down. APR 0–29.99%.',
    // Late fee information as of 2026 - Source: PayPal official website
    lateFees: {
      lateFeeAmount: 0, // No late fees
      lateFeeCap: 0, // No late fee cap
      retroactiveInterest: false, // No retroactive interest
      retroactiveApr: 0, // No retroactive APR
      gracePeriodDays: 0 // No grace period as no late fees apply
    }
  }
];

const CREDIT_CARDS = [
  // 0% Intro APR Cards
  {
    id: 'citi-simplicity',
    name: 'Citi Simplicity',
    type: 'credit-card',
    detail: '12 mo 0% APR · No late fees · No rewards',
    interestRate: 22.87,
    hasIntroApr: true,
    introAprRate: 0,
    introAprMonths: 12,
    pointsRate: 0,
    pointValue: 0,
    annualFee: 0,
    lateFee: 0,
    affiliateLink: '',
    affiliateNetwork: '',
    rewardTiers: [], // no rewards at all
    blendedRate: 0,
    notes: 'No late fees ever. Good for large purchases you\'ll pay off within 12 months.'
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    type: 'credit-card',
    detail: '15 mo 0% APR · 1.5–3% cash back',
    interestRate: 24.24,
    hasIntroApr: true,
    introAprRate: 0,
    introAprMonths: 15,
    pointsRate: 1.5, // base rate for single-purchase calc
    pointValue: 1.0,
    annualFee: 0,
    lateFee: 40,
    rewardTiers: [
      { category: 'dining', rate: 3.0 },
      { category: 'drugstores', rate: 3.0 },
      { category: 'travel', rate: 5.0, note: 'via Chase portal' },
      { category: 'everything', rate: 1.5 }
    ],
    blendedRate: 1.8, // weighted avg across typical spend
    notes: '3% dining & drugstores, 5% travel (Chase portal), 1.5% everything else.'
  },
  {
    id: 'discover-it',
    name: 'Discover it',
    type: 'credit-card',
    detail: '15 mo 0% APR · 1–5% cash back (doubled Y1)',
    interestRate: 22.74,
    hasIntroApr: true,
    introAprRate: 0,
    introAprMonths: 15,
    pointsRate: 1.5, // effective with cashback match year 1
    pointValue: 1.0,
    annualFee: 0,
    lateFee: 41,
    rewardTiers: [
      { category: 'rotating', rate: 5.0, cap: 1500, note: 'Quarterly rotating categories, $1,500/qtr cap' },
      { category: 'everything', rate: 1.0 }
    ],
    blendedRate: 1.5, // ~1.5% effective, doubled to ~3% in year 1 with match
    blendedRateYear1: 3.0,
    notes: '5% rotating categories ($1,500/qtr). Cashback Match doubles ALL rewards in year 1 (~3% effective).'
  },
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash',
    type: 'credit-card',
    detail: '2% cash back on everything · No annual fee',
    interestRate: 23.24,
    hasIntroApr: false,
    introAprRate: null,
    introAprMonths: 0,
    pointsRate: 2.0,
    pointValue: 1.0,
    annualFee: 0,
    lateFee: 40,
    rewardTiers: [
      { category: 'everything', rate: 2.0 }
    ],
    blendedRate: 2.0,
    notes: '1% when you buy + 1% when you pay. Flat 2% on everything — no categories to track.'
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    type: 'credit-card',
    detail: '2–5x points · Points worth 1.25–2¢ · $95/yr',
    interestRate: 25.49,
    hasIntroApr: false,
    introAprRate: null,
    introAprMonths: 0,
    pointsRate: 2.0, // base for single purchase
    pointValue: 1.5, // avg transfer value
    annualFee: 95,
    lateFee: 40,
    rewardTiers: [
      { category: 'dining', rate: 3.0 },
      { category: 'online', rate: 3.0, note: 'Online grocery (excl. Target/Walmart)' },
      { category: 'travel', rate: 5.0, note: 'Via Chase Travel portal' },
      { category: 'streaming', rate: 3.0 },
      { category: 'everything', rate: 1.0 }
    ],
    blendedRate: 1.8, // before point value multiplier
    blendedPointValue: 1.5,
    notes: '5x travel (Chase portal), 3x dining/online grocery/streaming, 1x else. Points worth 1.25¢ (portal) to 2¢+ (transfer partners). $95 annual fee.'
  },
  {
    id: 'amex-blue-cash-everyday',
    name: 'Amex Blue Cash Everyday',
    type: 'credit-card',
    detail: '15 mo 0% APR · 3% groceries · 2% gas',
    interestRate: 24.49,
    hasIntroApr: true,
    introAprRate: 0,
    introAprMonths: 15,
    pointsRate: 3.0, // groceries rate for single purchase
    pointValue: 1.0,
    annualFee: 0,
    lateFee: 40,
    rewardTiers: [
      { category: 'groceries', rate: 3.0, cap: 6000, note: '$6K/yr cap, then 1%' },
      { category: 'gas', rate: 3.0 },
      { category: 'online', rate: 3.0 },
      { category: 'everything', rate: 1.0 }
    ],
    blendedRate: 2.0,
    notes: '3% groceries ($6K/yr cap), 3% gas, 3% online shopping, 1% everything else. No annual fee.'
  },
  {
    id: 'capital-one-venture',
    name: 'Capital One Venture',
    type: 'credit-card',
    detail: '2x miles everywhere · Miles worth ~1.4¢ · $95/yr',
    interestRate: 24.49,
    hasIntroApr: false,
    introAprRate: null,
    introAprMonths: 0,
    pointsRate: 2.0,
    pointValue: 1.4,
    annualFee: 95,
    lateFee: 40,
    rewardTiers: [
      { category: 'hotels_rentals', rate: 5.0, note: 'Via Capital One Travel' },
      { category: 'everything', rate: 2.0 }
    ],
    blendedRate: 2.1, // slight boost from 5x hotels
    blendedPointValue: 1.4,
    notes: '5x on hotels/rentals (Capital One Travel), 2x everything else. Miles worth ~1¢ (statement credit) to 1.85¢ (transfer partners). $95 annual fee.'
  }
];

/**
 * Average annual spending by category (BLS Consumer Expenditure Survey 2024)
 * Used to calculate weighted average rewards for cards with category bonuses
 * Only includes categories typically charged to credit cards
 */
const AVG_ANNUAL_SPEND = {
  groceries:    5853,  // Food at home
  dining:       4316,  // Food away from home (restaurants, takeout)
  gas:          2843,  // Gasoline and motor oil
  travel:       929,   // Public transportation (incl. airfare)
  entertainment:3609,  // Entertainment
  drugstores:   400,   // Estimate (subset of healthcare OTC)
  streaming:    600,   // Estimate (subset of entertainment)
  online:       3000,  // Estimate (general online shopping)
  everything:   30000, // Rough cardable annual spend (excludes rent/mortgage/insurance)
};

/**
 * Enhanced credit card reward structures
 * rewardTiers: array of { category, rate, cap? } — rate in %
 * blendedRate: pre-calculated weighted avg assuming typical spend mix
 */

// APR ranges by credit score for estimation
const APR_BY_SCORE = {
  excellent: { min: 16, max: 21, avg: 18.5 },
  good:      { min: 20, max: 25, avg: 22.5 },
  fair:      { min: 24, max: 29, avg: 26.5 },
  poor:      { min: 28, max: 36, avg: 32 },
  unknown:   { min: 20, max: 29, avg: 24.5 }
};

// Minimum payment calculation standards
const MIN_PAYMENT_RULES = {
  percentOfBalance: 0.02, // 2% of balance (most common)
  absoluteMin: 25          // $25 minimum
};
