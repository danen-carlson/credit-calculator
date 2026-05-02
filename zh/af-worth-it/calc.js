// Annual Fee Worth It Calculator — CreditStud.io
(function () {
  'use strict';

  let selectedCard = null;
  const SPENDING_CATEGORIES = [
    { key: 'dining', label: 'Dining', icon: '🍽️' },
    { key: 'groceries', label: 'Groceries', icon: '🛒' },
    { key: 'travel', label: 'Travel', icon: '✈️' },
    { key: 'gas', label: 'Gas', icon: '⛽' },
    { key: 'streaming', label: 'Streaming', icon: '📺' },
    { key: 'other', label: 'Other', icon: '📦' }
  ];

  const DEFAULT_SPEND = { dining: 200, groceries: 400, travel: 100, gas: 150, streaming: 50, other: 500 };

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

  // Card search
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
          <div class="card-list-item-name">${card.name}</div>
          <div class="card-list-item-meta">${card.issuer}</div>
        </div>
        <div class="card-list-item-af">${card.annualFee === 0 ? 'No AF' : '$' + card.annualFee + '/yr'}</div>
      `;
      item.addEventListener('click', () => selectCard(card));
      cardListEl.appendChild(item);
    });
    cardListEl.classList.add('active');
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
    searchEl.value = '';
    cardListEl.classList.remove('active');

    document.getElementById('selectedCardName').textContent = card.name;
    document.getElementById('selectedCardIssuer').textContent = card.issuer;
    document.getElementById('selectedCardAF').textContent = card.annualFee === 0 ? 'No' : '$' + card.annualFee;
    selectedCardEl.style.display = 'flex';
    searchEl.parentElement.style.display = 'none';

    // Render spending categories
    renderSpendingFields(card);
    // Render perks
    renderPerks(card);
    // Show step 2
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

  function renderSpendingFields(card) {
    spendingGridEl.innerHTML = '';
    SPENDING_CATEGORIES.forEach(cat => {
      // Find matching reward rate for this category
      const reward = card.rewards.find(r => r.category.toLowerCase().includes(cat.key)) ||
                     card.rewards.find(r => r.category.toLowerCase() === 'all other') ||
                     card.rewards[card.rewards.length - 1]; // fallback to last (usually "other")

      const rate = reward ? reward.rate : '1';

      const div = document.createElement('div');
      div.className = 'spending-item';
      div.innerHTML = `
        <label>${cat.icon} ${cat.label}</label>
        <span class="spending-rate">${rate} back</span>
        <input type="number" class="spend-input" data-category="${cat.key}" value="${DEFAULT_SPEND[cat.key]}" min="0" step="50">
      `;
      spendingGridEl.appendChild(div);
    });

    spendingGridEl.querySelectorAll('.spend-input').forEach(input => {
      input.addEventListener('input', debounce(calculate, 200));
    });
  }

  function renderPerks(card) {
    perksGridEl.innerHTML = '';
    card.perks.forEach((perk, i) => {
      const div = document.createElement('div');
      div.className = 'perk-item' + (perk.value > 0 ? ' active' : '');
      div.innerHTML = `
        <input type="checkbox" id="perk-${i}" ${perk.value > 0 ? 'checked' : ''}>
        <span class="perk-item-name">${perk.name}</span>
        <span class="perk-item-value">$${perk.value}/yr</span>
      `;
      div.addEventListener('click', () => {
        const cb = document.getElementById('perk-' + i);
        cb.checked = !cb.checked;
        div.classList.toggle('active', cb.checked);
        calculate();
      });
      perksGridEl.appendChild(div);
    });
  }

  wouldSpendToggle.addEventListener('change', calculate);

  function calculate() {
    if (!selectedCard) return;

    // Calculate rewards from spending
    let rewardsValue = 0;
    const spendInputs = spendingGridEl.querySelectorAll('.spend-input');
    spendInputs.forEach(input => {
      const cat = input.dataset.category;
      const amount = parseFloat(input.value) || 0;

      // Find the best reward for this category
      let bestRate = 0;
      let rateValue = 0.01;

      selectedCard.rewards.forEach(r => {
        const catMatch = r.category.toLowerCase().includes(cat) ||
                         (cat === 'travel' && r.category.toLowerCase().includes('travel')) ||
                         (cat === 'dining' && r.category.toLowerCase().includes('dining')) ||
                         (cat === 'groceries' && r.category.toLowerCase().includes('grocer')) ||
                         (cat === 'gas' && r.category.toLowerCase().includes('gas')) ||
                         (cat === 'streaming' && r.category.toLowerCase().includes('streaming'));
        if (catMatch) {
          const rateNum = parseFloat(r.rate) || 0;
          if (rateNum > bestRate) {
            bestRate = rateNum;
            rateValue = r.type === 'cashback' ? rateNum / 100 : r.value || rateNum * (selectedCard.pointsValue || 0.01);
          }
        }
      });

      // If no category match, use "all other" rate
      if (bestRate === 0) {
        const otherReward = selectedCard.rewards.find(r => r.category.toLowerCase().includes('other'));
        if (otherReward) {
          const rateNum = parseFloat(otherReward.rate) || 1;
          rateValue = otherReward.type === 'cashback' ? rateNum / 100 : (otherReward.value || rateNum * (selectedCard.pointsValue || 0.01));
        } else {
          rateValue = 0.01; // 1% fallback
        }
      }

      rewardsValue += amount * 12 * rateValue;
    });

    // Calculate perk values
    let perksValue = 0;
    const wouldSpendAnyway = wouldSpendToggle.checked;
    selectedCard.perks.forEach((perk, i) => {
      const cb = document.getElementById('perk-' + i);
      if (cb && cb.checked) {
        if (wouldSpendAnyway) {
          perksValue += perk.value; // full value since you'd spend this anyway
        } else {
          // Discount perks that aren't naturally spending — count at 60%
          perksValue += perk.value * 0.6;
        }
      }
    });

    // Calculate net value
    const annualFee = selectedCard.annualFee;
    const netValue = rewardsValue + perksValue - annualFee;

    // Render verdict
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

    // Breakdown table
    const breakdownTable = document.getElementById('breakdownTable');
    breakdownTable.innerHTML = `
      <div class="breakdown-row positive">
        <span class="breakdown-label">Rewards earned</span>
        <span class="breakdown-value">+$${Math.round(rewardsValue).toLocaleString()}</span>
      </div>
      <div class="breakdown-row positive">
        <span class="breakdown-label">Perks & credits used</span>
        <span class="breakdown-value">+$${Math.round(perksValue).toLocaleString()}</span>
      </div>
      <div class="breakdown-row negative">
        <span class="breakdown-label">${selectedCard.name} annual fee</span>
        <span class="breakdown-value">−$${annualFee}</span>
      </div>
      <div class="breakdown-row total ${netValue >= 0 ? 'positive' : 'negative'}">
        <span class="breakdown-label">Net value</span>
        <span class="breakdown-value">${netValue >= 0 ? '+' : ''}${formatCurrency(netValue)}/yr</span>
      </div>
    `;

    // Explanation
    const explanation = document.getElementById('verdictExplanation');
    if (netValue < 0) {
      // Find alternatives
      const alt = FEE_CARDS.find(c => c.annualFee < annualFee && c.id !== selectedCard.id);
      explanation.innerHTML = `Based on your spending, you'd <strong>lose ${formatCurrency(Math.abs(netValue))}</strong> per year with the ${selectedCard.name}. ${alt ? `Consider the <strong>${alt.name}</strong> (${alt.annualFee === 0 ? 'no annual fee' : '$' + alt.annualFee + '/yr'}) instead.` : 'A no-annual-fee card would likely serve you better.'}`;
    } else if (netValue < 100) {
      explanation.innerHTML = `The ${selectedCard.name} barely earns its annual fee with your spending pattern. You're only coming out <strong>${formatCurrency(netValue)}</strong> ahead — make sure you're actually using the credits and perks listed above. If not, consider a no-annual-fee card.`;
    } else {
      explanation.innerHTML = `With your spending habits, the ${selectedCard.name} is <strong>worth the annual fee</strong>. You earn ${formatCurrency(netValue)} more in value than the $${annualFee} fee. Keep using the card's credits to maximize your return.`;
    }
  }

  let debounceTimer;
  function debounce(fn, ms) {
    return function (...args) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fn(...args), ms);
    };
  }

  // Cross-tool params
  const params = new URLSearchParams(window.location.search);
  if (params.has('card')) {
    const cardId = params.get('card');
    const card = FEE_CARDS.find(c => c.id === cardId);
    if (card) selectCard(card);
  }

  // Share config
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