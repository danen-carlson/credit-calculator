/* Debt Planner - Chart Rendering (Chart.js) */

let debtChart = null;
let milestoneChart = null;
let strategyComparisonChart = null;

const DEBT_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#c026d3'];
const DEBT_COLORS_ALPHA = DEBT_COLORS.map(c => c + '40');
const STRATEGY_COLORS = {
  snowball: '#3b82f6', // blue
  avalanche: '#8b5cf6', // purple
  minimum: '#64748b'    // gray
};

function renderCharts(retryCount = 0) {
  console.log('renderCharts called', { retryCount, chartJsLoaded: typeof Chart !== 'undefined' });
  
  // If Chart.js not loaded yet, retry with backoff
  if (typeof Chart === 'undefined') {
    if (retryCount < 5) {
      const delay = Math.pow(1.5, retryCount) * 200; // 200ms, 300ms, 450ms, 675ms, 1012ms
      console.log('Chart.js not loaded, retrying in', delay, 'ms');
      setTimeout(() => renderCharts(retryCount + 1), delay);
      return;
    } else {
      console.warn('Chart.js failed to load after 5 retries');
      
      // Show error message
      const errorEl = document.getElementById('chart-error');
      if (errorEl) errorEl.style.display = 'block';
      
      return;
    }
  }

  // Hide error if charts render successfully
  const errorEl = document.getElementById('chart-error');
  if (errorEl) errorEl.style.display = 'none';

  try {
    renderDebtOverTimeChart();
  } catch(e) { console.warn('Chart render error:', e); }
  try {
    renderStrategyComparisonChart();
  } catch(e) { console.warn('Strategy comparison chart render error:', e); }
  try {
    renderMilestoneChart();
  } catch(e) { console.warn('Milestone render error:', e); }
  try {
    renderCreditScoreChart();
  } catch(e) { console.warn('Credit score chart render error:', e); }
  console.log('renderCharts completed');
}

// Manual retry function for the button
function retryCharts() {
  const errorEl = document.getElementById('chart-error');
  if (errorEl) errorEl.style.display = 'none';
  renderCharts(0); // Start fresh retry
}

function renderDebtOverTimeChart() {
  const canvas = document.getElementById('debt-over-time-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  if (debtChart) {
    debtChart.destroy();
    debtChart = null;
  }

  const result = results[currentChartStrategy];
  if (!result || result.months.length === 0) return;

  if (typeof Chart === 'undefined') return;

  const debtNames = debts.map(d => d.name);
  const maxMonths = result.months.length;

  // Build datasets: one per debt, showing remaining balance over time
  const datasets = debtNames.map((name, idx) => {
    const data = result.months.map(m => {
      const bal = m.balances.find(b => b.name === name);
      return bal ? bal.balance : 0;
    });
    return {
      label: name,
      data: data,
      borderColor: DEBT_COLORS[idx % DEBT_COLORS.length],
      backgroundColor: DEBT_COLORS_ALPHA[idx % DEBT_COLORS_ALPHA.length],
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
    };
  });

  // Labels
  const labels = result.months.map(m => {
    if (m.month % 6 === 0 || m.month === 1 || m.month === maxMonths) {
      return `Month ${m.month}`;
    }
    return '';
  });

  try {
    debtChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            font: { family: 'Inter, sans-serif', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 29, 35, 0.9)',
          titleFont: { family: 'Inter, sans-serif', weight: '600' },
          bodyFont: { family: 'Inter, sans-serif' },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title: (items) => `Month ${items[0].dataIndex + 1}`,
            label: (item) => `${item.dataset.label}: $${Math.round(item.raw).toLocaleString()}`,
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11 },
            color: '#5f6775',
            maxRotation: 0,
            callback: function(val, index) {
              return this.getLabelForValue(val);
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f1f3f7' },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11 },
            color: '#5f6775',
            callback: (val) => '$' + (val >= 1000 ? (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k' : val)
          }
        }
      },
      animation: {
        duration: 600,
        easing: 'easeOutQuart'
      }
    }
  });
  } catch(e) { console.warn('Chart.js not loaded yet'); }
}

function renderMilestoneChart() {
  const container = document.getElementById('milestone-timeline');
  if (!container) return;

  console.log('Milestone chart render called', { currentChartStrategy, resultsAvailable: !!results, debtsLength: debts.length });
  const result = results[currentChartStrategy];
  console.log('Milestone data check:', { 
    resultExists: !!result, 
    monthsLength: result?.months?.length,
    minimum: !!results?.minimum,
    snowball: !!results?.snowball,
    avalanche: !!results?.avalanche
  });
  
  if (!result || result.months.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">No data to display.</p>';
    console.log('Milestone chart: No data to display');
    return;
  }

  const maxMonths = result.months.length;

  // Find when each debt is paid off
  const milestones = debts.map((debt, idx) => {
    let payoffMonth = null;
    for (let m = 0; m < result.months.length; m++) {
      const bal = result.months[m].balances.find(b => b.name === debt.name);
      if (bal && bal.balance <= 0 && payoffMonth === null) {
        payoffMonth = m + 1;
      }
    }
    return {
      name: debt.name,
      color: DEBT_COLORS[idx % DEBT_COLORS.length],
      payoffMonth: payoffMonth || maxMonths,
      initialBalance: debt.balance
    };
  });

  let html = '<div class="milestone-timeline">';

  milestones.forEach(m => {
    const pct = Math.min(100, (m.payoffMonth / maxMonths) * 100);
    const now = new Date();
    const payoffDate = new Date(now.getFullYear(), now.getMonth() + m.payoffMonth, 1);
    const dateStr = payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    html += `
      <div class="milestone-item">
        <div class="milestone-color" style="background:${m.color}"></div>
        <div class="milestone-label">${escapeHtml(m.name)}</div>
        <div class="milestone-bar-container">
          <div class="milestone-bar" style="width:${pct}%;background:${m.color}"></div>
        </div>
        <div class="milestone-month">Month ${m.payoffMonth}</div>
        <div class="milestone-star">⭐</div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderStrategyComparisonChart() {
  const canvas = document.getElementById('strategy-comparison-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Destroy existing chart if it exists
  if (strategyComparisonChart) {
    strategyComparisonChart.destroy();
    strategyComparisonChart = null;
  }

  // Check if we have all required data
  if (!results.snowball || !results.avalanche || !results.minimum) {
    console.log('Missing strategy data for comparison chart');
    // Clear the table as well
    const container = document.getElementById('strategy-comparison-table-container');
    if (container) container.innerHTML = '';
    return;
  }

  // Find the maximum number of months across all strategies
  const maxMonths = Math.max(
    results.snowball.months.length,
    results.avalanche.months.length,
    results.minimum.months.length
  );

  // Create labels for all months
  const labels = [];
  for (let i = 1; i <= maxMonths; i++) {
    if (i % 6 === 0 || i === 1 || i === maxMonths) {
      labels.push(`Month ${i}`);
    } else {
      labels.push('');
    }
  }

  // Function to get total balance at each month
  function getTotalBalances(strategyResult) {
    return strategyResult.months.map(month => 
      month.balances.reduce((sum, debt) => sum + debt.balance, 0)
    );
  }

  // Get balance data for each strategy
  const snowballBalances = getTotalBalances(results.snowball);
  const avalancheBalances = getTotalBalances(results.avalanche);
  const minimumBalances = getTotalBalances(results.minimum);

  // Pad arrays to match maxMonths length
  while (snowballBalances.length < maxMonths) snowballBalances.push(0);
  while (avalancheBalances.length < maxMonths) avalancheBalances.push(0);
  while (minimumBalances.length < maxMonths) minimumBalances.push(0);

  // Create datasets
  const datasets = [
    {
      label: 'Minimum Payments',
      data: minimumBalances,
      borderColor: STRATEGY_COLORS.minimum,
      backgroundColor: STRATEGY_COLORS.minimum + '20',
      fill: false,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2
    },
    {
      label: 'Debt Snowball',
      data: snowballBalances,
      borderColor: STRATEGY_COLORS.snowball,
      backgroundColor: STRATEGY_COLORS.snowball + '20',
      fill: false,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2
    },
    {
      label: 'Debt Avalanche',
      data: avalancheBalances,
      borderColor: STRATEGY_COLORS.avalanche,
      backgroundColor: STRATEGY_COLORS.avalanche + '20',
      fill: false,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2
    }
  ];

  // Create the chart
  strategyComparisonChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            font: { family: 'Inter, sans-serif', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 29, 35, 0.9)',
          titleFont: { family: 'Inter, sans-serif', weight: '600' },
          bodyFont: { family: 'Inter, sans-serif' },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title: (items) => `Month ${items[0].dataIndex + 1}`,
            label: (item) => `${item.dataset.label}: $${Math.round(item.raw).toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11 },
            color: '#5f6775',
            maxRotation: 0,
            callback: function(val, index) {
              return this.getLabelForValue(val);
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f1f3f7' },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11 },
            color: '#5f6775',
            callback: (val) => '$' + (val >= 1000 ? (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k' : val)
          }
        }
      },
      animation: {
        duration: 600,
        easing: 'easeOutQuart'
      }
    }
  });

  // Render the comparison table
  renderStrategyComparisonTable();
}

function renderStrategyComparisonTable() {
  const container = document.getElementById('strategy-comparison-table-container');
  if (!container) return;

  // Check if we have all required data
  if (!results.snowball || !results.avalanche || !results.minimum) {
    container.innerHTML = '';
    return;
  }

  // Find the optimal strategy (lowest total interest)
  const strategies = [
    { name: 'Minimum Payments', result: results.minimum, color: STRATEGY_COLORS.minimum },
    { name: 'Debt Snowball', result: results.snowball, color: STRATEGY_COLORS.snowball },
    { name: 'Debt Avalanche', result: results.avalanche, color: STRATEGY_COLORS.avalanche }
  ];

  const optimalStrategy = strategies.reduce((optimal, strategy) => 
    strategy.result.totalInterest < optimal.result.totalInterest ? strategy : optimal
  );

  // Format payoff dates
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Create table HTML
  let html = `
    <div class="strategy-comparison-table-wrapper">
      <table class="strategy-comparison-table">
        <thead>
          <tr>
            <th>Strategy</th>
            <th>Payoff Date</th>
            <th>Total Interest Paid</th>
          </tr>
        </thead>
        <tbody>
  `;

  strategies.forEach(strategy => {
    const isOptimal = strategy.name === optimalStrategy.name;
    const rowClass = isOptimal ? 'optimal-row' : '';
    const optimalBadge = isOptimal ? '<span class="optimal-badge">✓ Optimal</span>' : '';
    
    html += `
      <tr class="${rowClass}">
        <td>
          <div class="strategy-name-cell">
            <span class="strategy-color-indicator" style="background-color: ${strategy.color}"></span>
            ${escapeHtml(strategy.name)}
            ${optimalBadge}
          </div>
        </td>
        <td>${formatDate(strategy.result.debtFreeDate)}</td>
        <td>$${Math.round(strategy.result.totalInterest).toLocaleString()}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

// ========================
// CREDIT SCORE CHART
// ========================

function renderCreditScoreChart() {
  const canvas = document.getElementById('credit-score-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Destroy existing chart if it exists
  if (window.creditScoreChart) {
    window.creditScoreChart.destroy();
    window.creditScoreChart = null;
  }

  // Get the current strategy result
  const result = results[currentChartStrategy];
  if (!result || !result.months || result.months.length === 0) return;

  // Get credit score simulator values
  const { creditScore, totalCreditLimits, currentBalances } = window;
  
  // Generate data points for credit score projection
  const dataPoints = [];
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
    
    // Calculate credit score impact
    let impact = 0;
    if (projectedUtil < 10) {
      impact = 15; // +10-20 points
    } else if (projectedUtil < 30) {
      impact = 0; // Neutral
    } else if (projectedUtil < 50) {
      impact = -20; // -10 to -30 points
    } else {
      impact = -40; // Significant hit
    }
    
    const projectedScore = Math.max(300, Math.min(850, creditScore + impact));
    
    dataPoints.push({
      month: month.month,
      date: monthDate,
      debtBalance: totalDebt,
      utilization: projectedUtil,
      score: projectedScore
    });
    
    // Stop if debt is paid off
    if (totalDebt <= 0) break;
  }
  
  // Add final point if not already included
  if (dataPoints.length === 0 || dataPoints[dataPoints.length - 1].debtBalance > 0) {
    const lastMonth = result.months[result.months.length - 1];
    if (lastMonth) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() + lastMonth.month);
      
      let totalDebt = 0;
      lastMonth.balances.forEach(b => {
        totalDebt += b.balance;
      });
      
      const projectedUtil = totalCreditLimits > 0 ? (totalDebt / totalCreditLimits) * 100 : 0;
      
      // Calculate credit score impact
      let impact = 0;
      if (projectedUtil < 10) {
        impact = 15; // +10-20 points
      } else if (projectedUtil < 30) {
        impact = 0; // Neutral
      } else if (projectedUtil < 50) {
        impact = -20; // -10 to -30 points
      } else {
        impact = -40; // Significant hit
      }
      
      const projectedScore = Math.max(300, Math.min(850, creditScore + impact));
      
      dataPoints.push({
        month: lastMonth.month,
        date: monthDate,
        debtBalance: totalDebt,
        utilization: projectedUtil,
        score: projectedScore
      });
    }
  }
  
  // Prepare chart data
  const labels = dataPoints.map(point => 
    point.month % 6 === 0 || point.month === 1 || point.month === dataPoints[dataPoints.length - 1].month
      ? `Month ${point.month}`
      : ''
  );
  
  const scores = dataPoints.map(point => point.score);
  
  // Create the chart with dual axes
  window.creditScoreChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Debt Balance',
          data: dataPoints.map(point => point.debtBalance),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          yAxisID: 'y',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2
        },
        {
          label: 'Credit Score',
          data: scores,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          yAxisID: 'y1',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            font: { family: 'Inter, sans-serif', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 29, 35, 0.9)',
          titleFont: { family: 'Inter, sans-serif', weight: '600' },
          bodyFont: { family: 'Inter, sans-serif' },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title: (items) => `Month ${items[0].dataIndex + 1}`,
            label: function(context) {
              if (context.datasetIndex === 0) {
                return `${context.dataset.label}: $${Math.round(context.parsed.y).toLocaleString()}`;
              } else {
                return `${context.dataset.label}: ${Math.round(context.parsed.y)}`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11 },
            color: '#5f6775',
            maxRotation: 0
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: '#f1f3f7' },
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11 },
            color: '#5f6775',
            callback: (val) => '$' + (val >= 1000 ? (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k' : val)
          },
          title: {
            display: true,
            text: 'Debt Balance',
            font: { size: 12 }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          min: 300,
          max: 850,
          ticks: {
            font: { family: 'Inter, sans-serif', size: 11 },
            color: '#5f6775',
            callback: (val) => val
          },
          title: {
            display: true,
            text: 'Credit Score',
            font: { size: 12 }
          }
        }
      },
      animation: {
        duration: 600,
        easing: 'easeOutQuart'
      }
    }
  });
}
