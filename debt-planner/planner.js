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
    minPayment: parseFloat(d.minPayment) || 0
  }));
  window.debts = debts;
};
window.debts = debts;

// DEBT_COLORS is defined in charts.js — that's the only place it's used
const BALANCE_TRANSFER_CARDS = [
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash',
    introAprMonths: 18,
    transferFeePct: 0,
    postPromoApr: 18.24,
    creditLimit: 8000
  },
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    introAprMonths: 15,
    transferFeePct: 3,
    postPromoApr: 20.24,
    creditLimit: 6000
  },
  {
    id: 'discover-it',
    name: 'Discover it',
    introAprMonths: 15,
    transferFeePct: 3,
    postPromoApr: 19.24,
    creditLimit: 7000
  },
  {
    id: 'amex-blue-cash',
    name: 'Amex Blue Cash',
    introAprMonths: 15,
    transferFeePct: 3,
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
    minPayment: parseFloat(minPayment) || 0
  });
  renderDebtCards();
  updateSummary();
  updateConsolidationOptions();
  recalculate();
  notifyDebtsChanged();
}

function removeDebt(id) {
  debts = debts.filter(d => d.id !== id);
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
  } else {
    debt[field] = parseFloat(value) || 0;
  }
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
    card.innerHTML = `
      <div class="input-group">
        <label>Name</label>
        <input type="text" value="${escapeHtml(debt.name)}" 
               onchange="updateDebt(${debt.id}, 'name', this.value)" placeholder="e.g. Chase Visa">
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
               onchange="updateDebt(${debt.id}, 'apr', this.value)">
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

  document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
  document.getElementById('total-min').textContent = formatCurrency(totalMin);
  document.getElementById('weighted-apr').textContent = weightedApr.toFixed(2) + '%';

  // Update slider max based on debt size
  const slider = document.getElementById('extra-slider');
  const suggestedMax = Math.max(1000, Math.ceil(totalBalance / 12 / 100) * 100);
  slider.max = suggestedMax;
}

// ========================
// EXTRA PAYMENT
// ========================
function updateExtraPayment(value) {
  extraPayment = Math.max(0, parseFloat(value) || 0);
  document.getElementById('extra-amount').textContent = formatCurrency(extraPayment);
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);
  document.getElementById('extra-total').textContent = formatCurrency(totalMin + extraPayment);

  // Update preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.value) === extraPayment);
  });

  recalculate();
}

function setPreset(value) {
  document.getElementById('extra-slider').value = value;
  document.getElementById('extra-input').value = value;
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

  // Minimum card
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

  container.innerHTML = html;
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
  const debtSelect = document.getElementById('consolidation-debt-select');
  const cardSelect = document.getElementById('consolidation-card-select');
  if (!debtSelect || !cardSelect) return;

  const selectedDebt = debtSelect.value;
  const selectedCard = cardSelect.value;

  debtSelect.innerHTML = '<option value="">— Choose a debt —</option>' + debts
    .filter(d => d.balance > 0)
    .map(d => `<option value="${d.id}">${escapeHtml(d.name)} — ${formatCurrency(d.balance)} at ${d.apr.toFixed(2)}% APR</option>`)
    .join('');

  cardSelect.innerHTML = '<option value="">— Choose a card —</option>' + BALANCE_TRANSFER_CARDS
    .map(card => `<option value="${card.id}">${card.name} — ${card.introAprMonths} mo 0% APR • ${card.transferFeePct}% fee • Limit ${formatCurrency(card.creditLimit)}</option>`)
    .join('');

  if (debts.some(d => String(d.id) === selectedDebt)) debtSelect.value = selectedDebt;
  if (BALANCE_TRANSFER_CARDS.some(card => card.id === selectedCard)) cardSelect.value = selectedCard;

  updateConsolidationAmountHint();
}

function updateConsolidationAmountHint() {
  const debtSelect = document.getElementById('consolidation-debt-select');
  const cardSelect = document.getElementById('consolidation-card-select');
  const amountInput = document.getElementById('consolidation-amount');
  const info = document.getElementById('consolidation-limit-info');
  if (!debtSelect || !cardSelect || !amountInput || !info) return;

  const debt = debts.find(d => String(d.id) === debtSelect.value);
  const card = BALANCE_TRANSFER_CARDS.find(c => c.id === cardSelect.value);

  if (!debt) {
    amountInput.value = 0;
    info.textContent = 'Pick a debt to see the maximum transferable amount.';
    return;
  }

  const maxTransfer = card ? Math.min(debt.balance, card.creditLimit) : debt.balance;
  amountInput.max = maxTransfer;
  if (!parseFloat(amountInput.value) || parseFloat(amountInput.value) > maxTransfer) {
    amountInput.value = Math.round(maxTransfer);
  }

  if (!card) {
    info.textContent = `Debt balance available to transfer: ${formatCurrency(debt.balance)}.`;
    return;
  }

  const capped = debt.balance > card.creditLimit;
  info.textContent = `You can transfer up to ${formatCurrency(maxTransfer)} to ${card.name}${capped ? ` (limited by ${formatCurrency(card.creditLimit)} credit limit)` : ''}.`;
}

function simulateConsolidation(debtId, newCardTerms, transferAmount) {
  const targetDebt = debts.find(d => d.id === debtId);
  if (!targetDebt || !newCardTerms || !results.minimum) return null;

  const originalTransferAmount = Math.max(0, parseFloat(transferAmount) || 0);
  const cappedTransferAmount = Math.min(originalTransferAmount || targetDebt.balance, targetDebt.balance, newCardTerms.creditLimit);
  const transferFee = cappedTransferAmount * (newCardTerms.transferFeePct / 100);
  const transferredBalance = cappedTransferAmount + transferFee;
  const originalTotalMin = debts.reduce((sum, debt) => sum + debt.minPayment, 0);
  const transferredMinPayment = Math.max(Math.ceil(transferredBalance * 0.02), 35);

  const clonedDebts = debts.map(debt => ({ ...debt }));
  const clonedTarget = clonedDebts.find(debt => debt.id === debtId);
  clonedTarget.balance = Math.max(0, clonedTarget.balance - cappedTransferAmount);
  if (clonedTarget.balance <= 0.005) clonedTarget.minPayment = 0;

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
  if (targetDebt.balance > newCardTerms.creditLimit) {
    warnings.push(`Insufficient credit limit: only ${formatCurrency(newCardTerms.creditLimit)} of ${formatCurrency(targetDebt.balance)} can be transferred.`);
  }
  if (newCardTerms.postPromoApr >= targetDebt.apr) {
    warnings.push(`Post-promo APR (${newCardTerms.postPromoApr.toFixed(2)}%) is not lower than your current APR (${targetDebt.apr.toFixed(2)}%).`);
  }
  if (transferFee > 0 && transferFee >= (originalBest.totalInterest - consolidatedBest.totalInterest)) {
    warnings.push('The transfer fee eats up most or all of the projected interest savings.');
  }
  if (cappedTransferAmount <= 0) {
    warnings.push('No balance could be transferred with the current settings.');
  }

  return {
    debtId,
    debtName: targetDebt.name,
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
          <div class="consolidation-eyebrow">${escapeHtml(resultsData.debtName)} → ${escapeHtml(resultsData.newCardTerms.name)}</div>
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
  const debtSelect = document.getElementById('consolidation-debt-select');
  const cardSelect = document.getElementById('consolidation-card-select');
  const amountInput = document.getElementById('consolidation-amount');
  const button = document.getElementById('consolidate-btn');
  if (!debtSelect || !cardSelect || !amountInput) return;

  // Show loading state on button
  const originalText = button.textContent;
  button.textContent = 'Simulating...';
  button.classList.add('btn-loading');
  button.disabled = true;

  const debtId = parseInt(debtSelect.value, 10);
  const card = BALANCE_TRANSFER_CARDS.find(c => c.id === cardSelect.value);
  if (!debtId || !card) {
    resetConsolidationButton(button, originalText);
    alert('Choose a debt and a balance transfer card first.');
    return;
  }

  // Use setTimeout to allow UI to update before heavy computation
  setTimeout(() => {
    try {
      consolidationResults = simulateConsolidation(debtId, card, parseFloat(amountInput.value) || 0);
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

  const consolidationDebtSelect = document.getElementById('consolidation-debt-select');
  const consolidationCardSelect = document.getElementById('consolidation-card-select');
  const consolidationAmount = document.getElementById('consolidation-amount');
  if (consolidationDebtSelect) consolidationDebtSelect.addEventListener('change', updateConsolidationAmountHint);
  if (consolidationCardSelect) consolidationCardSelect.addEventListener('change', updateConsolidationAmountHint);
  if (consolidationAmount) consolidationAmount.addEventListener('input', () => {
    consolidationResults = null;
    const resultsEl = document.getElementById('consolidation-results');
    const resetBtn = document.getElementById('reset-consolidation-btn');
    if (resultsEl) resultsEl.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';
  });

  // Pre-populate with example debts
  console.log('Adding example debts');
  addDebt('Credit Card 1', 4200, 22.99, 84);
  addDebt('Credit Card 2', 8500, 18.49, 170);
  addDebt('Car Loan', 12300, 6.49, 285);
  console.log('Example debts added');

  updateConsolidationOptions();

  // Initial calculation
  console.log('Starting initial calculation');
  updateExtraPayment(200);
  console.log('Init complete');
  
  // Initialize export button state
  hideSkeleton();
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

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
