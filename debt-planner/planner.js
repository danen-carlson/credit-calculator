/* Debt Planner - Calculation Logic & Interactivity */

// ========================
// STATE
// ========================
let debts = [];
let extraPayment = 200;
let results = { minimum: null, snowball: null, avalanche: null };
let currentChartStrategy = 'snowball';
let scheduleOpen = false;
let consolidationResults = null;
// Credit score simulator state
let creditScore = 700; // Default credit score
let totalCreditLimits = 15000; // Default total credit limits
let currentBalances = 5000; // Default current balances
// Simulator what-if state — NEVER mutates debts[] directly
let simulatorState = {
  score: null,           // simulated score (null = no simulation active)
  projectedDebts: null, // deep copy of debts with simulated APRs
  projectedScoreDelta: 0
};
// `strategyComparisonChart` lives in charts.js to keep chart state co-located

// Emit a debts-changed event so the share URL module can re-serialize.
function notifyDebtsChanged() {
  window.debts = debts;
  try { document.dispatchEvent(new Event('debts-changed')); } catch (_) { /* older browsers */ }
}

// Expose a setter for the share hydrator to replace the debt list
window.setDebts = function (next) {
  if (!Array.isArray(next)) return;
  debts = next.map((d, i) => ({
    id: d.id ?? i + 1,
    name: d.name || `Debt ${i + 1}`,
    balance: parseFloat(d.balance) || 0,
    apr: parseFloat(d.apr) || 0,
    originalApr: parseFloat(d.originalApr) || parseFloat(d.apr) || 0, // Store original APR
    minPayment: parseFloat(d.minPayment) || 0
  }));
  window.debts = debts;
};
window.debts = debts;

// Common card name → APR suggestions for autosuggest (P1 #18)
const CARD_APR_SUGGEST = {
  'Chase Sapphire': 24.49,
  'Amex Blue Cash Preferred': 21.24,
  'Capital One Quicksilver': 26.49,
  'Discover It': 22.49,
  'Citi Double Cash': 23.24,
  'Chase Freedom': 21.24,
  'Amex Gold': 21.24,
  'Capital One Venture': 24.49,
  'Wells Fargo Active Cash': 22.49,
  'Citi Simplicity': 25.99,
  'Wells Fargo Reflect': 25.24,
  'Bank of America Cash Rewards': 23.24
};

// Windfall / one-time extra payment state (P1 #20)
let windfallAmount = 0;
let windfallMonth = 6;

// DEBT_COLORS is defined in charts.js — that's the only place it's used
// Balance transfer card data — verified against issuer pages 2026-04-28.
// Many issuers offer a lower intro fee for transfers in the first ~60 days/4 months,
// then jump to a higher standard fee. We model both.
const BALANCE_TRANSFER_CARDS = [
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash',
    introAprMonths: 18,
    // CORRECTED 2026-04-28: was 0 (silently making this look free). Real: 3% intro
    // (first 4 months, $5 min), then 5% standard. Source: citi.com / wallethub.com
    transferFeePct: 3,
    transferFeeStandardPct: 5,
    transferFeeMinDollars: 5,
    postPromoApr: 19.24,
    creditLimit: 8000
  },
  {
    id: 'wells-fargo-reflect',
    name: 'Wells Fargo Reflect',
    introAprMonths: 21,
    // 3% intro (first 120 days, $5 min) then 5%. Source: wellsfargo.com
    transferFeePct: 3,
    transferFeeStandardPct: 5,
    transferFeeMinDollars: 5,
    postPromoApr: 19.24,
    creditLimit: 7000
  },
  {
    id: 'citi-simplicity',
    name: 'Citi Simplicity',
    introAprMonths: 21,
    // 3% intro (first 4 months, $5 min) then 5%. Source: citi.com
    transferFeePct: 3,
    transferFeeStandardPct: 5,
    transferFeeMinDollars: 5,
    postPromoApr: 19.24,
    creditLimit: 6000
  },
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    introAprMonths: 15,
    // 3% intro (first 60 days, $5 min) then 5%. Source: chase.com
    transferFeePct: 3,
    transferFeeStandardPct: 5,
    transferFeeMinDollars: 5,
    postPromoApr: 20.24,
    creditLimit: 6000
  },
  {
    id: 'discover-it',
    name: 'Discover it',
    introAprMonths: 15,
    // 3% intro then 5% standard. Source: discover.com
    transferFeePct: 3,
    transferFeeStandardPct: 5,
    transferFeeMinDollars: 5,
    postPromoApr: 19.24,
    creditLimit: 7000
  },
  {
    id: 'amex-blue-cash',
    name: 'Amex Blue Cash Everyday',
    introAprMonths: 15,
    // 3% flat ($5 min). Amex generally doesn't tier the BT fee. Source: americanexpress.com
    transferFeePct: 3,
    transferFeeStandardPct: 3,
    transferFeeMinDollars: 5,
    postPromoApr: 21.24,
    creditLimit: 7500
  }
];

// ========================
// DEBT MANAGEMENT
// ========================
function addDebt(name, balance, apr, minPayment) {
  const nextId = debts.length > 0 ? Math.max(...debts.map(d => d.id)) + 1 : 1;
  debts.push({
    id: nextId,
    name: name || `Debt ${debts.length + 1}`,
    balance: parseFloat(balance) || 0,
    apr: parseFloat(apr) || 0,
    originalApr: parseFloat(apr) || 0, // Store original APR for credit score adjustments
    minPayment: parseFloat(minPayment) || 0
  });
  // Rebuild simulator projections if active
  if (simulatorState.score !== null) buildSimulatorProjections(simulatorState.score);
  renderDebtCards();
  updateSummary();
  updateConsolidationOptions();
  recalculate();
  notifyDebtsChanged();
}

function removeDebt(id) {
  debts = debts.filter(d => d.id !== id);
  // Rebuild simulator projections if active
  if (simulatorState.score !== null) buildSimulatorProjections(simulatorState.score);
  renderDebtCards();
  updateSummary();
  updateConsolidationOptions();
  resetConsolidation();
  recalculate();
  notifyDebtsChanged();
}

function updateDebt(id, field, value) {
  const debt = debts.find(d => d.id === id);
  if (!debt) return;
  
  if (field === 'name') {
    debt.name = value;
  } else if (field === 'apr') {
    // When manually updating APR, update the original APR as well
    const newApr = parseFloat(value) || 0;
    debt.apr = newApr;
    debt.originalApr = newApr;
  } else {
    debt[field] = parseFloat(value) || 0;
  }
  // Rebuild simulator projections if active (APR change affects projections)
  if (simulatorState.score !== null) buildSimulatorProjections(simulatorState.score);
  
  updateSummary();
  updateConsolidationOptions();
  resetConsolidation();
  recalculate();
  notifyDebtsChanged();
}

function renderDebtCards() {
  const container = document.getElementById('debt-list');
  container.innerHTML = '';
  debts.forEach((debt, i) => {
    const card = document.createElement('div');
    card.className = 'debt-card';
    card.dataset.debtId = debt.id;
    card.innerHTML = `
      <div class="debt-card-controls">
        <button class="btn-reorder" onclick="reorderDebt(${debt.id}, -1)" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="btn-reorder" onclick="reorderDebt(${debt.id}, 1)" title="Move down" ${i === debts.length - 1 ? 'disabled' : ''}>↓</button>
      </div>
      <div class="input-group">
        <label>Name</label>
        <input type="text" value="${escapeHtml(debt.name)}" 
               onchange="updateDebt(${debt.id}, 'name', this.value)" 
               oninput="applyAprSuggest(this, ${debt.id})"
               list="aprSuggestList" placeholder="e.g. Chase Visa">
      </div>
      <div class="input-group">
        <label>Balance</label>
        <div class="input-with-prefix">
          <span class="prefix">$</span>
          <input type="number" value="${debt.balance}" min="0" step="0.01" inputmode="decimal"
                 onchange="updateDebt(${debt.id}, 'balance', this.value)" style="padding-left:38px">
        </div>
      </div>
      <div class="input-group">
        <label>APR %</label>
        <input type="number" value="${debt.apr}" min="0" max="99" step="0.01" inputmode="decimal"
               onchange="updateDebt(${debt.id}, 'apr', this.value)" id="apr-${debt.id}">
      </div>
      <div class="input-group">
        <label>Min Payment</label>
        <div class="input-with-prefix">
          <span class="prefix">$</span>
          <input type="number" value="${debt.minPayment}" min="0" step="0.01" inputmode="decimal"
                 onchange="updateDebt(${debt.id}, 'minPayment', this.value)" style="padding-left:38px">
        </div>
      </div>
      <button class="btn-remove" onclick="removeDebt(${debt.id})" title="Remove debt">✕</button>
    `;
    container.appendChild(card);
  });
}

function updateSummary() {
  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);
  const weightedApr = totalBalance > 0
    ? debts.reduce((s, d) => s + d.apr * (d.balance / totalBalance), 0)
    : 0;

  // Cache DOM elements to avoid duplicate queries
  const totalBalanceEl = document.getElementById('total-balance');
  const totalMinEl = document.getElementById('total-min');
  const weightedAprEl = document.getElementById('weighted-apr');
  
  if (totalBalanceEl) totalBalanceEl.textContent = formatCurrency(totalBalance);
  if (totalMinEl) totalMinEl.textContent = formatCurrency(totalMin);
  if (weightedAprEl) weightedAprEl.textContent = weightedApr.toFixed(2) + '%';

  // Update slider max based on debt size
  const slider = document.getElementById('extra-slider');
  const suggestedMax = Math.max(1000, Math.ceil(totalBalance / 12 / 100) * 100);
  if (slider) slider.max = suggestedMax;
}

// ========================
// EXTRA PAYMENT
// ========================
function updateExtraPayment(value) {
  extraPayment = Math.max(0, parseFloat(value) || 0);
  
  // Cache DOM elements to avoid duplicate queries
  const extraAmountEl = document.getElementById('extra-amount');
  const extraTotalEl = document.getElementById('extra-total');
  
  if (extraAmountEl) extraAmountEl.textContent = formatCurrency(extraPayment);
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);
  if (extraTotalEl) extraTotalEl.textContent = formatCurrency(totalMin + extraPayment);

  // Update preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.value) === extraPayment);
  });

  recalculate();
}

function setPreset(value) {
  // Cache DOM elements to avoid duplicate queries
  const extraSliderEl = document.getElementById('extra-slider');
  const extraInputEl = document.getElementById('extra-input');
  
  if (extraSliderEl) extraSliderEl.value = value;
  if (extraInputEl) extraInputEl.value = value;
  updateExtraPayment(value);
}

// ========================
// CALCULATION ENGINE
// ========================
function simulateMinimums(debtsList) {
  const sim = debtsList.map(d => ({
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    minPayment: d.minPayment,
    monthlyRate: d.apr / 100 / 12,
    promoApr: d.promoApr,
    promoMonths: d.promoMonths || 0
  }));

  const months = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let warnings = [];

  // Check for minimum payment warnings
  sim.forEach(d => {
    if (d.balance > 0 && d.minPayment <= d.balance * d.monthlyRate) {
      warnings.push(`Minimum payment doesn't cover interest on "${d.name}"`);
    }
  });

  for (let m = 0; m < 360; m++) {
    const monthData = { month: m + 1, payments: [], balances: [], targetId: null };
    let allPaid = true;

    sim.forEach(d => {
      if (d.balance <= 0) {
        monthData.payments.push({ name: d.name, payment: 0, interest: 0, principal: 0, balance: 0 });
        monthData.balances.push({ name: d.name, balance: 0 });
        return;
      }
      allPaid = false;

      const activeMonthlyRate = m < (d.promoMonths || 0)
        ? ((d.promoApr || 0) / 100 / 12)
        : d.monthlyRate;
      const interest = d.balance * activeMonthlyRate;
      let payment = Math.min(d.minPayment, d.balance + interest);
      const principal = payment - interest;
      d.balance = Math.max(0, d.balance - principal);

      totalInterest += interest;
      totalPaid += payment;

      monthData.payments.push({ name: d.name, payment, interest, principal, balance: d.balance });
      monthData.balances.push({ name: d.name, balance: d.balance });
    });

    months.push(monthData);
    if (allPaid) break;
  }

  const debtFreeMonths = months.length;
  const now = new Date();
  const debtFreeDate = new Date(now.getFullYear(), now.getMonth() + debtFreeMonths, 1);

  return { months, totalInterest, totalPaid, debtFreeMonths, debtFreeDate, warnings };
}

function simulateStrategy(debtsList, extra, sortFn) {
  const sim = debtsList.map(d => ({
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    minPayment: d.minPayment,
    monthlyRate: d.apr / 100 / 12,
    promoApr: d.promoApr,
    promoMonths: d.promoMonths || 0
  }));

  const months = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let warnings = [];

  sim.forEach(d => {
    if (d.balance > 0 && d.minPayment <= d.balance * d.monthlyRate) {
      warnings.push(`Minimum payment doesn't cover interest on "${d.name}"`);
    }
  });

  for (let m = 0; m < 360; m++) {
    const monthData = { month: m + 1, payments: [], balances: [], targetId: null };

    // Get active debts (balance > 0)
    const active = sim.filter(d => d.balance > 0);
    if (active.length === 0) break;

    // Sort to find target
    const sorted = [...active].sort(sortFn);
    const target = sorted[0];
    monthData.targetId = target.name;

    // Calculate interest for all active debts
    const interests = {};
    sim.forEach(d => {
      if (d.balance > 0) {
        const activeMonthlyRate = m < (d.promoMonths || 0)
          ? ((d.promoApr || 0) / 100 / 12)
          : d.monthlyRate;
        interests[d.name] = d.balance * activeMonthlyRate;
      }
    });

    // Pay minimums on all
    let remainingExtra = extra;
    sim.forEach(d => {
      if (d.balance <= 0) {
        monthData.payments.push({ name: d.name, payment: 0, interest: 0, principal: 0, balance: 0, isTarget: false });
        monthData.balances.push({ name: d.name, balance: 0 });
        return;
      }

      const interest = interests[d.name];
      let payment = Math.min(d.minPayment, d.balance + interest);
      const principal = payment - interest;
      d.balance = Math.max(0, d.balance - principal);

      totalInterest += interest;
      totalPaid += payment;

      const isTarget = (d.name === target.name);
      monthData.payments.push({ name: d.name, payment, interest, principal, balance: d.balance, isTarget });
      monthData.balances.push({ name: d.name, balance: d.balance });
    });

    // Apply extra to target (and roll over if target is paid off)
    while (remainingExtra > 0.005) {
      const stillActive = sim.filter(d => d.balance > 0.005);
      if (stillActive.length === 0) break;

      const reSorted = [...stillActive].sort(sortFn);
      const nextTarget = reSorted[0];

      const extraPayment = Math.min(remainingExtra, nextTarget.balance);
      nextTarget.balance = Math.max(0, nextTarget.balance - extraPayment);
      totalPaid += extraPayment;

      remainingExtra -= extraPayment;

      // Update the payment record for this target
      const payRecord = monthData.payments.find(p => p.name === nextTarget.name);
      if (payRecord) {
        payRecord.payment += extraPayment;
        payRecord.principal += extraPayment;
        payRecord.balance = nextTarget.balance;
        payRecord.isTarget = true;
      }
      const balRecord = monthData.balances.find(b => b.name === nextTarget.name);
      if (balRecord) {
        balRecord.balance = nextTarget.balance;
      }
    }

    months.push(monthData);
  }

  const debtFreeMonths = months.length;
  const now = new Date();
  const debtFreeDate = new Date(now.getFullYear(), now.getMonth() + debtFreeMonths, 1);

  return { months, totalInterest, totalPaid, debtFreeMonths, debtFreeDate, warnings };
}

function calculateAll() {
  console.log('calculateAll called:', { debts: debts.length, allZero: debts.every(d => d.balance <= 0) });
  if (debts.length === 0 || debts.every(d => d.balance <= 0)) {
    results = { minimum: null, snowball: null, avalanche: null };
    return;
  }

  try {
    results.minimum = simulateMinimums(debts);
    console.log('Minimum simulation complete');
  } catch(e) { console.error('Minimum sim error:', e); }

  try {
    results.snowball = simulateStrategy(debts, extraPayment, (a, b) => a.balance - b.balance);
    console.log('Snowball simulation complete');
  } catch(e) { console.error('Snowball sim error:', e); }

  try {
    results.avalanche = simulateStrategy(debts, extraPayment, (a, b) => b.apr - a.apr);
    console.log('Avalanche simulation complete');
  } catch(e) { console.error('Avalanche sim error:', e); }
}

// ========================
// RENDERING
// ========================
function recalculate() {
  console.log('Recalculate started');
  
  // Show skeleton
  const skeleton = document.getElementById('debt-skeleton');
  if (skeleton) {
    skeleton.classList.add('active');
    const container = document.getElementById('results-container');
    if (container) {
      container.setAttribute('aria-busy', 'true');
    }
  }
  
  // Use setTimeout to allow UI to update before heavy computation
  setTimeout(() => {
    try { 
      console.log('Running calculateAll');
      calculateAll(); 
      console.log('calculateAll complete', { results: Object.keys(results).map(k => `${k}:${!!results[k]}`) });
    } catch(e) { console.warn('Calc error:', e); }
    try { 
      console.log('Rendering results');
      renderResults(); 
      console.log('Results rendered');
      // Show email capture after first results
      if (!debtEmailCaptureShown && typeof EmailCapture !== 'undefined') {
        debtEmailCaptureShown = true;
        setTimeout(function() { new EmailCapture('debt').showIfEligible(); }, 2000);
      }
      
      // Announce calculation completion for screen readers
      const statusEl = document.getElementById('debt-calc-status');
      if (statusEl) {
        const bestResult = results.avalanche || results.snowball;
        if (bestResult) {
          const months = bestResult.debtFreeMonths;
          const dateStr = bestResult.debtFreeMonths >= 360 ? '30+ years' : formatDate(bestResult.debtFreeDate);
          statusEl.textContent = `Calculated payoff in ${months} months, debt-free by ${dateStr}`;
        } else {
          statusEl.textContent = 'Calculation complete';
        }
      }
    } catch(e) { console.warn('Results render error:', e); }
    try { 
      console.log('Rendering charts');
      renderCharts(); 
      console.log('Charts rendered');
    } catch(e) { console.warn('Charts render error:', e); }
    try { 
      console.log('Rendering schedule');
      renderSchedule(); 
      console.log('Schedule rendered');
    } catch(e) { console.warn('Schedule render error:', e); }
    try { 
      console.log('Rendering recommendations');
      renderRecommendations(); 
      console.log('Recommendations rendered');
    } catch(e) { console.warn('Recommendations render error:', e); }
    try { 
      if (consolidationResults) {
        console.log('Rendering consolidation results');
        renderConsolidationResults(consolidationResults); 
        console.log('Consolidation results rendered');
      }
    } catch(e) { console.warn('Consolidation render error:', e); }
    console.log('Recalculate complete');
    
    // Hide skeleton after all rendering is complete
    hideSkeleton(skeleton);
  }, 0);
}

function hideSkeleton(skeleton) {
  if (skeleton) {
    skeleton.classList.remove('active');
    const container = document.getElementById('results-container');
    if (container) {
      container.removeAttribute('aria-busy');
    }
  }
  
  // Show/hide export button based on whether results are available
  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) {
    const hasResults = results && 
      ((results.minimum && results.minimum.months && results.minimum.months.length > 0) ||
       (results.snowball && results.snowball.months && results.snowball.months.length > 0) ||
       (results.avalanche && results.avalanche.months && results.avalanche.months.length > 0));
    exportBtn.style.display = hasResults ? 'inline-block' : 'none';
  }
}

function renderResults() {
  const container = document.getElementById('results-container');

  if (!results.minimum) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px 0;">Add debts above to see your payoff plan.</p>';
    const heroEl = document.getElementById('debt-free-hero');
    if (heroEl) heroEl.innerHTML = '';
    return;
  }

  const min = results.minimum;
  const snow = results.snowball;
  const av = results.avalanche;

  // Determine winner (avalanche usually saves most money)
  let winner = 'avalanche';
  if (snow.totalInterest < av.totalInterest) winner = 'snowball';
  if (snow.totalInterest === av.totalInterest) winner = 'tie';

  const interestDiff = Math.abs(snow.totalInterest - av.totalInterest);

  // ── P1 #16: Debt-Free Hero at top of results ──
  const heroEl = document.getElementById('debt-free-hero');
  if (heroEl) {
    const bestResult = (av.totalInterest <= snow.totalInterest) ? av : snow;
    const debtFreeDateStr = bestResult.debtFreeMonths >= 360 ? '30+ years' : formatDate(bestResult.debtFreeDate);
    const bestWithWindfall = simulateWithWindfall(bestResult);
    let heroSubtitle = `Total interest paid: ${formatCurrency(bestResult.totalInterest)}`;
    let heroDateStr = debtFreeDateStr;
    if (windfallAmount > 0 && bestWithWindfall) {
      heroDateStr = bestWithWindfall.debtFreeMonths >= 360 ? '30+ years' : formatDate(bestWithWindfall.debtFreeDate);
      heroSubtitle = `Total interest: ${formatCurrency(bestResult.totalInterest)} → ${formatCurrency(bestWithWindfall.totalInterest)} with windfall`;
    }
    heroEl.innerHTML = `
      <div class="debt-free-hero-card">
        <div class="debt-free-hero-emoji">🎉</div>
        <div class="debt-free-hero-stat">You'll be debt-free by <strong>${heroDateStr}</strong></div>
        <div class="debt-free-hero-subtitle">${heroSubtitle}</div>
      </div>
    `;
  }

  // ── P2 #43: Strategy explanation above cards ──
  let explanationHtml = `
    <div class="strategy-explanation">
      <p><strong>Snowball</strong> pays smallest balances first — quick wins keep you motivated. <strong>Avalanche</strong> pays highest-interest debts first — mathematically saves the most money. Pick the one you'll stick with.</p>
    </div>
  `;

  let html = '';

  // Savings banner
  if (extraPayment > 0) {
    const bestSavings = Math.min(snow.totalInterest, av.totalInterest);
    const saved = min.totalInterest - bestSavings;
    const timeSaved = min.debtFreeMonths - (winner === 'snowball' ? snow.debtFreeMonths : av.debtFreeMonths);
    html += `
      <div class="savings-banner">
        <div class="banner-title">💰 You could save <strong>${formatCurrency(saved)}</strong> and be debt-free <strong>${timeSaved} months</strong> sooner!</div>
        <div class="banner-detail">By paying ${formatCurrency(extraPayment)}/mo extra vs. minimum payments only</div>
      </div>
    `;
  }

  // Warnings
  const allWarnings = [...new Set([...(min.warnings || []), ...(snow.warnings || []), ...(av.warnings || [])])];
  if (allWarnings.length > 0) {
    html += `<div class="warning-banner"><strong>⚠️ Warning</strong>${allWarnings.map(w => `<div>${escapeHtml(w)}</div>`).join('')}</div>`;
  }

  // Strategy cards
  html += '<div class="strategy-grid">';

  // Strategy explanation already rendered above
  html += renderStrategyCard('minimum', 'Minimum Payments', 'The baseline — no extra payments', min, null, min);

  // Snowball card
  const snowSaved = min.totalInterest - snow.totalInterest;
  const snowTimeSaved = min.debtFreeMonths - snow.debtFreeMonths;
  html += renderStrategyCard('snowball', '🔵 Debt Snowball', 'Smallest balance first', snow, { interestSaved: snowSaved, timeSaved: snowTimeSaved }, min, winner === 'snowball');

  // Avalanche card
  const avSaved = min.totalInterest - av.totalInterest;
  const avTimeSaved = min.debtFreeMonths - av.debtFreeMonths;
  html += renderStrategyCard('avalanche', '🟣 Debt Avalanche', 'Highest interest first', av, { interestSaved: avSaved, timeSaved: avTimeSaved }, min, winner === 'avalanche');

  html += '</div>';

  // Snowball vs Avalanche comparison
  if (extraPayment > 0) {
    html += `
      <div class="savings-banner" style="background: linear-gradient(135deg, #eff4ff 0%, #f5f3ff 100%); border-color: var(--primary);">
        <div class="banner-title">Snowball vs Avalanche</div>
        <div class="banner-detail">
          ${winner === 'avalanche'
            ? `Avalanche saves <strong>${formatCurrency(interestDiff)}</strong> more than Snowball`
            : winner === 'snowball'
            ? `Snowball saves <strong>${formatCurrency(interestDiff)}</strong> more than Avalanche`
            : `Both strategies cost the same — pick whichever motivates you!`
          }
        </div>
      </div>
    `;
  }

  // ── P1 #20: Populate windfall results if windfall is active ──
  if (windfallAmount > 0) {
    const windfallEl = document.getElementById('windfall-results');
    if (windfallEl && bestWithWindfall) {
      const baseUrl = bestResult;
      const bf = bestWithWindfall;
      windfallEl.innerHTML = `
        <div class="windfall-before-after">
          <div class="windfall-before">
            <div class="windfall-label">Before (no windfall)</div>
            <div>Debt-free: <strong>${baseUrl.debtFreeMonths >= 360 ? '30+ years' : formatDate(baseUrl.debtFreeDate)}</strong></div>
            <div>Interest: <strong>${formatCurrency(baseUrl.totalInterest)}</strong></div>
          </div>
          <div class="windfall-after">
            <div class="windfall-label">After $${windfallAmount.toLocaleString()} at month ${windfallMonth}</div>
            <div>Debt-free: <strong>${bf.debtFreeMonths >= 360 ? '30+ years' : formatDate(bf.debtFreeDate)}</strong></div>
            <div>Interest: <strong>${formatCurrency(bf.totalInterest)}</strong></div>
            <div>Saved: <strong style="color:var(--success)">${formatCurrency(baseUrl.totalInterest - bf.totalInterest)}</strong></div>
          </div>
        </div>
      `;
    }
  }

  // ── P2 #42: Strategy comparison side-by-side ──
  html += renderStrategyComparisonPanel(min, snow, av);

  // ── P1 #20: Windfall before/after ──
  html += renderWindfallPanel(snow, av, bestResult);

  // ── P1 #8: Cross-tool CTA ──
  html += `
    <div class="cross-tool-cta">
      <a href="/rewards/" class="cta-card">
        <span class="cta-emoji">🎁</span>
        <div class="cta-text"><strong>Considering a new card?</strong> Find the best rewards →</div>
      </a>
      <a href="/compare/" class="cta-card">
        <span class="cta-emoji">⚖️</span>
        <div class="cta-text"><strong>Comparing a purchase?</strong> See cheapest payment →</div>
      </a>
    </div>
  `;

  container.innerHTML = explanationHtml + html;
}

function renderStrategyCard(id, name, subtitle, result, savings, minResult, isWinner) {
  const dateStr = result.debtFreeMonths >= 360 ? '30+ years' : formatDate(result.debtFreeDate);
  const monthsStr = result.debtFreeMonths >= 360 ? '360+' : result.debtFreeMonths;

  let html = `<div class="strategy-card ${isWinner ? 'winner' : ''}" id="card-${id}">`;
  html += `<div class="strategy-name">${name}</div>`;
  html += `<div class="strategy-subtitle">${subtitle}</div>`;
  html += `<div class="strategy-metric"><div class="strategy-metric-label">Debt-Free Date</div><div class="strategy-metric-value">${dateStr}</div></div>`;
  html += `<div class="strategy-metric"><div class="strategy-metric-label">Total Interest</div><div class="strategy-metric-value ${result === minResult ? 'danger' : 'success'}">${formatCurrency(result.totalInterest)}</div></div>`;
  html += `<div class="strategy-metric"><div class="strategy-metric-label">Total Paid</div><div class="strategy-metric-value">${formatCurrency(result.totalPaid)}</div></div>`;
  html += `<div class="strategy-metric"><div class="strategy-metric-label">Months</div><div class="strategy-metric-value">${monthsStr}</div></div>`;

  if (savings && result !== minResult) {
    html += `<div class="strategy-savings">`;
    html += `<div class="savings-row"><span class="savings-label">Interest saved</span><span class="savings-value positive">${formatCurrency(savings.interestSaved)}</span></div>`;
    html += `<div class="savings-row"><span class="savings-label">Time saved</span><span class="savings-value positive">${savings.timeSaved} months</span></div>`;
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ========================
// SCHEDULE TABLE
// ========================
function renderSchedule() {
  const body = document.getElementById('schedule-body');
  const icon = document.getElementById('schedule-icon');

  if (!results[currentChartStrategy]) {
    body.innerHTML = '<p style="padding:20px;color:var(--text-secondary);">No data to display.</p>';
    return;
  }

  const result = results[currentChartStrategy];
  const debtNames = debts.map(d => d.name);

  let html = '<div class="schedule-table-wrapper"><table class="schedule-table"><thead><tr>';
  html += '<th>Month</th>';
  html += '<th>Date</th>';
  debtNames.forEach(name => {
    html += `<th>${escapeHtml(name)}</th>`;
  });
  html += '<th>Total Paid</th>';
  html += '</tr></thead><tbody>';

  const now = new Date();
  let cumulativePaid = 0;

  result.months.forEach((month, idx) => {
    const isCelebration = month.payments.some(p => p.balance === 0 && idx > 0 && result.months[idx - 1].payments.find(pp => pp.name === p.name && pp.balance > 0));
    const monthDate = new Date(now.getFullYear(), now.getMonth() + month.month, 1);
    const dateStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    html += `<tr class="${isCelebration ? 'celebration' : ''}">`;
    html += `<td>${month.month}</td>`;
    html += `<td>${dateStr}</td>`;

    let monthTotal = 0;
    month.payments.forEach(p => {
      const isTarget = p.isTarget && p.payment > p.interest + 0.01;
      const display = p.payment > 0 ? formatCurrencyShort(p.payment) : '—';
      html += `<td class="${isTarget ? 'target-marker' : ''}">${display}</td>`;
      monthTotal += p.payment;
    });

    cumulativePaid += monthTotal;
    html += `<td>${formatCurrencyShort(cumulativePaid)}</td>`;
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  body.innerHTML = html;
}

function toggleSchedule() {
  scheduleOpen = !scheduleOpen;
  const body = document.getElementById('schedule-body');
  const icon = document.getElementById('schedule-icon');
  body.classList.toggle('open', scheduleOpen);
  icon.classList.toggle('open', scheduleOpen);
}

function setChartStrategy(strategy) {
  currentChartStrategy = strategy;
  document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.strategy === strategy);
  });
  renderCharts();
  renderSchedule();
}

// ========================
// RECOMMENDATIONS
// ========================
function renderRecommendations() {
  const container = document.getElementById('recommendations');
  const tips = [];

  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const avgApr = totalBalance > 0 ? debts.reduce((s, d) => s + d.apr * (d.balance / totalBalance), 0) : 0;

  if (avgApr > 20) {
    tips.push({
      icon: '💳',
      title: 'Consider a balance transfer card',
      text: `Your weighted average APR is ${avgApr.toFixed(1)}%. A 0% APR balance transfer card could save you thousands. <a href="/blog/best-0-apr-credit-cards.html">Compare 0% APR cards →</a>`
    });
  }

  if (totalBalance > 15000) {
    tips.push({
      icon: '🏦',
      title: 'Look into debt consolidation',
      text: `With ${formatCurrency(totalBalance)} in debt, a personal consolidation loan at a lower rate could simplify payments and reduce interest.`
    });
  }

  tips.push({
    icon: '📊',
    title: 'Understand your total credit costs',
    text: `Not sure how you got here? <a href="/">Compare BNPL vs credit card costs</a> to make smarter payment choices going forward.`
  });

  tips.push({
    icon: '🔍',
    title: 'Check your credit score',
    text: `Your credit score determines what rates you qualify for. Check it free to see your options for balance transfers and consolidation loans.`
  });

  if (results.snowball && results.avalanche && extraPayment > 0) {
    const diff = Math.abs(results.snowball.totalInterest - results.avalanche.totalInterest);
    if (diff < 50) {
      tips.push({
        icon: '✨',
        title: 'Both strategies work great for you',
        text: `The difference between Snowball and Avalanche is only ${formatCurrency(diff)}. Pick whichever feels more motivating — the best plan is the one you'll stick with!`
      });
    }
  }

  container.innerHTML = tips.map(tip => `
    <div class="recommendation-card">
      <span class="recommendation-icon">${tip.icon}</span>
      <div class="recommendation-content">
        <strong>${tip.title}</strong>
        <p>${tip.text}</p>
      </div>
    </div>
  `).join('');
}

// ========================
// UTILITIES
// ========================
function updateConsolidationOptions() {
  const debtCheckboxesContainer = document.getElementById('consolidation-debt-checkboxes');
  const cardSelect = document.getElementById('consolidation-card-select');
  if (!debtCheckboxesContainer || !cardSelect) return;

  // Populate debt checkboxes
  if (debts.filter(d => d.balance > 0).length > 0) {
    debtCheckboxesContainer.innerHTML = debts
      .filter(d => d.balance > 0)
      .map(d => `
        <div class="debt-checkbox-item">
          <label>
            <input type="checkbox" 
                   class="debt-checkbox" 
                   data-debt-id="${d.id}" 
                   data-debt-balance="${d.balance}" 
                   onchange="handleDebtCheckboxChange()">
            ${escapeHtml(d.name)} — ${formatCurrency(d.balance)} at ${d.apr.toFixed(2)}% APR
          </label>
        </div>
      `)
      .join('');
  } else {
    debtCheckboxesContainer.innerHTML = '<p style="color:var(--text-secondary);">No debts available for transfer.</p>';
  }

  cardSelect.innerHTML = '<option value="">— Choose a card —</option>' + BALANCE_TRANSFER_CARDS
    .map(card => `<option value="${card.id}">${card.name} — ${card.introAprMonths} mo 0% APR • ${card.transferFeePct}% fee • Limit ${formatCurrency(card.creditLimit)}</option>`)
    .join('');

  updateConsolidationAmountHint();
}

function updateConsolidationAmountHint() {
  const debtCheckboxes = document.querySelectorAll('.debt-checkbox:checked');
  const cardSelect = document.getElementById('consolidation-card-select');
  const amountInput = document.getElementById('consolidation-amount');
  const info = document.getElementById('consolidation-limit-info');
  if (!cardSelect || !amountInput || !info) return;

  // Get selected debts
  const selectedDebts = Array.from(debtCheckboxes).map(cb => ({
    id: parseInt(cb.dataset.debtId),
    balance: parseFloat(cb.dataset.debtBalance)
  }));

  // If no debts selected, show default message
  if (selectedDebts.length === 0) {
    amountInput.value = 5000; // Default transfer amount
    info.textContent = 'Select debts to see the maximum transferable amount. Default transfer amount: $5,000.';
    return;
  }

  // Calculate total balance of selected debts
  const totalSelectedBalance = selectedDebts.reduce((sum, debt) => sum + debt.balance, 0);
  
  // Get selected card
  const card = BALANCE_TRANSFER_CARDS.find(c => c.id === cardSelect.value);

  // Default transfer amount is $5,000 (common approved amount for good credit)
  let defaultTransferAmount = 5000;
  
  // Cap at total selected balance
  defaultTransferAmount = Math.min(defaultTransferAmount, totalSelectedBalance);
  
  // If card is selected, also cap at card limit
  if (card) {
    defaultTransferAmount = Math.min(defaultTransferAmount, card.creditLimit);
  }
  
  amountInput.value = Math.round(defaultTransferAmount);

  if (!card) {
    info.textContent = `Total balance of selected debts: ${formatCurrency(totalSelectedBalance)}. Default transfer amount: ${formatCurrency(defaultTransferAmount)}.`;
    return;
  }

  const cappedByCard = defaultTransferAmount >= card.creditLimit;
  const cappedByBalance = defaultTransferAmount >= totalSelectedBalance;
  
  let capInfo = '';
  if (cappedByCard && cappedByBalance) {
    capInfo = ' (limited by both card limit and total debt balance)';
  } else if (cappedByCard) {
    capInfo = ` (limited by ${formatCurrency(card.creditLimit)} card limit)`;
  } else if (cappedByBalance) {
    capInfo = ' (limited by total debt balance)';
  }
  
  info.textContent = `Default transfer amount: ${formatCurrency(defaultTransferAmount)} to ${card.name}${capInfo}.`;
}

function simulateConsolidation(selectedDebtIds, newCardTerms, transferAmount) {
  // Get selected debts
  const selectedDebts = debts.filter(d => selectedDebtIds.includes(d.id));
  
  if (selectedDebts.length === 0 || !newCardTerms || !results.minimum) return null;

  const originalTransferAmount = Math.max(0, parseFloat(transferAmount) || 0);
  
  // Calculate total balance of selected debts
  const totalSelectedBalance = selectedDebts.reduce((sum, debt) => sum + debt.balance, 0);
  
  // Validate that total transfer doesn't exceed sum of selected debt balances
  if (originalTransferAmount > totalSelectedBalance) {
    alert(`Transfer amount cannot exceed total balance of selected debts (${formatCurrency(totalSelectedBalance)}).`);
    return null;
  }
  
  // Cap transfer amount at card limit
  const cappedTransferAmount = Math.min(originalTransferAmount, totalSelectedBalance, newCardTerms.creditLimit);
  const transferFee = cappedTransferAmount * (newCardTerms.transferFeePct / 100);
  const transferredBalance = cappedTransferAmount + transferFee;
  const originalTotalMin = debts.reduce((sum, debt) => sum + debt.minPayment, 0);
  const transferredMinPayment = Math.max(Math.ceil(transferredBalance * 0.02), 35);

  const clonedDebts = debts.map(debt => ({ ...debt }));
  
  // Reduce balance of each selected debt proportionally
  const transferRatio = cappedTransferAmount / totalSelectedBalance;
  selectedDebts.forEach(debt => {
    const clonedDebt = clonedDebts.find(d => d.id === debt.id);
    const amountToTransfer = debt.balance * transferRatio;
    clonedDebt.balance = Math.max(0, clonedDebt.balance - amountToTransfer);
    if (clonedDebt.balance <= 0.005) clonedDebt.minPayment = 0;
  });

  clonedDebts.push({
    id: Math.max(...clonedDebts.map(debt => debt.id), 0) + 1,
    name: `${newCardTerms.name} (Transferred Balance)`,
    balance: transferredBalance,
    apr: newCardTerms.postPromoApr,
    promoApr: 0,
    promoMonths: newCardTerms.introAprMonths,
    minPayment: transferredMinPayment
  });

  const minimum = simulateMinimums(clonedDebts);
  const snowball = simulateStrategy(clonedDebts, extraPayment, (a, b) => a.balance - b.balance);
  const avalanche = simulateStrategy(clonedDebts, extraPayment, (a, b) => b.apr - a.apr);

  const originalBest = [results.minimum, results.snowball, results.avalanche]
    .filter(Boolean)
    .sort((a, b) => a.totalInterest - b.totalInterest)[0];
  const consolidatedBest = [minimum, snowball, avalanche].sort((a, b) => a.totalInterest - b.totalInterest)[0];

  const warnings = [];
  
  if (totalSelectedBalance > newCardTerms.creditLimit) {
    warnings.push(`Insufficient credit limit: only ${formatCurrency(newCardTerms.creditLimit)} of ${formatCurrency(totalSelectedBalance)} can be transferred.`);
  }
  
  // Check if post-promo APR is better than average of selected debts
  const avgSelectedApr = selectedDebts.reduce((sum, debt) => sum + debt.apr, 0) / selectedDebts.length;
  if (newCardTerms.postPromoApr >= avgSelectedApr) {
    warnings.push(`Post-promo APR (${newCardTerms.postPromoApr.toFixed(2)}%) is not lower than your average selected debt APR (${avgSelectedApr.toFixed(2)}%).`);
  }
  
  if (transferFee > 0 && transferFee >= (originalBest.totalInterest - consolidatedBest.totalInterest)) {
    warnings.push('The transfer fee eats up most or all of the projected interest savings.');
  }
  
  if (cappedTransferAmount <= 0) {
    warnings.push('No balance could be transferred with the current settings.');
  }

  // Create a descriptive debt name for multiple debts
  let debtNames;
  if (selectedDebts.length === 1) {
    debtNames = selectedDebts[0].name;
  } else if (selectedDebts.length === 2) {
    debtNames = `${selectedDebts[0].name} and ${selectedDebts[1].name}`;
  } else {
    debtNames = `${selectedDebts[0].name} and ${selectedDebts.length - 1} other debts`;
  }

  return {
    debtIds: selectedDebtIds,
    debtNames: debtNames,
    newCardTerms,
    requestedTransferAmount: originalTransferAmount,
    transferAmount: cappedTransferAmount,
    transferFee,
    transferredBalance,
    originalBest,
    consolidatedBest,
    originalResults: { ...results },
    consolidatedResults: { minimum, snowball, avalanche },
    interestSaved: originalBest.totalInterest - consolidatedBest.totalInterest,
    timeSaved: originalBest.debtFreeMonths - consolidatedBest.debtFreeMonths,
    transferCost: transferFee,
    netSavings: (originalBest.totalInterest - consolidatedBest.totalInterest) - transferFee,
    originalDebtFreeDate: originalBest.debtFreeDate,
    newDebtFreeDate: consolidatedBest.debtFreeDate,
    originalTotalMin,
    newTotalMin: clonedDebts.reduce((sum, debt) => sum + debt.minPayment, 0),
    warnings,
    recommendation: ((originalBest.totalInterest - consolidatedBest.totalInterest) - transferFee) > 0
      ? `This consolidation saves you ${formatCurrency((originalBest.totalInterest - consolidatedBest.totalInterest) - transferFee)} and is recommended.`
      : `Not worth it — you'd lose ${formatCurrency(Math.abs(((originalBest.totalInterest - consolidatedBest.totalInterest) - transferFee)))}.`
  };
}

function renderConsolidationResults(resultsData) {
  const container = document.getElementById('consolidation-results');
  const resetBtn = document.getElementById('reset-consolidation-btn');
  if (!container) return;

  const outcomeClass = resultsData.netSavings >= 0 ? 'positive' : 'negative';
  const outcomeIcon = resultsData.netSavings >= 0 ? '✅' : '⚠️';
  const warningsHtml = resultsData.warnings.length
    ? `<div class="consolidation-warnings">${resultsData.warnings.map(w => `<div>${escapeHtml(w)}</div>`).join('')}</div>`
    : '';

  container.style.display = 'block';
  if (resetBtn) resetBtn.style.display = 'inline-flex';
  container.innerHTML = `
    <div class="consolidation-results-card ${outcomeClass}">
      <div class="consolidation-results-header">
        <div>
          <div class="consolidation-eyebrow">${escapeHtml(resultsData.debtNames)} → ${escapeHtml(resultsData.newCardTerms.name)}</div>
          <h3>${outcomeIcon} Balance Transfer Simulation</h3>
        </div>
        <div class="consolidation-net ${outcomeClass}">${resultsData.netSavings >= 0 ? '+' : '-'}${formatCurrency(Math.abs(resultsData.netSavings))}</div>
      </div>

      <div class="consolidation-summary-grid">
        <div class="consolidation-stat"><span>Interest saved</span><strong>${formatCurrency(resultsData.interestSaved)}</strong></div>
        <div class="consolidation-stat"><span>Time saved</span><strong>${resultsData.timeSaved} months</strong></div>
        <div class="consolidation-stat"><span>Total transfer fee</span><strong>${formatCurrency(resultsData.transferCost)}</strong></div>
        <div class="consolidation-stat"><span>Net savings</span><strong>${resultsData.netSavings >= 0 ? '+' : '-'}${formatCurrency(Math.abs(resultsData.netSavings))}</strong></div>
        <div class="consolidation-stat"><span>New debt-free date</span><strong>${formatDate(resultsData.newDebtFreeDate)}</strong></div>
        <div class="consolidation-stat"><span>Original debt-free date</span><strong>${formatDate(resultsData.originalDebtFreeDate)}</strong></div>
      </div>

      <div class="consolidation-detail-row">
        <div><strong>Transfer amount:</strong> ${formatCurrency(resultsData.transferAmount)}</div>
        <div><strong>New transferred balance:</strong> ${formatCurrency(resultsData.transferredBalance)}</div>
        <div><strong>Promo period:</strong> ${resultsData.newCardTerms.introAprMonths} months at 0% APR</div>
        <div><strong>Post-promo APR:</strong> ${resultsData.newCardTerms.postPromoApr.toFixed(2)}%</div>
      </div>

      ${warningsHtml}

      <!-- P1 #19: Balance transfer gotcha warnings -->
      <div class="bt-gotcha-warnings">
        <div class="bt-gotcha-title">⚠️ Before you transfer, know the risks:</div>
        <div class="bt-gotcha-item">⚠️ If you don't pay off the balance before the promo ends, the remaining balance accrues interest at the post-promo APR</div>
        <div class="bt-gotcha-item">⚠️ Some store cards charge retroactive interest. Read the terms</div>
        <div class="bt-gotcha-item">⚠️ Missing a payment can void the intro APR</div>
      </div>

      <div class="consolidation-comparison">
        <div class="comparison-card">
          <div class="comparison-title">Original best plan</div>
          <div><strong>${formatCurrency(resultsData.originalBest.totalInterest)}</strong> interest</div>
          <div>${resultsData.originalBest.debtFreeMonths} months</div>
          <div>${formatDate(resultsData.originalDebtFreeDate)}</div>
        </div>
        <div class="comparison-card recommended">
          <div class="comparison-title">Best consolidated plan</div>
          <div><strong>${formatCurrency(resultsData.consolidatedBest.totalInterest)}</strong> interest</div>
          <div>${resultsData.consolidatedBest.debtFreeMonths} months</div>
          <div>${formatDate(resultsData.newDebtFreeDate)}</div>
        </div>
      </div>

      <div class="consolidation-recommendation ${outcomeClass}">${escapeHtml(resultsData.recommendation)}</div>
    </div>
  `;
}

function runConsolidation() {
  const debtCheckboxes = document.querySelectorAll('.debt-checkbox:checked');
  const cardSelect = document.getElementById('consolidation-card-select');
  const amountInput = document.getElementById('consolidation-amount');
  const button = document.getElementById('consolidate-btn');
  if (!cardSelect || !amountInput) return;

  // Show loading state on button
  const originalText = button.textContent;
  button.textContent = 'Simulating...';
  button.classList.add('btn-loading');
  button.disabled = true;

  // Get selected debt IDs
  const selectedDebtIds = Array.from(debtCheckboxes).map(cb => parseInt(cb.dataset.debtId));
  
  const card = BALANCE_TRANSFER_CARDS.find(c => c.id === cardSelect.value);
  if (selectedDebtIds.length === 0 || !card) {
    resetConsolidationButton(button, originalText);
    alert('Select at least one debt and choose a balance transfer card first.');
    return;
  }

  // Use setTimeout to allow UI to update before heavy computation
  setTimeout(() => {
    try {
      consolidationResults = simulateConsolidation(selectedDebtIds, card, parseFloat(amountInput.value) || 0);
      if (consolidationResults) {
        renderConsolidationResults(consolidationResults);
      }
    } finally {
      resetConsolidationButton(button, originalText);
    }
  }, 0);
}

function resetConsolidationButton(button, originalText) {
  button.textContent = originalText;
  button.classList.remove('btn-loading');
  button.disabled = false;
}

function handleDebtCheckboxChange() {
  // Update the transfer amount hint when debt selection changes
  updateConsolidationAmountHint();
  
  // Reset consolidation results when selection changes
  resetConsolidation();
}

function resetConsolidation() {
  consolidationResults = null;
  const container = document.getElementById('consolidation-results');
  const resetBtn = document.getElementById('reset-consolidation-btn');
  if (container) {
    container.innerHTML = '';
    container.style.display = 'none';
  }
  if (resetBtn) resetBtn.style.display = 'none';
}

function formatCurrency(amount) {
  return '$' + Math.round(amount).toLocaleString('en-US');
}

function formatCurrencyShort(amount) {
  if (amount >= 1000) {
    return '$' + Math.round(amount).toLocaleString('en-US');
  }
  return '$' + amount.toFixed(2);
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========================
// P1 #18: APR AUTOSUGGEST
// ========================
function applyAprSuggest(inputEl, debtId) {
  const val = inputEl.value.trim();
  // Direct match
  if (CARD_APR_SUGGEST[val] !== undefined) {
    const aprInput = document.getElementById('apr-' + debtId);
    if (aprInput && (!aprInput.value || parseFloat(aprInput.value) === 0)) {
      aprInput.value = CARD_APR_SUGGEST[val];
      updateDebt(debtId, 'apr', aprInput.value);
    }
    return;
  }
  // Partial / case-insensitive match
  const lower = val.toLowerCase();
  for (const [name, apr] of Object.entries(CARD_APR_SUGGEST)) {
    if (name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())) {
      const aprInput = document.getElementById('apr-' + debtId);
      if (aprInput && (!aprInput.value || parseFloat(aprInput.value) === 0)) {
        aprInput.value = apr;
        updateDebt(debtId, 'apr', aprInput.value);
      }
      return;
    }
  }
}

// ========================
// P2 #44: REORDER DEBTS
// ========================
function reorderDebt(id, direction) {
  const idx = debts.findIndex(d => d.id === id);
  if (idx < 0) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= debts.length) return;
  // Swap
  [debts[idx], debts[newIdx]] = [debts[newIdx], debts[idx]];
  renderDebtCards();
  recalculate();
  notifyDebtsChanged();
}

// ========================
// P1 #20: WINDFALL MODELING
// ========================
function simulateWithWindfall(baseResult) {
  if (!baseResult || windfallAmount <= 0) return null;
  // Re-run the same strategy with a one-time payment applied at windfallMonth
  const sortFn = currentChartStrategy === 'avalanche'
    ? (a, b) => b.apr - a.apr
    : (a, b) => a.balance - b.balance;
  return simulateStrategyWithWindfall(debts, extraPayment, sortFn, windfallAmount, windfallMonth);
}

function simulateStrategyWithWindfall(debtsList, extra, sortFn, lumpSum, lumpMonth) {
  const sim = debtsList.map(d => ({
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    minPayment: d.minPayment,
    monthlyRate: d.apr / 100 / 12,
    promoApr: d.promoApr,
    promoMonths: d.promoMonths || 0
  }));

  const months = [];
  let totalInterest = 0;
  let totalPaid = 0;

  for (let m = 0; m < 360; m++) {
    const monthData = { month: m + 1, payments: [], balances: [], targetId: null };
    const active = sim.filter(d => d.balance > 0);
    if (active.length === 0) break;

    const sorted = [...active].sort(sortFn);
    const target = sorted[0];
    monthData.targetId = target.name;

    const interests = {};
    sim.forEach(d => {
      if (d.balance > 0) {
        const rate = m < (d.promoMonths || 0) ? ((d.promoApr || 0) / 100 / 12) : d.monthlyRate;
        interests[d.name] = d.balance * rate;
      }
    });

    let remainingExtra = extra;
    // Apply windfall in the designated month
    if (m + 1 === lumpMonth && lumpSum > 0) {
      remainingExtra += lumpSum;
    }

    sim.forEach(d => {
      if (d.balance <= 0) {
        monthData.payments.push({ name: d.name, payment: 0, interest: 0, principal: 0, balance: 0, isTarget: false });
        monthData.balances.push({ name: d.name, balance: 0 });
        return;
      }
      const interest = interests[d.name];
      let payment = Math.min(d.minPayment, d.balance + interest);
      const principal = payment - interest;
      d.balance = Math.max(0, d.balance - principal);
      totalInterest += interest;
      totalPaid += payment;
      const isTarget = (d.name === target.name);
      monthData.payments.push({ name: d.name, payment, interest, principal, balance: d.balance, isTarget });
      monthData.balances.push({ name: d.name, balance: d.balance });
    });

    while (remainingExtra > 0.005) {
      const stillActive = sim.filter(d => d.balance > 0.005);
      if (stillActive.length === 0) break;
      const nextTarget = [...stillActive].sort(sortFn)[0];
      const ep = Math.min(remainingExtra, nextTarget.balance);
      nextTarget.balance = Math.max(0, nextTarget.balance - ep);
      totalPaid += ep;
      remainingExtra -= ep;
      const rec = monthData.payments.find(p => p.name === nextTarget.name);
      if (rec) { rec.payment += ep; rec.principal += ep; rec.balance = nextTarget.balance; }
      const bRec = monthData.balances.find(b => b.name === nextTarget.name);
      if (bRec) bRec.balance = nextTarget.balance;
    }

    months.push(monthData);
  }

  const debtFreeMonths = months.length;
  const now = new Date();
  const debtFreeDate = new Date(now.getFullYear(), now.getMonth() + debtFreeMonths, 1);
  return { months, totalInterest, totalPaid, debtFreeMonths, debtFreeDate, warnings: [] };
}

function renderWindfallPanel(snow, av, bestResult) {
  if (!snow || !av) return '';
  const bf = simulateWithWindfall(bestResult || av);
  let resultsHtml = '';
  if (windfallAmount > 0 && bf && bestResult) {
    resultsHtml = `
      <div class="windfall-before-after">
        <div class="windfall-before">
          <div class="windfall-label">Before (no windfall)</div>
          <div>Debt-free: <strong>${bestResult.debtFreeMonths >= 360 ? '30+ years' : formatDate(bestResult.debtFreeDate)}</strong></div>
          <div>Interest: <strong>${formatCurrency(bestResult.totalInterest)}</strong></div>
        </div>
        <div class="windfall-after">
          <div class="windfall-label">After $${windfallAmount.toLocaleString()} at month ${windfallMonth}</div>
          <div>Debt-free: <strong>${bf.debtFreeMonths >= 360 ? '30+ years' : formatDate(bf.debtFreeDate)}</strong></div>
          <div>Interest: <strong>${formatCurrency(bf.totalInterest)}</strong></div>
          <div>Saved: <strong style="color:var(--success)">${formatCurrency(bestResult.totalInterest - bf.totalInterest)}</strong></div>
        </div>
      </div>
    `;
  }
  return `
    <div class="windfall-section">
      <h3>💰 What if you make a one-time payment?</h3>
      <div class="windfall-inputs">
        <div class="input-group">
          <label>One-time amount</label>
          <div class="input-with-prefix">
            <span class="prefix">$</span>
            <input type="number" id="windfall-amount" value="${windfallAmount}" min="0" step="100" inputmode="decimal" style="padding-left:38px;">
          </div>
        </div>
        <div class="input-group">
          <label>Apply at month</label>
          <input type="number" id="windfall-month" value="${windfallMonth}" min="1" max="360" step="1" inputmode="numeric">
        </div>
        <button class="btn-consolidate" onclick="updateWindfall()">Apply</button>
      </div>
      <div class="windfall-results">${resultsHtml}</div>
    </div>
  `;
}

function updateWindfall() {
  windfallAmount = parseFloat(document.getElementById('windfall-amount')?.value) || 0;
  windfallMonth = parseInt(document.getElementById('windfall-month')?.value) || 6;
  windfallMonth = Math.max(1, Math.min(360, windfallMonth));
  recalculate();
}

// ========================
// P2 #42: STRATEGY COMPARISON PANEL
// ========================
function renderStrategyComparisonPanel(min, snow, av) {
  if (!min || !snow || !av) return '';

  const best = av.totalInterest <= snow.totalInterest ? av : snow;
  const bestName = av.totalInterest <= snow.totalInterest ? 'Avalanche' : 'Snowball';

  const now = new Date();
  function fmtDate(months) {
    const d = new Date(now.getFullYear(), now.getMonth() + months, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  return `
    <div class="strategy-comparison-panel">
      <h3>📊 Strategy Comparison</h3>
      <div class="comparison-columns">
        <div class="comparison-col">
          <div class="comparison-col-title">🔵 Snowball</div>
          <div class="comparison-stat"><span>Payoff date</span><strong>${snow.debtFreeMonths >= 360 ? '30+ years' : fmtDate(snow.debtFreeMonths)}</strong></div>
          <div class="comparison-stat"><span>Total interest</span><strong>${formatCurrency(snow.totalInterest)}</strong></div>
          <div class="comparison-stat"><span>Monthly payment</span><strong>${formatCurrency(debts.reduce((s,d)=>s+d.minPayment,0) + extraPayment)}</strong></div>
        </div>
        <div class="comparison-col best">
          <div class="comparison-col-title">🟣 Avalanche ★</div>
          <div class="comparison-stat"><span>Payoff date</span><strong>${av.debtFreeMonths >= 360 ? '30+ years' : fmtDate(av.debtFreeMonths)}</strong></div>
          <div class="comparison-stat"><span>Total interest</span><strong>${formatCurrency(av.totalInterest)}</strong></div>
          <div class="comparison-stat"><span>Monthly payment</span><strong>${formatCurrency(debts.reduce((s,d)=>s+d.minPayment,0) + extraPayment)}</strong></div>
        </div>
        <div class="comparison-col">
          <div class="comparison-col-title">Minimum Only</div>
          <div class="comparison-stat"><span>Payoff date</span><strong>${min.debtFreeMonths >= 360 ? '30+ years' : fmtDate(min.debtFreeMonths)}</strong></div>
          <div class="comparison-stat"><span>Total interest</span><strong>${formatCurrency(min.totalInterest)}</strong></div>
          <div class="comparison-stat"><span>Monthly payment</span><strong>${formatCurrency(debts.reduce((s,d)=>s+d.minPayment,0))}</strong></div>
        </div>
      </div>
    </div>
  `;
}

// ========================
// P2 #34: DATE-OF-DATA STAMP
// ========================
function getDateLabel() {
  return '2026-04-28';
}

// ========================
// CREDIT SCORE SIMULATOR
// ========================

function updateCreditScore(value) {
  const oldCreditScore = creditScore;
  creditScore = Math.max(300, Math.min(850, parseInt(value) || 700));
  document.getElementById('credit-score-value').textContent = creditScore;
  document.getElementById('credit-score-slider').value = creditScore;
  document.getElementById('credit-score-input').value = creditScore;
  
  // Build a projected what-if snapshot — NEVER touch debts[]
  if (oldCreditScore !== creditScore) {
    buildSimulatorProjections(creditScore);
  }
  
  renderCreditScoreSimulator();
}

// Build simulated debt projections based on a hypothetical credit score.
// This writes ONLY to simulatorState.projectedDebts — never to debts[].
function buildSimulatorProjections(newScore) {
  if (debts.length === 0) {
    simulatorState.projectedDebts = null;
    simulatorState.score = null;
    simulatorState.projectedScoreDelta = 0;
    return;
  }
  
  const scoreChange = newScore - 700; // delta from baseline 700
  simulatorState.score = newScore;
  simulatorState.projectedScoreDelta = scoreChange;
  
  // Deep copy debts with projected APRs
  simulatorState.projectedDebts = debts.map(d => {
    // Start from the user's actual originalApr
    const baseApr = d.originalApr !== undefined ? d.originalApr : d.apr;
    const aprAdjustment = -scoreChange * 0.01;
    const projectedApr = Math.max(0, baseApr + aprAdjustment);
    const interestSaved = d.balance * ((baseApr - projectedApr) / 100) / 12; // monthly
    return {
      ...d,
      originalApr: baseApr,
      projectedApr,
      interestSavedPerMonth: interestSaved
    };
  });
}

// Reset simulator to no projection (clear what-if)
function resetSimulator() {
  simulatorState = { score: null, projectedDebts: null, projectedScoreDelta: 0 };
  // Restore creditScore to reflect the user's actual score
  // We don't know the "actual" score, so just clear the simulation overlay
  renderCreditScoreSimulator();
}

function updateCreditLimits(value) {
  totalCreditLimits = Math.max(0, parseFloat(value) || 0);
  document.getElementById('credit-limits-value').textContent = formatCurrency(totalCreditLimits);
  document.getElementById('credit-limits-slider').value = totalCreditLimits;
  document.getElementById('credit-limits-input').value = totalCreditLimits;
  renderCreditScoreSimulator();
}

function updateBalances(value) {
  currentBalances = Math.max(0, parseFloat(value) || 0);
  document.getElementById('balances-value').textContent = formatCurrency(currentBalances);
  document.getElementById('balances-slider').value = currentBalances;
  document.getElementById('balances-input').value = currentBalances;
  renderCreditScoreSimulator();
}

function calculateUtilizationImpact(balance, limit) {
  if (limit <= 0) return 0;
  const utilization = (balance / limit) * 100;
  
  // Credit score impact model based on utilization brackets
  if (utilization < 10) {
    return { impact: 15, label: 'Excellent', color: '#10b981' }; // +10-20 points
  } else if (utilization < 30) {
    return { impact: 0, label: 'Good', color: '#10b981' }; // Neutral
  } else if (utilization < 50) {
    return { impact: -20, label: 'Fair', color: '#f59e0b' }; // -10 to -30 points
  } else {
    return { impact: -40, label: 'Poor', color: '#ef4444' }; // Significant hit
  }
}

function renderCreditScoreSimulator() {
  const simulatorSection = document.getElementById('credit-score-simulator');
  if (!simulatorSection) return;
  
  // Calculate current utilization
  const currentUtilization = totalCreditLimits > 0 ? (currentBalances / totalCreditLimits) * 100 : 0;
  const currentImpact = calculateUtilizationImpact(currentBalances, totalCreditLimits);
  
  // Generate projected utilization over time
  const projections = [];
  let projectedBalances = currentBalances;
  let projectedScore = creditScore;
  
  // If we have debt payoff results, project utilization over time
  const result = results[currentChartStrategy];
  if (result && result.months && result.months.length > 0) {
    // Take snapshots at regular intervals
    const interval = Math.max(1, Math.floor(result.months.length / 12));
    for (let i = 0; i < result.months.length; i += interval) {
      const month = result.months[i];
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() + month.month);
      
      // Calculate total debt balance for this month
      let totalDebt = 0;
      month.balances.forEach(b => {
        totalDebt += b.balance;
      });
      
      // Projected utilization
      const projectedUtil = totalCreditLimits > 0 ? (totalDebt / totalCreditLimits) * 100 : 0;
      const impact = calculateUtilizationImpact(totalDebt, totalCreditLimits);
      const projectedScoreForMonth = Math.max(300, Math.min(850, creditScore + impact.impact));
      
      projections.push({
        month: month.month,
        date: monthDate,
        balance: totalDebt,
        utilization: projectedUtil,
        score: projectedScoreForMonth,
        impact: impact
      });
      
      // Stop if debt is paid off
      if (totalDebt <= 0) break;
    }
    
    // Add final point if not already included
    if (projections.length === 0 || projections[projections.length - 1].balance > 0) {
      const lastMonth = result.months[result.months.length - 1];
      if (lastMonth) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() + lastMonth.month);
        
        let totalDebt = 0;
        lastMonth.balances.forEach(b => {
          totalDebt += b.balance;
        });
        
        const projectedUtil = totalCreditLimits > 0 ? (totalDebt / totalCreditLimits) * 100 : 0;
        const impact = calculateUtilizationImpact(totalDebt, totalCreditLimits);
        const projectedScoreForMonth = Math.max(300, Math.min(850, creditScore + impact.impact));
        
        projections.push({
          month: lastMonth.month,
          date: monthDate,
          balance: totalDebt,
          utilization: projectedUtil,
          score: projectedScoreForMonth,
          impact: impact
        });
      }
    }
  }
  
  // Generate utilization brackets explanation
  const utilizationExplanation = `
    <div class="utilization-explanation">
      <h4>💳 Credit Utilization Brackets</h4>
      <div class="utilization-tier excellent">
        <div class="tier-label">Excellent (0-10%)</div>
        <div class="tier-impact">+10-20 points boost</div>
      </div>
      <div class="utilization-tier good">
        <div class="tier-label">Good (10-30%)</div>
        <div class="tier-impact">Neutral impact</div>
      </div>
      <div class="utilization-tier fair">
        <div class="tier-label">Fair (30-50%)</div>
        <div class="tier-impact">-10 to -30 points</div>
      </div>
      <div class="utilization-tier poor">
        <div class="tier-label">Poor (50%+)</div>
        <div class="tier-impact">Significant point loss</div>
      </div>
      <p style="margin-top:12px;font-size:0.85rem;color:var(--text-secondary);">
        Your current utilization is <strong>${currentUtilization.toFixed(1)}%</strong>, 
        which puts you in the <strong style="color:${currentImpact.color}">${currentImpact.label}</strong> range.
      </p>
    </div>
  `;
  
  // Generate projections table
  let projectionsHTML = '';
  if (projections.length > 0) {
    projectionsHTML = `
      <div class="projections-table-wrapper">
        <table class="projections-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Date</th>
              <th>Debt Balance</th>
              <th>Utilization</th>
              <th>Projected Score</th>
            </tr>
          </thead>
          <tbody>
            ${projections.map(p => `
              <tr>
                <td>${p.month}</td>
                <td>${p.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                <td>${formatCurrency(p.balance)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span>${p.utilization.toFixed(1)}%</span>
                    <div style="flex:1;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
                      <div style="height:100%;width:${Math.min(100, p.utilization)}%;background:${p.impact.color};"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span>${p.score}</span>
                    <span style="font-size:0.8rem;color:${p.impact.color}">${p.impact.impact > 0 ? '↑' : p.impact.impact < 0 ? '↓' : '→'}</span>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  // Build APR comparison rows if simulator projections exist
  let aprComparisonHTML = '';
  if (simulatorState.projectedDebts && simulatorState.projectedDebts.length > 0) {
    const rows = simulatorState.projectedDebts.map(d => {
      const actualApr = d.originalApr;
      const projectedApr = d.projectedApr;
      const monthlySavings = d.interestSavedPerMonth || 0;
      const diffClass = projectedApr < actualApr ? 'apr-improved' : projectedApr > actualApr ? 'apr-worsened' : 'apr-unchanged';
      return `<tr class="${diffClass}">
        <td>${escapeHtml(d.name)}</td>
        <td>${actualApr.toFixed(2)}%</td>
        <td>${projectedApr.toFixed(2)}%</td>
        <td>${monthlySavings > 0 ? 'Saves $' + monthlySavings.toFixed(2) + '/mo' : monthlySavings < 0 ? 'Costs $' + Math.abs(monthlySavings).toFixed(2) + '/mo' : 'No change'}</td>
      </tr>`;
    }).join('');
    
    aprComparisonHTML = `
      <div class="apr-comparison">
        <h4>💳 What if my credit score were ${simulatorState.score}?</h4>
        <table class="apr-comparison-table">
          <thead>
            <tr><th>Debt</th><th>Actual APR</th><th>Projected APR</th><th>Impact</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="simulator-disclaimer">Score-to-APR projections are illustrative only. Actual APRs depend on issuer underwriting, income, and other factors beyond credit score.</p>
        <button class="btn-reset-simulator" onclick="resetSimulator(); document.getElementById('credit-score-slider').value=700; document.getElementById('credit-score-input').value=700; updateCreditScore(700);">Reset to my actual score</button>
      </div>
    `;
  }
  
  simulatorSection.innerHTML = `
    <div class="credit-score-simulator-content">
      <h3>📈 Credit Score Impact Simulator</h3>
      
      <div class="credit-score-inputs">
        <div class="input-group">
          <label>Current Credit Score</label>
          <div class="slider-container">
            <input type="range" id="credit-score-slider" class="slider" min="300" max="850" value="${creditScore}" 
                   oninput="updateCreditScore(this.value)">
            <div class="slider-value" id="credit-score-value">${creditScore}</div>
          </div>
          <input type="number" id="credit-score-input" class="number-input" min="300" max="850" value="${creditScore}"
                 oninput="updateCreditScore(this.value)">
        </div>
        
        <div class="input-group">
          <label>Total Credit Limits</label>
          <div class="slider-container">
            <input type="range" id="credit-limits-slider" class="slider" min="0" max="50000" step="100" value="${totalCreditLimits}"
                   oninput="updateCreditLimits(this.value)">
            <div class="slider-value" id="credit-limits-value">${formatCurrency(totalCreditLimits)}</div>
          </div>
          <div class="input-with-prefix">
            <span class="prefix">$</span>
            <input type="number" id="credit-limits-input" class="number-input" min="0" step="100" value="${totalCreditLimits}"
                   oninput="updateCreditLimits(this.value)" style="padding-left:24px;">
          </div>
        </div>
        
        <div class="input-group">
          <label>Current Balances</label>
          <div class="slider-container">
            <input type="range" id="balances-slider" class="slider" min="0" max="${totalCreditLimits > 0 ? totalCreditLimits : 50000}" step="100" value="${currentBalances}"
                   oninput="updateBalances(this.value)">
            <div class="slider-value" id="balances-value">${formatCurrency(currentBalances)}</div>
          </div>
          <div class="input-with-prefix">
            <span class="prefix">$</span>
            <input type="number" id="balances-input" class="number-input" min="0" step="100" value="${currentBalances}"
                   oninput="updateBalances(this.value)" style="padding-left:24px;">
          </div>
        </div>
      </div>
      
      <div class="credit-score-info">
        <div class="score-display">
          <div class="current-score">Current Score: <span class="score-value">${creditScore}</span></div>
          <div class="utilization-display">Utilization: <span class="utilization-value" style="color:${currentImpact.color}">${currentUtilization.toFixed(1)}%</span></div>
          <div class="projected-impact">Projected Impact: <span class="impact-value" style="color:${currentImpact.color}">${currentImpact.impact > 0 ? '+' : ''}${currentImpact.impact} points</span></div>
        </div>
      </div>
      
      ${aprComparisonHTML}
      
      ${utilizationExplanation}
      
      ${projectionsHTML}
    </div>
  `;
}

// ========================
// INITIALIZATION
// ========================
function init() {
  console.log('Init started');
  // Bind add debt button FIRST (before any calculations that might error)
  document.getElementById('add-debt-btn').addEventListener('click', () => {
    console.log('Add debt button clicked');
    addDebt('', 0, 0, 0);
  });

  // Set up slider
  const slider = document.getElementById('extra-slider');
  const input = document.getElementById('extra-input');

  let debounceTimer;
  slider.addEventListener('input', () => {
    input.value = slider.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => updateExtraPayment(slider.value), 100);
  });

  input.addEventListener('input', () => {
    slider.value = input.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => updateExtraPayment(input.value), 100);
  });

  const consolidationCardSelect = document.getElementById('consolidation-card-select');
  const consolidationAmount = document.getElementById('consolidation-amount');
  if (consolidationCardSelect) consolidationCardSelect.addEventListener('change', updateConsolidationAmountHint);
  if (consolidationAmount) consolidationAmount.addEventListener('input', () => {
    consolidationResults = null;
    const resultsEl = document.getElementById('consolidation-results');
    const resetBtn = document.getElementById('reset-consolidation-btn');
    if (resultsEl) resultsEl.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';
  });

  // Set up credit score simulator sliders
  const creditScoreSlider = document.getElementById('credit-score-slider');
  const creditScoreInput = document.getElementById('credit-score-input');
  const creditLimitsSlider = document.getElementById('credit-limits-slider');
  const creditLimitsInput = document.getElementById('credit-limits-input');
  const balancesSlider = document.getElementById('balances-slider');
  const balancesInput = document.getElementById('balances-input');
  
  if (creditScoreSlider && creditScoreInput) {
    let creditScoreTimer;
    creditScoreSlider.addEventListener('input', () => {
      creditScoreInput.value = creditScoreSlider.value;
      clearTimeout(creditScoreTimer);
      creditScoreTimer = setTimeout(() => updateCreditScore(creditScoreSlider.value), 100);
    });
    
    creditScoreInput.addEventListener('input', () => {
      creditScoreSlider.value = creditScoreInput.value;
      clearTimeout(creditScoreTimer);
      creditScoreTimer = setTimeout(() => updateCreditScore(creditScoreInput.value), 100);
    });
  }
  
  if (creditLimitsSlider && creditLimitsInput) {
    let creditLimitsTimer;
    creditLimitsSlider.addEventListener('input', () => {
      creditLimitsInput.value = creditLimitsSlider.value;
      clearTimeout(creditLimitsTimer);
      creditLimitsTimer = setTimeout(() => updateCreditLimits(creditLimitsSlider.value), 100);
    });
    
    creditLimitsInput.addEventListener('input', () => {
      creditLimitsSlider.value = creditLimitsInput.value;
      clearTimeout(creditLimitsTimer);
      creditLimitsTimer = setTimeout(() => updateCreditLimits(creditLimitsInput.value), 100);
    });
  }
  
  if (balancesSlider && balancesInput) {
    let balancesTimer;
    balancesSlider.addEventListener('input', () => {
      balancesInput.value = balancesSlider.value;
      clearTimeout(balancesTimer);
      balancesTimer = setTimeout(() => updateBalances(balancesSlider.value), 100);
    });
    
    balancesInput.addEventListener('input', () => {
      balancesSlider.value = balancesInput.value;
      clearTimeout(balancesTimer);
      balancesTimer = setTimeout(() => updateBalances(balancesInput.value), 100);
    });
  }

  // Pre-populate with example debts
  console.log('Adding example debts');
  addDebt('Credit Card 1', 4200, 22.99, 84);
  addDebt('Credit Card 2', 8500, 18.49, 170);
  addDebt('Car Loan', 12300, 6.49, 285);
  console.log('Example debts added');

  updateConsolidationOptions();

  // P2 #34: Inject date-of-data stamp into footer
  const stampMount = document.getElementById('dateLabel');
  if (stampMount) stampMount.textContent = 'Rates current as of: ' + getDateLabel();

  // Initial calculation
  console.log('Starting initial calculation');
  updateExtraPayment(200);
  console.log('Init complete');
  
  // Initialize export button state
  hideSkeleton();

  // Notify PWA install prompt that results are ready
  try { window.dispatchEvent(new Event('creditstud:results-ready')); } catch (_) { /* ignore */ }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Event delegation for data-action attributes
document.addEventListener('click', function(event) {
  const action = event.target.closest('[data-action]')?.getAttribute('data-action');
  if (!action) return;
  
  switch (action) {
    case 'set-preset':
      const value = event.target.closest('[data-value]')?.getAttribute('data-value');
      if (value !== undefined) setPreset(parseInt(value, 10));
      break;
    case 'run-consolidation':
      runConsolidation();
      break;
    case 'reset-consolidation':
      resetConsolidation();
      break;
    case 'set-chart-strategy':
      const strategy = event.target.closest('[data-strategy]')?.getAttribute('data-strategy');
      if (strategy) setChartStrategy(strategy);
      break;
    case 'retry-charts':
      retryCharts();
      break;
    case 'toggle-schedule':
      toggleSchedule();
      break;
    case 'print':
      window.print();
      break;
    case 'export-csv':
      exportAmortizationCSV();
      break;
  }
});

// Export amortization schedule as CSV
function exportAmortizationCSV() {
  const result = results[currentChartStrategy];
  if (!result || !result.months || result.months.length === 0) {
    alert("No amortization data available. Please add debts and run a calculation first.");
    return;
  }

  // Create CSV content
  let csvContent = "Month,Debt Name,Payment,Principal,Interest,Remaining Balance\n";
  
  // Process each month
  result.months.forEach(month => {
    // Process each payment in the month
    month.payments.forEach(payment => {
      // Escape fields that might contain commas
      const escapeField = (field) => {
        const str = String(field);
        return str.includes(',') ? `"${str}"` : str;
      };
      
      csvContent += [
        month.month,
        escapeField(payment.name),
        payment.payment.toFixed(2),
        payment.principal.toFixed(2),
        payment.interest.toFixed(2),
        payment.balance.toFixed(2)
      ].join(',') + '\n';
    });
  });

  // Create filename with current date
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const filename = `creditstudio-amortization-${dateString}.csv`;

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Show confirmation message
  const statusEl = document.getElementById('export-status');
  if (statusEl) {
    statusEl.textContent = 'CSV file downloaded successfully!';
    setTimeout(() => {
      statusEl.textContent = '';
    }, 3000);
  }
}

// Expose helpers for the share-state module to call after URL hydration.
window.renderDebtCards = renderDebtCards;
window.updateSummary = updateSummary;
window.recalculate = recalculate;
window.exportAmortizationCSV = exportAmortizationCSV;
window.updateCreditScore = updateCreditScore;
window.updateCreditLimits = updateCreditLimits;
window.updateBalances = updateBalances;
window.resetSimulator = resetSimulator;
