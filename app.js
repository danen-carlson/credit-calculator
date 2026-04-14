/**
 * SmartPay Calculator — UI Controller
 */

const state = {
  selectedMethods: new Set(),
  customMethods: [],
  payoffPct: 20,
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

// ── Payoff slider ──────────────────────────────────────────────────────────

const slider = document.getElementById('payoff-pct');
const sliderDisplay = document.getElementById('payoff-pct-display');
const presetBtns = document.querySelectorAll('.preset-btn');

function updateSliderDisplay(val) {
  const v = parseInt(val);
  state.payoffPct = v;
  if (v >= 100) {
    sliderDisplay.textContent = 'Pay in full';
  } else if (v <= 2) {
    sliderDisplay.textContent = 'Minimum payments (~2%)';
  } else {
    sliderDisplay.textContent = `${v}% of balance/mo`;
  }
  // Update active preset
  presetBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.value) === v);
  });
}

slider.addEventListener('input', (e) => updateSliderDisplay(e.target.value));

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const v = btn.dataset.value;
    slider.value = v;
    updateSliderDisplay(v);
  });
});

// ── Calculate ──────────────────────────────────────────────────────────────

document.getElementById('calculate-btn').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('purchase-amount').value);

  if (!amount || amount <= 0) {
    alert('Please enter a purchase amount.');
    document.getElementById('purchase-amount').focus();
    return;
  }

  if (state.selectedMethods.size === 0) {
    alert('Please select at least one payment method to compare.');
    return;
  }

  const creditScore = document.getElementById('credit-score').value;
  const allMethods = [...BNPL_METHODS, ...BNPL_MONTHLY_PLANS, ...CREDIT_CARDS, ...state.customMethods];
  const selectedMethods = allMethods.filter(m => state.selectedMethods.has(m.id));

  const { all, zeroInterestTier, monthlyTier } = calculateOptions({
    amount,
    creditScore,
    selectedMethods,
    payoffPct: state.payoffPct
  });

  state.results = all;
  renderResults(all, zeroInterestTier, monthlyTier, amount);
  document.getElementById('results-section').classList.remove('hidden');
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ── Render results ─────────────────────────────────────────────────────────

function renderResults(all, zeroTier, monthlyTier, amount) {
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
  subtitle.textContent = `Comparing ${all.length} options for your ${fmt(amount)} purchase.`;

  // Zero-interest tier
  if (zeroTier.length > 0) {
    container.innerHTML += '<h3 class="tier-heading">⚡ Zero Interest Options</h3><p class="tier-desc">Pay it off quickly with no interest charges.</p>';
    zeroTier.slice(0, 6).forEach((r, i) => {
      container.appendChild(createResultCard(r, i + 1, zeroTier[0]));
    });
  }

  // Monthly payment tier
  if (monthlyTier.length > 0) {
    container.innerHTML += '<h3 class="tier-heading">📅 Monthly Payment Plans</h3><p class="tier-desc">Spread payments over months. Interest applies based on your credit score.</p>';
    // Re-rank within this tier
    const sorted = [...monthlyTier].sort((a, b) => a.netCost - b.netCost);
    sorted.slice(0, 10).forEach((r, i) => {
      container.appendChild(createResultCard(r, i + 1, sorted[0]));
    });
  }

  renderPayoffTable(all);
}

function createResultCard(r, rank, best) {
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
