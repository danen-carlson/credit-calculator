#!/usr/bin/env node
// One-shot script: add foreignTransactionFee + customizableCategories to all
// existing cards in rewards/cards-data.js, then append 7 flagship cards.
// After running, verify with: node --check rewards/cards-data.js

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'rewards', 'cards-data.js');
let src = fs.readFileSync(file, 'utf8');

// Map of card id → { foreignTransactionFee, customizableCategories }
// FTX defaults: travel cards = 0, cashback/crypto/Amazon = 3, Capital One = 0, Discover = 0
const ftxByCardId = {
  'citi-double-cash': 3,
  'wells-fargo-active-cash': 3,
  'fidelity-rewards-visa': 1, // Elan, generally 1%
  'paypal-cashback-mastercard': 3,
  'chase-freedom-flex': 3,
  'discover-it-cash-back': 0, // Discover never charges FTX
  'us-bank-cash-plus': 3,
  'citi-custom-cash': 3,
  'chase-sapphire-preferred': 0, // travel card
  'amex-gold': 0,
  'capital-one-venture-x': 0,
  'capital-one-venture': 0,
  'amex-blue-cash-preferred': 2.7,
  'amex-blue-cash-everyday': 2.7,
  'amazon-prime-visa': 3,
  'coinbase-card': 3,
  'coinbase-one-credit': 3,
  'gemini-credit': 3,
  'square-cash-card': 3
};

// Custom categories — only US Bank Cash+ is currently customizable
const customizableByCardId = {
  'us-bank-cash-plus': true
  // all others default to false
};

// Add foreignTransactionFee + customizableCategories field before each card's closing `}`,
// only if not already present.
// Match pattern: a card object's closing — `    affiliateNetwork: '...',\n    isCrypto: true|false\n  },?\n`
// We'll add the new fields right after the existing isCrypto line.
src = src.replace(
  /(\n    id: '([a-z0-9-]+)',[\s\S]*?\n    isCrypto: (?:true|false))(\n  \},?\n)/g,
  (match, body, id, tail) => {
    // Skip if already has the field
    if (/foreignTransactionFee:/.test(body)) return match;
    const ftx = ftxByCardId[id];
    const customizable = customizableByCardId[id] || false;
    if (ftx === undefined) {
      console.warn(`  ⚠ no FTX value for ${id}, defaulting to 3`);
    }
    const ftxValue = ftx !== undefined ? ftx : 3;
    return `${body},\n    foreignTransactionFee: ${ftxValue},\n    customizableCategories: ${customizable}${tail}`;
  }
);

// Coinbase Card data accuracy: lower uniform 4% to 2% baseline + add note
// Current: Coinbase Card has rate 4 across categories. Adjust.
src = src.replace(
  /(id: 'coinbase-card',[\s\S]*?rewards: \{)([\s\S]*?)(\n    \},)/,
  (m, head, body, tail) => {
    const adjusted = body.replace(/rate: 4/g, 'rate: 2');
    return head + adjusted + tail;
  }
);

// Discover it: add explicit Year-1-only warning to perks
src = src.replace(
  /(id: 'discover-it-cash-back',[\s\S]*?perks: \[)([\s\S]*?)(\],)/,
  (m, head, body, tail) => {
    if (/Year 1 ONLY/.test(body) || /Year 2\+/.test(body)) return m;
    const extra = ",\n      '⚠️ Year 1 ONLY: rewards doubled at year-end. Year 2+: standard rates only'";
    const newBody = body.replace(/(['"])([^'"]+)\1(\s*)$/, (_, q, txt, ws) => `${q}${txt}${q}${extra}${ws}`);
    return head + newBody + tail;
  }
);

// Amazon Prime Visa: make Prime fee explicit
src = src.replace(
  /(id: 'amazon-prime-visa',[\s\S]*?perks: \[)([\s\S]*?)(\],)/,
  (m, head, body, tail) => {
    if (/Requires Amazon Prime/.test(body)) return m;
    const extra = ",\n      '⚠️ Requires Amazon Prime ($139/yr) — fee not included in calculation'";
    const newBody = body.replace(/(['"])([^'"]+)\1(\s*)$/, (_, q, txt, ws) => `${q}${txt}${q}${extra}${ws}`);
    return head + newBody + tail;
  }
);

// Append 7 flagship cards before the closing `];`
const newCards = `,
  // ============================================================
  // Flagship cards added 2026-04-28 (Sprint 3, P1 #24)
  // ============================================================
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    type: 'travel',
    annualFee: 795, // Raised June 2025
    signupBonus: { amount: 100000, unit: 'points', value: 2050, requirement: '$5,000 spend in 3 months' },
    rewards: {
      groceries: { rate: 1 },
      dining: { rate: 5 },
      gas: { rate: 1 },
      travel: { rate: 8, note: '8x via Chase Travel; 4x flights via Chase Travel; 3x other travel direct' },
      online: { rate: 1 },
      streaming: { rate: 1 },
      utilities: { rate: 1 },
      everything: { rate: 1 }
    },
    pointValue: 2.05,
    perks: ['8x travel via Chase Travel', '5x dining', '$300 annual travel credit', 'Priority Pass + Chase Sapphire Lounges', 'Global Entry/TSA PreCheck credit', 'Trip protection, primary rental car insurance'],
    annualCredits: 300,
    annualCreditNote: '$300 annual travel credit',
    bestFor: 'Frequent Travelers',
    affiliateLink: '',
    affiliateNetwork: '',
    isCrypto: false,
    foreignTransactionFee: 0,
    customizableCategories: false
  },
  {
    id: 'amex-platinum',
    name: 'Amex Platinum',
    issuer: 'American Express',
    type: 'travel',
    annualFee: 895, // Raised from $695 in Jan 2026
    signupBonus: { amount: 80000, unit: 'points', value: 1600, requirement: '$8,000 spend in 6 months' },
    rewards: {
      groceries: { rate: 1 },
      dining: { rate: 1 },
      gas: { rate: 1 },
      travel: { rate: 5, note: '5x flights & prepaid hotels via Amex Travel' },
      online: { rate: 1 },
      streaming: { rate: 1 },
      utilities: { rate: 1 },
      everything: { rate: 1 }
    },
    pointValue: 2.0,
    perks: ['5x flights & hotels via Amex Travel', '$200 airline incidental credit', '$200 hotel credit (FHR/THC)', '$200 Uber credit', '$240 digital entertainment credit', '$300 Equinox credit', '$199 CLEAR Plus credit', '$155 Walmart+ credit', '$100 Saks credit', 'Centurion Lounge access', 'Marriott Gold + Hilton Gold status'],
    annualCredits: 1394, // Conservative net of all credits
    annualCreditNote: 'Up to $2,400+ in credits if fully used',
    bestFor: 'Premium Travel Stackers',
    affiliateLink: '',
    affiliateNetwork: '',
    isCrypto: false,
    foreignTransactionFee: 0,
    customizableCategories: false
  },
  {
    id: 'bilt-blue',
    name: 'Bilt Blue',
    issuer: 'Wells Fargo',
    type: 'travel',
    annualFee: 0,
    signupBonus: { amount: 0, unit: 'points', value: 0, requirement: '' },
    rewards: {
      groceries: { rate: 1 },
      dining: { rate: 3 },
      gas: { rate: 1 },
      travel: { rate: 2 },
      online: { rate: 1 },
      streaming: { rate: 1 },
      utilities: { rate: 1 },
      rent: { rate: 1, note: '1x on rent (up to 100k pts/yr) — NO surcharge fee' },
      everything: { rate: 1 }
    },
    pointValue: 2.2, // TPG: Bilt points highly valued via transfer partners
    perks: ['1x on rent — no transaction fee (KEY differentiator)', '3x dining', '2x travel', 'Transfer to airlines & hotels (Hyatt, AA, etc.)', 'Rent Day 2x bonus on the 1st of each month', 'No annual fee'],
    bestFor: 'Renters & Foodies',
    affiliateLink: '',
    affiliateNetwork: '',
    isCrypto: false,
    foreignTransactionFee: 0,
    customizableCategories: false,
    notes: 'As of Jan 2026 the original Bilt Mastercard was replaced by 3 tiers: Bilt Blue ($0), Bilt Obsidian ($95), Bilt Palladium ($495). This entry is the entry-level Blue.'
  },
  {
    id: 'citi-strata-premier',
    name: 'Citi Strata Premier',
    issuer: 'Citi',
    type: 'travel',
    annualFee: 95,
    signupBonus: { amount: 60000, unit: 'points', value: 1140, requirement: '$4,000 spend in 3 months' },
    rewards: {
      groceries: { rate: 3 },
      dining: { rate: 3 },
      gas: { rate: 3 },
      travel: { rate: 3, note: '3x air travel + hotels' },
      online: { rate: 1 },
      streaming: { rate: 1 },
      utilities: { rate: 1 },
      everything: { rate: 1 }
    },
    pointValue: 1.9,
    perks: ['3x on dining, groceries, gas, air, hotels', '$100 hotel credit ($500+ booking via Citi Travel)', 'Trip protection', 'No foreign transaction fees', 'Renamed from Citi Premier in 2025'],
    annualCredits: 100,
    annualCreditNote: '$100 hotel credit',
    bestFor: 'Mid-tier Travelers',
    affiliateLink: '',
    affiliateNetwork: '',
    isCrypto: false,
    foreignTransactionFee: 0,
    customizableCategories: false
  },
  {
    id: 'wells-fargo-autograph',
    name: 'Wells Fargo Autograph',
    issuer: 'Wells Fargo',
    type: 'tiered',
    annualFee: 0,
    signupBonus: { amount: 20000, unit: 'points', value: 330, requirement: '$1,000 spend in 3 months' },
    rewards: {
      groceries: { rate: 1 },
      dining: { rate: 3 },
      gas: { rate: 3 },
      travel: { rate: 3 },
      online: { rate: 1 },
      streaming: { rate: 3 },
      utilities: { rate: 3, note: 'Phone plans included' },
      everything: { rate: 1 }
    },
    pointValue: 1.65,
    perks: ['3x on dining, travel, gas, transit, streaming, phone plans', 'No annual fee', 'No foreign transaction fees', 'Cell phone protection'],
    bestFor: 'No-AF 3x Hunters',
    affiliateLink: '',
    affiliateNetwork: '',
    isCrypto: false,
    foreignTransactionFee: 0,
    customizableCategories: false
  },
  {
    id: 'capital-one-savor',
    name: 'Capital One Savor',
    issuer: 'Capital One',
    type: 'cashback',
    annualFee: 0, // Now $0 AF (the $95 version was discontinued)
    signupBonus: { amount: 200, unit: 'cash', value: 200, requirement: '$500 spend in 3 months' },
    rewards: {
      groceries: { rate: 3 },
      dining: { rate: 3 },
      gas: { rate: 1 },
      travel: { rate: 1 },
      online: { rate: 1 },
      streaming: { rate: 3 },
      utilities: { rate: 1 },
      entertainment: { rate: 3, note: 'Concerts, sports, movies' },
      everything: { rate: 1 }
    },
    pointValue: 1.0,
    perks: ['3% on dining, groceries, entertainment, streaming', '1% on everything else', 'No annual fee (AF version discontinued)', 'No foreign transaction fees'],
    bestFor: 'Family Spenders',
    affiliateLink: '',
    affiliateNetwork: '',
    isCrypto: false,
    foreignTransactionFee: 0,
    customizableCategories: false
  },
  {
    id: 'bofa-premium-rewards-elite',
    name: 'BofA Premium Rewards Elite',
    issuer: 'Bank of America',
    type: 'travel',
    annualFee: 550,
    signupBonus: { amount: 75000, unit: 'points', value: 750, requirement: '$5,000 spend in 90 days' },
    rewards: {
      groceries: { rate: 1.5 },
      dining: { rate: 2 },
      gas: { rate: 1.5 },
      travel: { rate: 2 },
      online: { rate: 1.5 },
      streaming: { rate: 1.5 },
      utilities: { rate: 1.5 },
      everything: { rate: 1.5 }
    },
    pointValue: 1.0,
    perks: ['2x travel & dining', 'Up to 5.25% effective with Preferred Rewards (Diamond Honors)', '$300 annual travel credit', '$150 lifestyle credit', 'Priority Pass', 'Trip protection'],
    annualCredits: 450,
    annualCreditNote: '$300 travel + $150 lifestyle credits',
    bestFor: 'BofA Preferred Rewards Members',
    affiliateLink: '',
    affiliateNetwork: '',
    isCrypto: false,
    foreignTransactionFee: 0,
    customizableCategories: false
  }`;

// Inject new cards between the last card's closing `}` and the array terminator `];`.
// Existing: ...\n  }\n];   (one trailing card object, then the array close)
// `newCards` starts with `,\n  // ...` (leading comma + comment + new card objects)
// We want: ...\n  }<newCards>\n];
const before = src;
src = src.replace(/(\n  \})\n\];/, (m, brace) => brace + newCards + '\n];');
if (src === before) {
  console.error('ERROR: anchor pattern `\\n  }\\n];` not found for new-card injection');
  process.exit(1);
}

fs.writeFileSync(file, src, 'utf8');
console.log('✓ wrote ' + file);
console.log('   - foreignTransactionFee added to all existing cards');
console.log('   - customizableCategories added to all existing cards');
console.log('   - 7 flagship cards appended (CSR, Plat, Bilt Blue, Strata Premier, Autograph, Savor, BofA Elite)');
console.log('   - Coinbase Card rate dropped from 4% to 2% baseline');
console.log('   - Discover it & Amazon Prime Visa perks updated');
