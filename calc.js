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

/** Calculate worst case cost including late fees and retroactive interest */
function calculateWorstCaseCost(method, amount, creditScore, targetMonths) {
  // If no late fees data, return normal calculation
  if (!method.lateFees) {
    return { totalCost: amount, interestPaid: 0, fees: 0, netCost: amount };
  }

  const lateFees = method.lateFees;
  let totalCost = amount;
  let interestPaid = 0;
  let fees = 0;
  
  // Add late fee
  if (lateFees.lateFeeAmount) {
    fees += lateFees.lateFeeAmount;
  }
  
  // Add retroactive interest if applicable
  if (lateFees.retroactiveInterest && lateFees.retroactiveApr > 0) {
    // Calculate retroactive interest from purchase date to current date
    // Using a simplified approach: assume 1 month delay for retroactive interest
    const retroactiveMonths = 1;
    const retroactiveRate = lateFees.retroactiveApr / 100 / 12;
    interestPaid += amount * retroactiveRate * retroactiveMonths;
  }
  
  // For monthly plans, calculate interest over the term
  if (method.type === 'bnpl-monthly' || method.aprMin !== undefined) {
    // Estimate APR based on credit score
    let estimatedApr = method.aprTypical || 20;
    if (method.aprMin !== undefined && method.aprMax !== undefined) {
      const scoreMultipliers = { excellent: 0.2, good: 0.5, fair: 0.75, poor: 0.95, unknown: 0.6 };
      const mult = scoreMultipliers[creditScore] || 0.5;
      estimatedApr = method.aprMin + (method.aprMax - method.aprMin) * mult;
    }
    
    // Calculate interest for the term with 1 missed payment
    interestPaid += totalInterest(amount, estimatedApr, targetMonths);
  }
  
  totalCost = amount + interestPaid + fees;
  
  return { totalCost, interestPaid, fees, netCost: totalCost };
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

function evaluateBnpl(method, amount, isWorstCase = false, creditScore = 'good', targetMonths = 6) {
  if (amount < (method.minPurchase || 0)) return null;
  if (method.maxPurchase && amount > method.maxPurchase) return null;

  const downPct = (method.downPaymentPct || 25) / 100;
  const n = method.numPayments || 4;
  const intervalDays = method.intervalDays || 14;
  const totalWeeks = (n - 1) * (intervalDays / 7);

  let fees = 0;
  let interestPaid = 0;
  
  if (isWorstCase && method.lateFees) {
    // Calculate worst case scenario
    const lateFees = method.lateFees;
    
    // Add late fee
    if (lateFees.lateFeeAmount) {
      fees += lateFees.lateFeeAmount;
    }
    
    // Add retroactive interest if applicable
    if (lateFees.retroactiveInterest && lateFees.retroactiveApr > 0) {
      // Calculate retroactive interest from purchase date to current date
      // Using a simplified approach: assume 1 month delay for retroactive interest
      const retroactiveMonths = 1;
      const retroactiveRate = lateFees.retroactiveApr / 100 / 12;
      interestPaid += amount * retroactiveRate * retroactiveMonths;
    }
  } else {
    // Calculate normal fees
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
  }

  const totalCost = amount + interestPaid + fees;
  const downPayment = amount * downPct;
  const perPayment = (totalCost - downPayment) / (n - 1);

  const result = {
    id: method.id,
    name: method.name,
    type: 'Pay in 4 (BNPL)',
    subtype: 'bnpl',
    principal: amount,
    interestPaid: interestPaid,
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
    scenarios: null, // BNPL doesn't have multiple scenarios
    isWorstCase: isWorstCase
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

  if (isWorstCase && method.lateFees) {
    const lateFees = method.lateFees;
    if (lateFees.lateFeeAmount) {
      result.notes.push(`Worst case: Includes $${lateFees.lateFeeAmount} late fee`);
    }
    if (lateFees.retroactiveInterest && lateFees.retroactiveApr > 0) {
      result.warnings.push(`⚠️ Deferred interest trap: ${lateFees.retroactiveApr}% APR applied retroactively if payment missed`);
    }
  } else if (method.lateFee > 0) {
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

function evaluateBnplMonthly(method, amount, creditScore, targetMonths, isWorstCase = false) {
  if (amount < (method.minPurchase || 0)) return null;
  if (method.maxPurchase && amount > method.maxPurchase) return null;

  // Estimate APR based on credit score
  const scoreMultipliers = { excellent: 0.2, good: 0.5, fair: 0.75, poor: 0.95, unknown: 0.6 };
  const mult = scoreMultipliers[creditScore] || 0.5;
  const estimatedApr = method.aprMin + (method.aprMax - method.aprMin) * mult;
  
  // Find the best term option closest to target months
  const preferredTerm = targetMonths 
    ? method.termOptions.reduce((closest, months) => {
        return Math.abs(months - targetMonths) < Math.abs(closest - targetMonths) ? months : closest;
      })
    : (method.termOptions.includes(12) ? 12 : method.termOptions[Math.floor(method.termOptions.length / 2)]);
  
  let primaryInterest = 0;
  let primaryTotalCost = amount;
  let primaryNetCost = amount;
  let primaryMonthlyPayment = 0;
  
  if (isWorstCase && method.lateFees) {
    // Calculate worst case scenario
    const lateFees = method.lateFees;
    let fees = 0;
    let interestPaid = 0;
    
    // Add late fee
    if (lateFees.lateFeeAmount) {
      fees += lateFees.lateFeeAmount;
    }
    
    // Add retroactive interest if applicable
    if (lateFees.retroactiveInterest && lateFees.retroactiveApr > 0) {
      // Calculate retroactive interest from purchase date to current date
      const retroactiveMonths = 1;
      const retroactiveRate = lateFees.retroactiveApr / 100 / 12;
      interestPaid += amount * retroactiveRate * retroactiveMonths;
    }
    
    // Calculate regular interest for the term
    interestPaid += totalInterest(amount, estimatedApr, targetMonths);
    
    primaryInterest = interestPaid;
    primaryTotalCost = amount + interestPaid + fees;
    primaryNetCost = primaryTotalCost;
    primaryMonthlyPayment = monthlyPayment(amount, estimatedApr, targetMonths);
  } else {
    // Normal calculation
    primaryInterest = totalInterest(amount, estimatedApr, targetMonths);
    primaryTotalCost = amount + primaryInterest;
    primaryNetCost = primaryTotalCost;
    primaryMonthlyPayment = monthlyPayment(amount, estimatedApr, targetMonths);
  }
  
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

  const primaryScenario = {
    label: `${preferredTerm} months`,
    description: `${fmt(primaryMonthlyPayment)}/mo at ${estimatedApr.toFixed(1)}% APR`,
    monthlyPayment: primaryMonthlyPayment,
    interestPaid: primaryInterest,
    totalCost: primaryTotalCost,
    netCost: primaryNetCost,
    termMonths: preferredTerm,
    termDisplay: formatMonths(preferredTerm),
    isDefault: true
  };

  const result = {
    id: method.id,
    name: method.name,
    type: 'Monthly Plan (BNPL)',
    subtype: 'bnpl-monthly',
    principal: amount,
    interestPaid: primaryInterest,
    fees: isWorstCase && method.lateFees ? (method.lateFees.lateFeeAmount || 0) : 0,
    rewardsEarned: 0,
    totalCost: primaryTotalCost,
    netCost: primaryNetCost,
    monthlyPayment: primaryMonthlyPayment,
    paymentLabel: null,
    termMonths: preferredTerm,
    termDisplay: formatMonths(preferredTerm),
    availability: method.availability,
    availabilityNote: method.availabilityNote || '',
    notes: [method.notes || ''],
    warnings: estimatedApr > 0 ? [`~${estimatedApr.toFixed(1)}% APR (estimated for your credit score)`] : [],
    scenarios: scenarios,
    estimatedApr: estimatedApr,
    annualRewardInfo: null,
    isWorstCase: isWorstCase
  };
  
  // Add worst case warnings
  if (isWorstCase && method.lateFees) {
    const lateFees = method.lateFees;
    if (lateFees.lateFeeAmount) {
      result.notes.push(`Worst case: Includes $${lateFees.lateFeeAmount} late fee`);
    }
    if (lateFees.retroactiveInterest && lateFees.retroactiveApr > 0) {
      result.warnings.push(`⚠️ Deferred interest trap: ${lateFees.retroactiveApr}% APR applied retroactively if payment missed`);
    }
  }

  return result;
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

function evaluateCustom(method, amount, creditScore, targetMonths) {
  if (method.type === 'bnpl-monthly' || method.type === 'bnpl-4') {
    // Treat custom BNPL as simple interest-bearing installment
    const rate = method.interestRate || 0;
    const months = targetMonths || method.termMonths || 12;
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
  // Credit card or store card - use no intro version for fair comparison
  return evaluateCreditCardNoIntro(method, amount, creditScore, targetMonths);
}

// ── Main entry point ───────────────────────────────────────────────────────

function calculateOptions({ amount, creditScore, selectedMethods, targetMonths, isWorstCase = false }) {
  const results = [];
  const newCardOptions = [];

  for (const method of selectedMethods) {
    try {
      let result;
      let newCardResult = null;

      if (method.id && method.id.startsWith('custom-')) {
        result = evaluateCustom(method, amount, creditScore, targetMonths);
      } else if (method.type === 'bnpl-4') {
        // Pay-in-4 is always the cheapest option (0% interest) when amount is within range.
        // Show it regardless of targetMonths — finishing early is a good thing.
        result = evaluateBnpl(method, amount, isWorstCase, creditScore, targetMonths);
        // Mark that it finishes well ahead of the user's target when targetMonths > 3
        if (result && targetMonths > 3) {
          result.finishesEarly = true;
          result.actualTermLabel = '~6 weeks';
          result.notes = result.notes || [];
          result.notes.push(`Pays off in ~6 weeks (ahead of your ${targetMonths}-month goal)`);
        }
      } else if (method.type === 'bnpl-monthly') {
        result = evaluateBnplMonthly(method, amount, creditScore, targetMonths, isWorstCase);
      } else {
        // Calculate WITHOUT intro APR for fair comparison
        result = evaluateCreditCardNoIntro(method, amount, creditScore, targetMonths);
        // Also calculate WITH intro APR for "new card" option
        if (method.hasIntroApr && method.introAprMonths > 0) {
          newCardResult = evaluateCreditCardWithIntro(method, amount, creditScore, targetMonths);
          if (newCardResult) newCardOptions.push(newCardResult);
        }
      }
      if (result) results.push(result);
    } catch (e) {
      console.error('Calc error for', method.name, e);
    }
  }

  // Sort by net cost (ascending)
  results.sort((a, b) => a.netCost - b.netCost);
  results.forEach((r, i) => { r.rank = i + 1; });

  // Find alternatives within ±2 months of target
  const alternatives = results.filter(r => {
    const termDiff = Math.abs((r.termMonths || 0) - targetMonths);
    return termDiff <= 2 && termDiff > 0; // Exclude exact match (that's the best match)
  });

  // Sort new card options
  newCardOptions.sort((a, b) => a.netCost - b.netCost);

  return { all: results.slice(0, 15), newCardOptions: newCardOptions.slice(0, 3), alternatives };
}

// Calculate credit card WITHOUT intro APR benefits (fair comparison)
function evaluateCreditCardNoIntro(method, amount, creditScore, targetMonths) {
  const effectiveApr = getScoreAdjustedApr(method.interestRate, creditScore);
  const fees = method.annualFee || 0;
  const rewardsEarned = (amount * (method.pointsRate || 0) / 100) * (method.pointValue || 1);

  // Standard amortization: level monthly payment over targetMonths at effectiveApr
  const pmt = monthlyPayment(amount, effectiveApr, targetMonths);
  const totalInt = totalInterest(amount, effectiveApr, targetMonths);

  const netCost = amount + totalInt + fees - rewardsEarned;

  return {
    id: method.id,
    name: method.name,
    type: 'Credit Card (existing)',
    subtype: 'credit-card',
    principal: amount,
    interestPaid: totalInt,
    fees: fees,
    rewardsEarned: rewardsEarned,
    totalCost: amount + totalInt + fees,
    netCost: netCost,
    monthlyPayment: pmt,
    termMonths: targetMonths,
    termDisplay: `${targetMonths} months`,
    availability: 'anywhere',
    isNewCardOption: false,
    why: `${effectiveApr.toFixed(1)}% APR on existing card`,
    effectiveApr: effectiveApr
  };
}

// Calculate credit card WITH intro APR (new card option)
function evaluateCreditCardWithIntro(method, amount, creditScore, targetMonths) {
  const effectiveApr = getScoreAdjustedApr(method.interestRate, creditScore);
  const introMonths = method.introAprMonths || 0;
  const withinIntro = targetMonths <= introMonths;

  const fees = method.annualFee || 0;
  const rewardsEarned = (amount * (method.pointsRate || 0) / 100) * (method.pointValue || 1);

  let monthlyPmt;
  let interestPaid;

  if (withinIntro || effectiveApr === 0) {
    // Entire payoff falls within the 0% intro period, or APR is 0
    monthlyPmt = amount / targetMonths;
    interestPaid = 0;
  } else {
    // Two-phase amortization:
    //   Phase 1 (intro): 0% interest, balance reduces by pmt each month
    //   Phase 2 (post-intro): remaining balance amortized at regular APR over remaining months
    //
    //   A level monthly payment pmt must satisfy:
    //     remaining = amount - pmt * introMonths
    //     pmt = remaining * r / (1 - (1+r)^(-(targetMonths - introMonths)))
    //   Solving:
    //     pmt = amount * A / (1 + introMonths * A)
    //     where A = r / (1 - (1+r)^(-(targetMonths - introMonths)))
    const r = effectiveApr / 100 / 12;
    const postIntroN = targetMonths - introMonths;
    const A = r / (1 - Math.pow(1 + r, -postIntroN));
    monthlyPmt = (amount * A) / (1 + introMonths * A);
    const totalPaid = monthlyPmt * targetMonths;
    interestPaid = totalPaid - amount;
  }

  const netCost = amount + interestPaid + fees - rewardsEarned;

  // Calculate what this same card would cost WITHOUT intro (existing card) using standard amortization
  const interestExisting = totalInterest(amount, effectiveApr, targetMonths);
  const netCostExisting = amount + interestExisting + fees - rewardsEarned;

  return {
    id: method.id,
    name: method.name,
    type: 'Credit Card (new)',
    subtype: 'credit-card',
    principal: amount,
    interestPaid: interestPaid,
    fees: fees,
    rewardsEarned: rewardsEarned,
    totalCost: amount + interestPaid + fees,
    netCost: netCost,
    monthlyPayment: monthlyPmt,
    termMonths: targetMonths,
    termDisplay: `${targetMonths} months`,
    availability: 'anywhere',
    isNewCardOption: true,
    introMonths: introMonths,
    hasIntroApr: true,
    why: withinIntro ? `${introMonths}-month 0% intro APR` : `${introMonths} mo 0% intro, then ${effectiveApr.toFixed(1)}% APR`,
    savingsVsExisting: netCostExisting - netCost
  };
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
