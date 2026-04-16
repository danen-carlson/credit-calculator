/* Debt Planner - Chart Rendering (Chart.js) */

let debtChart = null;
let milestoneChart = null;

const DEBT_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#c026d3'];
const DEBT_COLORS_ALPHA = DEBT_COLORS.map(c => c + '40');

function renderCharts() {
  renderDebtOverTimeChart();
  renderMilestoneChart();
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
}

function renderMilestoneChart() {
  const container = document.getElementById('milestone-timeline');
  if (!container) return;

  const result = results[currentChartStrategy];
  if (!result || result.months.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">No data to display.</p>';
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
