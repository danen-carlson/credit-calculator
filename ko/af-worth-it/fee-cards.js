// Annual Fee Card Data — CreditStud.io
// Estimated perk values and reward categories for top AF cards

const FEE_CARDS = [
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 545,
    introAPR: 'N/A',
    regularAPR: '20.49% - 27.49% Variable',
    signupBonus: '60,000 points ($900 travel) after $4,000 spend in 3 months',
    rewards: [
      { category: 'Travel', rate: '10x', type: 'points', value: 5 },
      { category: 'Dining', rate: '5x', type: 'points', value: 2.5 },
      { category: 'All other', rate: '1x', type: 'points', value: 0.5 }
    ],
    pointsValue: 0.015, // cents per point for cash, more for travel
    perks: [
      { name: 'DoorDash DashPass', value: 120 },
      { name: 'Instacart+', value: 48 },
      { name: '$300 Travel Credit', value: 300 },
      { name: 'Priority Pass Select', value: 429 },
      { name: 'TSA PreCheck/CLEAR Credit', value: 100 },
      { name: 'Trip Delay Insurance', value: 50 },
      { name: 'No Foreign Transaction Fees', value: 40 }
    ],
    bestFor: ['Frequent travelers', 'Airport lounge visitors', 'Dining enthusiasts'],
    skipIf: 'You don\'t travel at least a few times per year and don\'t use lounges',
    creditScoreNeeded: 'Excellent (740+)',
    alternatives: ['chase-sapphire-preferred', 'capital-one-venture-x']
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    introAPR: '0% for 15 months on purchases',
    regularAPR: '20.49% - 27.49% Variable',
    signupBonus: '60,000 points ($750 travel) after $4,000 spend in 3 months',
    rewards: [
      { category: 'Travel', rate: '5x', type: 'points', value: 2.5 },
      { category: 'Dining', rate: '3x', type: 'points', value: 1.5 },
      { category: 'Streaming', rate: '3x', type: 'points', value: 1.5 },
      { category: 'All other', rate: '1x', type: 'points', value: 0.5 }
    ],
    pointsValue: 0.0125,
    perks: [
      { name: 'DoorDash DashPass', value: 120 },
      { name: 'Instacart Membership', value: 48 },
      { name: 'Trip Delay Insurance', value: 30 },
      { name: 'No Foreign Transaction Fees', value: 40 }
    ],
    bestFor: ['Travel beginners', 'Dining out regularly', 'Chase ecosystem users'],
    skipIf: 'You rarely travel or dine out and prefer flat cash-back',
    creditScoreNeeded: 'Good to Excellent (670+)',
    alternatives: ['chase-sapphire-reserve', 'capital-one-venture-x']
  },
  {
    id: 'amex-platinum',
    name: 'Amex Platinum',
    issuer: 'Amex',
    annualFee: 695,
    introAPR: 'N/A',
    regularAPR: '20.49% - 27.49% Variable',
    signupBonus: '80,000 points after $8,000 spend in 6 months',
    rewards: [
      { category: 'Flights', rate: '5x', type: 'points', value: 2.5 },
      { category: 'Hotels ( prepaid)', rate: '5x', type: 'points', value: 2.5 },
      { category: 'All other', rate: '1x', type: 'points', value: 0.5 }
    ],
    pointsValue: 0.02,
    perks: [
      { name: '$240 Digital Entertainment Credit', value: 240 },
      { name: '$155 Walmart+ Membership', value: 155 },
      { name: '$200 Uber Cash', value: 200 },
      { name: '$300 Equinox Gym Credit', value: 300 },
      { name: '$100 Saks Fifth Ave Credit', value: 100 },
      { name: '$189 CLEAR Credit', value: 189 },
      { name: 'Centurion Lounge Access', value: 600 },
      { name: 'Priority Pass', value: 429 },
      { name: 'TSA PreCheck/CLEAR', value: 100 },
      { name: '$200 Airline Fee Credit', value: 200 },
      { name: '$200 Hotel Credit', value: 200 },
      { name: 'No Foreign Transaction Fees', value: 40 }
    ],
    bestFor: ['Frequent flyers', 'Airport lounge lovers', 'Urban professionals'],
    skipIf: 'You can\'t use at least $695 in credits and lounge access per year',
    creditScoreNeeded: 'Excellent (740+)',
    alternatives: ['chase-sapphire-reserve', 'capital-one-venture-x']
  },
  {
    id: 'amex-gold',
    name: 'Amex Gold',
    issuer: 'Amex',
    annualFee: 325,
    introAPR: 'N/A',
    regularAPR: '20.49% - 27.49% Variable',
    signupBonus: '60,000 points after $4,000 spend in 6 months',
    rewards: [
      { category: 'Dining', rate: '4x', type: 'points', value: 2 },
      { category: 'Groceries', rate: '4x', type: 'points', value: 2 },
      { category: 'Flights', rate: '3x', type: 'points', value: 1.5 },
      { category: 'All other', rate: '1x', type: 'points', value: 0.5 }
    ],
    pointsValue: 0.02,
    perks: [
      { name: '$120 Dining Credit', value: 120 },
      { name: '$120 Uber Cash', value: 120 },
      { name: '$84 Resy Credit', value: 84 },
      { name: 'No Foreign Transaction Fees', value: 40 }
    ],
    bestFor: ['Foodies', 'Urban diners', 'Grocery spenders'],
    skipIf: 'You don\'t spend much on dining and groceries',
    creditScoreNeeded: 'Good to Excellent (670+)',
    alternatives: ['chase-sapphire-preferred', 'savor-one']
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    introAPR: 'N/A',
    regularAPR: '19.49% - 29.49% Variable',
    signupBonus: '75,000 miles after $4,000 spend in 3 months',
    rewards: [
      { category: 'Flights/Hotels (Capital One Travel)', rate: '10x', type: 'miles', value: 5 },
      { category: 'All other', rate: '2x', type: 'miles', value: 1 }
    ],
    pointsValue: 0.01, // 1 cent per mile for statement credit
    perks: [
      { name: '$300 Travel Credit', value: 300 },
      { name: '10,000 Anniversary Miles', value: 100 },
      { name: 'Priority Pass', value: 429 },
      { name: 'TSA PreCheck/CLEAR', value: 100 },
      { name: 'Capital One Lounge Access', value: 200 }
    ],
    bestFor: ['Simplicity lovers who travel', 'Lounge access seekers', 'Flat-rate earners'],
    skipIf: 'You prefer maximizing category bonuses over flat 2x earning',
    creditScoreNeeded: 'Excellent (740+)',
    alternatives: ['chase-sapphire-reserve', 'amex-platinum']
  },
  {
    id: 'citi-premier',
    name: 'Citi Premier',
    issuer: 'Citi',
    annualFee: 95,
    introAPR: '0% for 15 months on purchases',
    regularAPR: '20.49% - 28.49% Variable',
    signupBonus: '60,000 points after $4,000 spend in 3 months',
    rewards: [
      { category: 'Air Travel/Hotels', rate: '3x', type: 'points', value: 1.5 },
      { category: 'Gas/EVs', rate: '3x', type: 'points', value: 1.5 },
      { category: 'Groceries', rate: '3x', type: 'points', value: 1.5 },
      { category: 'Restaurants', rate: '3x', type: 'points', value: 1.5 },
      { category: 'All other', rate: '1x', type: 'points', value: 0.5 }
    ],
    pointsValue: 0.0125,
    perks: [
      { name: 'No Foreign Transaction Fees', value: 40 },
      { name: 'Trip Cancellation/Interruption', value: 30 }
    ],
    bestFor: ['Everyday spenders', 'Gas and grocery heavy', 'Travel beginners'],
    skipIf: 'You want premium travel perks like lounges',
    creditScoreNeeded: 'Good to Excellent (670+)',
    alternatives: ['chase-sapphire-preferred', 'wells-fargo-active-cash']
  },
  {
    id: 'bilt-mastercard',
    name: 'Bilt Mastercard',
    issuer: 'Wells Fargo / Bilt',
    annualFee: 0,
    introAPR: 'N/A',
    regularAPR: '20.49% - 28.49% Variable',
    signupBonus: 'Earn points on rent with no fee',
    rewards: [
      { category: 'Rent', rate: '1x', type: 'points', value: 0.5 },
      { category: 'Dining', rate: '4x', type: 'points', value: 2 },
      { category: 'Groceries', rate: '3x', type: 'points', value: 1.5 },
      { category: 'Travel', rate: '2x', type: 'points', value: 1 },
      { category: 'All other', rate: '1x', type: 'points', value: 0.5 }
    ],
    pointsValue: 0.0125,
    perks: [
      { name: 'No Annual Fee', value: 0 },
      { name: 'Rent Day Bonus Points', value: 60 },
      { name: 'No Foreign Transaction Fees', value: 40 }
    ],
    bestFor: ['Renters', 'Dining and grocery spenders', 'No-AF seekers'],
    skipIf: 'You don\'t pay rent or want premium travel benefits',
    creditScoreNeeded: 'Good to Excellent (670+)',
    alternatives: ['chase-sapphire-preferred', 'amex-gold']
  },
  {
    id: 'savor-one',
    name: 'Capital One SavorOne',
    issuer: 'Capital One',
    annualFee: 0,
    introAPR: '0% for 15 months on purchases',
    regularAPR: '19.49% - 29.49% Variable',
    signupBonus: '$200 after $500 spend in 3 months',
    rewards: [
      { category: 'Dining', rate: '3%', type: 'cashback', value: 3 },
      { category: 'Groceries', rate: '3%', type: 'cashback', value: 3 },
      { category: 'Streaming', rate: '3%', type: 'cashback', value: 3 },
      { category: 'Entertainment', rate: '3%', type: 'cashback', value: 3 },
      { category: 'All other', rate: '1%', type: 'cashback', value: 1 }
    ],
    pointsValue: 0.01,
    perks: [
      { name: 'No Annual Fee', value: 0 },
      { name: 'No Foreign Transaction Fees', value: 40 }
    ],
    bestFor: ['Dining lovers', 'Entertainment spenders', 'No-AF seekers'],
    skipIf: 'You want premium travel benefits or lounge access',
    creditScoreNeeded: 'Good to Excellent (670+)',
    alternatives: ['amex-gold', 'chase-sapphire-preferred']
  }
];

// Export for both browser and Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FEE_CARDS;
}