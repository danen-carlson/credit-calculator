// Annual Fee Worth It Calculator — CreditStud.io
// Rewritten 2026-05-12 to fix critical rewards calculation bug.
//
// CORRECT REWARDS MATH:
//   For points cards:   annual$ = monthlySpend × multiplier × pointValue × 12
//                       (e.g. $200 × 5pts/$ × $0.0205/pt × 12 = $246/yr)
//   For cashback cards: annual$ = monthlySpend × (rate/100) × 12
//                       (e.g. $200 × 0.03 × 12 = $72/yr)
//
// Category matching uses exact key match (not substring includes) to avoid
// "gas" matching "All other" or similar misfires.

(function () {
  'use strict';

  let selectedCard = null;
  let useConservativeValuation = false; // For Bilt-style cards with transfer partners

  const SPENDING_CATEGORIES = [
    { key: 'dining', label: 'Dining', icon: '🍽️' },
    { key: 'groceries', label: 'Groceries', icon: '🛒' },
    { key: 'travel', label: 'Travel', icon: '✈️' },
    { key: 'gas', label: 'Gas', icon: '⛽' },
    { key: 'streaming', label: 'Streaming', icon: '📺' },
    { key: 'online', label: 'Online Shopping', icon: '📦' },
    { key: 'utilities', label: 'Utilities', icon: '💡' },
    { key: 'other', label: 'Other', icon: '🔹' }
  ];

  const DEFAULT_SPEND = {
    dining: 200,
    groceries: 400,
    travel: 100,
    gas: 150,
    streaming: 50,
    online: 200,
    utilities: 150,
    other: 300
  };

  // Elements
  const searchEl = document.getElementById('cardSearch');
  const cardListEl = document.getElementById('cardList');
  const selectedCardEl = document.getElementById('selectedCard');
  const step2El = document.getElementById('step2');
  const resultsEl = document.getElementById('results');
  const spendingGridEl = document.getElementById('spendingGrid');
  const perksGridEl = document.getElementById('perksGrid');
  const changeCardBtn = document.getElementById('changeCard');
  const wouldSpendToggle = document.getElementById('wouldSpendAnyway');

  function formatCurrency(amount) {
    const neg = amount < 0;
    return (neg ? '−' : '') + '$' + Math.abs(Math.round(amount)).toLocaleString();
  }

  // ── Math helpers ─────────────────────────────────────────────────────────

  // Get the active point value for a card (with conservative-mode override)
  function getPointValue(card) {
    if (useConservativeValuation && card.pointValueConservative != null) {
      return card.pointValueConservative;
    }
    return card.pointValue || 0.01;
  }

  // Find the reward entry for a given category, with explicit fallback to 'other'.
  // Uses EXACT category key match — no substring includes.
  function findReward(card, categoryKey) {
    // Exact match
    let reward = card.rewards.find(r => r.category === categoryKey);
    if (reward) return reward;
    // Fallback to 'other' (catch-all)
    reward = card.rewards.find(r => r.category === 'other');
    if (reward) return reward;
    // Last resort: 1x/1% catch-all
    return { category: categoryKey, rate: 1, type: card.rewards[0]?.type || 'cashback' };
  }

  // Effective % return for a category. Used for display only.
  function effectivePercent(card, reward) {
    if (reward.type === 'cashback') return reward.rate;
    return reward.rate * getPointValue(card) * 100;
  }

  // Annual rewards value for a category. THE CORE FIX.
  function annualRewardsValue(card, reward, monthlySpend) {
    if (reward.type === 'cashback') {
      // rate is the percent (e.g. 3 for 3%)
      return monthlySpend * (reward.rate / 100) * 12;
    }
    // points: rate × pointValue × spend × months
    return monthlySpend * reward.rate * getPointValue(card) * 12;
  }

  // ── Card search & selection ──────────────────────────────────────────────

  function renderCardList(filter) {
    const term = (filter || '').toLowerCase();
    cardListEl.innerHTML = '';
    const filtered = FEE_CARDS.filter(c =>
      c.name.toLowerCase().includes(term) || c.issuer.toLowerCase().includes(term)
    );
    if (filtered.length === 0) {
      cardListEl.innerHTML = '<div class="card-list-item">No cards found</div>';
      return;
    }
    filtered.forEach(card => {
      const item = document.createElement('div');
      item.className = 'card-list-item';
      item.innerHTML = `
        <div>
          <div class="card-list-item-name">${escapeHtml(card.name)}</div>
          <div class="card-list-item-meta">${escapeHtml(card.issuer)}</div>
        </div>
        <div class="card-list-item-af">${card.annualFee === 0 ? 'No AF' : '$' + card.annualFee + '/yr'}</div>
      `;
      item.addEventListener('click', () => selectCard(card));
      cardListEl.appendChild(item);
    });
    cardListEl.classList.add('active');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  searchEl.addEventListener('input', (e) => renderCardList(e.target.value));
  searchEl.addEventListener('focus', () => renderCardList(searchEl.value));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.card-search-wrapper')) {
      cardListEl.classList.remove('active');
    }
  });

  function selectCard(card) {
    selectedCard = card;
    useConservativeValuation = false;
    searchEl.value = '';
    cardListEl.classList.remove('active');

    document.getElementById('selectedCardName').textContent = card.name;
    document.getElementById('selectedCardIssuer').textContent = card.issuer;
    document.getElementById('selectedCardAF').textContent = card.annualFee === 0 ? 'No' : '$' + card.annualFee;
    selectedCardEl.style.display = 'flex';
    searchEl.parentElement.style.display = 'none';

    renderSpendingFields(card);
    renderPerks(card);
    renderValuationToggle(card);

    step2El.style.display = '';
    resultsEl.style.display = '';
    calculate();
  }

  changeCardBtn.addEventListener('click', () => {
    selectedCard = null;
    selectedCardEl.style.display = 'none';
    searchEl.parentElement.style.display = '';
    step2El.style.display = 'none';
    resultsEl.style.display = 'none';
    searchEl.focus();
  });

  // ── Spending UI ──────────────────────────────────────────────────────────

  function renderSpendingFields(card) {
    spendingGridEl.innerHTML = '';
    SPENDING_CATEGORIES.forEach(cat => {
      const reward = findReward(card, cat.key);
      const effPct = effectivePercent(card, reward);

      const rateLabel = reward.type === 'cashback'
        ? `${reward.rate}% back`
        : `${reward.rate}x pts (~${effPct.toFixed(1)}% back)`;

      const div = document.createElement('div');
      div.className = 'spending-item';
      div.innerHTML = `
        <label>${cat.icon} ${cat.label}</label>
        <span class="spending-rate" title="${escapeHtml(reward.note || '')}">${rateLabel}</span>
        <input type="number" class="spend-input" data-category="${cat.key}"
               value="${DEFAULT_SPEND[cat.key]}" min="0" step="25" inputmode="decimal"
               aria-label="Monthly ${cat.label} spending">
      `;
      spendingGridEl.appendChild(div);
    });

    spendingGridEl.querySelectorAll('.spend-input').forEach(input => {
      input.addEventListener('input', debounce(calculate, 200));
    });
  }

  // ── Perks UI ─────────────────────────────────────────────────────────────

  function renderPerks(card) {
    perksGridEl.innerHTML = '';
    if (!card.perks || card.perks.length === 0) {
      perksGridEl.innerHTML = '<div style="color:var(--text-muted);font-style:italic;">No additional perks listed for this card.</div>';
      return;
    }
    card.perks.forEach((perk, i) => {
      // Default checked: any perk with value > 0 (you can toggle off)
      const startChecked = perk.value > 0;
      const div = document.createElement('div');
      div.className = 'perk-item' + (startChecked ? ' active' : '');
      div.innerHTML = `
        <input type="checkbox" id="perk-${i}" ${startChecked ? 'checked' : ''}
               aria-label="I'll use ${escapeHtml(perk.name)}">
        <span class="perk-item-name">${escapeHtml(perk.name)}${perk.autoUsed ? ' <span style="font-size:.7rem;color:var(--success);">(auto)</span>' : ''}</span>
        <span class="perk-item-value">$${perk.value}/yr</span>
      `;
      div.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return; // checkbox handles itself
        const cb = document.getElementById('perk-' + i);
        cb.checked = !cb.checked;
        div.classList.toggle('active', cb.checked);
        calculate();
      });
      const cbEl = div.querySelector('input[type=checkbox]');
      cbEl.addEventListener('change', () => {
        div.classList.toggle('active', cbEl.checked);
        calculate();
      });
      perksGridEl.appendChild(div);
    });
  }

  // ── Valuation toggle (for cards with transfer-partner value) ─────────────

  function renderValuationToggle(card) {
    const wrap = document.getElementById('valuationToggleWrap');
    if (!wrap) return;
    if (card.pointValueConservative != null) {
      const optimisticPct = (card.pointValue * 100).toFixed(2);
      const conservativePct = (card.pointValueConservative * 100).toFixed(2);
      wrap.innerHTML = `
        <label class="valuation-toggle">
          <input type="checkbox" id="conservativeValuation">
          <span>Use cash-redemption value (${conservativePct}¢/pt) instead of transfer-partner value (${optimisticPct}¢/pt)</span>
        </label>
      `;
      wrap.style.display = '';
      document.getElementById('conservativeValuation').addEventListener('change', (e) => {
        useConservativeValuation = e.target.checked;
        renderSpendingFields(selectedCard); // refresh rate labels
        calculate();
      });
    } else {
      wrap.innerHTML = '';
      wrap.style.display = 'none';
    }
  }

  wouldSpendToggle.addEventListener('change', calculate);

  // ── Main calculation ─────────────────────────────────────────────────────

  function calculate() {
    if (!selectedCard) return;

    // 1. Rewards from spending (THE FIX)
    let rewardsValue = 0;
    const categoryBreakdown = [];
    const spendInputs = spendingGridEl.querySelectorAll('.spend-input');
    spendInputs.forEach(input => {
      const cat = input.dataset.category;
      const amount = parseFloat(input.value) || 0;
      const reward = findReward(selectedCard, cat);
      const annualValue = annualRewardsValue(selectedCard, reward, amount);
      rewardsValue += annualValue;
      if (amount > 0) {
        categoryBreakdown.push({
          category: cat,
          monthlySpend: amount,
          rate: reward.rate,
          type: reward.type,
          annualValue
        });
      }
    });

    // 2. Perks value
    let perksValue = 0;
    const wouldSpendAnyway = wouldSpendToggle.checked;
    selectedCard.perks.forEach((perk, i) => {
      const cb = document.getElementById('perk-' + i);
      if (cb && cb.checked) {
        // autoUsed perks are always 100% (annual statement credits applied automatically)
        // wouldSpendAnyway=true means user gets full value of all checked perks
        // wouldSpendAnyway=false means manual perks get 60% (haircut for hassle/lock-in)
        if (perk.autoUsed || wouldSpendAnyway) {
          perksValue += perk.value;
        } else {
          perksValue += perk.value * 0.6;
        }
      }
    });

    // 3. Net value
    const annualFee = selectedCard.annualFee;
    const netValue = rewardsValue + perksValue - annualFee;

    renderVerdict(rewardsValue, perksValue, annualFee, netValue);
    renderBreakdown(rewardsValue, perksValue, annualFee, netValue, categoryBreakdown);
    renderExplanation(netValue);
  }

  function renderVerdict(rewardsValue, perksValue, annualFee, netValue) {
    const verdictAmount = document.getElementById('verdictAmount');
    const verdictLabel = document.getElementById('verdictLabel');
    const verdictBadge = document.getElementById('verdictBadge');
    const verdictCard = document.getElementById('verdictCard');

    verdictAmount.textContent = (netValue >= 0 ? '+' : '') + formatCurrency(netValue);
    verdictAmount.className = 'verdict-amount ' + (netValue >= 0 ? 'positive' : 'negative');

    if (netValue > 100) {
      verdictLabel.textContent = 'net value per year';
      verdictBadge.textContent = '✅ Worth It';
      verdictBadge.className = 'verdict-badge worth-it';
      verdictCard.style.borderColor = 'var(--success)';
    } else if (netValue > 0) {
      verdictLabel.textContent = 'net value per year (marginal)';
      verdictBadge.textContent = '⚡ Marginal';
      verdictBadge.className = 'verdict-badge marginal';
      verdictCard.style.borderColor = 'var(--warning)';
    } else {
      verdictLabel.textContent = 'net cost per year';
      verdictBadge.textContent = '❌ Skip It';
      verdictBadge.className = 'verdict-badge skip-it';
      verdictCard.style.borderColor = 'var(--danger)';
    }
  }

  function renderBreakdown(rewardsValue, perksValue, annualFee, netValue, categoryBreakdown) {
    const breakdownTable = document.getElementById('breakdownTable');

    // Build per-category sub-rows for rewards
    const catRows = categoryBreakdown
      .filter(c => c.annualValue >= 1)
      .sort((a, b) => b.annualValue - a.annualValue)
      .map(c => {
        const catLabel = SPENDING_CATEGORIES.find(s => s.key === c.category)?.label || c.category;
        const rateStr = c.type === 'cashback' ? `${c.rate}%` : `${c.rate}x pts`;
        return `<div class="breakdown-subrow">
          <span class="breakdown-sublabel">&nbsp;&nbsp;${catLabel} ($${c.monthlySpend}/mo × ${rateStr})</span>
          <span class="breakdown-subvalue">+$${Math.round(c.annualValue).toLocaleString()}</span>
        </div>`;
      })
      .join('');

    breakdownTable.innerHTML = `
      <div class="breakdown-row positive">
        <span class="breakdown-label">Rewards earned</span>
        <span class="breakdown-value">+$${Math.round(rewardsValue).toLocaleString()}</span>
      </div>
      ${catRows}
      <div class="breakdown-row positive">
        <span class="breakdown-label">Perks & credits used</span>
        <span class="breakdown-value">+$${Math.round(perksValue).toLocaleString()}</span>
      </div>
      <div class="breakdown-row negative">
        <span class="breakdown-label">${escapeHtml(selectedCard.name)} annual fee</span>
        <span class="breakdown-value">−$${annualFee}</span>
      </div>
      <div class="breakdown-row total ${netValue >= 0 ? 'positive' : 'negative'}">
        <span class="breakdown-label">Net value</span>
        <span class="breakdown-value">${netValue >= 0 ? '+' : ''}${formatCurrency(netValue)}/yr</span>
      </div>
    `;
  }

  function renderExplanation(netValue) {
    const explanation = document.getElementById('verdictExplanation');
    const annualFee = selectedCard.annualFee;
    if (netValue < 0) {
      const alt = FEE_CARDS.find(c => c.annualFee < annualFee && c.id !== selectedCard.id);
      explanation.innerHTML = `Based on your spending, you'd <strong>lose ${formatCurrency(Math.abs(netValue))}</strong> per year with the ${escapeHtml(selectedCard.name)}. ${alt ? `Consider the <strong>${escapeHtml(alt.name)}</strong> (${alt.annualFee === 0 ? 'no annual fee' : '$' + alt.annualFee + '/yr'}) instead.` : 'A no-annual-fee card would likely serve you better.'}`;
    } else if (netValue < 100) {
      explanation.innerHTML = `The ${escapeHtml(selectedCard.name)} barely earns its annual fee with your spending pattern. You're only coming out <strong>${formatCurrency(netValue)}</strong> ahead — make sure you're actually using the credits and perks listed above. If not, consider a no-annual-fee card.`;
    } else {
      explanation.innerHTML = `With your spending habits, the ${escapeHtml(selectedCard.name)} is <strong>worth the annual fee</strong>. You earn ${formatCurrency(netValue)} more in value than the $${annualFee} fee. Keep using the card's credits to maximize your return.`;
    }
  }

  // ── Utils ────────────────────────────────────────────────────────────────

  let debounceTimer;
  function debounce(fn, ms) {
    return function (...args) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fn(...args), ms);
    };
  }

  // ── Init ─────────────────────────────────────────────────────────────────

  const params = new URLSearchParams(window.location.search);
  if (params.has('card')) {
    const cardId = params.get('card');
    const card = FEE_CARDS.find(c => c.id === cardId);
    if (card) selectCard(card);
  }

  if (typeof ShareButtons !== 'undefined' && resultsEl.style.display !== 'none') {
    new ShareButtons({
      container: document.getElementById('shareBar'),
      url: window.location.href,
      title: 'Annual Fee Worth It Calculator — CreditStud.io',
      description: 'Is that annual fee worth it? Find out with real math.',
      inputs: []
    });
  }
})();
