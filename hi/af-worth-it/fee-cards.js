// Annual Fee Card Data — CreditStud.io
// Last verified: 2026-05-12
//
// Data format:
//   rewards[].rate     — Multiplier as number (5 for 5x points, 4 for 4% cashback)
//   rewards[].type     — 'points' or 'cashback'
//   pointValue         — Cents per point (e.g. 0.0205 = 2.05¢/pt). For cashback, set to 0.01 (1¢/pt = 1%).
//
// Effective return rate = rate × pointValue × 100 (for points)
//                       = rate (for cashback, since rate IS the percent)
//
// All annual fees, signup bonuses, perk values, and rewards verified against
// issuer websites and TPG point valuations (April 2026).

const FEE_CARDS = [
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 795, // Raised June 2025
    regularAPR: '21.49% - 28.49% Variable',
    signupBonus: '100,000 points after $5,000 spend in 3 months',
    rewards: [
      { category: 'travel', rate: 8, type: 'points', note: '8x via Chase Travel; 4x flights direct; 3x other travel' },
      { category: 'dining', rate: 5, type: 'points' },
      { category: 'streaming', rate: 1, type: 'points' },
      { category: 'groceries', rate: 1, type: 'points' },
      { category: 'gas', rate: 1, type: 'points' },
      { category: 'online', rate: 1, type: 'points' },
      { category: 'utilities', rate: 1, type: 'points' },
      { category: 'other', rate: 1, type: 'points' }
    ],
    pointValue: 0.0205, // 2.05¢/pt (TPG valuation)
    perks: [
      { name: '$300 Annual Travel Credit', value: 300, autoUsed: true },
      { name: 'Priority Pass Select + Sapphire Lounges', value: 429, autoUsed: false },
      { name: 'TSA PreCheck/Global Entry Credit', value: 100, autoUsed: false },
      { name: 'DoorDash DashPass', value: 120, autoUsed: false },
      { name: 'Trip Delay/Cancellation Insurance', value: 50, autoUsed: false },
      { name: 'Primary Rental Car Insurance', value: 75, autoUsed: false },
      { name: 'No Foreign Transaction Fees', value: 40, autoUsed: false }
    ],
    bestFor: ['Frequent travelers', 'Airport lounge visitors', 'Dining enthusiasts'],
    skipIf: 'You don\'t travel at least a few times per year and don\'t use lounges',
    creditScoreNeeded: 'Excellent (740+)',
    alternatives: ['chase-sapphire-preferred', 'capital-one-venture-x'],
    lastVerified: '2026-05-12'
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    regularAPR: '20.49% - 27.49% Variable',
    signupBonus: '75,000 points after $5,000 spend in 3 months',
    rewards: [
      { category: 'travel', rate: 5, type: 'points', note: '5x via Chase Travel; 2x other travel direct' },
      { category: 'dining', rate: 3, type: 'points' },
      { category: 'streaming', rate: 3, type: 'points' },
      { category: 'groceries', rate: 3, type: 'points', note: 'Online grocery only' },
      { category: 'gas', rate: 1, type: 'points' },
      { category: 'online', rate: 1, type: 'points' },
      { category: 'utilities', rate: 1, type: 'points' },
      { category: 'other', rate: 1, type: 'points' }
    ],
    pointValue: 0.0205, // 2.05¢/pt (TPG valuation)
    perks: [
      { name: '$50 Annual Hotel Credit (Chase Travel)', value: 50, autoUsed: true },
      { name: 'Trip Cancellation/Interruption Insurance', value: 30, autoUsed: false },
      { name: 'Primary Rental Car Insurance', value: 50, autoUsed: false },
      { name: 'DoorDash DashPass (12 months)', value: 120, autoUsed: false },
      { name: 'No Foreign Transaction Fees', value: 40, autoUsed: false }
    ],
    bestFor: ['Travel beginners', 'Dining out regularly', 'Chase ecosystem users'],
    skipIf: 'You rarely travel or dine out and prefer flat cash-back',
    creditScoreNeeded: 'Good to Excellent (670+)',
    alternatives: ['chase-sapphire-reserve', 'capital-one-venture-x'],
    lastVerified: '2026-05-12'
  },
  {
    id: 'amex-platinum',
    name: 'Amex Platinum',
    issuer: 'American Express',
    annualFee: 895, // Raised from $695 in Jan 2026
    regularAPR: '20.74% - 28.74% Variable',
    signupBonus: '80,000 points after $8,000 spend in 6 months',
    rewards: [
      { category: 'travel', rate: 5, type: 'points', note: '5x flights direct or via Amex Travel; 5x prepaid hotels via Amex Travel' },
      { category: 'dining', rate: 1, type: 'points' },
      { category: 'groceries', rate: 1, type: 'points' },
      { category: 'gas', rate: 1, type: 'points' },
      { category: 'streaming', rate: 1, type: 'points' },
      { category: 'online', rate: 1, type: 'points' },
      { category: 'utilities', rate: 1, type: 'points' },
      { category: 'other', rate: 1, type: 'points' }
    ],
    pointValue: 0.02, // 2.0¢/pt (TPG valuation)
    perks: [
      { name: '$200 Airline Fee Credit', value: 200, autoUsed: false },
      { name: '$200 Hotel Credit (FHR/THC)', value: 200, autoUsed: false },
      { name: '$200 Uber Cash', value: 200, autoUsed: false },
      { name: '$240 Digital Entertainment Credit', value: 240, autoUsed: false },
      { name: '$300 Equinox Credit', value: 300, autoUsed: false },
      { name: '$199 CLEAR Plus Credit', value: 199, autoUsed: false },
      { name: '$155 Walmart+ Credit', value: 155, autoUsed: false },
      { name: '$100 Saks Fifth Ave Credit', value: 100, autoUsed: false },
      { name: 'Centurion Lounge Access', value: 600, autoUsed: false },
      { name: 'Priority Pass + Delta Sky Club', value: 429, autoUsed: false },
      { name: 'TSA PreCheck/Global Entry Credit', value: 100, autoUsed: false },
      { name: 'Marriott Gold + Hilton Gold Status', value: 100, autoUsed: false },
      { name: 'No Foreign Transaction Fees', value: 40, autoUsed: false }
    ],
    bestFor: ['Frequent flyers', 'Airport lounge lovers', 'Urban professionals'],
    skipIf: 'You can\'t use at least $895 in credits and lounge access per year',
    creditScoreNeeded: 'Excellent (740+)',
    alternatives: ['chase-sapphire-reserve', 'capital-one-venture-x'],
    lastVerified: '2026-05-12'
  },
  {
    id: 'amex-gold',
    name: 'Amex Gold',
    issuer: 'American Express',
    annualFee: 325,
    regularAPR: '20.74% - 28.74% Variable',
    signupBonus: '60,000 points after $6,000 spend in 6 months',
    rewards: [
      { category: 'dining', rate: 4, type: 'points' },
      { category: 'groceries', rate: 4, type: 'points', note: 'US supermarkets up to $25k/yr, then 1x' },
      { category: 'travel', rate: 3, type: 'points', note: 'Flights booked directly or via amextravel.com' },
      { category: 'streaming', rate: 1, type: 'points' },
      { category: 'gas', rate: 1, type: 'points' },
      { category: 'online', rate: 1, type: 'points' },
      { category: 'utilities', rate: 1, type: 'points' },
      { category: 'other', rate: 1, type: 'points' }
    ],
    pointValue: 0.02, // 2.0¢/pt (TPG valuation)
    perks: [
      { name: '$120 Dining Credit ($10/mo)', value: 120, autoUsed: false },
      { name: '$120 Uber Cash ($10/mo)', value: 120, autoUsed: false },
      { name: '$84 Dunkin\' Credit ($7/mo)', value: 84, autoUsed: false },
      { name: '$100 Resy Credit', value: 100, autoUsed: false },
      { name: 'No Foreign Transaction Fees', value: 40, autoUsed: false }
    ],
    bestFor: ['Foodies', 'Urban diners', 'Grocery spenders'],
    skipIf: 'You don\'t spend much on dining and groceries',
    creditScoreNeeded: 'Good to Excellent (670+)',
    alternatives: ['chase-sapphire-preferred', 'capital-one-savor-one'],
    lastVerified: '2026-05-12'
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    regularAPR: '20.99% - 28.99% Variable',
    signupBonus: '75,000 miles after $4,000 spend in 3 months',
    rewards: [
      { category: 'travel', rate: 10, type: 'points', note: '10x hotels/rental cars via Capital One Travel; 5x flights via Capital One Travel; 2x other travel' },
      { category: 'dining', rate: 2, type: 'points' },
      { category: 'groceries', rate: 2, type: 'points' },
      { category: 'gas', rate: 2, type: 'points' },
      { category: 'streaming', rate: 2, type: 'points' },
      { category: 'online', rate: 2, type: 'points' },
      { category: 'utilities', rate: 2, type: 'points' },
      { category: 'other', rate: 2, type: 'points' }
    ],
    pointValue: 0.0185, // 1.85¢/mile (TPG valuation)
    perks: [
      { name: '$300 Annual Travel Credit (Capital One Travel)', value: 300, autoUsed: true },
      { name: '10,000 Anniversary Miles', value: 185, autoUsed: true },
      { name: 'Priority Pass + Capital One Lounges', value: 429, autoUsed: false },
      { name: 'TSA PreCheck/Global Entry Credit', value: 100, autoUsed: false },
      { name: 'No Foreign Transaction Fees', value: 40, autoUsed: false }
    ],
    bestFor: ['Simplicity lovers who travel', 'Lounge access seekers', 'Flat-rate earners'],
    skipIf: 'You prefer maximizing category bonuses over flat 2x earning',
    creditScoreNeeded: 'Excellent (740+)',
    alternatives: ['chase-sapphire-reserve', 'amex-platinum'],
    lastVerified: '2026-05-12'
  },
  {
    id: 'citi-strata-premier',
    name: 'Citi Strata Premier',
    issuer: 'Citi',
    annualFee: 95,
    regularAPR: '20.74% - 28.74% Variable',
    signupBonus: '60,000 points after $4,000 spend in 3 months',
    rewards: [
      { category: 'travel', rate: 3, type: 'points', note: 'Air travel + hotels' },
      { category: 'gas', rate: 3, type: 'points', note: 'Gas + EV charging' },
      { category: 'groceries', rate: 3, type: 'points' },
      { category: 'dining', rate: 3, type: 'points' },
      { category: 'streaming', rate: 1, type: 'points' },
      { category: 'online', rate: 1, type: 'points' },
      { category: 'utilities', rate: 1, type: 'points' },
      { category: 'other', rate: 1, type: 'points' }
    ],
    pointValue: 0.019, // 1.9¢/pt (TPG valuation)
    perks: [
      { name: '$100 Annual Hotel Credit', value: 100, autoUsed: true },
      { name: 'No Foreign Transaction Fees', value: 40, autoUsed: false },
      { name: 'Trip Cancellation/Interruption Insurance', value: 30, autoUsed: false }
    ],
    bestFor: ['Everyday spenders', 'Gas and grocery heavy', 'Travel beginners'],
    skipIf: 'You want premium travel perks like lounges',
    creditScoreNeeded: 'Good to Excellent (670+)',
    alternatives: ['chase-sapphire-preferred', 'wells-fargo-active-cash'],
    lastVerified: '2026-05-12'
  },
  {
    id: 'amex-blue-cash-preferred',
    name: 'Amex Blue Cash Preferred',
    issuer: 'American Express',
    annualFee: 95,
    regularAPR: '20.24% - 29.24% Variable',
    signupBonus: '$250 after $3,000 spend in 6 months',
    rewards: [
      { category: 'groceries', rate: 6, type: 'cashback', note: 'US supermarkets up to $6k/yr, then 1%' },
      { category: 'streaming', rate: 6, type: 'cashback' },
      { category: 'gas', rate: 3, type: 'cashback', note: 'Transit incl. gas, rideshare, parking, tolls, trains, buses' },
      { category: 'dining', rate: 1, type: 'cashback' },
      { category: 'travel', rate: 1, type: 'cashback' },
      { category: 'online', rate: 1, type: 'cashback' },
      { category: 'utilities', rate: 1, type: 'cashback' },
      { category: 'other', rate: 1, type: 'cashback' }
    ],
    pointValue: 0.01, // Cashback (1¢ per "point")
    perks: [
      { name: '$84 Disney Bundle Credit ($7/mo)', value: 84, autoUsed: false },
      { name: 'Return Protection & Purchase Security', value: 25, autoUsed: false }
    ],
    bestFor: ['Grocery shoppers', 'Streaming households', 'Suburban families'],
    skipIf: 'You don\'t spend $30+/mo on groceries or streaming',
    creditScoreNeeded: 'Good to Excellent (670+)',
    alternatives: ['amex-blue-cash-everyday', 'capital-one-savor-one'],
    lastVerified: '2026-05-12'
  },
  {
    id: 'bilt-obsidian',
    name: 'Bilt Obsidian',
    issuer: 'Wells Fargo / Bilt',
    annualFee: 95,
    regularAPR: '21.74% - 29.99% Variable',
    signupBonus: 'Earn 2x points on rent (up to 200k/yr) with no fee',
    rewards: [
      { category: 'dining', rate: 4, type: 'points' },
      { category: 'groceries', rate: 3, type: 'points' },
      { category: 'travel', rate: 3, type: 'points' },
      { category: 'gas', rate: 1, type: 'points' },
      { category: 'streaming', rate: 1, type: 'points' },
      { category: 'online', rate: 1, type: 'points' },
      { category: 'utilities', rate: 1, type: 'points' },
      { category: 'other', rate: 1, type: 'points' }
    ],
    pointValue: 0.022, // 2.2¢/pt (TPG, transfer partners); cash redemption = 1¢/pt
    pointValueConservative: 0.01, // Cash redemption value
    perks: [
      { name: 'Rent points (1x, no fee, up to 200k/yr)', value: 100, autoUsed: false, note: 'Pay rent with credit card, no surcharge' },
      { name: 'Rent Day 2x bonus (1st of month)', value: 60, autoUsed: false },
      { name: 'Lyft credits & Bilt Rewards perks', value: 50, autoUsed: false },
      { name: 'No Foreign Transaction Fees', value: 40, autoUsed: false }
    ],
    bestFor: ['Renters paying $1k+/mo', 'Dining and grocery spenders', 'Transfer partner enthusiasts'],
    skipIf: 'You don\'t pay rent or don\'t use transfer partners',
    creditScoreNeeded: 'Good to Excellent (670+)',
    alternatives: ['chase-sapphire-preferred', 'amex-gold'],
    lastVerified: '2026-05-12'
  },
  {
    id: 'capital-one-savor-one',
    name: 'Capital One SavorOne',
    issuer: 'Capital One',
    annualFee: 0,
    regularAPR: '19.24% - 29.24% Variable',
    signupBonus: '$200 after $500 spend in 3 months',
    rewards: [
      { category: 'dining', rate: 3, type: 'cashback' },
      { category: 'groceries', rate: 3, type: 'cashback' },
      { category: 'streaming', rate: 3, type: 'cashback' },
      { category: 'online', rate: 3, type: 'cashback', note: 'Entertainment purchases' },
      { category: 'travel', rate: 1, type: 'cashback' },
      { category: 'gas', rate: 1, type: 'cashback' },
      { category: 'utilities', rate: 1, type: 'cashback' },
      { category: 'other', rate: 1, type: 'cashback' }
    ],
    pointValue: 0.01,
    perks: [
      { name: 'No Annual Fee', value: 0, autoUsed: true },
      { name: 'No Foreign Transaction Fees', value: 40, autoUsed: false }
    ],
    bestFor: ['Dining lovers', 'Entertainment spenders', 'No-AF seekers'],
    skipIf: 'You want premium travel benefits or lounge access',
    creditScoreNeeded: 'Good to Excellent (670+)',
    alternatives: ['amex-gold', 'chase-sapphire-preferred'],
    lastVerified: '2026-05-12'
  }
];

// Export for both browser and Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FEE_CARDS;
}
