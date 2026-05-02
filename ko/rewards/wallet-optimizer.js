// Wallet Optimizer — Combinatorial Category Assignment Engine
// CreditStud.io — Sprint 3, P1 #21
//
// Solves the DOUBLE-COUNTING problem: instead of summing each card's
// standalone net value, we assign each spending category to exactly one
// wallet card (the one with the highest effective rate after caps),
// then compute the true combined wallet value.

(function() {
  'use strict';

  var CATEGORIES = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];

  var CATEGORY_LABELS = {
    groceries: 'Groceries',
    dining: 'Dining',
    gas: 'Gas',
    travel: 'Travel',
    online: 'Online Shopping',
    streaming: 'Streaming',
    utilities: 'Utilities',
    everything: 'Everything Else',
    rent: 'Rent'
  };

  // ── Effective rate for ranking: returns a "dollar value per dollar spent" ──
  // This is rate% * pointValue/100, so 2% cashback = 0.02, 4x at 2¢/pt = 0.08
  function dollarValuePerDollar(card, category, annualSpend) {
    if (!card || !card.rewards) return 0.01; // fall back to 1%
    var r = card.rewards[category];
    var nominalRate = (r && r.rate) ? r.rate : 1; // % rate
    var pv = card.pointValue || 1; // cents per point

    // Card-specific cap logic — compute blended effective rate
    if (card.id === 'amex-blue-cash-preferred' && category === 'groceries') {
      var cap = 6000;
      var capped = Math.min(annualSpend, cap);
      var over = Math.max(0, annualSpend - cap);
      return (capped * 0.06 + over * 0.01) / annualSpend;
    }
    if (card.id === 'amex-blue-cash-everyday' && category === 'groceries') {
      var cap = 6000;
      var capped = Math.min(annualSpend, cap);
      var over = Math.max(0, annualSpend - cap);
      return (capped * 0.03 + over * 0.01) / annualSpend;
    }
    if (card.id === 'amex-gold' && category === 'groceries') {
      var cap = 25000;
      var capped = Math.min(annualSpend, cap);
      var over = Math.max(0, annualSpend - cap);
      return ((capped * 0.04 + over * 0.01) * (pv / 100)) / annualSpend;
    }
    if (card.id === 'citi-custom-cash') {
      // Top cat at 5% up to $500/mo ($6k/yr), rest at 1%
      var cap = 6000;
      var capped = Math.min(annualSpend, cap);
      var over = Math.max(0, annualSpend - cap);
      return (capped * 0.05 + over * 0.01) / annualSpend;
    }
    if (card.id === 'us-bank-cash-plus') {
      var fiveKeys = (typeof usbFivePctSelections !== 'undefined') ? usbFivePctSelections : ['utilities', 'streaming'];
      var twoKey = (typeof usbTwoPctSelection !== 'undefined') ? usbTwoPctSelection : 'dining';
      if (fiveKeys.indexOf(category) !== -1) return 0.05;
      if (category === twoKey) return 0.02;
      return 0.01;
    }
    if (card.id === 'chase-freedom-flex') {
      return category === 'dining' ? 3 * (pv / 100) : 2 * (pv / 100);
    }
    if (card.id === 'discover-it-cash-back') {
      return 0.02; // average including rotating
    }

    // Standard: rate% * pointValue/100
    return (nominalRate / 100) * (pv / 100);
  }

  // ── Compute actual annual dollar earnings for assigned spend ──

  function computeEarnings(card, category, assignedAnnual) {
    if (assignedAnnual <= 0) return 0;
    var pv = card.pointValue || 1;
    var monthly = assignedAnnual / 12;

    // Citi Custom Cash: 5% up to $500/mo, then 1%
    if (card.id === 'citi-custom-cash') {
      var cappedMo = Math.min(monthly, 500);
      var overMo = Math.max(0, monthly - 500);
      return (cappedMo * 0.05 + overMo * 0.01) * 12;
    }

    // US Bank Cash+: delegate to simple model
    if (card.id === 'us-bank-cash-plus') {
      var fiveKeys = (typeof usbFivePctSelections !== 'undefined') ? usbFivePctSelections : ['utilities', 'streaming'];
      var twoKey = (typeof usbTwoPctSelection !== 'undefined') ? usbTwoPctSelection : 'dining';
      if (fiveKeys.indexOf(category) !== -1) return assignedAnnual * 0.05;
      if (category === twoKey) return assignedAnnual * 0.02;
      return assignedAnnual * 0.01;
    }

    // Chase Freedom Flex: 3x dining, ~2x avg elsewhere
    if (card.id === 'chase-freedom-flex') {
      var rate = category === 'dining' ? 3 : 2;
      return assignedAnnual * (rate / 100) * (pv / 100);
    }

    // Discover it: ~2% avg
    if (card.id === 'discover-it-cash-back') {
      return assignedAnnual * 0.02;
    }

    // Amex BCP groceries: 6% up to $6k, then 1%
    if (card.id === 'amex-blue-cash-preferred' && category === 'groceries') {
      var cap = 6000;
      var c = Math.min(assignedAnnual, cap);
      var o = Math.max(0, assignedAnnual - cap);
      return c * 0.06 + o * 0.01;
    }

    // Amex BCE groceries: 3% up to $6k, then 1%
    if (card.id === 'amex-blue-cash-everyday' && category === 'groceries') {
      var cap = 6000;
      var c = Math.min(assignedAnnual, cap);
      var o = Math.max(0, assignedAnnual - cap);
      return c * 0.03 + o * 0.01;
    }

    // Amex Gold groceries: 4x up to $25k, then 1x
    if (card.id === 'amex-gold' && category === 'groceries') {
      var cap = 25000;
      var c = Math.min(assignedAnnual, cap);
      var o = Math.max(0, assignedAnnual - cap);
      return (c * 0.04 + o * 0.01) * (pv / 100);
    }

    // Standard: rate * pointValue
    var r = (card.rewards && card.rewards[category]) ? card.rewards[category].rate : 1;
    if (!r) r = 1;
    return assignedAnnual * (r / 100) * (pv / 100);
  }

  // ── Signup bonus eligibility ──

  function isSignupBonusEligible(card, spending) {
    if (!card.signupBonus || !card.signupBonus.requirement) return true;
    var req = card.signupBonus.requirement;
    var match = req.match(/\$(\d+(?:,\d+)?)\s+spend\s+in\s+(\d+)\s+months?/i);
    if (!match) return true;
    var requiredAmount = parseInt(match[1].replace(/,/g, ''), 10);
    var requiredMonths = parseInt(match[2], 10);
    var totalMonthly = 0;
    for (var k in spending) { totalMonthly += spending[k] || 0; }
    return totalMonthly * requiredMonths >= requiredAmount;
  }

  // ── MAIN OPTIMIZER ──

  window.optimizeWallet = function(walletCardIds, allCards, monthlySpending, options) {
    options = options || {};
    var yearView = options.yearView || 'ongoing';
    var includeAnnualCredits = options.includeAnnualCredits || false;
    var categories = CATEGORIES.slice();

    // Resolve wallet card objects
    var walletCards = walletCardIds.map(function(id) {
      return allCards.find(function(c) { return c.id === id; });
    }).filter(Boolean);

    if (walletCards.length === 0) {
      return {
        assignments: {},
        perCard: {},
        totalNet: 0,
        totalGrossEarnings: 0,
        totalAnnualFees: 0,
        totalSignupBonus: 0,
        naiveTotal: 0,
        savings: 0,
        recommendations: [],
        explanations: ['Add cards to your wallet to see optimized category assignments.']
      };
    }

    // Annual spend per category
    var annualSpend = {};
    categories.forEach(function(cat) {
      annualSpend[cat] = (monthlySpending[cat] || 0) * 12;
    });

    // ── Step 1: For each category, rank wallet cards by effective dollar value ──
    var assignments = {};
    var perCard = {};

    walletCards.forEach(function(card) {
      perCard[card.id] = {
        card: card,
        categories: [],
        earnings: 0,
        annualFee: card.annualFee || 0,
        signupBonus: 0,
        netValue: 0
      };
    });

    // ── Step 2: Greedy assignment — best card wins each category ──
    categories.forEach(function(cat) {
      var annual = annualSpend[cat];
      if (annual <= 0) return;

      // Rank cards for this category
      var ranked = walletCards.map(function(card) {
        var dvd = dollarValuePerDollar(card, cat, annual);
        var earnings = annual * dvd;
        return { cardId: card.id, cardName: card.name, dvd: dvd, earnings: earnings, rate: (card.rewards && card.rewards[cat]) ? card.rewards[cat].rate : 1 };
      }).sort(function(a, b) { return b.earnings - a.earnings || b.dvd - a.dvd; });

      if (ranked.length === 0) return;

      // Assign to the best card
      var best = ranked[0];
      var bestCard = walletCards.find(function(c) { return c.id === best.cardId; });
      var earnings = computeEarnings(bestCard, cat, annual);

      assignments[cat] = {
        cardId: best.cardId,
        cardName: best.cardName,
        rate: best.rate,
        dollarValuePerDollar: best.dvd,
        annualSpend: annual,
        earnings: earnings
      };

      perCard[best.cardId].categories.push(cat);
      perCard[best.cardId].earnings += earnings;
    });

    // ── Step 3: Per-card net value ──
    var totalGrossEarnings = 0;
    var totalAnnualFees = 0;
    var totalSignupBonus = 0;

    walletCards.forEach(function(card) {
      var pc = perCard[card.id];
      pc.annualFee = card.annualFee || 0;

      if (yearView === 'first' && card.signupBonus && card.signupBonus.value > 0) {
        if (isSignupBonusEligible(card, monthlySpending)) {
          pc.signupBonus = card.signupBonus.value;
          if (includeAnnualCredits && card.annualCredits) {
            pc.signupBonus += card.annualCredits;
          }
        }
      }

      pc.netValue = pc.earnings - pc.annualFee + pc.signupBonus;
      totalGrossEarnings += pc.earnings;
      totalAnnualFees += pc.annualFee;
      totalSignupBonus += pc.signupBonus;
    });

    // ── Step 4: Naive (double-counted) total ──
    var naiveTotal = 0;
    walletCards.forEach(function(card) {
      if (typeof calculateCardRewards === 'function') {
        var calc = calculateCardRewards(card, monthlySpending, yearView);
        naiveTotal += calc.netAnnual;
      }
    });

    var totalNet = totalGrossEarnings - totalAnnualFees + totalSignupBonus;
    var savings = naiveTotal - totalNet;

    // ── Step 5: Recommendations ──
    var walletIdSet = {};
    walletCardIds.forEach(function(id) { walletIdSet[id] = true; });
    var unownedCards = allCards.filter(function(c) { return !walletIdSet[c.id]; });

    // Find weak categories (no card earning > 2% in wallet)
    var weakCategories = categories.filter(function(cat) {
      var a = assignments[cat];
      return !a || a.dollarValuePerDollar < 0.02;
    });

    var recommendations = [];
    unownedCards.forEach(function(card) {
      var improvement = 0;
      var bestCats = [];

      weakCategories.forEach(function(cat) {
        var annual = annualSpend[cat];
        if (annual <= 0) return;
        var currentEarnings = assignments[cat] ? assignments[cat].earnings : 0;
        var cardEarnings = annual * dollarValuePerDollar(card, cat, annual);
        var delta = cardEarnings - currentEarnings;
        if (delta > 5) {
          improvement += delta;
          var rate = (card.rewards && card.rewards[cat]) ? card.rewards[cat].rate : 1;
          bestCats.push({ category: cat, rate: rate, improvement: Math.round(delta) });
        }
      });

      if (improvement > 20 && bestCats.length > 0) {
        recommendations.push({
          card: card,
          totalImprovement: Math.round(improvement - (card.annualFee || 0)),
          bestCategories: bestCats.slice(0, 3)
        });
      }
    });

    recommendations.sort(function(a, b) { return b.totalImprovement - a.totalImprovement; });

    // ── Step 6: Explanations ──
    var explanations = [];

    if (savings > 0) {
      explanations.push(
        'Your wallet\u2019s true combined value is $' + Math.round(totalNet).toLocaleString() +
        '/yr \u2014 $' + Math.round(savings).toLocaleString() +
        ' less than the simple sum of $' + Math.round(naiveTotal).toLocaleString() +
        ' because each spending category can only be earned on one card.'
      );
    } else {
      explanations.push('Your wallet value is $' + Math.round(totalNet).toLocaleString() + '/yr with optimized category assignments.');
    }

    categories.forEach(function(cat) {
      var a = assignments[cat];
      if (a && annualSpend[cat] > 0) {
        var rateLabel = a.rate % 1 === 0 ? a.rate + '\u00d7' : a.rate.toFixed(1) + '\u00d7';
        if (a.dollarValuePerDollar <= 0.01 && a.rate <= 1) rateLabel = '1%';
        explanations.push(
          CATEGORY_LABELS[cat] + ': Use ' + a.cardName +
          ' (' + rateLabel + ') \u2192 $' + Math.round(a.earnings).toLocaleString() + '/yr'
        );
      }
    });

    if (weakCategories.length > 0) {
      var weakLabels = weakCategories.filter(function(c) { return annualSpend[c] > 0; }).map(function(c) { return CATEGORY_LABELS[c]; });
      if (weakLabels.length > 0) {
        explanations.push('Weak coverage: ' + weakLabels.join(', ') + ' \u2014 consider a card with bonus rates here.');
      }
    }

    return {
      assignments: assignments,
      perCard: perCard,
      totalNet: Math.round(totalNet),
      totalGrossEarnings: Math.round(totalGrossEarnings),
      totalAnnualFees: totalAnnualFees,
      totalSignupBonus: Math.round(totalSignupBonus),
      naiveTotal: Math.round(naiveTotal),
      savings: Math.round(savings),
      recommendations: recommendations.slice(0, 2),
      explanations: explanations
    };
  };

})();