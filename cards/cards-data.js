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
    alternatives: ['amex-gold', 'capital-one-venture-x', 'chase-sapphire-reserve'],
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
    alternatives: ['chase-sapphire-preferred', 'citi-custom-cash', 'bilt-mastercard'],
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
    alternatives: ['chase-sapphire-preferred', 'amex-gold', 'citi-double-cash'],
    affiliateLink: '#',
    reviewDate: '2026-04-29'
  },
  {
    slug: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve®',
    issuer: 'Chase',
    annualFee: 550,
    introAPR: 'No intro APR offer',
    regularAPR: '21.49% – 28.49% Variable',
    signupBonus: '75,000 points (worth $1,125 in travel) after $5,000 spend in 3 months',
    rewards: [
      { category: 'Travel (Chase portal)', rate: '10x', type: 'points' },
      { category: 'Hotels & car rentals (Chase portal)', rate: '10x', type: 'points' },
      { category: 'Dining', rate: '3x', type: 'points' },
      { category: 'Streaming', rate: '3x', type: 'points' },
      { category: 'Other travel', rate: '3x', type: 'points' },
      { category: 'Everything else', rate: '1x', type: 'points' }
    ],
    pointsValue: 0.015,
    perks: [
      'Priority Pass Select lounge access (cardholder + unlimited guests)',
      'TSA PreCheck / Global Entry credit ($100 every 4 years)',
      'Primary auto rental collision damage waiver',
      'Trip cancellation/interruption insurance (up to $10,000)',
      'Trip delay reimbursement (6+ hours, up to $500)',
      'Baggage delay insurance',
      'No foreign transaction fees',
      'DoorDash DashPass (12 months free, then 50% off)',
      'Instacart+ membership (12 months free)',
      'Lyft Pink All Access (12 months free)'
    ],
    annualCredits: [
      { label: '$300 annual travel credit', value: 300, notes: 'Automatic credit for travel purchases' },
      { label: '10,000 anniversary bonus points ($150 value)', value: 150 }
    ],
    ratings: { rewards: 4.5, perks: 5, afValue: 4, approval: 3, overall: 4.3 },
    bestFor: [
      'Frequent travelers who fly 6+ times per year',
      'People who value Priority Pass lounge access',
      'Chase Ultimate Rewards ecosystem power users'
    ],
    skipIf: 'You travel fewer than 3 times per year or don\'t use airport lounges. The $550 AF only pays off if you max the $300 travel credit and use lounge benefits regularly.',
    creditScoreNeeded: 'Excellent (720+)',
    issuerRules: '5/24 rule applies. Chase typically denies if you\'ve opened 5+ cards (any issuer) in 24 months.',
    faqs: [
      { q: 'Is the Chase Sapphire Reserve worth the $550 annual fee?', a: 'If you use the $300 travel credit and fly enough to use Priority Pass lounges, the effective fee drops to ~$0–$100. The 10x points on Chase Travel bookings and 1.5¢/point redemption value make it elite for heavy travelers. But if you barely travel, it\'s an expensive paperweight.' },
      { q: 'How does the Sapphire Reserve compare to the Preferred?', a: 'Reserve gives 10x on Chase Travel vs 5x, 1.5¢/point vs 1.25¢, Priority Pass lounges, and $300 travel credit. Preferred costs $550 less per year. If you travel 6+ times/year and use lounges, Reserve wins. Otherwise, Preferred is the better value.' },
      { q: 'What are Chase Sapphire Reserve points worth?', a: '1.5¢ each when redeemed for travel through Chase, or 1¢ for cash back. Transfer partners like Hyatt, United, and Singapore Airlines can yield 2–3¢+ per point for savvy redeemers.' },
      { q: 'Can I downgrade the Sapphire Reserve?', a: 'Yes, you can product-change to Chase Sapphire Preferred, Freedom Flex, or Freedom Unlimited. You\'ll lose lounge access and the travel credit, but avoid the $550 AF. Note: you can\'t upgrade back without a new application.' },
      { q: 'Does the $300 travel credit work automatically?', a: 'Yes. It credits automatically for qualifying travel purchases (airlines, hotels, car rentals, transit). No enrollment or portal booking required — just make the purchase and the credit posts within a few days.' },
      { q: 'How does Priority Pass work with the Reserve?', a: 'You get Priority Pass Select membership with unlimited lounge visits for yourself and unlimited free guests. Most other premium cards charge $27+ per guest. This alone can be worth $500+/year if you travel with companions.' }
    ],
    alternatives: ['chase-sapphire-preferred', 'capital-one-venture-x', 'amex-platinum'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'amex-platinum',
    name: 'The Platinum Card® from American Express',
    issuer: 'American Express',
    annualFee: 695,
    introAPR: 'No intro APR — charge card with Pay Over Time option',
    regularAPR: 'See Pay Over Time terms (variable APR applies)',
    signupBonus: '80,000 Membership Rewards points after $8,000 spend in 6 months',
    rewards: [
      { category: 'Flights (direct or amextravel.com)', rate: '5x', type: 'points' },
      { category: 'Prepaid hotels (amextravel.com)', rate: '5x', type: 'points' },
      { category: 'Everything else', rate: '1x', type: 'points' }
    ],
    pointsValue: 0.0155,
    perks: [
      'Centurion Lounge access (the best domestic lounges)',
      'Priority Pass Select (1,400+ lounges worldwide)',
      'Delta Sky Club access when flying Delta',
      'TSA PreCheck / Global Entry credit ($120 every 4–4.5 years)',
      'Hotel elite status (Hilton Gold, Marriott Bonvoy Gold, Radisson Premium)',
      'Fine Hotels & Resorts program (room upgrades, breakfast, late checkout, $100 property credit)',
      'Saks Fifth Avenue credit ($100/yr)',
      'Equinox gym credit ($300/yr)',
      'CLEAR Plus credit ($189/yr)',
      'Uber cash ($200/yr, $15/mo Jan–Nov, $35 in Dec)',
      'Digital entertainment credit ($240/yr for Peacock, NYT, WSJ, Disney+, etc.)',
      'Walmart+ membership credit ($12.95/mo)',
      '$200 airline fee credit',
      'No foreign transaction fees',
      'Concierge service'
    ],
    annualCredits: [
      { label: '$200 airline fee credit', value: 200, notes: 'Select one airline; covers bag fees, seat upgrades' },
      { label: '$200 Uber cash', value: 200 },
      { label: '$240 digital entertainment credit', value: 240, notes: 'Peacock, NYT, Disney+, Hulu, etc.' },
      { label: '$100 Saks credit', value: 100, notes: '$50 semi-annually' },
      { label: '$300 Equinox credit', value: 300 },
      { label: '$189 CLEAR credit', value: 189 },
      { label: '$155 Walmart+ credit', value: 155, notes: '$12.95/mo' },
      { label: 'Fine Hotels & Resorts ($100 per stay)', value: 100, notes: 'Per stay value, not annual total' }
    ],
    ratings: { rewards: 3, perks: 5, afValue: 3.5, approval: 2.5, overall: 4 },
    bestFor: [
      'Frequent travelers who visit 8+ airport lounges per year',
      'People who stay at upscale hotels (Hilton, Marriott) regularly',
      'Urban professionals who can use Equinox, Saks, and dining credits'
    ],
    skipIf: 'You can\'t or won\'t use 3+ annual credits. The $695 AF is brutal unless you methodically redeem $1,000+ in credits. If you fly 2–4 times per year, the Chase Sapphire Reserve or Venture X is a better deal.',
    creditScoreNeeded: 'Excellent (740+)',
    issuerRules: 'Welcome bonus once per lifetime. 1/5 rule for credit cards (max 1 new Amex CC per 5 days). Amex may claw back bonuses if you close within 12 months.',
    faqs: [
      { q: 'Is the Amex Platinum worth the $695 annual fee?', a: 'Only if you use the credits. The $1,484+ in annual credits can offset the fee, but many are fragmented ($15/mo Uber, $20/mo digital, etc.) and require active redemption. If you fly 8+ times/year and use Centurion lounges + hotel benefits, it\'s excellent. If not, the math doesn\'t work.' },
      { q: 'What\'s the real value of Amex Platinum credits?', a: 'Face value is ~$1,484/yr, but real value depends on your lifestyle. Uber credits expire monthly, digital credits require specific subscriptions, and the Saks credit is semi-annual. Most cardholders realistically use $700–$900 of credits, making the effective AF $0–$200.' },
      { q: 'How do Centurion Lounges compare to Priority Pass?', a: 'Centurion Lounges are significantly better — full hot buffets, craft cocktails, spa services. But they\'re only in ~15 U.S. airports. Priority Pass has 1,400+ locations globally but most are basic. Having both is the power move.' },
      { q: 'Amex Platinum vs Chase Sapphire Reserve?', a: 'Platinum has better lounges (Centurion) and more credits ($1,484 vs $450). Reserve has better earning rates (3–10x vs 1x on most purchases), is $145 less expensive, and has stronger travel insurance. Platinum is a lifestyle card; Reserve is a rewards card.' },
      { q: 'Are Membership Rewards points from the Platinum worth it?', a: 'The earning rates are unremarkable (5x flights, 1x everything else). The value comes from transfer partners: Aeroplan, ANA, Avianca, Delta, and hotel programs can yield 2–4¢/point. If you don\'t transfer, stick to the portal (1¢/point baseline).' },
      { q: 'Can I downgrade the Amex Platinum?', a: 'You can\'t product-change from a charge card to a credit card in Amex\'s system. You\'d need to close the Platinum and apply separately. Consider the Amex Gold ($325) if you want to stay in the ecosystem at lower cost.' }
    ],
    alternatives: ['chase-sapphire-reserve', 'capital-one-venture-x', 'amex-gold'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'bilt-mastercard',
    name: 'Bilt Mastercard®',
    issuer: 'Wells Fargo (issued by Evolve Bank)',
    annualFee: 0,
    introAPR: 'No intro APR on purchases',
    regularAPR: '20.49% – 29.49% Variable',
    signupBonus: 'Earn 2x points on rent payments for the first 12 months (no cap)',
    rewards: [
      { category: 'Rent payments', rate: '1x', type: 'points' },
      { category: 'Dining', rate: '3x', type: 'points' },
      { category: 'Travel', rate: '2x', type: 'points' },
      { category: 'Everything else', rate: '1x', type: 'points' }
    ],
    pointsValue: 0.014,
    perks: [
      'No credit check needed to start with BiltRent (optional debit feature)',
      'Rent payments on the 1st of each month with no transaction fee',
      'Up to $50,000/year in rent payments earn points',
      'No foreign transaction fees',
      'Bilt Bonus Day: 2x–5x points on the 1st of each month (rotating categories)',
      'Free credit score monitoring',
      'Neighborhood Perks: exclusive restaurant and fitness discounts',
      'Points transfer to 10+ airline and hotel partners (including Hyatt, United, American)',
      'BiltProtect: automatic debit from checking if you miss a payment'
    ],
    annualCredits: [],
    ratings: { rewards: 4, perks: 4.5, afValue: 5, approval: 4, overall: 4.3 },
    bestFor: [
      'Renters who pay $1,000+/month in rent — finally earn rewards on your biggest expense',
      'People who want a no-annual-fee card with real travel transfer partners',
      'Diners who eat out regularly (3x on dining with no AF)'
    ],
    skipIf: 'You don\'t pay rent (homeowners don\'t benefit from the core feature). If your landlord doesn\'t accept Bilt, the card is just a decent no-AF dining/travel card.',
    creditScoreNeeded: 'Good (670+)',
    issuerRules: 'No firm issuer rules like 5/24. Must have a qualifying rent payment address to unlock full benefits. Bilt also offers a debit-based rent payment option with no credit check.',
    faqs: [
      { q: 'How does the Bilt Mastercard earn points on rent?', a: 'You link your rent payment in the Bilt app. Bilt sends a check or ACH to your landlord on your behalf, and you earn 1x point per dollar of rent. You pay Bilt back from your linked bank account. No transaction fees, no landlord involvement needed.' },
      { q: 'Is the Bilt Mastercard really free with no annual fee?', a: 'Yes — $0 annual fee, no foreign transaction fees. Bilt makes money from interchange fees and their rewards marketplace. The catch: you must use the card for 5 transactions per statement period (Rent Day counts) to earn rent points.' },
      { q: 'How much are Bilt points worth?', a: '1¢ each for cash back or statement credit, ~1.4¢ through travel partners. Transfer partners include Hyatt, United, American Airlines, and others. The Hyatt transfer is particularly valuable — Bilt to Hyatt points can be worth 1.5–2¢ each.' },
      { q: 'What happens if my landlord doesn\'t accept Bilt?', a: 'Bilt sends a physical check or ACH transfer — no landlord signup required. They even include a pre-filled check template. In practice, 95%+ of landlords can receive Bilt payments without any effort on their part.' },
      { q: 'Does Bilt have a catch?', a: 'The main catch is the 5-transaction requirement per billing cycle to earn rent points. The card also has limited dining/travel bonuses compared to dedicated category cards. And you need to pay your rent through Bilt\'s system rather than just swiping the card.' },
      { q: 'Can I use the Bilt Mastercard for regular purchases?', a: 'Absolutely. Beyond rent (1x), it earns 3x on dining, 2x on travel, and 1x on everything else. That\'s competitive with many $95+ annual fee cards, especially for dining-heavy spenders.' }
    ],
    alternatives: ['chase-sapphire-preferred', 'amex-gold', 'capital-one-savorone'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'capital-one-savorone',
    name: 'Capital One SavorOne Cash Rewards Credit Card',
    issuer: 'Capital One',
    annualFee: 0,
    introAPR: '0% for 15 months on purchases and balance transfers',
    regularAPR: '19.99% – 29.99% Variable',
    signupBonus: '$200 cash back after $500 spend in 3 months',
    rewards: [
      { category: 'Dining', rate: '3%', type: 'cash back' },
      { category: 'Groceries', rate: '3%', type: 'cash back' },
      { category: 'Streaming services', rate: '3%', type: 'cash back' },
      { category: 'Entertainment', rate: '8%', type: 'cash back' },
      { category: 'Hotels & rental cars (Capital One Travel)', rate: '5%', type: 'cash back' },
      { category: 'Everything else', rate: '1%', type: 'cash back' }
    ],
    pointsValue: 0.01,
    perks: [
      'No annual fee, no foreign transaction fees',
      '0% intro APR for 15 months on purchases and balance transfers',
      '80,000 bonus Capital One miles when transferred from Venture/Venture X card',
      'Capital One Entertainment access (concert presales, events)',
      'Extended warranty on eligible purchases',
      '24-hour travel assistance',
      'No rotating categories — earn unlimited cash back'
    ],
    annualCredits: [],
    ratings: { rewards: 4.5, perks: 3, afValue: 5, approval: 4, overall: 4.3 },
    bestFor: [
      'Dining and grocery heavy spenders who want simple cash back',
      'People who want a 0% intro APR for 15 months',
      'Anyone who hates annual fees and rotating category tracking'
    ],
    skipIf: 'You travel internationally enough to justify a $95–$395 card with transfer partners and lounge access. The SavorOne\'s 5% travel booking rate only applies through Capital One Travel portal.',
    creditScoreNeeded: 'Good (670+)',
    issuerRules: 'Capital One typically limits personal cards to 2 per customer. Pre-qualification is available with a soft pull. Hard pull only if you apply.',
    faqs: [
      { q: 'Is the SavorOne really no annual fee?', a: 'Yes, truly $0 annual fee forever. No foreign transaction fees either. Capital One makes money on interchange and interest from people who carry balances — but if you pay in full, it\'s completely free.' },
      { q: 'How does the SavorOne compare to the Amex Gold for dining?', a: 'SavorOne gives 3% cash back on dining (no AF). Amex Gold gives 4x points on dining ($325 AF). If you value Amex points at 1.5¢ each, Gold earns 6% equivalent on dining — but you need to transfer points and pay $325/yr. SavorOne is the better pure cash back play for casual diners.' },
      { q: 'Is the 8% entertainment category real?', a: 'Yes, but it\'s limited to specific purchases: concert tickets through Capital One Entertainment, streaming services, and live events. You won\'t get 8% at Ticketmaster or StubHub — only Capital One\'s own ticketing platform. Still, 3% on dining and groceries is where most of your value comes from.' },
      { q: 'What\'s the intro APR deal?', a: '0% for 15 months on both purchases and balance transfers (3% BT fee). This makes the SavorOne one of the best no-AF cards for financing a large purchase or consolidating debt interest-free for over a year.' },
      { q: 'Can I combine SavorOne with a Venture X?', a: 'Yes — and this is where it gets powerful. You can transfer SavorOne cash back as miles to a Venture X card (at a 1:1 ratio), effectively getting 3x–8x miles on dining, groceries, and entertainment that redeem at 1¢–2¢+ each.' },
      { q: 'Is the SavorOne hard to get approved for?', a: 'Moderate. Capital One pre-qualifies with a soft pull, so check before applying. You\'ll typically need a 670+ FICO. They\'re more lenient than Chase but stricter than Discover.' }
    ],
    alternatives: ['amex-gold', 'bilt-mastercard', 'chase-sapphire-preferred'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'citi-double-cash',
    name: 'Citi® Double Cash Card',
    issuer: 'Citibank',
    annualFee: 0,
    introAPR: '0% for 18 months on balance transfers',
    regularAPR: '18.99% – 28.99% Variable',
    signupBonus: 'No signup bonus — earns 2% on everything from day one',
    rewards: [
      { category: 'All purchases (1% when you buy + 1% when you pay)', rate: '2%', type: 'cash back' },
      { category: 'Balance transfers during intro period', rate: '0%', type: 'intro APR' }
    ],
    pointsValue: 0.01,
    perks: [
      'No annual fee',
      'No category tracking required — flat 2% everywhere',
      '0% intro APR for 18 months on balance transfers (3% BT fee, then regular APR)',
      'No foreign transaction fees',
      'Citi Entertainment access',
      'Flexible redemption: statement credit, direct deposit, or check',
      'Can convert ThankYou Points when paired with Citi Premier® or Citi Prestige®',
      'Virtual account numbers for online shopping security'
    ],
    annualCredits: [],
    ratings: { rewards: 3.5, perks: 2.5, afValue: 5, approval: 4, overall: 3.8 },
    bestFor: [
      'People who want a simple set-it-and-forget-it card',
      'Complementary card to max out non-bonus-category spend',
      'Balance transfer seekers (18 months 0% APR)'
    ],
    skipIf: 'You already have a 2%+ flat-rate card or rarely use credit. Without a signup bonus, the Double Cash is a slow earner if you have cards that pay 3–5% on your top categories.',
    creditScoreNeeded: 'Good (670+)',
    issuerRules: 'Citi typically limits credit card applications to 1 per 8 days, 2 per 65 days, 1 per 180 days for the same card. No lifetime language on the card itself.',
    faqs: [
      { q: 'How does the Citi Double Cash 2% actually work?', a: 'You earn 1% when you make a purchase, and another 1% when you pay it off. The "pay" half means you must pay your balance to get the full 2%. This effectively penalizes people who only make minimum payments — you\'d only earn 1%.' },
      { q: 'Is the Citi Double Cash better than a flat 2% card?', a: 'Effectively the same if you pay in full. The "1% + 1%" structure is a wash for full payers. Where Double Cash wins is the 18-month 0% BT offer, making it the top balance transfer card. Where it loses: many 2% cards (like Wells Fargo Active Cash) offer a signup bonus that Double Cash doesn\'t.' },
      { q: 'Can I transfer Citi Double Cash rewards to travel partners?', a: 'Only if you also have a Citi Premier ($95 AF) or Citi Prestige. Then your Double Cash earnings convert to ThankYou Points (at 1¢ per point) and can transfer to 15+ airline and hotel partners. Without a premium Citi card, it\'s pure cash back only.' },
      { q: 'What\'s the balance transfer deal?', a: '0% APR for 18 months on balance transfers with a 3% fee (min $5). After the intro period, the regular APR kicks in (18.99%–28.99%). This is one of the longest 0% BT offers available, making it excellent for debt consolidation.' },
      { q: 'How does the Double Cash compare to the Wells Fargo Active Cash?', a: 'Active Cash gives a $200 signup bonus and the same flat 2% — it\'s generally better for new cardholders. Double Cash has the edge for balance transfers (18 months vs 12 months intro) and the Citi ecosystem pairing with Premier/Prestige.' },
      { q: 'Should I get the Double Cash if I already have a Chase Sapphire Preferred?', a: 'Yes, as a complement. Use Sapphire Preferred for travel (5x) and dining (3x), and Double Cash for everything else (groceries, Amazon, utilities, etc.) at 2%. This two-card strategy covers 95% of spending at 2%+ rates.' }
    ],
    alternatives: ['chase-sapphire-preferred', 'capital-one-savorone', 'wells-fargo-active-cash'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  // ============================================================
  // Sprint 12 cards (2026-04-30)
  // ============================================================
  {
    slug: 'amex-blue-cash-preferred',
    name: 'Blue Cash Preferred® Card from American Express',
    issuer: 'American Express',
    annualFee: 95,
    introAPR: '0% for 12 months on purchases, then variable',
    regularAPR: '20.49% – 29.49% Variable',
    signupBonus: '$250 statement credit after $3,000 spend in 6 months',
    rewards: [
      { category: 'U.S. supermarkets (up to $6K/yr)', rate: '6%', type: 'cash back' },
      { category: 'U.S. streaming subscriptions', rate: '6%', type: 'cash back' },
      { category: 'U.S. gas stations (up to $6K/yr)', rate: '3%', type: 'cash back' },
      { category: 'U.S. transit', rate: '3%', type: 'cash back' },
      { category: 'Non-U.S. supermarkets', rate: '1%', type: 'cash back' },
      { category: 'Everything else', rate: '1%', type: 'cash back' }
    ],
    pointsValue: 0.01,
    perks: [
      '6% cash back at U.S. supermarkets (up to $6,000/year, then 1%)',
      '6% cash back on U.S. streaming subscriptions',
      '3% cash back on U.S. gas stations (up to $6,000/year gas + transit combined)',
      '3% cash back on U.S. transit (tolls, rideshare, parking, buses, trains)',
      'No foreign transaction fees',
      'Amex Offers: targeted deals at popular retailers',
      'Return protection (90 days, up to $300/item)',
      'Purchase protection (90 days, up to $10K/occurrence)'
    ],
    annualCredits: [],
    ratings: { rewards: 4.5, perks: 3, afValue: 4.5, approval: 3.5, overall: 4.3 },
    bestFor: [
      'Families spending $400+/month at U.S. supermarkets',
      'People with significant streaming subscription costs',
      'Commuters who spend on gas and transit'
    ],
    skipIf: 'You spend less than $150/month at supermarkets. The $95 annual fee means you need decent grocery volume to come out ahead. Also skip if you mostly shop at Walmart, Target, or Costco — they don\'t code as supermarkets.',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: 'Welcome bonus once per lifetime. Amex 1/5 rule: max 1 new Amex credit card per 5 rolling days.',
    faqs: [
      { q: 'Is the Amex Blue Cash Preferred worth the $95 annual fee?', a: 'If you spend $400+/month at U.S. supermarkets, yes. At $400/mo, you earn $288/year in grocery cash back alone (6% on $4,800). Subtract the $95 AF and you\'re netting $193. Add gas/transit/streaming rewards and you\'re well into positive territory. Below $150/mo in groceries, the math flips — consider the no-AF Blue Cash Everyday instead.' },
      { q: 'What counts as a "U.S. supermarket" for the 6%?', a: 'Standalone grocery stores like Kroger, Safeway, Publix, Whole Foods, and Trader Joe\'s. Superstores like Walmart, Target, Costco, and Sam\'s Club do NOT count. The $6,000 annual cap applies to the grocery category; after that, groceries earn 1%.' },
      { q: 'How does the streaming 6% cash back work?', a: 'You earn 6% on eligible U.S. streaming subscriptions: Netflix, Hulu, Spotify, Disney+, Amazon Prime, Apple TV+, and more. There\'s no annual cap on streaming. This alone can net $50–$100/year if you have 3–5 subscriptions.' },
      { q: 'Is the Blue Cash Preferred better than the Amex Gold for groceries?', a: 'BCP gives straight 6% cash back on up to $6K/yr. Gold gives 4x points on up to $25K/yr. If you value Amex points at 1.5¢ each, Gold gives an effective 6% but only if you transfer points to partners. For pure cash back in your pocket? BCP wins. For travel rewards? Gold wins.' },
      { q: 'What happens after the $6,000 grocery cap?', a: 'Grocery spend above $6,000/year drops from 6% to 1%. If you spend more than $500/month on groceries, track your spend — beyond $6K, consider switching to a card like the Citi Custom Cash for the overage.' },
      { q: 'Does the Blue Cash Preferred have foreign transaction fees?', a: 'No — Amex removed the foreign transaction fee on BCP. You can use it abroad for groceries and earn 1% (international supermarkets won\'t code as U.S. supermarkets for the 6% rate).' }
    ],
    alternatives: ['amex-blue-cash-everyday', 'amex-gold', 'citi-custom-cash'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'chase-freedom-flex',
    name: 'Chase Freedom Flex℠ Credit Card',
    issuer: 'Chase',
    annualFee: 0,
    introAPR: '0% for 15 months on purchases and balance transfers',
    regularAPR: '20.49% – 29.24% Variable',
    signupBonus: '$200 cash back after $500 spend in 3 months, plus 5% on up to $1,500 in combined purchases each quarter (activation required)',
    rewards: [
      { category: 'Rotating categories (quarterly)', rate: '5%', type: 'cash back', note: 'Up to $1,500/quarter combined' },
      { category: 'Dining', rate: '3%', type: 'cash back' },
      { category: 'Drugstores', rate: '3%', type: 'cash back' },
      { category: 'Everything else', rate: '1%', type: 'cash back' }
    ],
    pointsValue: 0.01,
    perks: [
      '5% on rotating quarterly categories (up to $1,500/quarter) — no activation reminders, just activate',
      '3% on dining and drugstores, always',
      'No annual fee, ever',
      '0% intro APR for 15 months on purchases and balance transfers',
      'Purchase protection (120 days, up to $500/claim)',
      'Extended warranty protection',
      'Cell phone protection (up to $800/claim, $50 deductible)',
      'No foreign transaction fees',
      'DoorDash DashPass (3 months free, then 50% off)'
    ],
    annualCredits: [
      { label: 'DashPass discount (3 months free)', value: 30, notes: 'Value varies by use' }
    ],
    ratings: { rewards: 4.5, perks: 4, afValue: 5, approval: 3.5, overall: 4.4 },
    bestFor: [
      'People who will activate quarterly 5% categories and maximize $1,500/quarter',
      'Diners and drugstore regulars who benefit from ongoing 3%',
      'Chase Ultimate Rewards ecosystem members pairing with Sapphire Preferred/Reserve'
    ],
    skipIf: 'You won\'t remember to activate the 5% categories each quarter (unactivated = 1% only). Also skip if you spend more than $500/month on dining and want 4x points (Amex Gold or Altitude Go are better for heavy dining).',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: '5/24 rule applies: Chase typically denies if you\'ve opened 5+ cards (any issuer) in the past 24 months. This is one of the strictest application rules in the industry.',
    faqs: [
      { q: 'How do the Chase Freedom Flex rotating categories work?', a: 'Each quarter, Chase announces new 5% categories (e.g., Q1: groceries and fitness; Q2: gas and Lyft; Q3: dining and PayPal; Q4: Amazon and Target). You must activate online or in the app each quarter. You earn 5% on up to $1,500 in combined purchases across the quarter\'s categories — that\'s up to $75 cash back per quarter, $300/year.' },
      { q: 'Is the Chase Freedom Flex better than the old Chase Freedom?', a: 'Yes. The Flex added 3% on dining and drugstores (ongoing, not rotating), cell phone protection, and no foreign transaction fees. The old Freedom only had 1% on non-rotating purchases. If you still have the old Freedom, call Chase and ask to product-change to the Flex — same account, better rewards.' },
      { q: 'Can I combine Freedom Flex with Chase Sapphire Preferred or Reserve?', a: 'Absolutely — and you should. Freedom Flex cash back converts to Chase Ultimate Rewards points (at 1¢ each) when you also hold a Sapphire card. This means your 5% and 3% earnings become 5x and 3x UR points, which you can transfer to Hyatt, United, Southwest, and 12+ other partners at 1.25–1.5¢ per point.' },
      { q: 'What are the 2026 rotating categories for Freedom Flex?', a: 'Chase typically announces categories each quarter. Recent patterns: Q1 (Jan–Mar) = groceries/drugstores; Q2 (Apr–Jun) = gas/Lyft; Q3 (Jul–Sep) = dining/streaming; Q4 (Oct–Dec) = Amazon/Target/PayPal. Always verify on Chase\'s website and activate on day one of each quarter.' },
      { q: 'Is the Freedom Flex worth it without activating categories?', a: 'Less so. Without 5% categories, you\'re getting 3% on dining and drugstores 1% on everything else. That\'s still decent for a no-AF card, but you\'re leaving $300/year on the table. Set a calendar reminder for quarterly activation.' },
      { q: 'How does the Freedom Flex compare to the Discover it Cash Back?', a: 'Both offer 5% rotating categories. Key differences: Flex has 3% ongoing on dining/drugstores (Discover has 1%), no foreign transaction fees (Discover is accepted in fewer places abroad), and pairs with Chase UR ecosystem. Discover has the Cashback Match (doubles all first-year earnings) making it better in year one. Flex is better long-term.' }
    ],
    alternatives: ['discover-it-cash-back', 'chase-sapphire-preferred', 'citi-custom-cash'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'amex-blue-cash-everyday',
    name: 'Blue Cash Everyday® Card from American Express',
    issuer: 'American Express',
    annualFee: 0,
    introAPR: '0% for 15 months on purchases',
    regularAPR: '20.49% – 29.49% Variable',
    signupBonus: '$200 statement credit after $2,000 spend in 6 months',
    rewards: [
      { category: 'U.S. supermarkets (up to $6K/yr)', rate: '3%', type: 'cash back' },
      { category: 'U.S. gas stations (up to $6K/yr)', rate: '3%', type: 'cash back' },
      { category: 'U.S. online retail (up to $6K/yr)', rate: '3%', type: 'cash back' },
      { category: 'Everything else', rate: '1%', type: 'cash back' }
    ],
    pointsValue: 0.01,
    perks: [
      '3% at U.S. supermarkets, gas stations, and online retail (each up to $6K/yr)',
      'No annual fee, ever',
      '0% intro APR for 15 months on purchases',
      '$200 statement credit after $2,000 spend in 6 months',
      'Amex Offers: personalized deals at popular retailers',
      'No foreign transaction fees',
      'Purchase protection (90 days, up to $1,000/occurrence)',
      'Return protection (90 days, up to $300/item)'
    ],
    annualCredits: [],
    ratings: { rewards: 4, perks: 3, afValue: 5, approval: 4, overall: 4 },
    bestFor: [
      'Grocery shoppers spending $200–$500/month at U.S. supermarkets',
      'People who want simple cash back with no annual fee',
      'Online shoppers who want 3% back on Amazon and other retail'
    ],
    skipIf: 'You spend $500+/month at U.S. supermarkets — step up to the Blue Cash Preferred for 6%. Also skip if you want travel transfer partners (BCE is cash-back only).',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: 'Welcome bonus once per lifetime. Amex 1/5 rule: max 1 new Amex credit card per 5 rolling days.',
    faqs: [
      { q: 'Is the Amex Blue Cash Everyday worth it?', a: 'If you spend $200–$500/month at U.S. supermarkets, yes. At $300/month, you\'d earn $108/year in grocery cash back alone. Add gas and online retail and you\'re looking at $200–$300+/year in total cash back with zero annual fee. It\'s the best no-AF grocery card if you don\'t want to track rotating categories.' },
      { q: 'What counts as "U.S. online retail" for the 3%?', a: 'Online purchases from U.S. retailers not classified as supermarkets, gas stations, or travel. This includes Amazon, Target.com, Walmart.com, and most online stores. The $6,000/year cap means you earn 3% on up to $500/month of online shopping.' },
      { q: 'Blue Cash Everyday vs Blue Cash Preferred — which is right?', a: 'BCP gives 6% on groceries for $95/year. BCE gives 3% on groceries for $0/year. Break-even: if you spend more than ~$160/month at U.S. supermarkets, BCP earns more after the fee. BCP also adds 6% streaming and 3% transit. If you\'re a light grocery spender or hate annual fees, BCE is the move.' },
      { q: 'Can I upgrade from Blue Cash Everyday to Blue Cash Preferred?', a: 'Yes. After having the BCE for 12+ months, you can request a product change to the BCP. You\'ll start earning 6% on groceries, but you\'ll also incur the $95 annual fee. Amex sometimes offers upgrade bonuses (e.g., $150 statement credit) — watch for those.' },
      { q: 'Does the $6,000 annual cap apply to each category separately?', a: 'Yes. The $6,000 cap is per category. You get $6K at supermarkets, $6K at gas stations, and $6K at online retail — each earning 3%. After each $6K cap, that category drops to 1%. For most people, the caps won\'t matter on gas and online retail, but heavy grocery spenders ($500+/mo) should track the supermarket cap.' },
      { q: 'How does the Blue Cash Everyday compare to the Citi Custom Cash?', a: 'BCE gives 3% on groceries capped at $6K/yr. Custom Cash gives 5% on your top category capped at $500/mo spending. Custom Cash earns more on groceries up to $500/mo ($25/mo vs $15/mo), but BCE gives 3% on gas AND online retail too. If groceries are your only big category, Custom Cash wins. If you want broader 3% coverage, BCE wins.' }
    ],
    alternatives: ['amex-blue-cash-preferred', 'citi-custom-cash', 'capital-one-savorone'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'citi-strata-premier',
    name: 'Citi Strata Premier℠ Card',
    issuer: 'Citibank',
    annualFee: 95,
    introAPR: 'No intro APR offer',
    regularAPR: '21.49% – 29.49% Variable',
    signupBonus: '60,000 ThankYou Points (worth ~$600 in travel) after $4,000 spend in 3 months',
    rewards: [
      { category: 'Air travel', rate: '3x', type: 'points' },
      { category: 'Hotels', rate: '3x', type: 'points' },
      { category: 'Restaurants', rate: '3x', type: 'points' },
      { category: 'Gas stations', rate: '3x', type: 'points' },
      { category: 'Groceries', rate: '3x', type: 'points', note: 'First 6 months only, then 1x' },
      { category: 'Ev charging', rate: '3x', type: 'points' },
      { category: 'Everything else', rate: '1x', type: 'points' }
    ],
    pointsValue: 0.0150,
    perks: [
      '3x on air travel, hotels, restaurants, gas, EV charging — no caps',
      '60,000 bonus points (worth ~$600 travel) after $4K spend',
      '$100 annual hotel credit (bookings through Citi Travel)',
      'No foreign transaction fees',
      'Priority Pass Select membership (1 free visit/year, $32/visit after)',
      'Trip cancellation/interruption protection (up to $5,000)',
      'Baggage delay protection ($100/day for 3+ days)',
      'Transfer partners: 15+ airlines and hotels including JetBlue, Virgin Atlantic, and Wyndham'
    ],
    annualCredits: [
      { label: '$100 annual hotel credit', value: 100, notes: 'Citi Travel bookings only' }
    ],
    ratings: { rewards: 4, perks: 3.5, afValue: 4, approval: 3, overall: 4 },
    bestFor: [
      'Mid-tier travelers who want 3x on travel and dining for $95/year',
      'People who don\'t qualify for or want to avoid the $395+ premium cards',
      'Citi ecosystem users pairing with Double Cash for a 2-card strategy'
    ],
    skipIf: 'You travel less than 2–3 times per year — the $95 AF won\'t pay off. Also skip if Chase 5/24 blocks you and you don\'t have existing Citi relationship. The Chase Sapphire Preferred offers better insurance at the same price.',
    creditScoreNeeded: 'Good to Excellent (680+)',
    issuerRules: 'Citi limits applications to 1 card per 8 days, 2 per 65 days. The Strata Premier specifically may deny applicants with recent Citi card openings.',
    faqs: [
      { q: 'Is the Citi Strata Premier worth the $95 annual fee?', a: 'If you spend $1,000+/month across travel, dining, and gas, yes. The 3x rate on those categories earns roughly $540/year in rewards on $1,500/mo spend. Subtract the $95 AF and net the $100 hotel credit, and you\'re at $545 net value. Without the hotel credit use, it\'s still $445 net — solid for a $95 card.' },
      { q: 'What are Citi ThankYou Points worth?', a: '1¢ each for cash back or statement credit. 1.5¢ each when redeemed for travel through Citi Travel. 1.5–2.5¢ each when transferred to partners like JetBlue, Virgin Atlantic, or Wyndham. The transfer partners aren\'t as strong as Chase or Amex, but they\'re workable for flexible travelers.' },
      { q: 'How does the Strata Premier compare to Chase Sapphire Preferred?', a: 'Both cost $95/year. CSP gives 5x on Chase Travel, 3x on dining/streaming/online groceries, and stronger travel insurance (primary rental car coverage, trip delay). Strata gives 3x on a broader set of categories (air, hotels, gas, restaurants, EV charging) but weaker insurance and transfer partners. CSP wins on ecosystem and insurance; Strata wins on breadth of 3x categories.' },
      { q: 'What is the $100 annual hotel credit?', a: 'Each card anniversary year, you get a $100 statement credit for hotel bookings through Citi Travel (partnered with Booking.com). Book a $100+ hotel stay and the credit covers it. If you stay in hotels at least once a year, this effectively reduces the annual fee to $0 or less.' },
      { q: 'Is the Priority Pass membership useful?', a: 'Marginally. You get 1 free lounge visit per year (cardholder only), then $32 per visit. Compared to the Venture X\'s unlimited visits with 2 guests, this is a teaser. Don\'t factor it heavily into your decision.' },
      { q: 'Can I combine Strata Premier with the Citi Double Cash?', a: 'Yes — and it\'s a great pairing. Use Strata for travel/dining/gas (3x) and Double Cash for everything else (2%). Plus, having both cards lets you convert Double Cash earnings into ThankYou Points for travel transfers, unlocking 1.5–2+¢ per point redemption.' }
    ],
    alternatives: ['chase-sapphire-preferred', 'capital-one-venture-x', 'citi-double-cash'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'wells-fargo-active-cash',
    name: 'Wells Fargo Active Cash® Card',
    issuer: 'Wells Fargo',
    annualFee: 0,
    introAPR: '0% for 15 months on purchases and balance transfers',
    regularAPR: '20.49% – 28.99% Variable',
    signupBonus: '$200 cash rewards after $1,000 spend in 3 months',
    rewards: [
      { category: 'All purchases', rate: '2%', type: 'cash back' }
    ],
    pointsValue: 0.02,
    perks: [
      '2% cash rewards on every purchase — no categories, no caps, no tracking',
      '$200 signup bonus after $1,000 spend in 3 months',
      'No annual fee',
      '0% intro APR for 15 months on purchases and balance transfers (3% BT fee)',
      'Cell phone protection (up to $600/claim, $25 deductible)',
      'No foreign transaction fees',
      'Visa Signature benefits (concierge, lost luggage, travel accident insurance)',
      'Up to $600 in cell phone protection when you pay your bill with the card'
    ],
    annualCredits: [],
    ratings: { rewards: 3.5, perks: 3, afValue: 5, approval: 4, overall: 3.9 },
    bestFor: [
      'People who want 2% cash back everywhere with zero effort',
      'Balance transfer seekers wanting 15 months at 0%',
      'Anyone who hates rotating categories and annual fees'
    ],
    skipIf: 'You want maximum rewards on specific categories — a 5% grocery or 4% dining card will out-earn this on those purchases. Also skip if you have the Citi Double Cash (nearly identical card) and don\'t need another.',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: 'Wells Fargo may deny applicants who have recently opened another Wells Fargo card. They tend to be more flexible than Chase but less flexible than Capital One.',
    faqs: [
      { q: 'Is the Wells Fargo Active Cash better than the Citi Double Cash?', a: 'Nearly identical for rewards — both give 2% on everything. Active Cash has a $200 signup bonus (Double Cash has none) and 15 months 0% on purchases AND balance transfers (Double Cash is 18 months on BTs only, no purchase intro). Active Cash also includes cell phone protection. Long-term, they\'re equivalent. Short-term, Active Cash wins with the bonus.' },
      { q: 'How does the 2% cash back work?', a: 'Simple: every purchase earns 2% back as cash rewards. No categories, no caps, no activation needed. You can redeem as a statement credit, direct deposit to a Wells Fargo account, or check. No minimum redemption threshold for statement credit.' },
      { q: 'Should I get the Active Cash or the Wells Fargo Autograph?', a: 'Both are no-AF cards from Wells Fargo. Active Cash gives flat 2% everywhere. Autograph gives 3x on dining, gas, transit, streaming, phone plans, and travel — but 1x on everything else. If you spend disproportionately on those 5 categories, Autograph wins. If your spend is spread out, Active Cash is simpler and often better.' },
      { q: 'Is the cell phone protection good?', a: 'It covers damage and theft up to $600/claim with a $25 deductible (max $1,200/year). You must pay your cell phone bill with the card. At typical carrier insurance rates of $10–$15/month, this saves you $120–$180/year. Just make sure you set your phone bill to autopay on the Active Cash.' },
      { q: 'Can I upgrade to the Wells Fargo Autograph later?', a: 'Yes, after 12+ months of good payment history, you can product-change to the Autograph or other Wells Fargo cards. You won\'t get the Autograph\'s signup bonus on a product change, though — that\'s only for new applications.' },
      { q: 'Is the Wells Fargo Active Cash hard to get approved for?', a: 'Moderate. Wells Fargo usually wants a 670+ FICO score. They look at income and recent inquiries. The pre-qualification tool on their website uses a soft pull, so check there first. Approval is generally easier than Chase but slightly harder than Capital One.' }
    ],
    alternatives: ['citi-double-cash', 'wells-fargo-autograph', 'capital-one-quicksilver'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  // ============================================================
  // Sprint 11 cards (2026-04-30)
  // ============================================================
  {
    slug: 'wells-fargo-autograph',
    name: 'Wells Fargo Autograph℠ Card',
    issuer: 'Wells Fargo',
    annualFee: 0,
    introAPR: '0% for 12 months on purchases',
    regularAPR: '20.49% – 28.49% Variable',
    signupBonus: '20,000 points (worth ~$330 in travel) after $1,000 spend in 3 months',
    rewards: [
      { category: 'Dining', rate: '3x', type: 'points' },
      { category: 'Gas & transit', rate: '3x', type: 'points' },
      { category: 'Travel', rate: '3x', type: 'points' },
      { category: 'Streaming', rate: '3x', type: 'points' },
      { category: 'Phone plans', rate: '3x', type: 'points' },
      { category: 'Everything else', rate: '1x', type: 'points' }
    ],
    pointsValue: 0.0165,
    perks: [
      '3x points on 5 popular categories: dining, gas/transit, travel, streaming, phone plans',
      'No annual fee',
      'No foreign transaction fees',
      'Cell phone protection (up to $600/claim, $1,200/yr)',
      '20,000 bonus points after $1,000 spend (worth ~$330 in travel)',
      'Transfer partners: 11 airlines & hotels (including Avianca, Icelandair, Choice)'
    ],
    annualCredits: [],
    ratings: { rewards: 4, perks: 3, afValue: 5, approval: 3.5, overall: 4 },
    bestFor: [
      'People who want 3x on 5 categories with no annual fee',
      'Commuters who spend on gas and transit',
      'Cardholders who value cell phone protection'
    ],
    skipIf: 'You want maximum grocery rewards (no grocery bonus) or you prefer pure cash back over points transfers.',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: 'Wells Fargo tends to be more flexible than Chase on applications. They may deny if you have a recent Wells Fargo card opening within the last 6 months.',
    faqs: [
      { q: 'Is the Wells Fargo Autograph worth it?', a: 'Yes — if you spend on dining, gas, transit, streaming, or phone plans. The 3x rate across 5 categories with no annual fee is one of the best no-fee setups available. The signup bonus ($330 value) is solid for a $0 AF card.' },
      { q: 'What are Wells Fargo points worth?', a: 'Wells Fargo Go Far Rewards points are worth ~1.65¢ each when redeemed for travel through their portal, or 1¢ for cash back. With 11 transfer partners, you can potentially get 1.5–2¢+ per point on airline transfers, though the partner list isn\'t as deep as Chase or Amex.' },
      { q: 'How does the Autograph compare to the Chase Freedom Flex?', a: 'Autograph gives consistent 3x on 5 categories with no activation needed. Freedom Flex gives 5% on rotating categories (up to $1,500/quarter) which can be more lucrative if you track the calendar, plus 3% on dining and drugstores. Autograph is set-and-forget; Freedom Flex is for people who like to optimize.' },
      { q: 'Does the Autograph count gas and transit separately?', a: 'No — gas stations and transit (rideshare, buses, trains, parking, tolls) are combined into one "gas & transit" category. That means your Uber rides and gas fill-ups both earn 3x.' },
      { q: 'Is the cell phone protection good?', a: 'It covers damage and theft up to $600 per claim ($1,200/year max, $25 deductible). You need to pay your monthly phone bill with the card to be eligible. This alone can save you $10-15/mo if you\'re paying for phone insurance through your carrier.' },
      { q: 'Can I downgrade or upgrade later?', a: 'You can product-change to other Wells Fargo cards (like the Active Cash for a flat 2% setup). There\'s no penalty for upgrading/downgrading, but the Autograph is one of the best no-AF cards they offer.' }
    ],
    alternatives: ['chase-sapphire-preferred', 'capital-one-savorone', 'citi-double-cash'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'us-bank-altitude-go',
    name: 'US Bank Altitude® Go Visa Signature Card',
    issuer: 'US Bank',
    annualFee: 0,
    introAPR: '0% for 12 billing cycles on purchases and balance transfers',
    regularAPR: '19.49% – 28.49% Variable',
    signupBonus: '20,000 bonus points (worth ~$200) after $1,000 spend in 90 days',
    rewards: [
      { category: 'Dining', rate: '4x', type: 'points' },
      { category: 'Groceries', rate: '2x', type: 'points' },
      { category: 'Gas & EV charging', rate: '2x', type: 'points' },
      { category: 'Streaming', rate: '2x', type: 'points' },
      { category: 'Travel', rate: '2x', type: 'points' },
      { category: 'Everything else', rate: '1x', type: 'points' }
    ],
    pointsValue: 0.01,
    perks: [
      '4x points on dining — the highest no-annual-fee dining rate available',
      '2x on groceries, gas, streaming, and travel',
      'No annual fee',
      '0% intro APR for 12 billing cycles on purchases and balance transfers',
      '$30 annual streaming credit (reimbursed for 6+ streaming services)',
      'No foreign transaction fees'
    ],
    annualCredits: [
      { label: '$30 annual streaming credit', value: 30, notes: 'For qualified streaming subscriptions' }
    ],
    ratings: { rewards: 4.5, perks: 3.5, afValue: 5, approval: 3, overall: 4.2 },
    bestFor: [
      'Heavy diners who want the best no-AF dining rate',
      'People who value a 0% intro APR alongside rewards',
      'Streaming subscribers who\'ll use the $30 annual credit'
    ],
    skipIf: 'You want transfer partners for maximum point value (Altitude Go points are cash-back only). If you have the Amex Gold and actually use its credits, the Go is a step down.',
    creditScoreNeeded: 'Good to Excellent (680+)',
    issuerRules: 'US Bank is known for being inquiry-sensitive. They may deny applicants with 3+ recent hard inquiries. Pre-qualification is recommended before applying.',
    faqs: [
      { q: 'Is the US Bank Altitude Go worth it?', a: 'If you spend $400+/month on dining, yes. The 4x rate on dining is the best no-annual-fee rate available, and the 2x on groceries/gas/streaming/travel rounds out a solid everyday card. The $30 streaming credit and 0% intro APR are cherries on top.' },
      { q: 'What are Altitude Go points worth?', a: '1¢ each for cash back (statement credit, direct deposit). Unlike the Altitude Reserve, Go points cannot be transferred to travel partners. This makes the Go a pure cash-back card dressed up as a points card.' },
      { q: 'How does the Altitude Go compare to the Capital One SavorOne?', a: 'SavorOne offers 3% on dining and 3% on groceries (vs 4% and 2%). SavorOne wins on groceries, Go wins on dining. SavorOne has 8% on Capital One Entertainment. Go has the $30 streaming credit. Both are no-AF — pick based on whether you spend more on dining (Go) or groceries (SavorOne).' },
      { q: 'What is the $30 streaming credit?', a: 'US Bank gives you a $30 annual credit for streaming subscriptions (Netflix, Hulu, Spotify, etc.) charged to the card. It\'s reimbursed as a statement credit. If you subscribe to any 2-3 streaming services, you\'ll easily max this out.' },
      { q: 'Is the US Bank Altitude Go hard to get approved for?', a: 'US Bank is pickier than Capital One but less strict than Chase. They look at recent inquiries and may deny you if you\'ve opened 3+ cards in the past 6 months. Pre-qualify on their website first for a soft-pull check.' },
      { q: 'Can I upgrade to the Altitude Reserve later?', a: 'You can product-change from Go to Reserve (subject to approval). The Reserve has a $400 annual fee but gives 4.5x on travel and mobile wallet purchases plus Priority Pass. Only worth it if you travel heavily.' }
    ],
    alternatives: ['capital-one-savorone', 'amex-gold', 'wells-fargo-autograph'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'citi-custom-cash',
    name: 'Citi Custom Cash® Card',
    issuer: 'Citibank',
    annualFee: 0,
    introAPR: '0% for 15 months on purchases',
    regularAPR: '19.49% – 29.49% Variable',
    signupBonus: '$200 cash back after $1,500 spend in 6 months',
    rewards: [
      { category: 'Top spending category', rate: '5%', type: 'cash back', note: 'Automatic — up to $500/month' },
      { category: 'Everything else', rate: '1%', type: 'cash back' }
    ],
    pointsValue: 0.01,
    perks: [
      '5% cash back on your top eligible spend category each month (up to $500, then 1%)',
      'Auto-detects your top category — no activation or tracking required',
      'No annual fee',
      '0% intro APR for 15 months on purchases',
      '$200 cash back after spending $1,500 in the first year',
      'No foreign transaction fees'
    ],
    annualCredits: [],
    ratings: { rewards: 5, perks: 2.5, afValue: 5, approval: 3.5, overall: 4.3 },
    bestFor: [
      'People with one dominant spending category that changes month to month',
      'Diners in months you eat out a lot, then grocery spenders when you\'re stocking up',
      'Anyone who hates rotating category tracking but wants 5% back'
    ],
    skipIf: 'Your spending is spread evenly across 3+ categories — you\'ll only get 5% on one, and 1% on the rest. Also skip if you want a card with strong perks beyond rewards.',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: 'Citi limits applications to 1 card per 8 days, 2 per 65 days. The Custom Cash specifically has no lifetime language on the bonus, but Citi will deny you if you\'ve opened too many cards recently.',
    faqs: [
      { q: 'How does the Citi Custom Cash 5% category work?', a: 'Each billing cycle, Citi automatically identifies your top eligible spending category and gives you 5% back on up to $500 in that category. No activation, no sign-ups. If you spend $600 on dining in a month, you earn 5% on $500 ($25) and 1% on the remaining $100 ($1).' },
      { q: 'What categories qualify for the 5%?', a: 'Qualifying categories include: restaurants, supermarkets, gas stations, drugstores, fitness clubs, home improvement stores, online purchases, travel, and more. The card automatically picks whichever category you spent the most in each billing cycle.' },
      { q: 'Is the Custom Cash better than the Freedom Flex?', a: 'Depends. Custom Cash gives a guaranteed 5% on your top category every month with no effort. Freedom Flex gives 5% on rotating categories (which you have to activate) plus 3% on dining and drugstores. If you like set-it-and-forget-it, go Custom Cash. If you track rotating categories and want 3% ongoing on dining, go Freedom Flex.' },
      { q: 'Can I have both Citi Custom Cash and Citi Double Cash?', a: 'Yes, and it\'s a great combo. Use Custom Cash for your top monthly category (5%) and Double Cash for everything else (2%). Together, they cover your spending at 2-5% with no annual fees on either card.' },
      { q: 'What happens if I spend less than $500 in my top category?', a: 'You simply earn 5% on whatever you spend, up to $500. There\'s no minimum spend requirement for the 5% category. If your top category is $200, you earn 5% on $200 and 1% on everything else.' },
      { q: 'Is the $200 signup bonus easy to get?', a: 'Relatively easy — $1,500 spend over 6 months works out to just $125/month. That\'s achievable with normal everyday spending. The 0% intro APR for 15 months also helps if you need to float a large purchase.' }
    ],
    alternatives: ['chase-freedom-flex', 'citi-double-cash', 'amex-blue-cash-everyday'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'capital-one-quicksilver',
    name: 'Capital One Quicksilver Cash Rewards Credit Card',
    issuer: 'Capital One',
    annualFee: 0,
    introAPR: '0% for 15 months on purchases and balance transfers',
    regularAPR: '19.99% – 29.99% Variable',
    signupBonus: '$200 cash back after $500 spend in 3 months',
    rewards: [
      { category: 'All purchases', rate: '1.5%', type: 'cash back' }
    ],
    pointsValue: 0.015,
    perks: [
      '1.5% cash back on every purchase — no categories, no limits',
      '$200 signup bonus after $500 spend in 3 months',
      'No annual fee',
      '0% intro APR for 15 months on purchases and balance transfers',
      'No foreign transaction fees',
      'Uber Cash 10% back on Uber rides and Uber Eats through 11/14/2026'
    ],
    annualCredits: [],
    ratings: { rewards: 3.5, perks: 3, afValue: 5, approval: 4.5, overall: 3.8 },
    bestFor: [
      'People who want zero-hassle cash back with no annual fee',
      'Balance transfer seekers who want 15 months at 0%',
      'Anyone rebuilding credit — Capital One is more forgiving on approvals'
    ],
    skipIf: 'You want category bonuses. If you spend heavily on dining, groceries, or travel, a category card like the SavorOne or Custom Cash will earn you significantly more.',
    creditScoreNeeded: 'Fair to Excellent (580+)',
    issuerRules: 'Capital One is one of the most approval-friendly issuers. They pre-qualify with a soft pull and can approve people with fair credit. They typically allow 1-2 personal cards at a time.',
    faqs: [
      { q: 'Is the Capital One Quicksilver worth it?', a: 'As a flat-rate cash-back card, yes. The 1.5% on everything with no annual fee and no category tracking is as simple as it gets. The $200 signup bonus and 0% intro APR seal the deal. But if you spend $500+/mo on groceries or dining, get a category card instead.' },
      { q: 'How does Quicksilver compare to Citi Double Cash?', a: 'Both earn 2% effective (Double Cash: 1% + 1% when you pay; Quicksilver: 1.5% flat). Quicksilver gives a $200 signup bonus, 0% intro APR, and easier approval. Double Cash has the edge for pure ongoing rewards (2% vs 1.5%) and the ability to convert to ThankYou Points with a Citi Premier. For first-year value, Quicksilver wins. For long-term ceiling, Double Cash wins.' },
      { q: 'What credit score do I need for Quicksilver?', a: 'Capital One is one of the most forgiving issuers. The Quicksilver has been approved for people with 630+ scores, and even lower with good income. Pre-qualify on their website for a soft-pull check before applying.' },
      { q: 'Is the 1.5% really enough?', a: 'On $2,000/mo spending, that\'s $30/month or $360/year. A category card earning 3-5% on your top categories would earn more, but only if you bother to use the right card for each purchase. Quicksilver is the "never think about it" card.' },
      { q: 'Can I upgrade from QuicksilverOne to Quicksilver?', a: 'Yes. Capital One regularly upgrades QuicksilverOne (which has a $39 annual fee) to Quicksilver (no annual fee) after 6-12 months of good payment history. If you have QuicksilverOne, call and ask for a product change.' },
      { q: 'Is the balance transfer offer good?', a: 'The 0% for 15 months on purchases and balance transfers is competitive. The 3% balance transfer fee ($5 minimum) is standard. If you\'re carrying high-interest debt, the 15 months of 0% can save you hundreds in interest.' }
    ],
    alternatives: ['citi-double-cash', 'wells-fargo-active-cash', 'capital-one-savorone'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'discover-it-cash-back',
    name: 'Discover it® Cash Back',
    issuer: 'Discover',
    annualFee: 0,
    introAPR: '0% for 15 months on purchases, then 17.49% – 27.49% Variable',
    regularAPR: '17.49% – 27.49% Variable',
    signupBonus: 'Cashback Match — Discover matches ALL cash back earned in your first year (unlimited)',
    rewards: [
      { category: 'Rotating categories', rate: '5%', type: 'cash back', note: 'Up to $1,500/quarter, activation required' },
      { category: 'Everything else', rate: '1%', type: 'cash back' }
    ],
    pointsValue: 0.01,
    perks: [
      '5% cash back on rotating categories each quarter (up to $1,500, activation required)',
      'Cashback Match: Discover DOUBLES all cash back earned in your first year',
      'No annual fee, ever',
      '0% intro APR for 15 months on purchases',
      'Free FICO credit score',
      'No foreign transaction fees',
      'U.S.-based customer service 24/7'
    ],
    annualCredits: [],
    ratings: { rewards: 4.5, perks: 3, afValue: 5, approval: 4, overall: 4.2 },
    bestFor: [
      'First-year cardholders who max out the Cashback Match (effectively 10% in rotating categories year one)',
      'People who like rotating 5% categories and will activate each quarter',
      'Anyone new to credit who wants no annual fee and a generous first year'
    ],
    skipIf: 'You won\'t activate the quarterly categories or won\'t max out the $1,500/quarter cap. Also skip if you want consistent category rewards — the Discover only gives 1% on non-bonus spending.',
    creditScoreNeeded: 'Fair to Good (640+)',
    issuerRules: 'Discover typically approves 1 card per 12-month period. They\'re lenient on credit score but may deny if you have a recent late payment or high utilization. Pre-qualification is available online.',
    faqs: [
      { q: 'How does the Discover it Cashback Match work?', a: 'In your first 12 billing cycles, Discover matches ALL the cash back you\'ve earned — dollar for dollar. If you earn $300 in cash back, they give you another $300 at the end of the year. That makes the rotating 5% categories effectively 10% in year one. After year one, you earn the regular rates only.' },
      { q: 'What are the 2026 rotating categories?', a: 'Discover typically announces categories quarterly. Recent categories include: Q1 grocery stores, Q2 gas stations & Uber, Q3 restaurants, Q4 Amazon & Target. You must activate each quarter at Discover.com or in the app — if you forget, you only earn 1%.' },
      { q: 'Is Discover it Cash Back better than Chase Freedom Flex?', a: 'Year one: Yes, Discover is better because of the Cashback Match (effectively doubles everything). Year two and beyond: Freedom Flex is better because it has 3% ongoing on dining and drugstores, while Discover drops to 1% on non-rotating categories. If you\'re choosing one, get both — use Discover in year one, then switch to Freedom Flex.' },
      { q: 'Can I have both the Discover it Cash Back and Discover it Miles?', a: 'No. Discover typically only allows one card per person. If you have the Miles card, you\'d need to close it before applying for Cash Back, or product-change (which is a Discover-internal process — call them).' },
      { q: 'Where is Discover not accepted?', a: 'Discover has closed the acceptance gap significantly and is now accepted at 99% of US merchants that take credit cards. The main holdouts are some small businesses and international merchants in certain countries. Costco accepts Discover but not Amex in most locations.' },
      { q: 'Is the first-year match really unlimited?', a: 'Yes — there\'s no cap on the Cashback Match. If you somehow earn $1,000 in cash back in your first year, Discover gives you another $1,000. The only cap is on the rotating 5% categories ($1,500/quarter max at 5%), but the match applies to ALL earnings including 1% on everyday spending.' }
    ],
    alternatives: ['chase-freedom-flex', 'citi-custom-cash', 'capital-one-quicksilver'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  // ============================================================
  // Sprint 13 cards (2026-04-30)
  // ============================================================
  {
    slug: 'bofa-customized-cash-rewards',
    name: 'Bank of America® Customized Cash Rewards Credit Card',
    issuer: 'Bank of America',
    annualFee: 0,
    introAPR: '0% for 15 months on purchases',
    regularAPR: '19.24% – 29.24% Variable',
    signupBonus: '$200 online cash rewards bonus after $1,000 spend in 90 days',
    rewards: [
      { category: 'Choice category (3%)', rate: '3%', type: 'cash back', note: 'Gas, online shopping, dining, travel, drugstores, or home improvement — pick one' },
      { category: 'Groceries', rate: '2%', type: 'cash back' },
      { category: 'Wholesale clubs', rate: '2%', type: 'cash back' },
      { category: 'Everything else', rate: '1%', type: 'cash back' }
    ],
    pointsValue: 0.01,
    perks: [
      '3% on your choice category — change it any time (gas, online shopping, dining, travel, drugstores, or home improvement)',
      '2% on groceries and wholesale clubs (no caps on 3% and 2%)',
      '1% on everything else',
      'No annual fee',
      '0% intro APR for 15 months on purchases',
      'Preferred Rewards boost: BofA checking customers get 10-75% bonus on rewards (up to 5.25% / 3.5% / 1.75%)',
      'No foreign transaction fees',
      'Free FICO score from TransUnion'
    ],
    annualCredits: [],
    ratings: { rewards: 4, perks: 3.5, afValue: 5, approval: 3.5, overall: 4.1 },
    bestFor: [
      'BofA checking/savings customers who qualify for Preferred Rewards boosts',
      'People who want flexibility to change their 3% category month to month',
      'Grocery shoppers who also want a wholesale club bonus'
    ],
    skipIf: 'You don\'t bank with BofA (you miss the Preferred Rewards boost, which is the whole point). Also skip if you want a fixed 3% dining card — the choice category can be confusing.',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: 'No strict velocity rules like 5/24. BofA evaluates income, existing relationship, and debt-to-income. Having a BofA checking account significantly helps approval odds.',
    faqs: [
      { q: 'How does the BofA Customized Cash Rewards choice category work?', a: 'You pick one of six categories for 3%: gas, online shopping, dining, travel, drugstores, or home improvement. You can change it once per calendar month online or in the app. If you never change it, it stays on your previous selection. The 2% on groceries and wholesale clubs is always active.' },
      { q: 'What is the BofA Preferred Rewards boost?', a: 'If you have $20K+ in a BofA checking/savings/investment account, you get a 25% rewards bonus (Gold tier). $50K+ = 50% bonus (Platinum). $100K+ = 75% bonus (Platinum Honors). This turns the 3% into 3.75%, 4.5%, or 5.25%. With Platinum Honors, you\'re earning 5.25% on your choice category — rivaling dedicated 5% cards with no annual fee.' },
      { q: 'Is the Customized Cash Rewards better than the Citi Custom Cash?', a: 'For BofA banking customers with $100K+ in assets: absolutely. The 5.25% (3% × 1.75x) on your choice category beats Custom Cash\'s 5% — and there\'s no $500/month cap. For everyone else, Custom Cash gives a cleaner 5% on your top category with no asset requirements. If you don\'t BofA bank, skip this card.' },
      { q: 'Can I really change the 3% category every month?', a: 'Yes, once per calendar month. Some people switch monthly — online shopping for holiday months, gas for summer road trips, dining for summer dining out. It\'s flexibility that most category cards don\'t offer.' },
      { q: 'Does the 2% on groceries include Walmart and Target?', a: 'No. Like most cards, standalone supermarkets code as groceries. Walmart, Target, and warehouse clubs like Costco code differently. However, the 2% on wholesale clubs does cover Costco and Sam\'s Club — making this one of the few cards that earns bonus at warehouse clubs.' },
      { q: 'Is the signup bonus worth it?', a: 'The $200 bonus after $1,000 spend in 90 days is decent for a no-annual-fee card. That\'s effectively 20% back on your first $1,000. After the bonus, ongoing value depends on your spending and whether you qualify for the Preferred Rewards boost.' }
    ],
    alternatives: ['citi-custom-cash', 'amex-blue-cash-everyday', 'chase-freedom-flex'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'us-bank-cash-plus',
    name: 'U.S. Bank Cash+® Visa Signature® Card',
    issuer: 'US Bank',
    annualFee: 0,
    introAPR: '0% for 12 billing cycles on purchases and balance transfers',
    regularAPR: '19.49% – 28.49% Variable',
    signupBonus: '$200 cash back after $1,000 spend in 90 days',
    rewards: [
      { category: 'First 5% category (choose 2)', rate: '5%', type: 'cash back', note: 'Choose from: fast food, TV/internet/streaming, cell phone providers, grocery stores, department stores, home utilities, ground transportation, or EV charging' },
      { category: 'Second 5% category (choose 2)', rate: '2%', type: 'cash back', note: 'Choose from same list or gas stations, drugstores, gym memberships' },
      { category: 'Everything else', rate: '1%', type: 'cash back' }
    ],
    pointsValue: 0.01,
    perks: [
      '5% cash back on two categories you choose each quarter',
      '2% cash back on one everyday category you choose each quarter',
      '1% on everything else',
      'No annual fee',
      '0% intro APR for 12 billing cycles on purchases and balance transfers',
      'Cell phone protection (up to $600/claim, $25 deductible)',
      'Covers up to 3 phones on the plan when you pay the bill with the card'
    ],
    annualCredits: [],
    ratings: { rewards: 4.5, perks: 3.5, afValue: 5, approval: 3, overall: 4.2 },
    bestFor: [
      'People who want maximum control over their bonus categories',
      'Families who spend heavily on groceries, streaming, and fast food',
      'EV owners who want 5% back on charging'
    ],
    skipIf: 'You won\'t remember to choose categories each quarter. If you set it and forget it, you\'ll earn just 1% on everything — defeating the purpose. Also skip if you dislike US Bank\'s smaller ecosystem.',
    creditScoreNeeded: 'Good to Excellent (680+)',
    issuerRules: 'US Bank is inquiry-sensitive and may deny applicants with 3+ recent hard pulls. They also prefer applicants with an existing US Bank relationship. Pre-qualification is available with a soft pull.',
    faqs: [
      { q: 'How does the Cash+ category selection work?', a: 'Each quarter, you choose two categories for 5% and one for 2%. Options include fast food, TV/internet/streaming, cell phone providers, grocery stores, department stores, home utilities, ground transportation, EV charging, gas stations, drugstores, and gym memberships. The categories reset each quarter, and you must actively select them online or in the app.' },
      { q: 'Is 5% on two categories really worth it?', a: 'If you target your top spending categories, yes. 5% on groceries and fast food, for example, can earn $25/month on $500 spend in each category, or $300/year. That\'s excellent for a no-annual-fee card. The key is choosing categories that match your actual spending.' },
      { q: 'How does Cash+ compare to Chase Freedom Flex?', a: 'Both require category activation, but Cash+ lets you choose from a list while Freedom Flex gives you predetermined rotating categories. Cash+ is for planners who know their spending; Freedom Flex is for people who happen to spend on whatever Chase picks that quarter. Cash+ is more flexible but requires more effort.' },
      { q: 'What about the cell phone protection?', a: 'It covers damage and theft up to $600 per claim ($25 deductible, max $1,200/year) when you pay your cell phone bill with the card. This covers up to 3 lines. Most carrier insurance costs $10-15/month per line — so this benefit alone can save you $120-540/year.' },
      { q: 'Can I keep the same categories every quarter?', a: 'Yes, you can re-select the same categories each quarter. If groceries and streaming are always your top two, just re-choose them every quarter. Set a calendar reminder for day one of each quarter.' },
      { q: 'Is US Bank hard to get approved for?', a: 'They\'re inquiry-sensitive and prefer applicants with an existing US Bank relationship. Having a checking or savings account with them helps. They typically want 680+ FICO. Pre-qualify on their website first for a soft-pull check.' }
    ],
    alternatives: ['chase-freedom-flex', 'discover-it-cash-back', 'citi-custom-cash'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'capital-one-savor',
    name: 'Capital One Savor® Dining and Entertainment Card',
    issuer: 'Capital One',
    annualFee: 95,
    introAPR: 'No intro APR offer',
    regularAPR: '19.99% – 29.99% Variable',
    signupBonus: '$300 cash back after $3,000 spend in 3 months',
    rewards: [
      { category: 'Dining', rate: '4%', type: 'cash back' },
      { category: 'Entertainment', rate: '4%', type: 'cash back' },
      { category: 'Groceries', rate: '3%', type: 'cash back' },
      { category: 'Streaming services', rate: '3%', type: 'cash back' },
      { category: 'Everything else', rate: '1%', type: 'cash back' }
    ],
    pointsValue: 0.01,
    perks: [
      '4% cash back on dining — top-tier rate for a standalone card',
      '4% on entertainment (concerts, sporting events, movies, theme parks)',
      '3% on groceries',
      '3% on streaming services',
      '$300 signup bonus after $3,000 spend in 3 months',
      'No foreign transaction fees',
      'Capital One Entertainment access (presales, VIP packages)',
      '24-hour travel assistance and roadside dispatch'
    ],
    annualCredits: [],
    ratings: { rewards: 4.5, perks: 3.5, afValue: 3.5, approval: 3.5, overall: 4 },
    bestFor: [
      'Heavy diners who eat out 4+ times per month',
      'Entertainment enthusiasts — concerts, sports, movies',
      'People who want the best dedicated dining card without points complexity'
    ],
    skipIf: 'You spend less than $250/month on dining and entertainment — the $95 AF won\'t pay off. Also skip if you want travel transfer partners (Savor is cash back only, unlike Venture X). Consider SavorOne (no AF) if you\'re on the fence about the annual fee.',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: 'Capital One typically limits personal cards to 2 per customer. Pre-qualification available with a soft pull. Savor specifically requires good-excellent credit.',
    faqs: [
      { q: 'Is the Savor worth the $95 annual fee?', a: 'If you spend $300+/month on dining and entertainment, yes. At $300/month dining, you earn $144/year in dining cash back alone, and $108/year on $300/month groceries (3%). Total: $252/year. After the $95 AF, you net $157 — and that\'s before the signup bonus. If you spend less than $200/month combined on dining/entertainment, the SavorOne (no AF, 3% dining) is the better deal.' },
      { q: 'How does the Savor compare to the SavorOne?', a: 'Savor costs $95/year and gives 4% dining/entertainment, 3% groceries/streaming. SavorOne is free and gives 3% dining/groceries/streaming, 8% on Capital One Entertainment. Savor wins for heavy diners ($300+/month). SavorOne wins for moderate diners. The math: Savor earns 1% more on dining — if you spend $9,500+/year dining, the extra 1% ($95) covers the annual fee.' },
      { q: 'What counts as "entertainment" for the 4%?', a: 'Concerts, sporting events, movie theaters, amusement parks, tourist attractions, and entertainment venues. Bars and nightclubs also typically code as dining. It does NOT include streaming services (those earn 3%) or video games.' },
      { q: 'Can I combine Savor with Venture X?', a: 'No — Capital One typically limits personal cards to 2. If you already have SavorOne + Venture X, you\'d need to product-change one before adding Savor.' },
      { q: 'Is the Savor better than the Amex Gold for dining?', a: 'Savor gives 4% cash back on dining ($95 AF). Amex Gold gives 4x points on dining ($325 AF). In pure cash value, Savor wins: 4% straight cash vs Gold\'s 4x points × 1¢ = 4% (cash back) or 4x × 1.5¢ = 6% (travel transfers). If you transfer Amex points to partners, Gold is better. If you want simple cash back, Savor wins by $230 in annual fees.' },
      { q: 'Does the Savor count delivery apps as dining?', a: 'Yes — Uber Eats, DoorDash, Grubhub, and other delivery platforms code as dining for most merchants. Some exceptions: if you order from a grocery store via a delivery app, it may code as groceries instead of dining.' }
    ],
    alternatives: ['capital-one-savorone', 'amex-gold', 'us-bank-altitude-go'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'southwest-priority-card',
    name: 'Southwest Rapid Rewards® Priority Credit Card',
    issuer: 'Chase',
    annualFee: 149,
    introAPR: 'No intro APR offer on purchases',
    regularAPR: '21.49% – 28.99% Variable',
    signupBonus: '50,000 points after $2,000 spend in 3 months (worth ~$750 in Southwest travel)',
    rewards: [
      { category: 'Southwest purchases', rate: '3x', type: 'points' },
      { category: 'Dining', rate: '2x', type: 'points' },
      { category: 'Rapid Rewards hotel & car rental partners', rate: '2x', type: 'points' },
      { category: 'Local transit & rideshare', rate: '2x', type: 'points' },
      { category: 'Internet, cable & phone services', rate: '2x', type: 'points' },
      { category: 'Everything else', rate: '1x', type: 'points' }
    ],
    pointsValue: 0.015,
    perks: [
      '7,500 anniversary bonus points each year (worth ~$112 in Southwest travel)',
      '$75 annual Southwest travel credit',
      '4 upgraded boardings per year (when available)',
      'In-flight WiFi credits (ongoing)',
      '20% back on inflight drinks',
      'No foreign transaction fees',
      'Companion Pass qualifying points: 10,000 per year toward the 135,000 needed',
      'TSA PreCheck credit ($100 every 4 years)',
      'Trip cancellation/interruption insurance',
      'Baggage delay insurance',
      'Lost luggage insurance'
    ],
    annualCredits: [
      { label: '7,500 anniversary points (~$112 value)', value: 112 },
      { label: '$75 Southwest travel credit', value: 75 }
    ],
    ratings: { rewards: 3.5, perks: 4, afValue: 4, approval: 3, overall: 3.8 },
    bestFor: [
      'Frequent Southwest flyers with 4+ flights per year',
      'People working toward the Southwest Companion Pass',
      'Anyone who values upgraded boarding and WiFi on Southwest flights'
    ],
    skipIf: 'You rarely fly Southwest — the rewards are Southwest-specific and can\'t be transferred to other airlines. Also skip if you don\'t fly 3+ times per year, as the $149 AF is hard to justify without regular Southwest travel.',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: '5/24 rule applies. Chase will typically deny if you\'ve opened 5+ cards (any issuer) in 24 months. This includes all Chase personal and business cards.',
    faqs: [
      { q: 'Is the Southwest Priority Card worth the $149 annual fee?', a: 'Yes, if you fly Southwest 4+ times per year. The 7,500 anniversary points (~$112) and $75 travel credit together cover $187 of the $149 AF — you\'re already $38 ahead before earning a single point on spending. Add upgraded boarding (worth $30-60/flight) and WiFi, and this card pays for itself easily for loyal Southwest flyers.' },
      { q: 'What is the Southwest Companion Pass?', a: 'The holy grail of airline perks: a named companion flies free with you every time you fly Southwest, for the rest of the calendar year plus the following year. You need 135,000 qualifying points, and the Priority card gives you 10,000 toward that each year. If you\'re close, the card can push you over the edge.' },
      { q: 'How does the Priority compare to the Southwest Plus and Premier?', a: 'Priority ($149 AF) gives 7,500 anniversary points + $75 travel credit. Premier ($99 AF, discontinued) gave 6,000 points. Plus ($69 AF) gives 3,000 points + $50 travel credit. Priority is the best value for frequent flyers - the anniversary bonus alone covers most of the fee.' },
      { q: 'Can I use the Companion Pass with any ticket?', a: 'Yes — even award tickets. Book a flight with points, add your companion for free. This essentially doubles the value of every Southwest point you earn. Families love it: one ticket per trip, one free companion seat every time.' },
      { q: 'How much are Southwest Rapid Rewards points worth?', a: '~1.5¢ each for Wanna Get Away fares. That means the 50,000 signup bonus is worth ~$750 in travel. Points don\'t expire as long as you have earning activity within 24 months, and there are no blackout dates or capacity controls on award flights.' },
      { q: 'Should I get the Priority or Chase Sapphire Preferred?', a: 'Get both if you can. Priority for Southwest earning and Companion Pass progress. Sapphire Preferred for everything else (5x on travel portal, 3x dining). Plus, holding both lets you earn more flexible Chase UR points that you can transfer to Southwest (among other partners).' }
    ],
    alternatives: ['chase-sapphire-preferred', 'capital-one-venture-x', 'citi-strata-premier'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  },
  {
    slug: 'ihg-one-rewards-premier',
    name: 'IHG One Rewards® Premier Credit Card',
    issuer: 'Chase',
    annualFee: 99,
    introAPR: 'No intro APR offer on purchases',
    regularAPR: '21.49% – 28.49% Variable',
    signupBonus: '175,000 IHG points after $3,000 spend in 3 months (worth ~$875 in hotels)',
    rewards: [
      { category: 'IHG hotels & resorts', rate: '26x', type: 'points' },
      { category: 'Dining', rate: '3x', type: 'points' },
      { category: 'Gas stations', rate: '3x', type: 'points' },
      { category: 'Flights on IHG partner airlines', rate: '3x', type: 'points' },
      { category: 'Transit', rate: '3x', type: 'points' },
      { category: 'Everything else', rate: '1x', type: 'points' }
    ],
    pointsValue: 0.005,
    perks: [
      '4th night free on award stays (every 4th night is free on stays of 4+ nights)',
      'Free night award each card anniversary (hotels up to 40,000 points)',
      'Platinum Elite status (late checkout, 50% points bonus on stays)',
      'IHG statement credit: $100 off a $200+ IHG stay each year',
      'No foreign transaction fees',
      'TSA PreCheck / Global Entry credit ($100 every 4 years)',
      'Trip cancellation/interruption insurance',
      'Auto rental collision damage waiver'
    ],
    annualCredits: [
      { label: 'Free night award (up to 40K points)', value: 200, notes: 'Typical value of a 40K-point night' },
      { label: '$100 IHG statement credit', value: 100, notes: 'On purchases of $200+' }
    ],
    ratings: { rewards: 3, perks: 4, afValue: 4.5, approval: 3, overall: 3.8 },
    bestFor: [
      'People who stay at IHG hotels 5+ nights per year (Holiday Inn, Crowne Plaza, InterContinental, Kimpton)',
      'Families who book 4+ night stays (the 4th night free is huge)',
      'Anyone who values a free annual night more than a $99 fee'
    ],
    skipIf: 'You don\'t stay at IHG properties. The earning rates outside IHG hotels are mediocre (3x dining/gas is common on no-AF cards), and IHG points are worth only ~0.5¢ each. This card is only worth it if you actually book IHG hotels.',
    creditScoreNeeded: 'Good to Excellent (670+)',
    issuerRules: '5/24 rule applies. Chase will typically deny if you\'ve opened 5+ cards (any issuer) in 24 months. IHG card specifically may also be denied if you have an existing IHG card.',
    faqs: [
      { q: 'Is the IHG Premier worth the $99 annual fee?', a: 'Yes, easily — if you stay at IHG hotels even once a year. The free night award (worth ~$150-200) and $100 statement credit together are worth $250-300, dwarfing the $99 fee. You\'re netting $150-200/year minimum just from the annual benefits.' },
      { q: 'How does the 4th night free on award stays work?', a: 'When you book an award stay of 4 or more nights at an IHG property using points, every 4th night is free (0 points required for that night). On a 4-night stay, you pay for 3 nights. On an 8-night stay, you pay for 6. This can save 25% on longer stays.' },
      { q: 'How much are IHG points worth?', a: '~0.5¢ each, making the 26x rate on IHG stays equivalent to 13% back. That sounds great until you realize 175,000 points ≈ $875 in free nights. The points are most valuable at lower-tier properties like Holiday Inn Express where a night can cost 15,000-25,000 points.' },
      { q: 'Is the free night award really worth $200?', a: 'You can redeem it for any IHG hotel that costs up to 40,000 points per night. Many Holiday Inn Express and even some Crowne Plaza properties fall in this range. If you use it at a $200/night property (common in major cities), the value is $200. If you apply it to a $150 Holiday Inn, the value is $150.' },
      { q: 'How does this compare to the Hyatt card for hotel stays?', a: 'Hyatt points are worth ~1.5¢ each vs IHG\'s ~0.5¢ each, making Hyatt\'s earning more valuable per point. However, IHG has far more properties (6,000+ vs 1,300+), so availability is better. If you can find Hyatt properties where you travel, the Chase Hyatt card is better. If you need broad coverage, IHG wins.' },
      { q: 'Can I combine the free night with the 4th night free?', a: 'Yes! Book a 4-night award stay, and the 4th night is free. Then use your annual free night certificate for one of the paid nights. This combination can make a 4-night stay cost just 2 nights worth of points plus one certificate — incredibly efficient.' }
    ],
    alternatives: ['chase-sapphire-preferred', 'amex-platinum', 'citi-strata-premier'],
    affiliateLink: '#',
    reviewDate: '2026-04-30'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CARD_REVIEWS };
}
