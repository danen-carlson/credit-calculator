// Personal Loan vs Balance Transfer Calculator — CreditStud.io
(function () {
  'use strict';

  const debtEl = document.getElementById('debtAmount');
  const aprEl = document.getElementById('currentAPR');
  const tierEl = document.getElementById('creditTier');
  const monthsEl = document.getElementById('payoffMonths');
  const monthsVal = document.getElementById('payoffMonthsVal');

  const verdictBar = document.getElementById('verdictBar');
  const verdictText = document.getElementById('verdictText');

  function formatCurrency(amount) {
    return '$' + Math.round(amount).toLocaleString();
  }

  function calculateAmortization(principal, apr, months) {
    const monthlyRate = apr / 100 / 12;
    if (monthlyRate === 0) {
      return { monthly: principal / months, totalInterest: 0, totalPaid: principal };
    }
    const monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPaid = monthly * months;
    const totalInterest = totalPaid - principal;
    return { monthly, totalInterest, totalPaid };
  }

  function calculateBT(debt, introMonths, btFee, regularAPR, totalMonths) {
    const btFeeAmount = debt * btFee / 100;
    // During intro period, pay equal installments
    const monthlyDuringIntro = debt / introMonths;
    let totalInterest = 0;
    let remainingBalance = debt;
    let totalPaid = btFeeAmount + debt;

    // If can pay off during intro period
    if (introMonths >= totalMonths) {
      return {
        monthly: monthlyDuringIntro,
        totalInterest: btFeeAmount,
        totalPaid: debt + btFeeAmount,
        paidOffInIntro: true,
        remainingAfterIntro: 0
      };
    }

    // Pay during intro period first
    for (let i = 0; i < introMonths; i++) {
      remainingBalance -= monthlyDuringIntro;
    }

    if (remainingBalance <= 0) {
      return {
        monthly: monthlyDuringIntro,
        totalInterest: btFeeAmount,
        totalPaid: debt + btFeeAmount,
        paidOffInIntro: true,
        remainingAfterIntro: 0
      };
    }

    // After intro, regular APR kicks in
    const remainingMonths = totalMonths - introMonths;
    const monthlyRate = regularAPR / 100 / 12;
    const regularMonthly = remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
      (Math.pow(1 + monthlyRate, remainingMonths) - 1);

    let postInterest = 0;
    let bal = remainingBalance;
    for (let i = 0; i < remainingMonths; i++) {
      const interest = bal * monthlyRate;
      bal -= (regularMonthly - interest);
      postInterest += interest;
    }

    totalInterest = btFeeAmount + postInterest;
    totalPaid = debt + totalInterest;

    return {
      monthly: Math.max(monthlyDuringIntro, regularMonthly),
      totalInterest,
      totalPaid,
      paidOffInIntro: false,
      remainingAfterIntro: remainingBalance,
      regularMonthly,
      introMonthly: monthlyDuringIntro
    };
  }

  function calculateLoan(debt, aprMin, aprMax, origMin, origMax, months) {
    const originationMid = (origMin + origMax) / 2;
    const originationFee = debt * originationMid / 100;
    const loanAmount = debt; // you receive debt - origination
    const midApr = (aprMin + aprMax) / 2;

    const result = calculateAmortization(loanAmount, midApr, months);
    return {
      monthly: result.monthly,
      totalInterest: result.totalInterest,
      totalPaid: result.totalPaid + originationFee,
      originationFee,
      aprUsed: midApr,
      originationPct: originationMid
    };
  }

  function calculate() {
    const debt = parseFloat(debtEl.value) || 10000;
    const currentAPR = parseFloat(aprEl.value) || 24.99;
    const tier = tierEl.value;
    const months = parseInt(monthsEl.value) || 36;
    const loanRates = LOAN_RATES[tier];

    // Find best BT card for the tier
    const tierPriority = { excellent: ['excellent', 'good', 'fair'], good: ['good', 'fair'], fair: ['fair', 'good'], poor: ['fair'] };
    const eligibleTiers = tierPriority[tier] || ['good', 'fair'];
    const btCard = BT_CARDS.find(c => eligibleTiers.includes(c.minCredit)) || BT_CARDS[0];

    // BT calculation
    const btResult = calculateBT(debt, btCard.introMonths, btCard.btFee, btCard.regularAPR, months);

    // Loan calculation
    const loanResult = calculateLoan(debt, loanRates.aprMin, loanRates.aprMax, loanRates.originationMin, loanRates.originationMax, months);

    // Update BT display
    document.getElementById('btCardName').textContent = btCard.name;
    document.getElementById('btIntroAPR').textContent = btCard.introAPR === 0 ? `0% for ${btCard.introMonths} months` : `${btCard.introAPR}% intro`;
    document.getElementById('btFee').textContent = `${btCard.btFee}% (${formatCurrency(debt * btCard.btFee / 100)})`;

    if (btResult.paidOffInIntro) {
      document.getElementById('btMonthly').textContent = formatCurrency(btResult.monthly) + '/mo';
      document.getElementById('btTotalInterest').textContent = formatCurrency(btResult.totalInterest) + ' (BT fee only)';
    } else {
      document.getElementById('btMonthly').textContent = `${formatCurrency(btResult.introMonthly)}/mo intro → ${formatCurrency(btResult.regularMonthly)}/mo`;
      document.getElementById('btTotalInterest').textContent = formatCurrency(btResult.totalInterest);
    }
    document.getElementById('btTotalCost').textContent = formatCurrency(btResult.totalPaid);

    // BT callout
    if (btResult.paidOffInIntro) {
      document.getElementById('btCalloutText').textContent = `Great choice! Pay off within the ${btCard.introMonths}-month 0% period and you only pay the BT fee.`;
    } else {
      document.getElementById('btCalloutText').textContent = `⚠️ After ${btCard.introMonths} months, APR jumps to ${btCard.regularAPRRange}. Remaining balance: ${formatCurrency(btResult.remainingAfterIntro)}.`;
    }

    // BT highlights
    const btHighlights = document.getElementById('btHighlights');
    btHighlights.innerHTML = btCard.highlights.map(h => `✓ ${h}`).join('<br>');

    // Update Loan display
    document.getElementById('loanCardName').textContent = `Rates for ${loanRates.label} credit`;
    document.getElementById('loanAPR').textContent = `${loanRates.aprMin}% - ${loanRates.aprMax}% (mid: ${loanResult.aprUsed.toFixed(2)}%)`;
    document.getElementById('loanOrigination').textContent = `${loanRates.originationMin}% - ${loanRates.originationMax}% (${formatCurrency(loanResult.originationFee)})`;
    document.getElementById('loanMonthly').textContent = formatCurrency(loanResult.monthly) + '/mo (fixed)';
    document.getElementById('loanTotalInterest').textContent = formatCurrency(loanResult.totalInterest);
    document.getElementById('loanTotalCost').textContent = formatCurrency(loanResult.totalPaid);

    // Loan highlights
    const loanHighlightsEl = document.getElementById('loanHighlights');
    loanHighlightsEl.innerHTML = `Lenders: ${loanRates.examples.join(', ')}<br>✓ Fixed monthly payment<br>✓ Structured payoff timeline<br>✓ No penalty for early repayment`;

    // Verdict
    const savings = loanResult.totalPaid - btResult.totalPaid;
    const absSavings = Math.abs(savings);
    if (savings > 50) {
      verdictBar.className = 'verdict-bar bt-wins';
      verdictText.innerHTML = `💳 Balance transfer saves you <strong>${formatCurrency(savings)}</strong> more than a personal loan`;
    } else if (savings < -50) {
      verdictBar.className = 'verdict-bar loan-wins';
      verdictText.innerHTML = `🏦 Personal loan saves you <strong>${formatCurrency(absSavings)}</strong> more than a balance transfer`;
    } else {
      verdictBar.className = 'verdict-bar tie';
      verdictText.innerHTML = `🤝 It's a tie — both options cost about the same. Pick based on your preference for fixed payments vs. 0% intro.`;
    }

    // Highlight the winner card
    const btCardEl = document.querySelector('.compare-bt');
    const loanCardEl = document.querySelector('.compare-loan');
    btCardEl.style.boxShadow = savings > 50 ? '0 0 0 2px var(--primary)' : '';
    loanCardEl.style.boxShadow = savings < -50 ? '0 0 0 2px var(--success)' : '';
  }

  // Event listeners
  debtEl.addEventListener('input', calculate);
  aprEl.addEventListener('input', calculate);
  tierEl.addEventListener('change', calculate);
  monthsEl.addEventListener('input', () => {
    monthsVal.textContent = monthsEl.value + ' months';
    calculate();
  });

  // Share config
  if (typeof ShareButtons !== 'undefined') {
    new ShareButtons({
      container: document.getElementById('shareBar'),
      url: window.location.href,
      title: 'Personal Loan vs Balance Transfer — CreditStud.io',
      description: 'Which saves more: a personal loan or balance transfer card? Find out →',
      inputs: [
        { id: 'debtAmount', type: 'number', param: 'debt' },
        { id: 'currentAPR', type: 'number', param: 'apr' }
      ]
    });
  }

  // Cross-tool params
  const params = new URLSearchParams(window.location.search);
  if (params.has('debt')) debtEl.value = params.get('debt');
  if (params.has('apr')) aprEl.value = params.get('apr');
  if (params.has('tier')) {
    const tier = params.get('tier');
    if (['excellent', 'good', 'fair', 'poor'].includes(tier)) tierEl.value = tier;
  }

  // Initial calculation
  calculate();
})();