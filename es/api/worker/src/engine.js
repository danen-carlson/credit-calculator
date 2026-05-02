/**
 * CreditStud.io API Engine
 *
 * Wraps the browser-based calc.js and data.js for use in Cloudflare Workers.
 * Sets up globals that the calculation functions expect, then exports clean APIs.
 */

// ── Data (from data.js, inlined) ─────────────────────────────────

const BNPL_METHODS = [
  {
    id: 'klarna-pay4',
    name: 'Klarna',
    type: 'bnpl-4',
    detail: 'Pay in 4 · 0% interest · Works anywhere via virtual card',
    affiliateLink: '',
    affiliateNetwork: '',
    downPaymentPct: 25,
    installmentCount: 4,
    installmentFreq: 'biweekly',
    serviceFee: 0,
    lateFees: { lateFeeAmount: 7, retroactiveInterest: false },
    interestRate: 0,
    aprMin: 0,
    aprMax: 0,
    requiresCreditCheck: 'soft',
  },
  {
    id: 'afterpay',
    name: 'Afterpay',
    type: 'bnpl-4',
    detail: 'Pay in 4 · 0% interest · Simple and predictable',
    affiliateLink: '',
    affiliateNetwork: '',
    downPaymentPct: 25,
    installmentCount: 4,
    installmentFreq: 'biweekly',
    serviceFee: 0,
    lateFees: { lateFeeAmount: 8, retroactiveInterest: false, maxLateFees: 6 },
    interestRate: 0,
    aprMin: 0,
    aprMax: 0,
    requiresCreditCheck: 'soft',
  },
  {
    id: 'paypal-pay4',
    name: 'PayPal Pay in 4',
    type: 'bnpl-4',
    detail: 'Pay in 4 · 0% interest · Widely accepted',
    affiliateLink: '',
    affiliateNetwork: '',
    downPaymentPct: 25,
    installmentCount: 4,
    installmentFreq: 'biweekly',
    serviceFee: 0,
    lateFees: { lateFeeAmount: 0, retroactiveInterest: false },
    interestRate: 0,
    aprMin: 0,
    aprMax: 0,
    requiresCreditCheck: 'soft',
  },
  {
    id: 'affirm-pay4',
    name: 'Affirm',
    type: 'bnpl-4',
    detail: 'Pay in 4 · 0% interest at select merchants · No late fees',
    affiliateLink: '',
    affiliateNetwork: '',
    downPaymentPct: 25,
    installmentCount: 4,
    installmentFreq: 'biweekly',
    serviceFee: 0,
    lateFees: { lateFeeAmount: 0, retroactiveInterest: false },
    interestRate: 0,
    aprMin: 0,
    aprMax: 0,
    requiresCreditCheck: 'soft',
  },
];

const BNPL_MONTHLY_PLANS = [
  {
    id: 'klarna-6',
    name: 'Klarna 6-mo',
    type: 'bnpl-monthly',
    detail: '6 months · 0% APR at select merchants',
    affiliateLink: '',
    aprMin: 0,
    aprMax: 33,
    months: 6,
    requiresCreditCheck: 'soft',
  },
  {
    id: 'affirm-monthly',
    name: 'Affirm Monthly',
    type: 'bnpl-monthly',
    detail: '3-60 months · 0-36% APR based on credit',
    affiliateLink: '',
    aprMin: 0,
    aprMax: 36,
    months: 12,
    requiresCreditCheck: 'soft',
  },
  {
    id: 'sezzle-6',
    name: 'Sezzle',
    type: 'bnpl-monthly',
    detail: '6 weeks-48 months · 0% short-term, up to 36% APR longer terms',
    affiliateLink: '',
    aprMin: 0,
    aprMax: 36,
    months: 6,
    requiresCreditCheck: 'soft',
  },
];

// Load full card data lazily from /data/cards.json or inline
// For the Worker, we'll use a separate cards-data export
export { CREDIT_CARDS, STATE_SALES_TAX, AVG_ANNUAL_SPEND, APR_BY_SCORE, MIN_PAYMENT_RULES } from './cards-data.js';

// ── Core Math ──────────────────────────────────────────────────────

function monthlyPayment(principal, annualRate, months) {
  if (annualRate === 0 || months === 0) return principal / (months || 1);
  const r = annualRate / 100 / 12;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function monthsFromPayment(principal, annualRate, monthlyPmt) {
  if (monthlyPmt <= 0) return Infinity;
  if (annualRate === 0) return Math.ceil(principal / monthlyPmt);
  const r = annualRate / 100 / 12;
  if (monthlyPmt <= principal * r) return Infinity;
  return Math.ceil(-Math.log(1 - (principal * r / monthlyPmt)) / Math.log(1 + r));
}

function totalInterest(principal, annualRate, months) {
  if (annualRate === 0 || months === 0) return 0;
  const pmt = monthlyPayment(principal, annualRate, months);
  return (pmt * months) - principal;
}

// ── Score Helpers ───────────────────────────────────────────────────

function scoreToTier(score) {
  if (score >= 740) return 'excellent';
  if (score >= 670) return 'good';
  if (score >= 580) return 'fair';
  return 'poor';
}

function getScoreAdjustedApr(baseApr, creditScore) {
  const tier = typeof creditScore === 'string' ? creditScore : scoreToTier(creditScore);
  const aprByScore = {
    excellent: { min: 16, max: 21, avg: 18.5 },
    good:      { min: 20, max: 25, avg: 22.5 },
    fair:      { min: 24, max: 29, avg: 26.5 },
    poor:      { min: 28, max: 36, avg: 32 },
    unknown:   { min: 20, max: 29, avg: 24.5 },
  };

  if (typeof baseApr === 'object' && baseApr.min !== undefined) {
    const range = baseApr;
    const tierRanges = aprByScore[tier] || aprByScore.good;
    if (range.min === range.max) return range.min;
    const position = (tierRanges.avg - tierRanges.min) / (tierRanges.max - tierRanges.min);
    return Math.round((range.min + (range.max - range.min) * position) * 100) / 100;
  }
  return baseApr;
}

// ── BNPL Evaluators ────────────────────────────────────────────────

function evaluateBnpl(method, amount, isWorstCase = false, creditScore = 'good', targetMonths = 6) {
  const downPayment = amount * (method.downPaymentPct / 100);
  const remaining = amount - downPayment;
  if (method.type === 'bnpl-4') {
    const installmentCount = method.installmentCount || 4;
    const perPayment = remaining / installmentCount;
    const totalCost = amount + (method.serviceFee || 0) + (method.lateFees?.lateFeeAmount || 0);
    return {
      name: method.name,
      type: method.type,
      totalCost: Math.round(totalCost * 100) / 100,
      interestPaid: 0,
      fees: (method.serviceFee || 0) + (method.lateFees?.lateFeeAmount || 0),
      rewardsEarned: 0,
      netCost: Math.round(totalCost * 100) / 100,
      monthlyPayment: Math.round(perPayment * 100) / 100,
      apr: 0,
      effectiveApr: 0,
      description: method.detail,
      deepLink: `https://creditstud.io/compare/?amount=${amount}&months=${targetMonths}&score=${creditScoreToNumber(creditScore)}`,
    };
  }
  return null;
}

function evaluateBnplMonthly(method, amount, creditScore, targetMonths, isWorstCase = false) {
  const estimatedApr = getScoreAdjustedApr({ min: method.aprMin, max: method.aprMax }, creditScore);
  const interest = totalInterest(amount, estimatedApr, targetMonths);
  const pmt = monthlyPayment(amount, estimatedApr, targetMonths);
  const totalCost = amount + interest;
  return {
    name: method.name,
    type: method.type,
    totalCost: Math.round(totalCost * 100) / 100,
    interestPaid: Math.round(interest * 100) / 100,
    fees: 0,
    rewardsEarned: 0,
    netCost: Math.round(totalCost * 100) / 100,
    monthlyPayment: Math.round(pmt * 100) / 100,
    apr: Math.round(estimatedApr * 100) / 100,
    effectiveApr: Math.round(estimatedApr * 100) / 100,
    description: method.detail,
    deepLink: `https://creditstud.io/compare/?amount=${amount}&months=${targetMonths}`,
  };
}

// ── Credit Card Evaluators ─────────────────────────────────────────

function getCategoryRewardsRate(method, category) {
  if (!method.rewardTiers) return 0;
  // Try exact match first
  const exact = method.rewardTiers.find(t => t.category === category);
  if (exact) {
    const rate = (exact.rate || 0) / 100;
    return rate * (method.blendedPointValue || method.pointValue || 1);
  }
  // Fall back to 'everything'
  const everythingTier = method.rewardTiers.find(t => t.category === 'everything');
  if (everythingTier) {
    return ((everythingTier.rate || 0) / 100) * (method.blendedPointValue || method.pointValue || 1);
  }
  return (method.pointsRate || 0) * (method.pointValue || 1) / 100;
}

function evaluateCreditCard(method, amount, creditScore, payoffPct) {
  const effectiveApr = getScoreAdjustedApr(method.interestRate, creditScore);
  const rewardsRate = getCategoryRewardsRate(method, 'everything');
  const rewardsEarned = amount * rewardsRate;
  const annualFee = method.annualFee || 0;
  const fees = method.balanceTransferFee || 0;

  // Intro rate handling
  let introApr = null;
  let introMonths = 0;
  if (method.introApr) {
    introApr = method.introApr.rate || 0;
    introMonths = method.introApr.months || 0;
  }

  // Simulate payoff
  const pctSim = simulatePercentPayments(amount, effectiveApr, payoffPct || 3, introMonths);
  const minSim = simulateMinimumPayments(amount, effectiveApr, introMonths);

  const interestExisting = totalInterest(amount, effectiveApr, pctSim.months);
  const pctResult = {
    name: method.name,
    type: 'credit-card',
    totalCost: Math.round((amount + pctSim.totalInterest + annualFee) * 100) / 100,
    interestPaid: Math.round(pctSim.totalInterest * 100) / 100,
    fees: annualFee + fees,
    rewardsEarned: Math.round(rewardsEarned * 100) / 100,
    netCost: Math.round((amount + pctSim.totalInterest + annualFee - rewardsEarned) * 100) / 100,
    monthlyPayment: Math.round(pctSim.monthlyPayment * 100) / 100,
    apr: method.interestRate,
    effectiveApr: Math.round(effectiveApr * 100) / 100,
    description: method.detail || method.name,
    deepLink: `https://creditstud.io/compare/?amount=${amount}`,
  };

  // If intro rate exists, add intro result
  if (introMonths > 0 && introApr !== null) {
    const introPmt = monthlyPayment(amount, introApr, introMonths);
    const introInterest = totalInterest(amount, introApr, introMonths);
    pctResult.introRate = introApr;
    pctResult.introMonths = introMonths;
    pctResult.introMonthlyPayment = Math.round(introPmt * 100) / 100;
  }

  return pctResult;
}

function simulatePercentPayments(principal, annualRate, pctOfOriginal, introMonths = 0) {
  const r = annualRate / 100 / 12;
  const fixedPayment = Math.max(25, principal * (pctOfOriginal / 100));
  let balance = principal;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 600; // 50 years cap
  let currentIntroMonths = introMonths;

  while (balance > 0 && months < maxMonths) {
    months++;
    const interest = balance * r;
    totalInterest += interest;
    if (currentIntroMonths > 0) {
      currentIntroMonths--;
    }
    balance = balance + interest - fixedPayment;
    if (balance < 0) balance = 0;
  }

  return { totalInterest: Math.round(totalInterest * 100) / 100, months, monthlyPayment: fixedPayment };
}

function simulateMinimumPayments(principal, annualRate, introMonths = 0) {
  const r = annualRate / 100 / 12;
  let balance = principal;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 600;
  let currentIntroMonths = introMonths;

  while (balance > 25 && months < maxMonths) {
    months++;
    const minPmt = Math.max(25, balance * 0.02);
    const interest = balance * r;
    totalInterest += interest;
    if (currentIntroMonths > 0) currentIntroMonths--;
    balance = balance + interest - minPmt;
    if (balance < 0) balance = 0;
  }

  return { totalInterest: Math.round(totalInterest * 100) / 100, months };
}

// ── Min Payment Calculator ─────────────────────────────────────────

function calculateMinPayment(balance, apr, minPct = 2) {
  const r = apr / 100 / 12;
  let remaining = balance;
  let totalPaid = 0;
  let totalInterestPaid = 0;
  let month = 0;
  const schedule = [];

  while (remaining > 0.01 && month < 600) {
    month++;
    const interest = remaining * r;
    const minPmt = Math.max(25, remaining * (minPct / 100));
    const payment = Math.min(minPmt, remaining + interest);
    const principalPmt = payment - interest;

    totalPaid += payment;
    totalInterestPaid += interest;
    remaining -= principalPmt;

    if (remaining < 0) remaining = 0;

    if (month <= 12 || month % 12 === 0) {
      schedule.push({
        month,
        balance: Math.round(remaining * 100) / 100,
        payment: Math.round(payment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        principal: Math.round(principalPmt * 100) / 100,
      });
    }
  }

  return {
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterest: Math.round(totalInterestPaid * 100) / 100,
    monthsToPayoff: month,
    firstPayment: Math.round(Math.max(25, balance * (minPct / 100)) * 100) / 100,
    lastPayment: Math.round(totalPaid / month * 100) / 100,
    schedule,
  };
}

// ── Debt Planner ───────────────────────────────────────────────────

function calculateDebtPlanner(debts, extraPayment = 0) {
  // Snowball: smallest balance first
  const snowball = calculateStrategy(
    debts.map(d => ({ ...d })),
    extraPayment,
    (a, b) => a.balance - b.balance
  );

  // Avalanche: highest interest first
  const avalanche = calculateStrategy(
    debts.map(d => ({ ...d })),
    extraPayment,
    (a, b) => b.apr - a.apr
  );

  // Minimum payments only
  const minimums = calculateStrategy(
    debts.map(d => ({ ...d })),
    0,
    (a, b) => a.balance - b.balance
  );

  return {
    snowball,
    avalanche,
    minimums,
    savingsVsMinimum: Math.round((minimums.totalInterest - avalanche.totalInterest) * 100) / 100,
  };
}

function calculateStrategy(debts, extraPayment, sortFn) {
  debts.sort(sortFn);
  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  const maxMonths = 600;

  while (debts.some(d => d.balance > 0.01) && month < maxMonths) {
    month++;
    let extra = extraPayment;

    for (const debt of debts) {
      if (debt.balance <= 0) continue;
      const r = debt.apr / 100 / 12;
      const minPmt = Math.max(25, debt.balance * 0.02);
      const interest = debt.balance * r;

      let payment;
      if (debt.balance <= minPmt + interest) {
        payment = debt.balance + interest;
      } else {
        payment = minPmt;
      }

      debt.balance = debt.balance + interest - payment;
      totalPaid += payment;
      totalInterest += interest;

      if (debt.balance < 0) debt.balance = 0;
    }

    // Apply extra payment to highest priority (first in sorted array)
    for (const debt of debts) {
      if (extra <= 0) break;
      if (debt.balance <= 0) continue;
      const applied = Math.min(extra, debt.balance);
      debt.balance -= applied;
      totalPaid += applied;
      extra -= applied;
    }
  }

  return {
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    monthsFree: month,
  };
}

// ── Public API ──────────────────────────────────────────────────────

function creditScoreToNumber(score) {
  const map = { excellent: 750, good: 700, fair: 650, poor: 580, unknown: 700 };
  return map[score] || 700;
}

export function compareCalculator(params) {
  const { amount, months, payment, score, category } = params;
  const creditScore = typeof score === 'number' ? scoreToTier(score) : (score || 'good');
  const creditScoreNum = typeof score === 'number' ? score : creditScoreToNumber(creditScore);
  const purchaseCategory = category || 'everything';
  const monthlyPaymentMode = !!payment;
  const monthlyPmtValue = payment || null;
  const targetMonths = months || 12;

  const results = [];

  // Evaluate BNPL pay-in-4
  for (const method of BNPL_METHODS) {
    const result = evaluateBnpl(method, amount, false, creditScore, targetMonths);
    if (result) {
      result.deepLink = `https://creditstud.io/compare/?amount=${amount}&months=${targetMonths}&score=${creditScoreNum}&category=${purchaseCategory}`;
      results.push(result);
    }
  }

  // Evaluate BNPL monthly
  for (const method of BNPL_MONTHLY_PLANS) {
    const result = evaluateBnplMonthly(method, amount, creditScore, targetMonths);
    result.deepLink = `https://creditstud.io/compare/?amount=${amount}&months=${targetMonths}&score=${creditScoreNum}&category=${purchaseCategory}`;
    results.push(result);
  }

  // Sort by netCost ascending
  results.sort((a, b) => (a.netCost || a.totalCost) - (b.netCost || b.totalCost));

  return {
    input: {
      amount,
      months: targetMonths,
      creditScore: creditScoreNum,
      category: purchaseCategory,
      payoffMode: monthlyPaymentMode ? 'payment' : 'months',
    },
    results,
    meta: {
      dataVersion: '2026-05-01',
      calculator: 'compare',
      disclaimer: 'Estimates based on published card terms. Actual terms may vary. See creditstud.io for full details.',
    },
  };
}

export function minPaymentCalculator(params) {
  const { balance, apr, minPct } = params;
  const result = calculateMinPayment(balance, apr, minPct || 2);
  return {
    input: { balance, apr, minPaymentPct: minPct || 2 },
    results: {
      totalPaid: result.totalPaid,
      totalInterest: result.totalInterest,
      monthsToPayoff: result.monthsToPayoff,
      firstPayment: result.firstPayment,
      lastPayment: result.lastPayment,
    },
    meta: {
      dataVersion: '2026-05-01',
      calculator: 'min-payment',
      disclaimer: 'Estimates based on standard minimum payment formulas. Actual terms may vary.',
    },
  };
}

export function debtPlannerCalculator(params) {
  const { debts, extra } = params;
  const result = calculateDebtPlanner(debts, extra || 0);
  return {
    input: { debts, extra: extra || 0 },
    results: result,
    meta: {
      dataVersion: '2026-05-01',
      calculator: 'debt-planner',
      disclaimer: 'Estimates based on standard amortization. Actual terms may vary.',
    },
  };
}

export { BNPL_METHODS, BNPL_MONTHLY_PLANS, scoreToTier, getScoreAdjustedApr, getCategoryRewardsRate };