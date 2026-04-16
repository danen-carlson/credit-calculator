/* Debt Planner - Calculation Logic & Interactivity */

// ========================
// STATE
// ========================
let debts = [];
let extraPayment = 200;
let results = { minimum: null, snowball: null, avalanche: null };
let currentChartStrategy = 'snowball';
let scheduleOpen = false;

const DEBT_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#c026d3'];

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
  recalculate();
}

function removeDebt(id) {
  debts = debts.filter(d => d.id !== id);
  renderDebtCards();
  updateSummary();
  recalculate();
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
  recalculate();
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
    monthlyRate: d.apr / 100 / 12
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

      const interest = d.balance * d.monthlyRate;
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
    monthlyRate: d.apr / 100 / 12
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
        interests[d.name] = d.balance * d.monthlyRate;
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
  try { calculateAll(); } catch(e) { console.warn('Calc error:', e); }
  try { renderResults(); } catch(e) { console.warn('Results render error:', e); }
  try { renderCharts(); } catch(e) { console.warn('Charts render error:', e); }
  try { renderSchedule(); } catch(e) { console.warn('Schedule render error:', e); }
  try { renderRecommendations(); } catch(e) { console.warn('Recommendations render error:', e); }
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
  // Bind add debt button FIRST (before any calculations that might error)
  document.getElementById('add-debt-btn').addEventListener('click', () => {
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

  // Pre-populate with example debts
  addDebt('Credit Card 1', 4200, 22.99, 84);
  addDebt('Credit Card 2', 8500, 18.49, 170);
  addDebt('Car Loan', 12300, 6.49, 285);

  // Initial calculation
  updateExtraPayment(200);
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
