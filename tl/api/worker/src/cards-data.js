// Auto-extracted from data.js for Cloudflare Worker API
// Last updated: 2026-05-01

export const CREDIT_CARDS = [
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
    // Balance transfer terms — Verified 2026-04-28
    // Source: https://wallethub.com/d/citi-simplicity-567c
    // 0% intro APR for 21 months on BT (one of the longest BT offers available)
    balanceTransfer: {
      introApr: 0,           // 0% intro APR on balance transfers
      introAprMonths: 21,    // 21 months 0% APR on BT (longer than purchase intro!)
      postPromoApr: 22.87,   // matches card's regular APR range
      transferFeeIntroPct: 3,  // 3% intro BT fee (first 4 months)
      transferFeeIntroMinDollars: 5, // $5 minimum
      transferFeeIntroWindowMonths: 4,  // intro fee window = first 4 months
      transferFeeStandardPct: 5,  // 5% standard BT fee after intro window
      transferFeeStandardMinDollars: 5, // $5 minimum
    },
    notes: 'No late fees ever. 0% intro APR for 21 months on balance transfers. Good for large purchases you\'ll pay off within 12 months.'
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
    // Balance transfer terms — Verified 2026-04-28
    // Source: https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited
    // Also: https://www.cnbc.com/select/chase-freedom-unlimited-freedom-flex-zero-percent-apr-balance-transfer/
    balanceTransfer: {
      introApr: 0,
      introAprMonths: 15,
      postPromoApr: 24.24,   // matches card regular APR
      transferFeeIntroPct: 3,   // 3% intro BT fee (first 60 days)
      transferFeeIntroMinDollars: 5,
      transferFeeIntroWindowMonths: 2, // 60 days = ~2 months
      transferFeeStandardPct: 5,
      transferFeeStandardMinDollars: 5,
    },
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
    // Balance transfer terms — Verified 2026-04-28
    // Source: https://www.discover.com/credit-cards/cash-back/it-card.html
    // Also: https://wallethub.com/answers/cc/discover-balance-transfer-promotion-2140658744/
    balanceTransfer: {
      introApr: 0,
      introAprMonths: 15,
      postPromoApr: 22.74,   // matches card regular APR
      transferFeeIntroPct: 3,   // 3% intro BT fee
      transferFeeIntroMinDollars: null, // Discover doesn't specify a $ min for intro
      transferFeeIntroWindowMonths: null, // intro fee window not specified (3% for initial BT offer)
      transferFeeStandardPct: 5,
      transferFeeStandardMinDollars: null, // future transfers at 5%
    },
    notes: '5% rotating categories ($1,500/qtr). Cashback Match doubles ALL rewards in year 1 (~3% effective). 3% intro BT fee, 5% after.'
  },
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash',
    type: 'credit-card',
    detail: '2% cash back on everything · No annual fee',
    interestRate: 23.24,
    hasIntroApr: true,       // CORRECTED: has 0% intro APR on BT (was false)
    introAprRate: 0,
    introAprMonths: 18,       // 0% for 18 months on balance transfers
    pointsRate: 2.0,
    pointValue: 1.0,
    annualFee: 0,
    lateFee: 40,
    rewardTiers: [
      { category: 'everything', rate: 2.0 }
    ],
    blendedRate: 2.0,
    // Balance transfer terms — CORRECTED 2026-04-28 (was transferFeePct: 0 in planner.js — WRONG)
    // Source: https://wallethub.com/d/citi-double-cash-card-121c
    // Also: https://money.usnews.com/credit-cards/citi/citi-double-cash-card
    // Intro BT fee: 3% of each transfer ($5 min) for transfers within first 4 months
    // Standard BT fee: 5% of each transfer ($5 min) after 4 months
    // Intro APR: 0% for 18 months on balance transfers
    // Post-promo APR: 17.49%–27.49% variable
    balanceTransfer: {
      introApr: 0,
      introAprMonths: 18,
      postPromoApr: 22.49,   // midpoint of 17.49%–27.49% range
      transferFeeIntroPct: 3,    // 3% intro BT fee (first 4 months)
      transferFeeIntroMinDollars: 5,
      transferFeeIntroWindowMonths: 4,  // intro fee window = first 4 months
      transferFeeStandardPct: 5,  // 5% standard BT fee after 4 months
      transferFeeStandardMinDollars: 5,
    },
    notes: '1% when you buy + 1% when you pay. Flat 2% on everything — no categories to track. 0% intro APR on BT for 18 months; 3% intro BT fee (then 5%).'
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
    // Balance transfer terms — Verified 2026-04-28
    // Source: https://wallethub.com/answers/cc/blue-cash-everyday-balance-transfer-1000399-2140706248/
    // 0% intro APR for 15 months on BT; 3% BT fee ($5 min); regular APR 19.49%–28.49% (V)
    balanceTransfer: {
      introApr: 0,
      introAprMonths: 15,
      postPromoApr: 24.49,   // matches card regular APR
      transferFeeIntroPct: 3,   // 3% BT fee
      transferFeeIntroMinDollars: 5,
      transferFeeIntroWindowMonths: null, // not tiered — flat 3% fee
      transferFeeStandardPct: 3,  // Amex BCE charges 3% flat (no 5% tier)
      transferFeeStandardMinDollars: 5,
    },
    notes: '3% groceries ($6K/yr cap), 3% gas, 3% online shopping, 1% everything else. No annual fee. 3% BT fee.'
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
  },
  {
    id: 'amazon-prime-visa',
    name: 'Amazon Prime Rewards Visa',
    type: 'credit-card',
    detail: '5% Amazon & Whole Foods · 2% dining/gas/drugstores · No annual fee',
    interestRate: 22.24,
    hasIntroApr: false,
    introAprRate: null,
    introAprMonths: 0,
    pointsRate: 5.0, // Amazon rate for single purchase
    pointValue: 1.0,
    annualFee: 0,
    annualFeeNote: 'Requires Amazon Prime ($139/yr)',
    lateFee: 40,
    rewardTiers: [
      { category: 'amazon', rate: 5.0, note: 'Amazon.com & Whole Foods Market' },
      { category: 'dining', rate: 2.0 },
      { category: 'gas', rate: 2.0 },
      { category: 'drugstores', rate: 2.0 },
      { category: 'everything', rate: 1.0 }
    ],
    blendedRate: 2.3, // weighted avg for typical household
    notes: '5% Amazon.com & Whole Foods (Prime members), 2% restaurants/gas/drugstores, 1% everything else. $0 annual fee but requires Prime ($139/yr). $150 Amazon gift card upon approval.'
  },
  // Added 2026-04-28: Referenced by debt-planner/planner.js as 'chase-freedom-flex'
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    type: 'credit-card',
    detail: '15 mo 0% APR · 3% dining/drugstores · 5% rotating · $200 bonus',
    interestRate: 23.74, // variable 18.24%–27.74%
    hasIntroApr: true,
    introAprRate: 0,
    introAprMonths: 15,
    pointsRate: 3.0, // dining/drugstores base
    pointValue: 2.05, // Chase UR points value with transfer partners
    annualFee: 0,
    lateFee: 40,
    rewardTiers: [
      { category: 'rotating', rate: 5.0, cap: 1500, note: 'Quarterly rotating categories, $1,500/qtr cap' },
      { category: 'dining', rate: 3.0 },
      { category: 'drugstores', rate: 3.0 },
      { category: 'everything', rate: 1.0 }
    ],
    blendedRate: 1.8,
    // Balance transfer terms — Verified 2026-04-28
    // Source: https://creditcards.chase.com/cash-back-credit-cards/freedom/flex
    // Also: https://www.cnbc.com/select/chase-freedom-unlimited-freedom-flex-zero-percent-apr-balance-transfer/
    // Intro BT fee: 3% ($5 min) for transfers within first 60 days
    // Standard BT fee: 5% ($5 min) after 60 days
    // 0% intro APR for 15 months on purchases and BT
    balanceTransfer: {
      introApr: 0,
      introAprMonths: 15,
      postPromoApr: 23.74,   // midpoint of 18.24%–27.74%
      transferFeeIntroPct: 3,   // 3% intro BT fee (first 60 days)
      transferFeeIntroMinDollars: 5,
      transferFeeIntroWindowMonths: 2, // 60 days ≈ 2 months
      transferFeeStandardPct: 5,
      transferFeeStandardMinDollars: 5,
    },
    affiliateLink: '',
    affiliateNetwork: '',
    notes: '5% rotating categories ($1,500/qtr), 3% dining/drugstores, 1% everything. 3% intro BT fee (first 60 days), then 5%.'
  },
  // Added 2026-04-28: Top balance transfer card — longest 0% intro period (21 months)
  {
    id: 'wells-fargo-reflect',
    name: 'Wells Fargo Reflect',
    type: 'credit-card',
    detail: '21 mo 0% APR · No annual fee · Cell phone protection',
    interestRate: 23.49, // variable 17.49%, 23.99%, or 28.24%
    hasIntroApr: true,
    introAprRate: 0,
    introAprMonths: 21, // 0% for 21 months on purchases and BT (longest in market)
    pointsRate: 0,
    pointValue: 0,
    annualFee: 0,
    lateFee: 40,
    rewardTiers: [],
    blendedRate: 0,
    // Balance transfer terms — Verified 2026-04-28
    // Source: https://www.cnbc.com/select/wells-fargo-announces-reflect-card/
    // Also: https://money.usnews.com/credit-cards/wells-fargo/wells-fargo-reflect-card
    // 3% intro BT fee for first 60 days, then 5% standard — same as other WF cards
    // 0% intro APR for 21 months on purchases and qualifying BT
    balanceTransfer: {
      introApr: 0,
      introAprMonths: 21,       // longest 0% BT offer on the market
      postPromoApr: 23.49,      // midpoint of 17.49%–28.24%
      transferFeeIntroPct: 3,   // 3% intro BT fee (first 60 days)
      transferFeeIntroMinDollars: 5,
      transferFeeIntroWindowMonths: 2, // 60 days ≈ 2 months
      transferFeeStandardPct: 5,
      transferFeeStandardMinDollars: 5,
    },
    affiliateLink: '',
    affiliateNetwork: '',
    notes: 'Longest 0% intro APR (21 months). No rewards. 3% intro BT fee (first 60 days), then 5%.'
  }
];

export const APR_BY_SCORE = {
  excellent: { min: 16, max: 21, avg: 18.5 },
  good:      { min: 20, max: 25, avg: 22.5 },
  fair:      { min: 24, max: 29, avg: 26.5 },
  poor:      { min: 28, max: 36, avg: 32 },
  unknown:   { min: 20, max: 29, avg: 24.5 },
};

export const AVG_ANNUAL_SPEND = {
  groceries:    5853,
  dining:       4316,
  gas:          2843,
  travel:       929,
  entertainment:3609,
  drugstores:   400,
  streaming:    600,
  online:       3000,
  everything:   30000,
};

export const MIN_PAYMENT_RULES = {
  percentOfBalance: 0.02,
  absoluteMin: 25,
};

export const STATE_SALES_TAX = {
  AL: 4.00, AK: 1.76, AZ: 6.10, AR: 6.30, CA: 8.68, CO: 5.97, CT: 6.35, DE: 0.00,
  FL: 6.80, GA: 6.97, HI: 4.44, ID: 6.04, IL: 8.18, IN: 6.97, IA: 6.80, KS: 7.48,
  KY: 6.00, LA: 8.91, ME: 5.50, MD: 6.00, MA: 6.25, MI: 6.00, MN: 7.49, MS: 7.08,
  MO: 7.71, MT: 0.00, NE: 6.84, NV: 6.85, NH: 0.00, NJ: 6.60, NM: 6.86, NY: 7.83,
  NC: 6.71, ND: 6.72, OH: 6.74, OK: 7.46, OR: 0.00, PA: 6.00, RI: 7.00, SC: 6.60,
  SD: 6.11, TN: 8.48, TX: 7.29, UT: 6.91, VT: 6.18, VA: 5.30, WA: 7.33, WV: 6.39,
  WI: 5.44, WY: 5.36,
};
