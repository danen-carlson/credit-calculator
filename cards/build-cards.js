#!/usr/bin/env node
/**
 * CreditStud.io — Card Reviews Build Script
 *
 * Reads cards-data.js and generates:
 *   - cards/<slug>/index.html for each card
 *   - cards/index.html (listing page)
 *
 * Run: node cards/build-cards.js
 */

const fs = require('fs');
const path = require('path');

const cardsDir = __dirname;
const repoDir = path.dirname(cardsDir);

const { CARD_REVIEWS } = require('./cards-data.js');

// === Helpers ===

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderStars(score) {
  // score: 0-5 (supports halves)
  const filled = Math.floor(score);
  const half = (score - filled) >= 0.5;
  const empty = 5 - filled - (half ? 1 : 0);
  let stars = '★'.repeat(filled);
  if (half) stars += '½';
  stars += `<span class="star-empty">${'☆'.repeat(empty)}</span>`;
  return stars;
}

function renderRewards(rewards) {
  const rows = rewards.map(r => `
    <tr>
      <td>${escapeHtml(r.category)}</td>
      <td class="rate">${escapeHtml(r.rate)}</td>
      <td>${escapeHtml(r.type)}</td>
    </tr>
  `).join('');
  return `<table class="rewards-table">
    <thead><tr><th>Category</th><th>Rate</th><th>Type</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderPerks(perks) {
  if (!perks || !perks.length) return '<p style="color:var(--text-secondary);">No notable perks.</p>';
  return `<ul class="perks-list">${perks.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`;
}

function renderCredits(credits) {
  if (!credits || !credits.length) return '';
  const totalValue = credits.reduce((s, c) => s + (c.value || 0), 0);
  const rows = credits.map(c => `
    <tr>
      <td>${escapeHtml(c.label)}${c.notes ? ` <span style="color:var(--text-secondary);font-size:0.85rem;">(${escapeHtml(c.notes)})</span>` : ''}</td>
      <td class="credit-value">$${c.value || 0}</td>
    </tr>
  `).join('');
  return `<section class="card-section">
    <h2><span class="icon">💰</span> Annual Credits ($${totalValue} total face value)</h2>
    <table class="credits-table"><tbody>${rows}</tbody></table>
    <p style="margin-top:12px;font-size:0.85rem;color:var(--text-secondary);">
      Credit value depends on you actually using them. Many credits are split monthly or semi-annually, so factor in your usage habits before counting them against the AF.
    </p>
  </section>`;
}

function renderRatings(ratings) {
  const items = [
    { key: 'rewards', label: 'Rewards' },
    { key: 'perks', label: 'Perks' },
    { key: 'afValue', label: 'AF Value' },
    { key: 'approval', label: 'Approval Ease' },
    { key: 'overall', label: 'Overall' }
  ];
  return items.map(it => {
    const score = ratings[it.key] || 0;
    return `<div class="rating-item">
      <div class="rating-label">${it.label}</div>
      <div class="rating-stars">${renderStars(score)}</div>
      <div class="rating-value">${score} / 5</div>
    </div>`;
  }).join('');
}

function renderBestFor(bestFor) {
  if (!bestFor || !bestFor.length) return '';
  return `<ul>${bestFor.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`;
}

function renderMath(card) {
  // Sample monthly spend assumption; calculate yearly rewards using top 3 categories
  const sampleSpend = { 'Travel': 300, 'Dining': 400, 'Restaurants worldwide': 400, 'Streaming': 50, 'Online groceries': 150, 'U.S. supermarkets (up to $25K/yr)': 600, 'Flights (Capital One Travel)': 300, 'Hotels & rental cars (Capital One Travel)': 100, 'Other': 1500, 'Everything else': 1500 };
  const lines = [];
  let yearly = 0;
  for (const r of card.rewards) {
    const monthly = sampleSpend[r.category] || sampleSpend[r.category.split(' ')[0]] || 0;
    if (monthly === 0) continue;
    const rateNum = parseFloat(r.rate.replace(/[^0-9.]/g, '')) || 1;
    const yearlyPoints = monthly * 12 * rateNum;
    const dollars = yearlyPoints * (card.pointsValue || 0.01);
    yearly += dollars;
    lines.push({
      label: `${r.category}: $${monthly}/mo × 12 × ${r.rate}`,
      value: `$${dollars.toFixed(0)} value`
    });
  }
  if (!lines.length) return '';
  // Subtract AF
  yearly -= card.annualFee || 0;
  const annualCreditValue = (card.annualCredits || []).reduce((s, c) => s + (c.value || 0), 0);
  if (annualCreditValue > 0) {
    yearly += annualCreditValue;
    lines.push({ label: `+ Annual credits (full use)`, value: `$${annualCreditValue}` });
  }
  if (card.annualFee) {
    lines.push({ label: `– Annual fee`, value: `–$${card.annualFee}` });
  }
  const rows = lines.map(l => `<div class="math-row"><span>${escapeHtml(l.label)}</span><span>${escapeHtml(l.value)}</span></div>`).join('');
  return `<section class="math-example">
    <h3>📊 Example: Typical traveler/diner</h3>
    ${rows}
    <div class="math-row"><span>Net annual value</span><span>${yearly >= 0 ? '+' : ''}$${yearly.toFixed(0)}</span></div>
    <p style="margin-top:12px;font-size:0.85rem;color:#0369a1;">Based on illustrative spending. Use our <a href="/af-worth-it/">AF Worth It Calculator</a> to plug in your real numbers.</p>
  </section>`;
}

function renderComparison(card, allCards) {
  const alts = (card.alternatives || []).map(slug => allCards.find(c => c.slug === slug)).filter(Boolean);
  if (!alts.length) return '';
  const cards = alts.map(a => `
    <a href="/cards/${a.slug}/" class="compare-card">
      <div class="compare-name">${escapeHtml(a.name)}</div>
      <div class="compare-meta">${escapeHtml(a.issuer)} • $${a.annualFee} AF</div>
      <div class="compare-link">Read review →</div>
    </a>
  `).join('');
  return `<section class="card-section">
    <h2><span class="icon">⚖️</span> Compare to similar cards</h2>
    <div class="compare-grid">${cards}</div>
    <p style="margin-top:12px;font-size:0.9rem;"><a href="/compare/">Side-by-side comparison tool →</a></p>
  </section>`;
}

function renderFaqs(faqs) {
  if (!faqs || !faqs.length) return '';
  const items = faqs.map(f => `
    <details>
      <summary>${escapeHtml(f.q)}</summary>
      <div class="faq-answer">${escapeHtml(f.a)}</div>
    </details>
  `).join('');
  return `<section class="card-section">
    <h2><span class="icon">❓</span> Frequently asked questions</h2>
    <div class="faq-list">${items}</div>
  </section>`;
}

function renderFaqSchema(faqs) {
  if (!faqs || !faqs.length) return '';
  const main = faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a }
  }));
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: main
  });
}

function renderProductSchema(card) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: card.name,
    brand: { '@type': 'Brand', name: card.issuer },
    description: `Editorial review of the ${card.name} — rewards, perks, fees, and verdict from CreditStud.io.`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: card.ratings.overall,
      bestRating: 5,
      worstRating: 1,
      ratingCount: 1,
      reviewCount: 1
    }
  });
}

function navHtml(activeSlug) {
  return `<nav class="top-nav">
        <a href="/" class="nav-link">Home</a>
        <a href="/compare/" class="nav-link">Compare</a>
        <a href="/debt-planner/" class="nav-link">Debt Planner</a>
        <a href="/rewards/" class="nav-link">Rewards</a>
        <a href="/min-payment/" class="nav-link">Min Payment</a>
        <a href="/score-simulator/" class="nav-link">Score Sim</a>
        <a href="/af-worth-it/" class="nav-link">AF Worth It?</a>
        <a href="/loan-vs-bt/" class="nav-link">Loan vs BT</a>
        <a href="/cards/" class="nav-link${activeSlug ? ' active' : ''}">Card Reviews</a>
      </nav>`;
}

// === Render single card page ===

function renderCardPage(card, allCards) {
  const ogDesc = `Honest review of the ${card.name}. ${card.skipIf ? 'Pros, cons, real math, and who should skip.' : 'Pros, cons, and verdict.'} ${card.signupBonus.split('.')[0]}.`;
  const title = `${card.name} Review — Pros, Cons & Verdict | CreditStud.io`;
  const verdict = card.bestFor && card.bestFor.length
    ? `Best for ${card.bestFor[0].toLowerCase()}. ${card.skipIf ? `Skip if ${card.skipIf.toLowerCase()}` : ''}`
    : `Editorial review by CreditStud.io.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(ogDesc)}">
  <link rel="canonical" href="https://creditstud.io/cards/${card.slug}/">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(ogDesc)}">
  <meta property="og:url" content="https://creditstud.io/cards/${card.slug}/">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="CreditStud.io">
  <meta property="og:image" content="https://creditstud.io/og-images/cards-${card.slug}.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(ogDesc)}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../style.css">
  <link rel="stylesheet" href="../../shared/components.css">
  <link rel="stylesheet" href="../card.css">
  <link rel="stylesheet" href="../../shared/share.css">
  <link rel="stylesheet" href="../../shared/email-capture.css">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#2563eb">
  <link rel="icon" type="image/svg+xml" href="/icon.svg">
  <link rel="apple-touch-icon" href="/icon.svg">

  <script type="application/ld+json">${renderProductSchema(card)}</script>
  <script type="application/ld+json">${renderFaqSchema(card.faqs)}</script>
</head>
<body>
  <!-- DISCLOSURE -->
  <div class="site-disclosure-banner">
    <div class="site-disclosure-container">
      CreditStud.io may earn commissions from credit card applications through affiliate links. This does not affect our rankings or recommendations.
      <a href="/disclosure.html">Learn more</a>
    </div>
  </div>
  <!-- /DISCLOSURE -->

  <header class="card-hero">
    <div class="container">
      ${navHtml(card.slug)}
      <span class="issuer-tag">${escapeHtml(card.issuer)}</span>
      <h1>${escapeHtml(card.name)}</h1>
      <div class="hero-stats">
        <div class="stat-card"><div class="stat-label">Annual fee</div><div class="stat-value">$${card.annualFee}</div></div>
        <div class="stat-card"><div class="stat-label">Welcome bonus</div><div class="stat-value">${escapeHtml(card.signupBonus.split(' after ')[0])}</div></div>
        <div class="stat-card"><div class="stat-label">Intro APR</div><div class="stat-value" style="font-size:0.85rem;">${escapeHtml(card.introAPR)}</div></div>
        <div class="stat-card"><div class="stat-label">Reg. APR</div><div class="stat-value" style="font-size:0.85rem;">${escapeHtml(card.regularAPR)}</div></div>
      </div>
      <a href="${escapeHtml(card.affiliateLink || '#')}" class="btn-apply-hero" target="_blank" rel="nofollow sponsored">Apply at ${escapeHtml(card.issuer)} →</a>
    </div>
  </header>

  <main class="container" style="max-width:900px;">

    <div class="verdict-box">
      <h2>Quick verdict</h2>
      <p>${escapeHtml(verdict)}</p>
    </div>

    <div class="ratings-grid">
      ${renderRatings(card.ratings)}
    </div>

    <section class="card-section">
      <h2><span class="icon">🎁</span> Welcome bonus</h2>
      <p style="font-size:1.05rem;">${escapeHtml(card.signupBonus)}</p>
    </section>

    <section class="card-section">
      <h2><span class="icon">⚡</span> Rewards</h2>
      ${renderRewards(card.rewards)}
      ${card.pointsValue ? `<p style="margin-top:12px;font-size:0.9rem;color:var(--text-secondary);">Points/miles valued at ${(card.pointsValue * 100).toFixed(2)}¢ each (CreditStud.io estimate based on typical travel redemption).</p>` : ''}
    </section>

    ${renderCredits(card.annualCredits)}

    <section class="card-section">
      <h2><span class="icon">✨</span> Perks</h2>
      ${renderPerks(card.perks)}
    </section>

    <section class="card-section">
      <h2><span class="icon">🎯</span> Who should consider this card</h2>
      <div class="fit-grid">
        <div class="fit-block fit-best">
          <h3>✅ Best for</h3>
          ${renderBestFor(card.bestFor)}
        </div>
        <div class="fit-block fit-skip">
          <h3>❌ Skip if</h3>
          <p>${escapeHtml(card.skipIf || 'No standout reasons to skip — but always do your own math.')}</p>
        </div>
      </div>
    </section>

    ${renderMath(card)}

    <section class="card-section">
      <h2><span class="icon">📋</span> Application tips</h2>
      <div class="app-tips">
        <div class="tip-row">
          <div class="tip-label">Credit needed</div>
          <div>${escapeHtml(card.creditScoreNeeded)}</div>
        </div>
        ${card.issuerRules ? `<div class="tip-row">
          <div class="tip-label">Issuer rules</div>
          <div>${escapeHtml(card.issuerRules)}</div>
        </div>` : ''}
      </div>
      <p style="margin-top:16px;font-size:0.9rem;">
        Not sure if you'll qualify? Try our <a href="/score-simulator/">credit score simulator</a> to see what rate range you might fall into.
      </p>
    </section>

    ${renderComparison(card, allCards)}

    ${renderFaqs(card.faqs)}

    <div class="card-cta-bar">
      <h2>Ready to apply?</h2>
      <p>Application takes 5 minutes. Approval decision typically instant for qualified applicants.</p>
      <a href="${escapeHtml(card.affiliateLink || '#')}" class="btn-apply" target="_blank" rel="nofollow sponsored">Apply at ${escapeHtml(card.issuer)} →</a>
    </div>

    <p class="review-meta">
      Reviewed by CreditStud.io editorial team • Last updated ${escapeHtml(card.reviewDate)} • <a href="/disclosure.html">Methodology &amp; disclosure</a>
    </p>

  </main>

  <footer class="footer">
    <div class="container">
      <p>CreditStud.io is for informational purposes only. Actual rates, terms, and eligibility may vary.</p>
      <p style="margin-top:8px;font-size:0.85rem;"><a href="/disclosure.html">Affiliate Disclosure</a></p>
    </div>
  </footer>

  <script src="../../shared/pwa.js"></script>
  <script src="../../shared/email-capture.js"></script>
  <script src="../../shared/share.js"></script>
</body>
</html>
`;
}

// === Render listing page ===

function renderListingPage(allCards) {
  const items = allCards.map(c => `
    <a href="/cards/${c.slug}/" class="cards-listing-card">
      <div class="listing-issuer">${escapeHtml(c.issuer)}</div>
      <h3>${escapeHtml(c.name)}</h3>
      <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5;">${escapeHtml((c.bestFor && c.bestFor[0]) || '')}</p>
      <div class="listing-stats">
        <div><span class="listing-stat-label">AF:</span> <span class="listing-stat-value">$${c.annualFee}</span></div>
        <div><span class="listing-stat-label">Rating:</span> <span class="listing-stat-value">${c.ratings.overall}/5 ★</span></div>
      </div>
      <div class="read-more">Read review →</div>
    </a>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credit Card Reviews — Honest Verdicts | CreditStud.io</title>
  <meta name="description" content="Honest credit card reviews with real math, perks breakdowns, and editorial verdicts. No fluff, no SEO filler — just the numbers.">
  <link rel="canonical" href="https://creditstud.io/cards/">
  <meta property="og:title" content="Credit Card Reviews — Honest Verdicts | CreditStud.io">
  <meta property="og:description" content="Honest credit card reviews with real math, perks breakdowns, and editorial verdicts. No fluff, no SEO filler — just the numbers.">
  <meta property="og:url" content="https://creditstud.io/cards/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="CreditStud.io">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../style.css">
  <link rel="stylesheet" href="../shared/components.css">
  <link rel="stylesheet" href="card.css">
  <link rel="stylesheet" href="../shared/share.css">
  <link rel="stylesheet" href="../shared/email-capture.css">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#2563eb">
  <link rel="icon" type="image/svg+xml" href="/icon.svg">
</head>
<body>
  <div class="site-disclosure-banner">
    <div class="site-disclosure-container">
      CreditStud.io may earn commissions from credit card applications through affiliate links. This does not affect our rankings or recommendations.
      <a href="/disclosure.html">Learn more</a>
    </div>
  </div>

  <header class="header">
    <div class="container">
      ${navHtml('listing')}
      <h1 class="logo">💳 Credit<span>Stud.io</span></h1>
      <p class="header-subtitle">Card Reviews — honest verdicts with real math</p>
    </div>
  </header>

  <main class="container" style="max-width:1100px;">
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);padding:20px 24px;margin:24px 0;">
      <p style="margin:0;font-size:0.95rem;line-height:1.6;">
        Every review here is written by humans who actually use these cards or research them deeply. We show our math, link to our calculators, and tell you when to skip a card — even if it pays a bigger commission.
      </p>
    </div>

    <h2 style="margin-bottom:0;">All reviews (${allCards.length})</h2>
    <div class="cards-listing-grid">
      ${items}
    </div>

    <div style="background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);border:1.5px solid #7dd3fc;border-radius:var(--radius);padding:24px;margin:32px 0;text-align:center;">
      <h3 style="margin:0 0 8px;color:#0369a1;">Not sure which card is right?</h3>
      <p style="margin:0 0 12px;">Our <a href="/rewards/">Rewards Calculator</a> picks the best card for your spending in seconds.</p>
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <p>CreditStud.io is for informational purposes only. Actual rates, terms, and eligibility may vary.</p>
      <p style="margin-top:8px;font-size:0.85rem;"><a href="/disclosure.html">Affiliate Disclosure</a></p>
    </div>
  </footer>

  <script src="../shared/pwa.js"></script>
  <script src="../shared/email-capture.js"></script>
  <script src="../shared/share.js"></script>
</body>
</html>
`;
}

// === Build ===

function build() {
  let count = 0;
  for (const card of CARD_REVIEWS) {
    const slugDir = path.join(cardsDir, card.slug);
    if (!fs.existsSync(slugDir)) fs.mkdirSync(slugDir, { recursive: true });
    const html = renderCardPage(card, CARD_REVIEWS);
    fs.writeFileSync(path.join(slugDir, 'index.html'), html, 'utf8');
    console.log(`  ✓ cards/${card.slug}/index.html`);
    count++;
  }

  const listingHtml = renderListingPage(CARD_REVIEWS);
  fs.writeFileSync(path.join(cardsDir, 'index.html'), listingHtml, 'utf8');
  console.log(`  ✓ cards/index.html`);

  console.log(`\nGenerated ${count} card review pages + 1 listing page.`);
}

if (require.main === module) {
  build();
}

module.exports = { build, renderCardPage, renderListingPage };
