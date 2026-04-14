/**
 * SmartPay Calculator — Calculation Engine
 * Handles BNPL pay-in-4, credit card multi-scenario, and custom methods
 */

// ── Core math ──────────────────────────────────────────────────────────────

/** Monthly payment for a standard amortized loan */
function monthlyPayment(principal, annualRate, months) {
  if (annualRate === 0 || months === 0) return principal / (months || 1);
  const r = annualRate / 100 / 12;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

/** Total interest over term */
function totalInterest(principal, annualRate, months) {
  if (annualRate === 0 || months === 0) return 0;
  const pmt = monthlyPayment(principal, annualRate, months);
  return (pmt * months) - principal;
}

/** Simulate paying a fixed % of original balance each month */
function simulatePercentPayments(principal, annualRate, pctOfOriginal, introMonths = 0) {
  const r = annualRate / 100 / 12;
  const fixedPayment = Math.max(MIN_PAYMENT_RULES.absoluteMin, principal * (pctOfOriginal / 100));
  let balance = principal;
  let totalInt = 0;
  let months = 0;
  const maxMonths = 600;

  while (balance > 0.50 && months < maxMonths) {
    months++;
    if (months > introMonths && annualRate > 0) {
      const interest = balance * r;
      totalInt += interest;
      balance += interest;
    }
    const payment = Math.min(fixedPayment, balance);
    balance = Math.max(0, balance - payment);
  }
  return { totalInterest: totalInt, months, monthlyPayment: fixedPayment };
}

/** Simulate minimum payments (2% of balance or $25, whichever is greater) */
function simulateMinimumPayments(principal, annualRate, introMonths = 0) {
  const r = annualRate / 100 / 12;
  let balance = principal;
  let totalInt = 0;
  let months = 0;
  const maxMonths = 600;

  while (balance > 0.50 && months < maxMonths) {
    months++;
    if (months > introMonths && annualRate > 0) {
      const interest = balance * r;
      totalInt += interest;
      balance += interest;
    }
    const payment = Math.max(MIN_PAYMENT_RULES.absoluteMin, balance * MIN_PAYMENT_RULES.percentOfBalance);
    balance = Math.max(0, balance - payment);
  }
  return { totalInterest: totalInt, months, monthlyPayment: Math.max(MIN_PAYMENT_RULES.absoluteMin, principal * MIN_PAYMENT_RULES.percentOfBalance) };
}

/** Simulate fixed dollar monthly payments */
function simulateFixedPayments(principal, annualRate, monthlyAmt, introMonths = 0) {
  const r = annualRate / 100 / 12;
  let balance = principal;
  let totalInt = 0;
  let months = 0;
  const maxMonths = 600;

  while (balance > 0.50 && months < maxMonths) {
    months++;
    if (months > introMonths && annualRate > 0) {
      const interest = balance * r;
      totalInt += interest;
      balance += interest;
    }
    const payment = Math.min(monthlyAmt, balance);
    balance = Math.max(0, balance - payment);
    if (payment <= 0) break;
  }
  return { totalInterest: totalInt, months };
}

// ── BNPL calculation ───────────────────────────────────────────────────────

function evaluateBnpl(method, amount) {
  if (amount < (method.minPurchase || 0)) return null;
  if (method.maxPurchase && amount > method.maxPurchase) return null;

  const downPct = (method.downPaymentPct || 25) / 100;
  const n = method.numPayments || 4;
  const intervalDays = method.intervalDays || 14;
  const totalWeeks = (n - 1) * (intervalDays / 7);

  // Calculate fees
  let fees = 0;
  if (method.id === 'zip') {
    // Zip uses origination fee based on purchase amount, roughly 2% of purchase
    // From their examples: $400 → $8 fee, $800 → $17 fee
    // Range: $4–$60
    fees = Math.max(method.originationFeeMin || 4, Math.min(method.originationFeeMax || 60, Math.round(amount * 0.02)));
  } else {
    // Service fee (Klarna charges $0.75–$3)
    const feeMin = method.serviceFeeMin || 0;
    const feeMax = method.serviceFeeMax || 0;
    fees = feeMax > 0 ? Math.min(feeMax, Math.max(feeMin, amount * 0.01)) : 0;
  }

  const totalCost = amount + fees;
  const downPayment = amount * downPct;
  const perPayment = (totalCost - downPayment) / (n - 1);

  const result = {
    id: method.id,
    name: method.name,
    type: 'Pay in 4 (BNPL)',
    subtype: 'bnpl',
    principal: amount,
    interestPaid: 0,
    fees: fees,
    rewardsEarned: 0,
    totalCost: totalCost,
    netCost: totalCost,
    monthlyPayment: perPayment,
    paymentLabel: `${fmt(downPayment)} down + ${n - 1} × ${fmt(perPayment)}`,
    termMonths: totalWeeks / 4.33,
    termDisplay: `${Math.round(totalWeeks)} weeks`,
    availability: method.availability,
    availabilityNote: method.availabilityNote || '',
    notes: [],
    warnings: [],
    scenarios: null // BNPL doesn't have multiple scenarios
  };

  // Notes
  if (fees > 0 && method.id === 'zip') {
    result.warnings.push(`$${fees} origination fee (~${((fees / amount) * 100).toFixed(1)}% of purchase, ~30–35% APR equivalent)`);
  } else if (fees > 0) {
    result.notes.push(`$${fees.toFixed(2)} service fee`);
  }

  if (method.interestRate === 0 && method.id !== 'zip') {
    result.notes.push('0% interest if paid on schedule');
  }

  if (method.lateFee > 0) {
    result.notes.push(`Late fee: up to $${method.lateFee}`);
  } else if (method.lateFee === 0) {
    result.notes.push('No late fees');
  }

  if (method.availability === 'partner') {
    result.warnings.push('Only at partner merchants — not available everywhere');
  } else if (method.availability === 'both') {
    result.notes.push('Works anywhere via virtual card + partner checkout');
  }

  return result;
}

function evaluateBnplMonthly(method, amount, creditScore) {
  if (amount < (method.minPurchase || 0)) return null;
  if (method.maxPurchase && amount > method.maxPurchase) return null;

  // Estimate APR based on credit score
  const scoreMultipliers = { excellent: 0.2, good: 0.5, fair: 0.75, poor: 0.95, unknown: 0.6 };
  const mult = scoreMultipliers[creditScore] || 0.5;
  const estimatedApr = method.aprMin + (method.aprMax - method.aprMin) * mult;
  
  // Pick the best term option for the amount (prefer 12 months as default display)
  const preferredTerm = method.termOptions.includes(12) ? 12 : method.termOptions[Math.floor(method.termOptions.length / 2)];
  
  // Build scenarios for each term option
  const scenarios = method.termOptions.map(months => {
    const pmt = monthlyPayment(amount, estimatedApr, months);
    const interest = totalInterest(amount, estimatedApr, months);
    return {
      label: `${months} months`,
      description: `${fmt(pmt)}/mo at ${estimatedApr.toFixed(1)}% APR`,
      monthlyPayment: pmt,
      interestPaid: interest,
      totalCost: amount + interest,
      netCost: amount + interest,
      termMonths: months,
      termDisplay: formatMonths(months),
      isDefault: months === preferredTerm
    };
  });

  const primary = scenarios.find(s => s.isDefault) || scenarios[0];

  return {
    id: method.id,
    name: method.name,
    type: 'Monthly Plan (BNPL)',
    subtype: 'bnpl-monthly',
    principal: amount,
    interestPaid: primary.interestPaid,
    fees: 0,
    rewardsEarned: 0,
    totalCost: primary.totalCost,
    netCost: primary.netCost,
    monthlyPayment: primary.monthlyPayment,
    paymentLabel: null,
    termMonths: primary.termMonths,
    termDisplay: primary.termDisplay,
    availability: method.availability,
    availabilityNote: method.availabilityNote || '',
    notes: [method.notes || ''],
    warnings: estimatedApr > 0 ? [`~${estimatedApr.toFixed(1)}% APR (estimated for your credit score)`] : [],
    scenarios: scenarios,
    estimatedApr: estimatedApr,
    annualRewardInfo: null
  };
}

// ── Credit card calculation (multi-scenario) ───────────────────────────────

function getScoreAdjustedApr(cardBaseApr, creditScore) {
  const adjustments = { excellent: -3, good: 0, fair: 3, poor: 8, unknown: 0 };
  const adj = adjustments[creditScore] || 0;
  return Math.max(0, Math.min(36, cardBaseApr + adj));
}

function evaluateCreditCard(method, amount, creditScore, payoffPct) {
  if (amount < (method.minPurchase || 0)) return null;
  if (method.maxPurchase && amount > method.maxPurchase) return null;

  const effectiveApr = method.interestRate 
    ? getScoreAdjustedApr(method.interestRate, creditScore)
    : (APR_BY_SCORE[creditScore] || APR_BY_SCORE['good']).avg;
  const introMonths = method.hasIntroApr ? (method.introAprMonths || 0) : 0;
  const fees = method.annualFee || 0;

  // Rewards earned
  const rewardsEarned = (amount * (method.pointsRate || 0) / 100) * (method.pointValue || 1);

  // Build scenarios
  const scenarios = [];

  // Scenario 1: Pay in full (statement period)
  scenarios.push({
    label: 'Pay in Full',
    description: 'Pay entire balance this statement',
    monthlyPayment: amount,
    interestPaid: 0,
    totalCost: amount + fees,
    netCost: amount + fees - rewardsEarned,
    termMonths: 1,
    termDisplay: '1 month'
  });

  // Scenario 2: Intro APR payoff (if applicable)
  if (introMonths > 0) {
    const introPmt = amount / introMonths;
    scenarios.push({
      label: `Pay in ${introMonths} months (0% intro)`,
      description: `Pay off during ${introMonths}-month 0% intro period`,
      monthlyPayment: introPmt,
      interestPaid: 0,
      totalCost: amount + fees,
      netCost: amount + fees - rewardsEarned,
      termMonths: introMonths,
      termDisplay: `${introMonths} months`
    });
  }

  // Scenario 3: User-selected % payoff — always at REAL APR (no intro benefit)
  // This is what drives the ranking so users see actual cost
  const pctSim = simulatePercentPayments(amount, effectiveApr, payoffPct, 0);
  scenarios.push({
    label: `Pay ${payoffPct}% monthly`,
    description: `Pay ${fmt(pctSim.monthlyPayment)}/mo (${payoffPct}% of purchase)`,
    monthlyPayment: pctSim.monthlyPayment,
    interestPaid: pctSim.totalInterest,
    totalCost: amount + pctSim.totalInterest + fees,
    netCost: amount + pctSim.totalInterest + fees - rewardsEarned,
    termMonths: pctSim.months,
    termDisplay: formatMonths(pctSim.months),
    isDefault: true
  });

  // Scenario 4: Minimum payments — also at REAL APR (no intro benefit)
  const minSim = simulateMinimumPayments(amount, effectiveApr, 0);
  scenarios.push({
    label: 'Minimum payments',
    description: `Pay ${fmt(minSim.monthlyPayment)}/mo (2% or $25 min)`,
    monthlyPayment: minSim.monthlyPayment,
    interestPaid: minSim.totalInterest,
    totalCost: amount + minSim.totalInterest + fees,
    netCost: amount + minSim.totalInterest + fees - rewardsEarned,
    termMonths: minSim.months,
    termDisplay: formatMonths(minSim.months)
  });

  // Use the user-selected % scenario as the primary for ranking
  const primary = scenarios.find(s => s.isDefault) || scenarios[2];

  return {
    id: method.id,
    name: method.name,
    type: method.type === 'store-card' ? 'Store Card' : 'Credit Card',
    subtype: 'credit-card',
    principal: amount,
    interestPaid: primary.interestPaid,
    fees: fees,
    rewardsEarned: rewardsEarned,
    totalCost: primary.totalCost,
    netCost: primary.netCost,
    monthlyPayment: primary.monthlyPayment,
    paymentLabel: null,
    termMonths: primary.termMonths,
    termDisplay: primary.termDisplay,
    availability: 'anywhere',
    availabilityNote: 'Accepted everywhere the card network is accepted',
    notes: method.notes ? [method.notes] : [],
    warnings: primary.interestPaid > 0 ? [`${effectiveApr.toFixed(1)}% APR${introMonths > 0 ? ` after ${introMonths}-month intro` : ''}`] : [],
    scenarios: scenarios,
    effectiveApr: effectiveApr,
    annualRewardInfo: (typeof AVG_ANNUAL_SPEND !== 'undefined') ? calculateAnnualRewards(method) : null
  };
}

// ── Custom method evaluation ───────────────────────────────────────────────

function evaluateCustom(method, amount, creditScore, payoffPct) {
  if (method.type === 'bnpl-monthly' || method.type === 'bnpl-4') {
    // Treat custom BNPL as simple interest-bearing installment
    const rate = method.interestRate || 0;
    const months = method.termMonths || 12;
    const interest = totalInterest(amount, rate, months);
    return {
      id: method.id,
      name: method.name,
      type: 'Payment Plan',
      subtype: 'custom',
      principal: amount,
      interestPaid: interest,
      fees: 0,
      rewardsEarned: 0,
      totalCost: amount + interest,
      netCost: amount + interest,
      monthlyPayment: monthlyPayment(amount, rate, months),
      paymentLabel: null,
      termMonths: months,
      termDisplay: formatMonths(months),
      availability: 'varies',
      availabilityNote: '',
      notes: rate === 0 ? ['0% interest'] : [],
      warnings: rate > 0 ? [`${rate}% APR`] : [],
      scenarios: null
    };
  }
  // Credit card or store card
  return evaluateCreditCard(method, amount, creditScore, payoffPct);
}

// ── Main entry point ───────────────────────────────────────────────────────

function calculateOptions({ amount, creditScore, selectedMethods, payoffPct }) {
  const results = [];

  for (const method of selectedMethods) {
    try {
      let result;
      if (method.id && method.id.startsWith('custom-')) {
        result = evaluateCustom(method, amount, creditScore, payoffPct);
      } else if (method.type === 'bnpl-4') {
        result = evaluateBnpl(method, amount);
      } else if (method.type === 'bnpl-monthly') {
        result = evaluateBnplMonthly(method, amount, creditScore);
      } else {
        result = evaluateCreditCard(method, amount, creditScore, payoffPct);
      }
      if (result) results.push(result);
    } catch (e) {
      console.error('Calc error for', method.name, e);
    }
  }

  // Sort by net cost (ascending)
  results.sort((a, b) => a.netCost - b.netCost);
  results.forEach((r, i) => { r.rank = i + 1; });

  // Split into tiers
  const zeroInterestTier = results.filter(r => 
    r.subtype === 'bnpl' || (r.subtype === 'credit-card' && r.interestPaid === 0 && r.fees === 0)
  );
  const monthlyTier = results.filter(r => 
    r.subtype === 'bnpl-monthly' || r.subtype === 'credit-card' || r.subtype === 'custom'
  );

  return { all: results.slice(0, 15), zeroInterestTier, monthlyTier };
}

// ── Annual fee breakeven & blended rewards ──────────────────────────────────

/**
 * Calculate blended annual rewards based on BLS 2024 average spending by category.
 * Returns { annualRewards, netAnnualRewards, blendedPct, breakeven, feeAdvice }
 */
function calculateAnnualRewards(method) {
  if (!method.rewardTiers || method.rewardTiers.length === 0) {
    return { annualRewards: 0, netAnnualRewards: 0, blendedPct: 0, breakeven: null, feeAdvice: null };
  }

  const fee = method.annualFee || 0;
  const pointVal = method.blendedPointValue || method.pointValue || 1.0;
  let totalRewards = 0;
  let totalSpend = 0;

  for (const tier of method.rewardTiers) {
    if (tier.category === 'everything' || tier.category === 'rotating') continue;
    const annualSpend = AVG_ANNUAL_SPEND[tier.category] || 0;
    const cappedSpend = tier.cap ? Math.min(annualSpend, tier.cap) : annualSpend;
    totalRewards += cappedSpend * (tier.rate / 100) * pointVal;
    totalSpend += cappedSpend;
  }

  // "Everything else" fallback tier
  const everythingTier = method.rewardTiers.find(t => t.category === 'everything');
  if (everythingTier) {
    const totalCardable = AVG_ANNUAL_SPEND.everything || 30000;
    const remainingSpend = Math.max(0, totalCardable - totalSpend);
    totalRewards += remainingSpend * (everythingTier.rate / 100) * pointVal;
    totalSpend += remainingSpend;
  }

  // Rotating categories (Discover, etc.) — estimate $1500/qtr in bonus, rest at base
  const rotatingTier = method.rewardTiers.find(t => t.category === 'rotating');
  if (rotatingTier) {
    const bonusSpend = Math.min(rotatingTier.cap || 1500, 1500) * 4; // 4 quarters
    totalRewards += bonusSpend * (rotatingTier.rate / 100) * pointVal;
  }

  const blendedPct = totalSpend > 0 ? (totalRewards / totalSpend) * 100 : 0;
  const netRewards = totalRewards - fee;

  let breakeven = null;
  let feeAdvice = null;
  if (fee > 0) {
    if (blendedPct > 0) {
      breakeven = Math.ceil(fee / (blendedPct / 100));
      if (breakeven <= (AVG_ANNUAL_SPEND.everything || 30000)) {
        feeAdvice = {
          verdict: 'worth-it',
          message: `\u2705 $${fee}/yr fee pays for itself at ${fmt(breakeven)}+/yr spend. Average household puts ~$30K/yr on cards \u2192 you'd earn ~${fmt(totalRewards)}/yr in rewards (${fmt(netRewards)} net after fee).`
        };
      } else {
        feeAdvice = {
          verdict: 'maybe-not',
          message: `\u26a0\ufe0f Need ${fmt(breakeven)}+/yr on this card to break even on the $${fee} fee. Above-average spend required.`
        };
      }
    } else {
      feeAdvice = {
        verdict: 'not-worth-it',
        message: `\u274c $${fee}/yr fee with no rewards to offset it.`
      };
    }
  }

  return { annualRewards: totalRewards, netAnnualRewards: netRewards, blendedPct, breakeven, feeAdvice };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatMonths(months) {
  if (months <= 1) return '1 month';
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const yrs = Math.floor(months / 12);
  const mo = months % 12;
  if (mo === 0) return `${yrs} yr${yrs === 1 ? '' : 's'}`;
  return `${yrs} yr ${mo} mo`;
}

function fmt(n) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
