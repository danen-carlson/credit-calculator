#!/usr/bin/env node
/**
 * GEO Schema Injector — Adds BreadcrumbList, Review, HowTo, and Article schema
 * to CreditStud.io HTML pages.
 *
 * Usage: node inject-schema.js [--dry-run]
 *
 * Reads HTML files, injects missing schema, writes back.
 * Idempotent — won't add duplicate schemas.
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const BASE_URL = 'https://creditstud.io';

// ── Breadcrumb Definitions ────────────────────────────────────────

const breadcrumbMap = {
  'index.html': [{ name: 'Home', url: '/' }],
  'compare/index.html': [{ name: 'Home', url: '/' }, { name: 'Credit Comparison', url: '/compare/' }],
  'rewards/index.html': [{ name: 'Home', url: '/' }, { name: 'Rewards Calculator', url: '/rewards/' }],
  'debt-planner/index.html': [{ name: 'Home', url: '/' }, { name: 'Debt Planner', url: '/debt-planner/' }],
  'min-payment/index.html': [{ name: 'Home', url: '/' }, { name: 'Minimum Payment Calculator', url: '/min-payment/' }],
  'af-worth-it/index.html': [{ name: 'Home', url: '/' }, { name: 'Annual Fee Calculator', url: '/af-worth-it/' }],
  'loan-vs-bt/index.html': [{ name: 'Home', url: '/' }, { name: 'Loan vs Balance Transfer', url: '/loan-vs-bt/' }],
  'score-simulator/index.html': [{ name: 'Home', url: '/' }, { name: 'Credit Score Simulator', url: '/score-simulator/' }],
  'cards/index.html': [{ name: 'Home', url: '/' }, { name: 'Credit Cards', url: '/cards/' }],
  'blog/index.html': [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog/' }],
  'learn/index.html': [{ name: 'Home', url: '/' }, { name: 'Learn', url: '/learn/' }],
  'disclosure.html': [{ name: 'Home', url: '/' }, { name: 'Disclosure', url: '/disclosure.html' }],
  'merchant/index.html': [{ name: 'Home', url: '/' }, { name: 'Merchant Guides', url: '/merchant/' }],
};

// Card pages are handled separately below with cardNames mapping

// ── HowTo Definitions ─────────────────────────────────────────────

const howToSteps = {
  'compare/index.html': {
    name: 'Compare Credit Cards & BNPL',
    description: 'Find the cheapest way to finance any purchase by comparing credit cards and BNPL services side by side.',
    steps: [
      { name: 'Enter purchase amount', text: 'Type in the amount you plan to spend.' },
      { name: 'Set your credit score', text: 'Select your credit score range for accurate APR estimates.' },
      { name: 'Choose a payoff timeline', text: 'Set how many months you want to pay it off.' },
      { name: 'Compare results', text: 'Review the total cost, interest, fees, and net cost for each option.' },
    ],
  },
  'rewards/index.html': {
    name: 'Calculate Credit Card Rewards',
    description: 'Compare 25+ credit cards by actual dollar value based on your monthly spending.',
    steps: [
      { name: 'Enter monthly spending', text: 'Input your spending across categories like dining, groceries, and travel.' },
      { name: 'See annual rewards', text: 'View projected annual rewards value for each card.' },
      { name: 'Compare signup bonuses', text: 'Factor in first-year bonus value vs ongoing rewards.' },
    ],
  },
  'min-payment/index.html': {
    name: 'Calculate Minimum Payment Cost',
    description: 'See the true cost of making only minimum payments on credit card debt.',
    steps: [
      { name: 'Enter your balance', text: 'Type in your current credit card balance.' },
      { name: 'Enter your APR', text: 'Input your card\'s annual percentage rate.' },
      { name: 'See the real cost', text: 'View total interest paid, months to payoff, and the difference vs paying more.' },
    ],
  },
  'af-worth-it/index.html': {
    name: 'Is Your Annual Fee Worth It?',
    description: 'Calculate whether a credit card\'s annual fee is worth paying based on your spending.',
    steps: [
      { name: 'Select your card', text: 'Choose the card with an annual fee you\'re evaluating.' },
      { name: 'Enter monthly spending', text: 'Input your typical monthly spend in relevant categories.' },
      { name: 'Compare fee vs rewards', text: 'See if the rewards and credits offset the annual fee.' },
    ],
  },
  'loan-vs-bt/index.html': {
    name: 'Compare Personal Loan vs Balance Transfer',
    description: 'Decide between a personal loan and a balance transfer offer to pay off debt.',
    steps: [
      { name: 'Enter debt amount', text: 'Type in the total debt you want to pay off.' },
      { name: 'Enter loan and BT terms', text: 'Input the personal loan APR and the balance transfer offer details.' },
      { name: 'Compare total cost', text: 'See which option saves you more over the payoff period.' },
    ],
  },
  'score-simulator/index.html': {
    name: 'Simulate Credit Score Impact',
    description: 'See how different credit scores affect the APR and total interest you pay.',
    steps: [
      { name: 'Enter your balance', text: 'Type in your current or planned balance.' },
      { name: 'Select score range', text: 'Choose a credit score range to see estimated APR.' },
      { name: 'Compare scores', text: 'See how different scores change your interest rate and total cost.' },
    ],
  },
};

// ── Card Review Schema Data ────────────────────────────────────────
// Editorial reviews for each card page

const cardReviews = {
  'chase-sapphire-preferred': { verdict: 'Best for travel and dining rewards with a reasonable annual fee', pros: ['3x points on dining and travel', 'Generous 60K signup bonus', 'Transfer partners worth 1.5¢+ per point'], cons: ['Annual fee not offset by credits alone', 'No fixed reward categories beyond travel/dining'] },
  'amex-gold': { verdict: 'Top pick for dining and groceries if you use the monthly credits', pros: ['4x on dining worldwide', '4x on groceries (up to $25K/year)', '$120 dining credit, $84 Uber cash'], cons: ['Annual fee is $325 (hard to offset without credits)', 'No lounge access or travel insurance'] },
  'capital-one-venture-x': { verdict: 'Premium travel card with strong everyday value', pros: ['2x on everything', 'Priority Pass + Plaza Premium lounge access', 'Annual $300 travel credit'], cons: ['Annual fee of $395', 'Requires excellent credit'] },
  'chase-sapphire-reserve': { verdict: 'Best premium travel card for airport lounge access and trip protection', pros: ['3x on travel and dining', '$300 annual travel credit', 'Priority Pass membership'], cons: ['Annual fee is $550 (effective $250 after credit)', 'Lower everyday earn rate than Venture X'] },
  'amex-platinum': { verdict: 'The luxury travel card with unmatched lounge access and statement credits', pros: ['$800+ in annual credits', 'Centurion + Priority Pass lounges', '5x on flights'], cons: ['$695 annual fee', 'Low earning rate on non-bonus spend'] },
  'bilt-mastercard': { verdict: 'Best for renters — pay rent with no fee and earn points', pros: ['Earn points on rent with no transaction fee', 'No annual fee', 'Day 1 of the month double points'], cons: ['Limited earning categories beyond rent and dining', 'Requires using the Bilt Rewards platform'] },
  'capital-one-savorone': { verdict: 'Best no-annual-fee dining and entertainment card', pros: ['3% on dining, entertainment, and streaming', 'No annual fee', '3% on grocery stores (first year only)'], cons: ['Grocery bonus is temporary', 'No transfer partners'] },
  'citi-double-cash': { verdict: 'Simple flat 2% cash back on everything — no categories to track', pros: ['2% on everything (1% purchase + 1% payment)', 'No annual fee', 'No category limits'], cons: ['No signup bonus', 'No transfer partners', 'Foreign transaction fee'] },
  'wells-fargo-autograph': { verdict: 'Solid no-annual-fee card with 3x on common categories', pros: ['3x on restaurants, travel, streaming, and phone plans', 'No annual fee', 'Cell phone protection'], cons: ['Limited 1x on everything else', 'No luxury perks'] },
  'us-bank-altitude-go': { verdict: 'Good no-fee option for streaming and dining', pros: ['4x on streaming services', '2x on dining, groceries, and gas', 'No annual fee'], cons: ['Streaming cap at $2,000/year', 'Limited other benefits'] },
  'citi-custom-cash': { verdict: 'Best automatic 5% cash back card — no tracking categories', pros: ['5% on your top eligible category each billing cycle', 'No annual fee', 'Automatic category detection'], cons: ['5% capped at $500/billing cycle ($6K/year)', '1% after that'] },
  'capital-one-quicksilver': { verdict: 'Simple 1.5% cash back on everything — easy and predictable', pros: ['Unlimited 1.5% cash back on every purchase', 'No annual fee', 'Simple flat rate — no categories'], cons: ['Lower rate than 2% cards like Double Cash', 'No category bonuses'] },
  'discover-it-cash-back': { verdict: '5% rotating categories with first-year cashback match doubles your rewards', pros: ['5% rotating categories', 'First-year Cashback Match doubles earnings', 'No annual fee'], cons: ['Limited acceptance outside the US', 'Rotating categories require activation'] },
  'amex-blue-cash-preferred': { verdict: 'Best grocery card if you spend enough to justify the fee', pros: ['6% on groceries (up to $6K/year)', '6% on streaming', '3% on transit'], cons: ['$95 annual fee', 'Grocery cap is relatively low'] },
  'chase-freedom-flex': { verdict: 'Excellent no-fee quarterly bonus card with flexible categories', pros: ['5% rotating categories', '3% on dining and drugstores', 'No annual fee'], cons: ['Rotating categories require activation', '5% caps at $1,500/quarter'] },
  'amex-blue-cash-everyday': { verdict: 'No-fee grocery card with decent everyday rewards', pros: ['3% on groceries (up to $6K/year)', '3% on gas (up to $6K/year)', 'No annual fee'], cons: ['Grocery and gas caps at $6K combined', '1% on everything else'] },
  'citi-strata-premier': { verdict: 'Solid travel card with flexible point transfers', pros: ['3x on air travel, hotels, and restaurants', '3x on gas and groceries', 'No foreign transaction fee'], cons: ['Annual fee of $95', 'Points less valuable without transfer partners'] },
  'wells-fargo-active-cash': { verdict: 'Unlimited 2% cash back on everything with no annual fee', pros: ['Unlimited 2% cash back on every purchase', 'No annual fee', 'Cell phone protection'], cons: ['No category bonuses', 'Basic benefits compared to Autograph'] },
};

// ── Helper Functions ────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasSchema(html, schemaType) {
  return html.includes(`"@type": "${schemaType}"`) || html.includes(`"@type":"${schemaType}"`);
}

function makeBreadcrumb(items) {
  const itemListElement = items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: `${BASE_URL}${item.url}`,
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

function makeReview(cardName, reviewData) {
  const datePublished = '2026-04-28';
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: `${cardName} Review`,
    reviewBody: `${reviewData.verdict}. Pros: ${reviewData.pros.join('; ')}. Cons: ${reviewData.cons.join('; ')}.`,
    datePublished,
    author: { '@type': 'Organization', name: 'CreditStud.io', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'CreditStud.io', url: BASE_URL },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '4.2',
      bestRating: '5',
      worstRating: '1',
      description: reviewData.verdict,
    },
    itemReviewed: {
      '@type': 'Product',
      name: cardName,
    },
    positiveNotes: {
      '@type': 'ItemList',
      itemListElement: reviewData.pros.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p,
      })),
    },
    negativeNotes: {
      '@type': 'ItemList',
      itemListElement: reviewData.cons.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c,
      })),
    },
  };
}

function makeArticle(title, url, description, datePublished, dateModified) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || title,
    datePublished: datePublished || '2026-04-28',
    dateModified: dateModified || '2026-04-28',
    author: { '@type': 'Organization', name: 'CreditStud.io', url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'CreditStud.io',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}${url}` },
  };
}

function makeHowTo(config) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: config.name,
    description: config.description,
    totalTime: 'PT5M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
    tool: { '@type': 'HowToTool', name: 'CreditStud.io Calculator' },
    step: config.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

function injectSchema(html, schemaObj) {
  const json = JSON.stringify(schemaObj, null, 2);
  const tag = `<script type="application/ld+json">\n${json}\n</script>`;

  // Find the last existing schema block and insert after it
  const lastSchemaEnd = html.lastIndexOf('</script>\n<!-- /SCHEMA');
  if (lastSchemaEnd !== -1) {
    // Insert after existing schema block
    return html.slice(0, lastSchemaEnd + '</script>'.length) + '\n' + tag + html.slice(lastSchemaEnd + '</script>'.length);
  }

  // Find the </head> tag and insert before it
  const headClose = html.indexOf('</head>');
  if (headClose !== -1) {
    return html.slice(0, headClose) + tag + '\n' + html.slice(headClose);
  }

  // Fallback: append to end
  return html + '\n' + tag;
}

// ── Card display name mapping ──────────────────────────────

const cardNames = {
  'chase-sapphire-preferred': 'Chase Sapphire Preferred',
  'amex-gold': 'American Express® Gold Card',
  'capital-one-venture-x': 'Capital One Venture X',
  'chase-sapphire-reserve': 'Chase Sapphire Reserve',
  'amex-platinum': 'American Express Platinum',
  'bilt-mastercard': 'Bilt Mastercard',
  'capital-one-savorone': 'Capital One SavorOne',
  'citi-double-cash': 'Citi Double Cash',
  'wells-fargo-autograph': 'Wells Fargo Autograph',
  'us-bank-altitude-go': 'US Bank Altitude Go',
  'citi-custom-cash': 'Citi Custom Cash',
  'capital-one-quicksilver': 'Capital One Quicksilver',
  'discover-it-cash-back': 'Discover it Cash Back',
  'amex-blue-cash-preferred': 'Blue Cash Preferred from American Express',
  'chase-freedom-flex': 'Chase Freedom Flex',
  'amex-blue-cash-everyday': 'Blue Cash Everyday from American Express',
  'citi-strata-premier': 'Citi Strata Premier',
  'wells-fargo-active-cash': 'Wells Fargo Active Cash',
  'amazon-prime-visa-signature': 'Amazon Prime Visa Signature',
  'apple-card': 'Apple Card',
  'barclays-uber-pro': 'Barclays Uber Pro Card',
  'bofa-customized-cash-rewards': 'Bank of America Customized Cash Rewards',
  'capital-one-savor': 'Capital One Savor',
  'chase-ink-business-preferred': 'Chase Ink Business Preferred',
  'citi-premier': 'Citi Premier',
  'ihg-one-rewards-premier': 'IHG One Rewards Premier',
  'southwest-priority-card': 'Southwest Priority Card',
  'us-bank-cash-plus': 'US Bank Cash+',
};

// ── Blog page metadata ──────────────────────────────

const blogMeta = {
  'amex-gold-worth-it': { title: 'Is the Amex Gold Card Worth It?', date: '2026-03-15' },
  'best-0-apr-credit-cards': { title: 'Best 0% APR Credit Cards', date: '2026-03-20' },
  'best-balance-transfer-credit-cards': { title: 'Best Balance Transfer Credit Cards', date: '2026-04-01' },
  'best-credit-cards-for-groceries': { title: 'Best Credit Cards for Groceries', date: '2026-03-25' },
  'best-credit-cards-for-travel': { title: 'Best Credit Cards for Travel', date: '2026-04-05' },
  'bnpl-hidden-fees': { title: 'BNPL Hidden Fees You Might Not Know About', date: '2026-04-10' },
  'bnpl-vs-credit-card': { title: 'BNPL vs Credit Card: Which Is Cheaper?', date: '2026-03-22' },
  'cheapest-way-to-finance-purchase': { title: 'Cheapest Way to Finance a Purchase', date: '2026-04-08' },
  'credit-card-benefits-youre-not-using': { title: 'Credit Card Benefits You\'re Not Using', date: '2026-04-12' },
  'credit-card-points-offset-interest': { title: 'Can Credit Card Rewards Offset Interest?', date: '2026-03-28' },
  'does-klarna-affect-credit-score': { title: 'Does Klarna Affect Your Credit Score?', date: '2026-04-03' },
  'how-to-build-credit-from-scratch': { title: 'How to Build Credit From Scratch', date: '2026-03-18' },
  'klarna-vs-afterpay-vs-affirm': { title: 'Klarna vs Afterpay vs Affirm', date: '2026-04-14' },
  'minimum-payment-trap': { title: 'The Minimum Payment Trap', date: '2026-03-30' },
  'sneaky-credit-card-pitfalls': { title: 'Sneaky Credit Card Pitfalls', date: '2026-04-18' },
  'snowball-vs-avalanche': { title: 'Snowball vs Avalanche: Best Debt Payoff Method', date: '2026-03-10' },
  'affirm-interest-rates-explained': { title: 'Affirm Interest Rates Explained', date: '2026-04-20' },
};

// ── Main ────────────────────────────────────────────────────────────

let changed = 0;
let skipped = 0;

// 1. Inject BreadcrumbList into pages missing it
for (const [relPath, items] of Object.entries(breadcrumbMap)) {
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP ${relPath} (file not found)`);
    skipped++;
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  if (hasSchema(html, 'BreadcrumbList')) {
    console.log(`  SKIP ${relPath} (BreadcrumbList exists)`);
    skipped++;
    continue;
  }

  const breadcrumb = makeBreadcrumb(items);
  html = injectSchema(html, breadcrumb);

  if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ADD  BreadcrumbList → ${relPath}`);
  changed++;
}

// Add card pages with dynamic breadcrumbs
for (const cardSlug of Object.keys(cardNames)) {
  const relPath = `cards/${cardSlug}/index.html`;
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP ${relPath} (file not found)`);
    skipped++;
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  if (hasSchema(html, 'BreadcrumbList')) {
    console.log(`  SKIP ${relPath} (BreadcrumbList exists)`);
    skipped++;
    continue;
  }

  const breadcrumb = makeBreadcrumb([
    { name: 'Home', url: '/' },
    { name: 'Credit Cards', url: '/cards/' },
    { name: cardNames[cardSlug], url: `/${relPath}` },
  ]);
  html = injectSchema(html, breadcrumb);

  if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ADD  BreadcrumbList → ${relPath}`);
  changed++;
}

// Add blog page breadcrumbs (blogs missing BreadcrumbList)
for (const [slug, meta] of Object.entries(blogMeta)) {
  const relPath = `blog/${slug.endsWith('.html') ? slug : slug + '.html'}`;
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  if (hasSchema(html, 'BreadcrumbList')) {
    console.log(`  SKIP ${relPath} (BreadcrumbList exists)`);
    continue;
  }

  const breadcrumb = makeBreadcrumb([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog/' },
    { name: meta.title, url: `/${relPath}` },
  ]);
  html = injectSchema(html, breadcrumb);

  if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ADD  BreadcrumbList → ${relPath}`);
  changed++;
}

// Add learn page breadcrumbs
const learnPages = [
  { slug: 'pay-off-10k-debt', title: 'How to Pay Off $10K in Debt' },
  { slug: 'bnpl-interest-calculator', title: 'BNPL Interest Calculator' },
  { slug: 'balance-transfer-calculator', title: 'Balance Transfer Calculator' },
  { slug: 'crypto-credit-card-rewards', title: 'Crypto Credit Card Rewards' },
  { slug: 'snowball-vs-avalanche', title: 'Snowball vs Avalanche' },
];
for (const lp of learnPages) {
  const relPath = `learn/${lp.slug}.html`;
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  if (hasSchema(html, 'BreadcrumbList')) {
    console.log(`  SKIP ${relPath} (BreadcrumbList exists)`);
    continue;
  }

  const breadcrumb = makeBreadcrumb([
    { name: 'Home', url: '/' },
    { name: 'Learn', url: '/learn/' },
    { name: lp.title, url: `/${relPath}` },
  ]);
  html = injectSchema(html, breadcrumb);

  if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ADD  BreadcrumbList → ${relPath}`);
  changed++;
}

// Add merchant page breadcrumbs
const merchantPages = [
  'amazon', 'costco', 'target', 'walmart', 'groceries', 'home-improvement',
  'gas-stations', 'restaurants', 'streaming', 'travel', 'pharmacy',
  'warehouse-clubs', 'online-shopping', 'utilities'
];
for (const mp of merchantPages) {
  const relPath = `merchant/${mp}.html`;
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  if (hasSchema(html, 'BreadcrumbList')) {
    console.log(`  SKIP ${relPath} (BreadcrumbList exists)`);
    continue;
  }

  const name = mp.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const breadcrumb = makeBreadcrumb([
    { name: 'Home', url: '/' },
    { name: 'Where to Pay', url: '/merchant/' },
    { name: name, url: `/${relPath}` },
  ]);
  html = injectSchema(html, breadcrumb);

  if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ADD  BreadcrumbList → ${relPath}`);
  changed++;
}

// 2. Inject Review schema into card pages
for (const [cardSlug, reviewData] of Object.entries(cardReviews)) {
  const relPath = `cards/${cardSlug}/index.html`;
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  if (hasSchema(html, 'Review')) {
    console.log(`  SKIP ${relPath} (Review exists)`);
    continue;
  }

  const cardName = cardNames[cardSlug] || cardSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const review = makeReview(cardName, reviewData);
  html = injectSchema(html, review);

  if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ADD  Review → ${relPath}`);
  changed++;
}

// 3. Inject HowTo schema into calculator pages (that don't already have it)
for (const [relPath, config] of Object.entries(howToSteps)) {
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  if (hasSchema(html, 'HowTo')) {
    console.log(`  SKIP ${relPath} (HowTo exists)`);
    continue;
  }

  const howTo = makeHowTo(config);
  html = injectSchema(html, howTo);

  if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ADD  HowTo → ${relPath}`);
  changed++;
}

// 4. Inject Article schema into blog pages missing it
for (const [slug, meta] of Object.entries(blogMeta)) {
  const relPath = `blog/${slug.endsWith('.html') ? slug : slug + '.html'}`;
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  if (hasSchema(html, 'Article')) {
    console.log(`  SKIP ${relPath} (Article exists)`);
    continue;
  }

  const article = makeArticle(
    meta.title,
    `/${relPath}`,
    meta.title,
    meta.date,
    '2026-04-28',
  );
  html = injectSchema(html, article);

  if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ADD  Article → ${relPath}`);
  changed++;
}

// 5. Add dateModified to existing Product schema on card pages
for (const cardSlug of Object.keys(cardNames)) {
  const relPath = `cards/${cardSlug}/index.html`;
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');

  // Add dateModified to Product schema if missing
  if (html.includes('"@type": "Product"') || html.includes('"@type":"Product"')) {
    if (!html.includes('dateModified')) {
      html = html.replace(
        /("@type":\s*"Product"[^}]*?"aggregateRating")/s,
        '$1'
      );
      // Insert dateModified into Product schema (before closing brace)
      // This is a simple approach — find the Product schema and add dateModified
      const productMatch = html.match(/(<script type="application\/ld\+json">[\s\S]*?"@type":\s*"Product"[\s\S]*?<\/script>)/);
      if (productMatch) {
        let productBlock = productMatch[1];
        if (!productBlock.includes('dateModified')) {
          productBlock = productBlock.replace(
            /("aggregateRating":\s*\{[^}]*\})/,
            '$1,\n      "dateModified": "2026-04-28"'
          );
          // Only replace if we actually added the field
          if (productBlock.includes('dateModified')) {
            html = html.replace(productMatch[1], productBlock);
            if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf8');
            console.log(`  ADD  dateModified (Product) → ${relPath}`);
            changed++;
          }
        }
      }
    }
  }
}

console.log(`\n${DRY_RUN ? 'DRY RUN - ' : ''}Done. ${changed} files changed, ${skipped} files skipped.`);