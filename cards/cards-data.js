// CreditStud.io — Card Reviews Data
// All data is editorial/research-based. Update reviewDate when refreshing.

const CARD_REVIEWS = [
  {
    slug: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred® Card',
    issuer: 'Chase',
    annualFee: 95,
    introAPR: '0% for 15 months on purchases',
    regularAPR: '20.49% – 27.49% Variable',
    signupBonus: '60,000 points (worth $750 in travel) after $4,000 spend in 3 months',
    rewards: [
      { category: 'Travel (Chase portal)', rate: '5x', type: 'points' },
      { category: 'Dining', rate: '3x', type: 'points' },
      { category: 'Streaming', rate: '3x', type: 'points' },
      { category: 'Online groceries', rate: '3x', type: 'points' },
      { category: 'Other travel', rate: '2x', type: 'points' },
      { category: 'Everything else', rate: '1x', type: 'points' }
    ],
    pointsValue: 0.0125,
    perks: [
      'Trip delay insurance (6+ hours)',
      'Baggage delay insurance',
      'Primary auto rental collision damage waiver',
      'No foreign transaction fees',
      'DoorDash DashPass (12 months free)',
      'Instacart+ membership (12 months)',
      '25% bonus when redeeming points for travel through Chase'
    ],
    annualCredits: [
      { label: '$50 annual hotel credit', value: 50, notes: 'Hotels booked through Chase Travel' }
    ],
    ratings: { rewards: 4, perks: 3.5, afValue: 4.5, approval: 3.5, overall: 4 },
    bestFor: [
      'Travelers who book 1–3 trips/year',
      'People who eat out regularly',
      'Beginners to the Chase Ultimate Rewards ecosystem'
    ],
    skipIf: 'You rarely travel or dine out, or want simple flat-rate cash back.',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: '5/24 rule: Chase typically denies if you\'ve opened 5+ cards (any issuer) in the past 24 months.',
    faqs: [
      { q: 'Is the Chase Sapphire Preferred worth the $95 annual fee?', a: 'For most people who travel and dine out, yes. The $50 annual hotel credit alone covers more than half the fee, and the 5x travel / 3x dining rewards add up fast. The signup bonus alone (worth ~$750 in travel) covers the fee for ~7 years.' },
      { q: 'What are Chase Sapphire Preferred points worth?', a: 'Points are worth 1.25¢ each when redeemed for travel through Chase Travel, or 1¢ for cash back. With Chase\'s transfer partners (Hyatt, United, Southwest, etc.), savvy redeemers regularly get 1.5–2¢+ per point.' },
      { q: 'What credit score do I need for the Chase Sapphire Preferred?', a: 'Good to excellent credit (670+ FICO) is recommended. Chase also enforces the unwritten "5/24 rule" — if you\'ve opened 5 or more credit cards from any issuer in the last 24 months, you\'ll likely be denied regardless of score.' },
      { q: 'Does the Chase Sapphire Preferred have foreign transaction fees?', a: 'No — zero foreign transaction fees, making it a strong choice for international travel.' },
      { q: 'How does the Sapphire Preferred compare to the Reserve?', a: 'The Reserve ($545 AF) adds airport lounge access, $300 annual travel credit, and 1.5¢/point redemption. The Preferred ($95) is a better value unless you fly enough to use the lounges (~10+ flights/year) and use the full $300 credit.' },
      { q: 'Can I downgrade the Sapphire Preferred later?', a: 'Yes. After year 1, you can downgrade product-change to Chase Freedom Unlimited or Freedom Flex (no AF), keeping your account history. You can\'t upgrade back without a new application though.' }
    ],
    alternatives: ['amex-gold', 'capital-one-venture-x'],
    affiliateLink: '#',
    reviewDate: '2026-04-29'
  },
  {
    slug: 'amex-gold',
    name: 'American Express® Gold Card',
    issuer: 'American Express',
    annualFee: 325,
    introAPR: 'No intro APR — pay-in-full charge card behavior, with Pay Over Time option',
    regularAPR: 'See terms (Pay Over Time APR varies)',
    signupBonus: '60,000 Membership Rewards points after $6,000 spend in 6 months',
    rewards: [
      { category: 'Restaurants worldwide', rate: '4x', type: 'points' },
      { category: 'U.S. supermarkets (up to $25K/yr)', rate: '4x', type: 'points' },
      { category: 'Flights booked direct or amextravel.com', rate: '3x', type: 'points' },
      { category: 'Prepaid hotels (amextravel.com)', rate: '2x', type: 'points' },
      { category: 'Everything else', rate: '1x', type: 'points' }
    ],
    pointsValue: 0.0150,
    perks: [
      '$120/yr Uber Cash ($10/mo)',
      '$120/yr dining credit ($10/mo at Grubhub, Resy, Five Guys, etc.)',
      '$84/yr Dunkin\' credit ($7/mo)',
      '$100/yr Resy credit ($50 semi-annually)',
      'No foreign transaction fees',
      'Hotel Collection benefits (room upgrade + $100 property credit)'
    ],
    annualCredits: [
      { label: 'Uber Cash', value: 120 },
      { label: 'Dining credit', value: 120 },
      { label: 'Dunkin\' credit', value: 84 },
      { label: 'Resy credit', value: 100 }
    ],
    ratings: { rewards: 5, perks: 4, afValue: 4, approval: 3, overall: 4.2 },
    bestFor: [
      'Heavy restaurant spenders',
      'U.S. supermarket shoppers (up to $2K/mo)',
      'People who already use Uber, Grubhub, Dunkin\', or Resy'
    ],
    skipIf: 'You don\'t use Uber/Grubhub/Dunkin\' regularly. Coupon-style credits only pay off if you\'d already spend the money.',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: 'Welcome bonus once-per-lifetime (Amex strict rule). 1/5 rule for credit cards (max 1 new Amex CC per 5 days).',
    faqs: [
      { q: 'Is the Amex Gold worth $325 annually?', a: 'If you actually use the credits ($424/yr face value), the card pays for itself before factoring rewards. The catch: most credits are split monthly/semi-annually so you have to remember to redeem them.' },
      { q: 'What\'s the best way to use Membership Rewards points?', a: 'Transfer partners (Delta, ANA, Air France/KLM, Hilton, Marriott) typically yield 1.5–2.5¢/point. Avoid the gift card / pay-with-points-on-Amazon redemption — those are ~0.7¢/point.' },
      { q: 'Are Amex Gold credits hard to use?', a: 'They\'re prorated monthly, which means you actively have to redeem them. People who set monthly Uber/Dunkin\' reminders maximize value; people who don\'t end up leaving $200+/yr on the table.' },
      { q: 'Does the Amex Gold count as a charge card?', a: 'It\'s technically a charge card with Pay Over Time — most spend must be paid in full each month, but you can opt eligible charges into a revolving plan with interest.' },
      { q: 'How does the Amex Gold compare to the Chase Sapphire Preferred?', a: 'Gold is better for dining and groceries (4x vs 3x). Sapphire Preferred is cheaper ($95 vs $325) and has stronger travel insurance + transfer partners. Pick Gold if you spend $1K+/mo on restaurants/groceries.' },
      { q: 'Is the Amex Gold worth it without using credits?', a: 'Less compelling. Strip out the $424 in coupon credits and you\'re paying $325/yr for 4x dining. Cards like Citi Custom Cash give 5% on a chosen category for $0 AF.' }
    ],
    alternatives: ['chase-sapphire-preferred', 'citi-custom-cash'],
    affiliateLink: '#',
    reviewDate: '2026-04-29'
  },
  {
    slug: 'capital-one-venture-x',
    name: 'Capital One Venture X Rewards Credit Card',
    issuer: 'Capital One',
    annualFee: 395,
    introAPR: 'No intro APR offer',
    regularAPR: '19.99% – 29.99% Variable',
    signupBonus: '75,000 miles after $4,000 spend in 3 months',
    rewards: [
      { category: 'Hotels & rental cars (Capital One Travel)', rate: '10x', type: 'miles' },
      { category: 'Flights (Capital One Travel)', rate: '5x', type: 'miles' },
      { category: 'Everything else', rate: '2x', type: 'miles' }
    ],
    pointsValue: 0.0150,
    perks: [
      'Priority Pass + Capital One Lounge access (cardholder + 2 guests)',
      'Hertz President\'s Circle elite status',
      'TSA PreCheck/Global Entry credit ($120 every 4 years)',
      'Cell phone protection',
      'No foreign transaction fees',
      'Visa Infinite benefits (concierge, lost luggage, travel emergency)'
    ],
    annualCredits: [
      { label: '$300 annual travel credit (Capital One Travel)', value: 300 },
      { label: '10,000 anniversary bonus miles ($100 value)', value: 100 }
    ],
    ratings: { rewards: 4.5, perks: 4.5, afValue: 5, approval: 3.5, overall: 4.5 },
    bestFor: [
      'People who want premium perks for under $400 AF',
      'Travelers who book through 1–2 portals',
      'Anyone tired of the 5/24 rule'
    ],
    skipIf: 'You\'d rarely use lounges or the Capital One Travel portal. The portal can be more expensive than booking direct.',
    creditScoreNeeded: 'Excellent (740+)',
    issuerRules: 'Capital One typically allows only 1–2 personal cards per customer. No formal rules like 5/24, but they look at recent inquiries.',
    faqs: [
      { q: 'Is the Venture X really only $395/year?', a: 'Effectively, no. After the $300 travel credit and 10K anniversary miles ($100), the net AF is ~$0/yr if you book any travel through Capital One Travel. It\'s the cheapest premium card available.' },
      { q: 'How does the Venture X compare to Chase Sapphire Reserve and Amex Platinum?', a: 'Venture X is $150–$300 cheaper than Reserve/Platinum and includes lounge access, but transfer partners are weaker (no Hyatt, no Delta) and the travel portal can be pricier than booking direct.' },
      { q: 'Are Capital One miles worth it?', a: 'Best value at 1.85¢+ via transfer partners (Air Canada Aeroplan, Avianca LifeMiles, Turkish Airlines). At 1¢ for "purchase eraser" they\'re mediocre; you need to learn transfer partners.' },
      { q: 'Can I add authorized users for free?', a: 'Yes. Authorized users get full Priority Pass and Capital One Lounge access — that alone is worth ~$700/yr if your spouse travels with you.' },
      { q: 'What\'s the catch with the $300 travel credit?', a: 'Must book through Capital One Travel portal. Prices are sometimes 3–10% higher than booking direct, so the credit\'s real value is closer to $250–$280 if you\'d normally book elsewhere.' },
      { q: 'Is the Venture X hard to get approved for?', a: 'Yes — Capital One is conservative. You\'ll typically need a 740+ FICO, low utilization, and clean recent inquiries. They also auto-decline applicants with too many recent Capital One products.' }
    ],
    alternatives: ['chase-sapphire-preferred', 'amex-gold'],
    affiliateLink: '#',
    reviewDate: '2026-04-29'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CARD_REVIEWS };
}
