/**
 * SmartPay Calculator — UI Controller
 */

const state = {
  selectedMethods: new Set(),
  customMethods: [],
  payoffMonths: 6,
  results: [],
  hideAnnualFee: false,
  showBnpl: true,
  showCards: true
};

// ── Render method selection cards ──────────────────────────────────────────

function renderMethodCards() {
  const bnplGrid = document.getElementById('bnpl-grid');
  const cardGrid = document.getElementById('card-grid');
  const bnplSection = bnplGrid.closest('.method-section');
  const cardSection = cardGrid.closest('.method-section');

  bnplGrid.innerHTML = '';
  cardGrid.innerHTML = '';

  // BNPL section
  if (state.showBnpl) {
    bnplSection.classList.remove('hidden');
    BNPL_METHODS.forEach(m => bnplGrid.appendChild(createMethodCard(m)));
    BNPL_MONTHLY_PLANS.forEach(m => bnplGrid.appendChild(createMethodCard(m)));
  } else {
    bnplSection.classList.add('hidden');
    BNPL_METHODS.forEach(m => state.selectedMethods.delete(m.id));
    BNPL_MONTHLY_PLANS.forEach(m => state.selectedMethods.delete(m.id));
  }

  // Credit Cards section
  if (state.showCards) {
    cardSection.classList.remove('hidden');
    const visibleCards = CREDIT_CARDS.filter(m => {
      if ((m.annualFee || 0) > 0 && state.hideAnnualFee) return false;
      return true;
    });
    visibleCards.forEach(m => cardGrid.appendChild(createMethodCard(m)));
  } else {
    cardSection.classList.add('hidden');
    CREDIT_CARDS.forEach(m => state.selectedMethods.delete(m.id));
  }
}

function createMethodCard(method) {
  const div = document.createElement('div');
  div.className = 'method-card' + (state.selectedMethods.has(method.id) ? ' selected' : '');
  div.dataset.id = method.id;

  div.innerHTML = `
    <div class="method-check">${state.selectedMethods.has(method.id) ? '✓' : ''}</div>
    <div class="method-name">${method.name}</div>
    <div class="method-detail">${method.detail}</div>
  `;

  div.addEventListener('click', () => toggleMethod(method.id));
  return div;
}

function toggleMethod(id) {
  if (state.selectedMethods.has(id)) {
    state.selectedMethods.delete(id);
  } else {
    state.selectedMethods.add(id);
  }
  const card = document.querySelector(`.method-card[data-id="${id}"]`);
  if (card) {
    const isSelected = state.selectedMethods.has(id);
    card.classList.toggle('selected', isSelected);
    card.querySelector('.method-check').textContent = isSelected ? '✓' : '';
  }
}

// ── Custom method handling ─────────────────────────────────────────────────

document.getElementById('add-custom-btn').addEventListener('click', () => {
  document.getElementById('custom-form').classList.remove('hidden');
  document.getElementById('add-custom-btn').classList.add('hidden');
});

document.getElementById('cancel-custom-btn').addEventListener('click', () => {
  document.getElementById('custom-form').classList.add('hidden');
  document.getElementById('add-custom-btn').classList.remove('hidden');
  clearCustomForm();
});

document.getElementById('save-custom-btn').addEventListener('click', () => {
  const name = document.getElementById('custom-name').value.trim();
  const type = document.getElementById('custom-type').value;
  const apr = parseFloat(document.getElementById('custom-apr').value) || 0;
  const rewards = parseFloat(document.getElementById('custom-rewards').value) || 0;
  const introApr = parseFloat(document.getElementById('custom-intro-apr').value) || 0;
  const introMonths = parseInt(document.getElementById('custom-intro-months').value) || 0;

  if (!name) { alert('Please enter a name for your card or service.'); return; }

  const id = 'custom-' + Date.now();
  const method = {
    id, name, type,
    detail: `${rewards > 0 ? rewards + '% rewards · ' : ''}${introMonths > 0 ? introMonths + ' mo ' + introApr + '% intro · ' : ''}${apr}% APR`,
    interestRate: apr,
    hasIntroApr: introMonths > 0,
    introAprRate: introApr,
    introAprMonths: introMonths,
    pointsRate: rewards,
    pointValue: 1.0,
    annualFee: 0,
    lateFee: 0,
    minPurchase: 0,
    maxPurchase: null
  };

  state.customMethods.push(method);
  state.selectedMethods.add(id);
  renderCustomTags();
  document.getElementById('custom-form').classList.add('hidden');
  document.getElementById('add-custom-btn').classList.remove('hidden');
  clearCustomForm();
});

function clearCustomForm() {
  ['custom-name', 'custom-apr', 'custom-rewards', 'custom-intro-apr', 'custom-intro-months']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('custom-type').value = 'credit-card';
}

function renderCustomTags() {
  const container = document.getElementById('custom-methods-list');
  container.innerHTML = '';
  state.customMethods.forEach(m => {
    const tag = document.createElement('div');
    tag.className = 'custom-tag';
    tag.innerHTML = `
      <span>${m.name}</span>
      <small style="color:var(--text-secondary)">${m.detail}</small>
      <button class="remove-custom" data-id="${m.id}" title="Remove">×</button>
    `;
    tag.querySelector('.remove-custom').addEventListener('click', () => removeCustom(m.id));
    container.appendChild(tag);
  });
}

function removeCustom(id) {
  state.customMethods = state.customMethods.filter(m => m.id !== id);
  state.selectedMethods.delete(id);
  renderCustomTags();
}

// ── Calculate ──────────────────────────────────────────────────────────────

// ── Collapsible Methods Section ──────────────────────────────────────────────

const methodsHeader = document.getElementById('methods-header');
const methodsContent = document.getElementById('methods-content');
const expandBtn = document.getElementById('expand-methods-btn');
const collapseBtn = document.getElementById('collapse-methods-btn');

function toggleMethods() {
  const isCollapsed = methodsContent.classList.contains('collapsed');
  methodsContent.classList.toggle('collapsed', !isCollapsed);
  expandBtn.textContent = isCollapsed ? 'Change ▼' : 'Change ▶';
  updateSelectedCount();
}

function expandMethods() {
  methodsContent.classList.remove('collapsed');
  expandBtn.textContent = 'Change ▼';
}

function collapseMethods() {
  methodsContent.classList.add('collapsed');
  expandBtn.textContent = 'Change ▶';
  updateSelectedCount();
}

function updateSelectedCount() {
  const count = state.selectedMethods.size + state.customMethods.length;
  const countText = document.querySelector('.selected-count');
  if (countText) {
    countText.textContent = count > 0 ? `(${count} selected)` : '(Using defaults)';
  }
}

if (methodsHeader) methodsHeader.addEventListener('click', (e) => {
  if (e.target !== expandBtn && !e.target.closest('#collapse-methods-btn')) {
    toggleMethods();
  }
});

if (expandBtn) expandBtn.addEventListener('click', expandMethods);
if (collapseBtn) collapseBtn.addEventListener('click', collapseMethods);

// ── Months selector ──────────────────────────────────────────────────────────

const monthsSelect = document.getElementById('payoff-months');
if (monthsSelect) {
  monthsSelect.addEventListener('change', (e) => {
    state.payoffMonths = parseInt(e.target.value);
  });
}

// ── Calculate ────────────────────────────────────────────────────────────────

document.getElementById('calculate-btn').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('purchase-amount').value);
  const targetMonths = parseInt(document.getElementById('payoff-months').value) || 6;

  if (!amount || amount <= 0) {
    alert('Please enter a purchase amount.');
    document.getElementById('purchase-amount').focus();
    return;
  }

  if (state.selectedMethods.size === 0) {
    alert('Please select at least one payment method to compare.');
    return;
  }

  state.payoffMonths = targetMonths;
  const creditScore = document.getElementById('credit-score').value;
  const allMethods = [...BNPL_METHODS, ...BNPL_MONTHLY_PLANS, ...CREDIT_CARDS, ...state.customMethods];
  const selectedMethods = allMethods.filter(m => state.selectedMethods.has(m.id));

  const { all, newCardOptions, alternatives } = calculateOptions({
    amount,
    creditScore,
    selectedMethods,
    targetMonths
  });

  state.results = all;
  renderResults(all, newCardOptions, alternatives, amount, targetMonths);
  document.getElementById('results-section').classList.remove('hidden');
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ── Render results ─────────────────────────────────────────────────────────

function renderResults(all, newCardOptions, alternatives, amount, targetMonths) {
  const container = document.getElementById('results-cards');
  container.innerHTML = '';

  // Disclosure
  const hasAnyAffiliate = all.some(r => AFFILIATE_LINKS[r.id]);
  document.getElementById('affiliate-disclosure').classList.toggle('hidden', !hasAnyAffiliate);

  // Credit Karma CTA
  const ckLink = (typeof SUPPLEMENTARY_LINKS !== 'undefined') ? SUPPLEMENTARY_LINKS['credit-karma'] : '';
  const ctaEl = document.getElementById('credit-score-cta');
  const ckLinkEl = document.getElementById('credit-karma-link');
  if (ckLink && ctaEl && ckLinkEl) {
    ckLinkEl.href = ckLink;
    ctaEl.classList.remove('hidden');
  } else if (ctaEl) {
    ctaEl.classList.add('hidden');
  }

  if (all.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary)">No matching options found for this amount. Try adjusting your selections.</p>';
    return;
  }

  const subtitle = document.getElementById('results-subtitle');
  subtitle.textContent = `Best options for your ${fmt(amount)} purchase paid off in ${targetMonths} months.`;

  // Best Match Section
  const bestMatchSection = document.getElementById('best-match-section');
  const bestMatchCard = document.getElementById('best-match-card');
  bestMatchSection.classList.remove('hidden');

  // Find best match - exact or closest term match
  const bestMatch = all[0]; // Already sorted by net cost
  bestMatchCard.innerHTML = '';
  bestMatchCard.appendChild(createResultCard(bestMatch, 1, bestMatch, true));

  // Add "why this is best" badge
  const whyBadge = document.createElement('div');
  whyBadge.className = 'best-match-why';
  const monthlyPmt = bestMatch.monthlyPayment || (bestMatch.principal / (bestMatch.termMonths || targetMonths));
  whyBadge.innerHTML = `✓ ${fmt(monthlyPmt)}/mo · ${bestMatch.termDisplay || targetMonths + ' months'} · Lowest total cost`;
  bestMatchCard.insertBefore(whyBadge, bestMatchCard.firstChild);

  // New Card Options (if any with savings)
  const newCardSection = document.getElementById('new-card-option');
  const newCardContainer = document.getElementById('new-card-cards');
  const hasSavings = newCardOptions.some(o => o.savingsVsExisting > 0);

  if (hasSavings && newCardOptions.length > 0) {
    newCardSection.classList.remove('hidden');
    newCardContainer.innerHTML = '';
    newCardOptions.slice(0, 2).forEach((o, i) => {
      newCardContainer.appendChild(createNewCardOptionCard(o, i + 1));
    });
  } else {
    newCardSection.classList.add('hidden');
  }

  // Alternatives Section
  const altSection = document.getElementById('alternatives-section');
  const altContainer = document.getElementById('alternatives-cards');

  if (alternatives.length > 0) {
    altSection.classList.remove('hidden');
    altContainer.innerHTML = '';
    alternatives.slice(0, 5).forEach((r, i) => {
      altContainer.appendChild(createResultCard(r, i + 2, bestMatch));
    });
  } else {
    altSection.classList.add('hidden');
  }

  // Keep the payoff table at bottom
  renderPayoffTable(all);
}

function createNewCardOptionCard(o, rank) {
  const card = document.createElement('div');
  card.className = 'result-card';

  const withinIntro = o.termMonths <= (o.introMonths || 0);
  const savingsText = o.savingsVsExisting > 0 ? `Save ${fmt(o.savingsVsExisting)} vs existing card` : '';

  card.innerHTML = `
    <div class="new-card-badge">🎁 New Card Offer</div>
    <div class="result-header">
      <div>
        <div class="result-name">${o.name}</div>
        <div class="result-type">${o.type}</div>
      </div>
      <div class="result-cost">
        <div class="result-total">${fmt(o.netCost)}</div>
        ${savingsText ? `<div class="result-savings">${savingsText}</div>` : ''}
      </div>
    </div>
    <div class="result-details">
      <div class="detail-item">
        <span class="detail-label">Monthly Payment</span>
        <span class="detail-value">${fmt(o.monthlyPayment)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Interest</span>
        <span class="detail-value good">${o.interestPaid === 0 ? '$0 ✓' : fmt(o.interestPaid)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Term</span>
        <span class="detail-value">${o.termDisplay}</span>
      </div>
    </div>
    <div class="result-notes good-note" style="margin-top: 10px;">
      ${o.why}
    </div>
    ${AFFILIATE_LINKS[o.id] ? `<a href="${AFFILIATE_LINKS[o.id]}" target="_blank" rel="noopener sponsored" class="btn-apply">Apply Now →</a>` : ''}
  `;

  return card;
}

function createResultCard(r, rank, best, isBestMatch = false) {
  if (isBestMatch) {
    // Simplified card for best match
    return createBestMatchCard(r);
  }
  return createStandardResultCard(r, rank, best);
}

function createBestMatchCard(r) {
  const card = document.createElement('div');
  card.className = 'result-card';

  const costColor = r.interestPaid > r.principal * 0.1 ? 'danger'
    : r.interestPaid > 0 ? 'warning' : 'good';

  const isCreditCard = r.subtype === 'credit-card';
  const aprDisplay = isCreditCard && r.effectiveApr ? `<span class="apr-value">${r.effectiveApr.toFixed(1)}% APR</span>` : '';

  let html = `
    <div class="result-header">
      <div>
        <div class="result-name">${r.name}</div>
        <div class="result-type">${r.type}</div>
      </div>
      <div class="result-cost">
        <div class="result-total">${fmt(r.netCost)}</div>
        ${r.rewardsEarned > 0 ? `<div class="result-savings">Incl. ${fmt(r.rewardsEarned)} rewards</div>` : ''}
      </div>
    </div>
    <div class="result-details">
      <div class="detail-item">
        <span class="detail-label">Monthly Payment</span>
        <span class="detail-value">${fmt(r.monthlyPayment || r.principal / (r.termMonths || 6))}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Interest / Fees</span>
        <span class="detail-value ${costColor}">${r.interestPaid + r.fees > 0 ? fmt(r.interestPaid + r.fees) : '$0 ✓'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Term</span>
        <span class="detail-value">${r.termDisplay || '—'}</span>
      </div>
    </div>
  `;

  // Add APR comparison for credit cards
  if (isCreditCard && r.effectiveApr) {
    html += `
      <div class="apr-comparison">
        <span class="apr-label">Interest rate:</span>
        ${aprDisplay}
      </div>
    `;
  }

  // Notes & warnings
  const allNotes = [...(r.notes || []), ...(r.warnings || [])];
  if (allNotes.length > 0) {
    const isWarning = r.warnings && r.warnings.length > 0;
    html += `<div class="result-notes ${!isWarning ? 'good-note' : ''}">
      ${allNotes.map(n => `• ${n}`).join('<br>')}
    </div>`;
  }

  // Affiliate button
  const affiliateUrl = AFFILIATE_LINKS[r.id];
  if (affiliateUrl) {
    const btnLabel = r.subtype === 'bnpl' ? 'Sign Up' : 'Learn More';
    html += `<a href="${affiliateUrl}" target="_blank" rel="noopener sponsored" class="btn-apply">${btnLabel} →</a>`;
  }

  card.innerHTML = html;
  return card;
}

function createStandardResultCard(r, rank, best) {
  const card = document.createElement('div');
  card.className = 'result-card';

  const rankLabels = ['Best Choice', '2nd Best', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-4', 'rank-5'];
  const savings = rank > 1 ? r.netCost - best.netCost : null;

  const costColor = r.interestPaid > r.principal * 0.1 ? 'danger'
    : r.interestPaid > 0 ? 'warning' : 'good';

  const isCreditCard = r.subtype === 'credit-card';
  const aprDisplay = isCreditCard && r.effectiveApr ? `<span class="apr-value">${r.effectiveApr.toFixed(1)}% APR</span>` : '';

  let html = `
    <div class="result-rank ${rankClasses[Math.min(rank - 1, 4)]}">${rankLabels[Math.min(rank - 1, 9)]}</div>
    <div class="result-header">
      <div>
        <div class="result-name">${r.name}</div>
        <div class="result-type">${r.type}</div>
      </div>
      <div class="result-cost">
        <div class="result-total">${fmt(r.netCost)}</div>
        ${savings !== null ? `<div class="result-savings">+${fmt(savings)} more</div>` : ''}
        ${rank === 1 && r.rewardsEarned > 0 ? `<div class="result-savings">Incl. ${fmt(r.rewardsEarned)} rewards</div>` : ''}
      </div>
    </div>
    <div class="result-details">
      <div class="detail-item">
        <span class="detail-label">${r.paymentLabel ? 'Schedule' : 'Monthly Payment'}</span>
        <span class="detail-value">${r.paymentLabel || fmt(r.monthlyPayment)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Interest / Fees</span>
        <span class="detail-value ${costColor}">${r.interestPaid + r.fees > 0 ? fmt(r.interestPaid + r.fees) : '$0 ✓'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Term</span>
        <span class="detail-value">${r.termDisplay || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Rewards</span>
        <span class="detail-value good">${r.rewardsEarned > 0 ? fmt(r.rewardsEarned) : '—'}</span>
      </div>
    </div>
  `;

  // APR comparison for credit cards
  if (isCreditCard && r.effectiveApr) {
    html += `
      <div class="apr-comparison">
        <span class="apr-label">Interest rate:</span>
        ${aprDisplay}
      </div>
    `;
  }

  // Scenario table for credit cards
  if (r.scenarios && r.scenarios.length > 1) {
    const minScenario = r.scenarios.find(s => s.label === 'Minimum payments');
    const minIsDangerous = minScenario && minScenario.interestPaid > r.principal * 0.1;

    html += `
      <table class="scenario-table">
        <thead>
          <tr>
            <th>Payoff Plan</th>
            <th>Monthly</th>
            <th>Interest</th>
            <th>Total Cost</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${r.scenarios.map(s => {
            const isMin = s.label === 'Minimum payments';
            const cls = s.isDefault ? 'scenario-highlight'
              : (isMin && s.interestPaid > 0) ? 'scenario-danger'
              : '';
            const interestCell = s.interestPaid > 0
              ? `<span style="color:var(--danger);font-weight:600">${fmt(s.interestPaid)}</span>`
              : '<span style="color:var(--success)">$0</span>';
            const costCell = isMin && s.interestPaid > 0
              ? `<strong style="color:var(--danger)">${fmt(s.netCost)}</strong>`
              : `<strong>${fmt(s.netCost)}</strong>`;
            return `<tr class="${cls}">
              <td class="scenario-label">${isMin && s.interestPaid > 0 ? '⚠️ ' + s.label : s.label}</td>
              <td>${fmt(s.monthlyPayment)}</td>
              <td>${interestCell}</td>
              <td>${costCell}</td>
              <td>${s.termDisplay}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;

    if (minIsDangerous) {
      const pctMore = ((minScenario.netCost / r.principal - 1) * 100).toFixed(0);
      html += `<div class="result-notes" style="margin-top:8px">
        ⚠️ <strong>Minimum payments trap:</strong> You'd pay ${pctMore}% more (${fmt(minScenario.interestPaid)} in interest) and take ${minScenario.termDisplay} to pay off this ${fmt(r.principal)} purchase.
      </div>`;
    }
  }

  // Notes & warnings
  const allNotes = [...(r.notes || []), ...(r.warnings || [])];
  if (allNotes.length > 0) {
    const isWarning = r.warnings && r.warnings.length > 0;
    html += `<div class="result-notes ${!isWarning ? 'good-note' : ''}">
      ${allNotes.map(n => `• ${n}`).join('<br>')}
    </div>`;
  }

  // Affiliate button
  const affiliateUrl = AFFILIATE_LINKS[r.id];
  if (affiliateUrl) {
    const btnLabel = r.subtype === 'bnpl' ? 'Sign Up' : 'Learn More';
    html += `<a href="${affiliateUrl}" target="_blank" rel="noopener sponsored" class="btn-apply">${btnLabel} →</a>`;
  }

  card.innerHTML = html;
  return card;
}
  const card = document.createElement('div');
  card.className = 'result-card';

  const rankLabels = ['🏆 Best Choice', '2nd Best', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-4', 'rank-5'];
  const savings = rank > 1 ? r.netCost - best.netCost : null;
  const isBest = rank === 1;

  const costColor = r.interestPaid > r.principal * 0.1 ? 'danger'
    : r.interestPaid > 0 ? 'warning' : 'good';

  // Availability badge
  const availBadge = r.availability === 'anywhere' ? '<span class="availability-badge avail-anywhere">Works everywhere</span>'
    : r.availability === 'partner' ? '<span class="availability-badge avail-partner">Partner merchants only</span>'
    : r.availability === 'both' ? '<span class="availability-badge avail-both">Anywhere (virtual card) + partners</span>'
    : '';

  let html = `
    <div class="result-rank ${rankClasses[Math.min(rank - 1, 4)]}">${rankLabels[Math.min(rank - 1, 9)]}</div>
    <div class="result-header">
      <div>
        <div class="result-name">${r.name}</div>
        <div class="result-type">${r.type}</div>
        ${availBadge}
      </div>
      <div class="result-cost">
        <div class="result-total">${fmt(r.netCost)}</div>
        ${savings !== null ? `<div class="result-savings">+${fmt(savings)} more</div>` : ''}
        ${isBest && r.rewardsEarned > 0 ? `<div class="result-savings">Incl. ${fmt(r.rewardsEarned)} rewards</div>` : ''}
      </div>
    </div>
    <div class="result-details">
      <div class="detail-item">
        <span class="detail-label">${r.paymentLabel ? 'Schedule' : 'Monthly Payment'}</span>
        <span class="detail-value">${r.paymentLabel || fmt(r.monthlyPayment)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Interest / Fees</span>
        <span class="detail-value ${costColor}">${r.interestPaid + r.fees > 0 ? fmt(r.interestPaid + r.fees) : '$0 ✓'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Term</span>
        <span class="detail-value">${r.termDisplay || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Rewards</span>
        <span class="detail-value good">${r.rewardsEarned > 0 ? fmt(r.rewardsEarned) : '—'}</span>
      </div>
    </div>
  `;

  // Scenario table for credit cards — always show so user sees the danger of minimums
  if (r.scenarios && r.scenarios.length > 1) {
    const minScenario = r.scenarios.find(s => s.label === 'Minimum payments');
    const minIsDangerous = minScenario && minScenario.interestPaid > r.principal * 0.1;

    html += `
      <table class="scenario-table">
        <thead>
          <tr>
            <th>Payoff Plan</th>
            <th>Monthly</th>
            <th>Interest</th>
            <th>Total Cost</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${r.scenarios.map(s => {
            const isMin = s.label === 'Minimum payments';
            const cls = s.isDefault ? 'scenario-highlight'
              : (isMin && s.interestPaid > 0) ? 'scenario-danger'
              : '';
            const interestCell = s.interestPaid > 0
              ? `<span style="color:var(--danger);font-weight:600">${fmt(s.interestPaid)}</span>`
              : '<span style="color:var(--success)">$0</span>';
            const costCell = isMin && s.interestPaid > 0
              ? `<strong style="color:var(--danger)">${fmt(s.netCost)}</strong>`
              : `<strong>${fmt(s.netCost)}</strong>`;
            return `<tr class="${cls}">
              <td class="scenario-label">${isMin && s.interestPaid > 0 ? '⚠️ ' + s.label : s.label}</td>
              <td>${fmt(s.monthlyPayment)}</td>
              <td>${interestCell}</td>
              <td>${costCell}</td>
              <td>${s.termDisplay}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;

    // Warning callout if minimum payments are brutal
    if (minIsDangerous) {
      const pctMore = ((minScenario.netCost / r.principal - 1) * 100).toFixed(0);
      html += `<div class="result-notes" style="margin-top:8px">
        ⚠️ <strong>Minimum payments trap:</strong> You'd pay ${pctMore}% more (${fmt(minScenario.interestPaid)} in interest) and take ${minScenario.termDisplay} to pay off this ${fmt(r.principal)} purchase.
      </div>`;
    }
  }

  // Annual rewards & fee advice for credit cards
  if (r.annualRewardInfo && r.annualRewardInfo.blendedPct > 0) {
    const info = r.annualRewardInfo;
    const feeClass = info.feeAdvice
      ? (info.feeAdvice.verdict === 'worth-it' ? 'good-note' : 'result-notes')
      : 'good-note';

    html += `<div class="annual-rewards-box">`;
    html += `<div class="annual-rewards-header">Annual Rewards Estimate <small>(based on avg US spending)</small></div>`;
    html += `<div class="annual-rewards-stats">`;
    html += `<span><strong>${fmt(info.annualRewards)}</strong>/yr in rewards</span>`;
    html += `<span>~${info.blendedPct.toFixed(1)}% blended rate</span>`;
    if (info.feeAdvice) {
      html += `<span><strong>${fmt(info.netAnnualRewards)}</strong>/yr after $${r.fees} fee</span>`;
    }
    html += `</div>`;
    if (info.feeAdvice) {
      html += `<div class="fee-advice ${feeClass}">${info.feeAdvice.message}</div>`;
    }
    if (info.breakeven && !info.feeAdvice) {
      // No fee but show breakeven info anyway? Skip.
    }
    html += `</div>`;
  }

  // Notes & warnings
  const allNotes = [...(r.notes || []), ...(r.warnings || [])];
  if (allNotes.length > 0) {
    const isWarning = r.warnings && r.warnings.length > 0;
    html += `<div class="result-notes ${!isWarning ? 'good-note' : ''}">
      ${allNotes.map(n => `• ${n}`).join('<br>')}
    </div>`;
  }

  // Affiliate button
  const affiliateUrl = AFFILIATE_LINKS[r.id];
  if (affiliateUrl) {
    const btnLabel = r.subtype === 'bnpl' ? 'Sign Up' : 'Apply Now';
    html += `<a href="${affiliateUrl}" target="_blank" rel="noopener sponsored" class="btn-apply">${btnLabel} →</a>`;
  }

  card.innerHTML = html;
  return card;
}

function renderPayoffTable(results) {
  const wrapper = document.getElementById('payoff-table-wrapper');
  const section = document.getElementById('payoff-comparison');

  const table = document.createElement('table');
  table.className = 'payoff-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Option</th>
        <th>Type</th>
        <th>Purchase</th>
        <th>Interest + Fees</th>
        <th>Rewards</th>
        <th>Net Total</th>
        <th>Where</th>
      </tr>
    </thead>
    <tbody>
      ${results.map((r, i) => `
        <tr class="${i === 0 ? 'best-row' : ''}">
          <td><strong>${r.name}</strong></td>
          <td>${r.type}</td>
          <td>${fmt(r.principal)}</td>
          <td style="color:${(r.interestPaid + r.fees) > 0 ? 'var(--danger)' : 'var(--success)'}">${fmt(r.interestPaid + r.fees)}</td>
          <td style="color:${r.rewardsEarned > 0 ? 'var(--success)' : 'var(--text-secondary)'}">${r.rewardsEarned > 0 ? '-' + fmt(r.rewardsEarned) : '—'}</td>
          <td><strong>${fmt(r.netCost)}</strong></td>
          <td>${r.availability === 'anywhere' ? '✅ Anywhere' : r.availability === 'both' ? '✅ Anywhere*' : '⚠️ Partners'}</td>
        </tr>
      `).join('')}
    </tbody>
  `;

  wrapper.innerHTML = '';
  wrapper.appendChild(table);
  section.classList.remove('hidden');
}

// ── Filter handlers ──────────────────────────────────────────────────────

document.getElementById('toggle-show-bnpl').addEventListener('change', (e) => {
  state.showBnpl = e.target.checked;
  if (state.showBnpl) {
    BNPL_METHODS.forEach(m => state.selectedMethods.add(m.id));
    BNPL_MONTHLY_PLANS.forEach(m => state.selectedMethods.add(m.id));
  }
  renderMethodCards();
});

document.getElementById('toggle-show-cards').addEventListener('change', (e) => {
  state.showCards = e.target.checked;
  if (state.showCards) {
    CREDIT_CARDS.forEach(m => {
      if (!((m.annualFee || 0) > 0 && state.hideAnnualFee)) {
        state.selectedMethods.add(m.id);
      }
    });
  }
  renderMethodCards();
});

document.getElementById('toggle-hide-annual-fee').addEventListener('change', (e) => {
  state.hideAnnualFee = e.target.checked;
  if (state.hideAnnualFee) {
    CREDIT_CARDS.filter(m => (m.annualFee || 0) > 0).forEach(m => state.selectedMethods.delete(m.id));
  }
  renderMethodCards();
});

// ── Init ───────────────────────────────────────────────────────────────────

// Pre-select all payment methods by default
BNPL_METHODS.forEach(m => state.selectedMethods.add(m.id));
BNPL_MONTHLY_PLANS.forEach(m => state.selectedMethods.add(m.id));
CREDIT_CARDS.forEach(m => state.selectedMethods.add(m.id));

renderMethodCards();
updateSelectedCount();

// Set initial months from select
const monthsSelectInit = document.getElementById('payoff-months');
if (monthsSelectInit) {
  state.payoffMonths = parseInt(monthsSelectInit.value) || 6;
}
