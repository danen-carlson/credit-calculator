// Minimum Payment Trap Calculator — CreditStud.io
(function () {
  'use strict';

  const balanceEl = document.getElementById('balance');
  const aprEl = document.getElementById('apr');
  const minPayEl = document.getElementById('minPayPercent');

  const payoffTimeEl = document.getElementById('payoffTime');
  const totalInterestEl = document.getElementById('totalInterest');
  const totalPaidEl = document.getElementById('totalPaid');
  const totalPaidSubEl = document.getElementById('totalPaidSub');

  const barPrincipalEl = document.getElementById('barPrincipal');
  const barInterestEl = document.getElementById('barInterest');
  const barPrincipalLabelEl = document.getElementById('barPrincipalLabel');
  const barInterestLabelEl = document.getElementById('barInterestLabel');
  const legendPrincipalEl = document.getElementById('legendPrincipal');
  const legendInterestEl = document.getElementById('legendInterest');

  function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatMonths(totalMonths) {
    if (totalMonths === Infinity || !isFinite(totalMonths)) return 'Never (interest exceeds payments)';
    const years = Math.floor(totalMonths / 12);
    const months = Math.round(totalMonths % 12);
    if (years === 0) return months + ' month' + (months !== 1 ? 's' : '');
    if (months === 0) return years + ' year' + (years !== 1 ? 's' : '');
    return years + ' year' + (years !== 1 ? 's' : '') + ', ' + months + ' month' + (months !== 1 ? 's' : '');
  }

  // Calculate payoff with minimum payments
  function calculateMinPayment(balance, monthlyRate, minPayPercent) {
    let months = 0;
    let totalPaid = 0;
    let totalInterest = 0;
    const originalBalance = balance;
    const maxMonths = 1200; // 100 years cap

    while (balance > 0.01 && months < maxMonths) {
      const minPayment = Math.max(balance * minPayPercent / 100, 25);
      const interest = balance * monthlyRate;

      // Check if interest exceeds minimum payment (never pays off)
      if (interest >= minPayment) {
        return { months: Infinity, totalPaid: Infinity, totalInterest: Infinity, originalBalance };
      }

      const principal = minPayment - interest;
      balance -= principal;
      totalPaid += minPayment;
      totalInterest += interest;
      months++;

      if (balance < 0) {
        totalPaid += balance; // adjust for overpayment
        balance = 0;
      }
    }

    return { months, totalPaid, totalInterest, originalBalance };
  }

  // Calculate payoff with fixed extra payment
  function calculateWithExtra(balance, monthlyRate, minPayPercent, extraPerMonth) {
    let months = 0;
    let totalPaid = 0;
    let totalInterest = 0;
    const maxMonths = 1200;

    while (balance > 0.01 && months < maxMonths) {
      const minPayment = Math.max(balance * minPayPercent / 100, 25);
      const payment = minPayment + extraPerMonth;
      const interest = balance * monthlyRate;

      if (interest >= payment) {
        return { months: Infinity, totalPaid: Infinity, totalInterest: Infinity };
      }

      const principal = payment - interest;
      balance -= principal;
      totalPaid += payment;
      totalInterest += interest;
      months++;

      if (balance < 0) {
        totalPaid += balance;
        balance = 0;
      }
    }

    return { months, totalPaid, totalInterest };
  }

  function calculate() {
    const balance = parseFloat(balanceEl.value) || 5000;
    const apr = parseFloat(aprEl.value) || 24.99;
    const minPayPercent = parseFloat(minPayEl.value) || 2;
    const monthlyRate = apr / 100 / 12;

    // Main calculation
    const result = calculateMinPayment(balance, monthlyRate, minPayPercent);

    // Update hero stats
    if (result.months === Infinity) {
      payoffTimeEl.textContent = 'Never paid off';
      totalInterestEl.textContent = '∞';
      totalPaidEl.textContent = '∞';
      totalPaidSubEl.textContent = 'interest exceeds minimum payment';
    } else {
      payoffTimeEl.textContent = formatMonths(result.months);
      totalInterestEl.textContent = formatCurrency(result.totalInterest);
      totalPaidEl.textContent = formatCurrency(result.totalPaid);
      totalPaidSubEl.textContent = 'to clear ' + formatCurrency(balance);
    }

    // Stacked bar
    if (result.months !== Infinity && result.totalPaid > 0) {
      const principalPct = (balance / result.totalPaid * 100);
      const interestPct = 100 - principalPct;
      barPrincipalEl.style.width = principalPct + '%';
      barInterestEl.style.width = interestPct + '%';
      barPrincipalLabelEl.textContent = formatCurrency(balance);
      barInterestLabelEl.textContent = formatCurrency(result.totalInterest);
      legendPrincipalEl.textContent = formatCurrency(balance);
      legendInterestEl.textContent = formatCurrency(result.totalInterest);
    } else {
      barPrincipalEl.style.width = '0%';
      barInterestEl.style.width = '100%';
      barInterestLabelEl.textContent = 'Interest exceeds payments';
      legendPrincipalEl.textContent = '—';
      legendInterestEl.textContent = '∞';
    }

    // Comparison scenarios
    const scenarios = [25, 50, 100];
    scenarios.forEach(extra => {
      const withExtra = calculateWithExtra(balance, monthlyRate, minPayPercent, extra);
      const timeEl = document.getElementById('time' + extra);
      const intSaveEl = document.getElementById('intSave' + extra);
      const saveEl = document.getElementById('save' + extra);

      if (withExtra.months === Infinity) {
        timeEl.textContent = 'Still won\'t pay off';
        intSaveEl.textContent = '—';
        saveEl.textContent = '';
      } else {
        timeEl.textContent = formatMonths(withExtra.months);
        if (result.months !== Infinity) {
          const interestSaved = result.totalInterest - withExtra.totalInterest;
          intSaveEl.textContent = formatCurrency(interestSaved);
          const yearsSaved = Math.max(0, result.months - withExtra.months);
          saveEl.textContent = 'Pay off ' + formatMonths(yearsSaved) + ' sooner';
        } else {
          intSaveEl.textContent = formatCurrency(withExtra.totalInterest) + ' total interest';
          saveEl.textContent = 'Actually pays off!';
        }
      }
    });

    // Update CTA links
    const plannerLink = document.getElementById('ctaPlanner');
    if (plannerLink) {
      plannerLink.href = '/debt-planner/?balance=' + encodeURIComponent(balance) + '&apr=' + encodeURIComponent(apr);
    }
  }

  // Live updating
  let debounceTimer;
  function debouncedCalculate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(calculate, 150);
  }

  balanceEl.addEventListener('input', debouncedCalculate);
  aprEl.addEventListener('input', debouncedCalculate);
  minPayEl.addEventListener('input', debouncedCalculate);

  // Share configuration
  if (typeof ShareButtons !== 'undefined') {
    new ShareButtons({
      container: document.getElementById('shareBar'),
      url: window.location.href,
      title: 'Minimum Payment Trap Calculator — CreditStud.io',
      description: 'I just discovered it would take ' + (payoffTimeEl.textContent || 'years') + ' to pay off my credit card making only minimum payments! See your true cost →',
      inputs: [
        { id: 'balance', type: 'number', param: 'balance' },
        { id: 'apr', type: 'number', param: 'apr' },
        { id: 'minPayPercent', type: 'number', param: 'minPct' }
      ]
    });
  }

  // Cross-tool params
  const params = new URLSearchParams(window.location.search);
  if (params.has('balance')) balanceEl.value = params.get('balance');
  if (params.has('apr')) aprEl.value = params.get('apr');

  // Initial calculation
  calculate();
})();