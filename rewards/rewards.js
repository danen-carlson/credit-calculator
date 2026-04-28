// Rewards Calculator — Main Logic
// CreditStud.io

(function() {
  'use strict';

  // Email capture — show once after first calculation, then dismiss for 7 days
  let emailCaptureShown = false;

  // Default spending values (BLS Consumer Expenditure Survey, adjusted 2026)
  const defaultSpending = {
    groceries: 540,
    dining: 350,
    gas: 250,
    travel: 150,
    online: 300,
    streaming: 65,
    utilities: 200,
    everything: 600
  };

  const categoryIcons = {
    groceries: '🛒',
    dining: '🍽️',
    gas: '⛽',
    travel: '✈️',
    online: '📦',
    streaming: '📺',
    utilities: '💡',
    everything: '🔹'
  };

  const categoryLabels = {
    groceries: 'Groceries',
    dining: 'Dining/Restaurants',
    gas: 'Gas/Transportation',
    travel: 'Travel',
    online: 'Online Shopping',
    streaming: 'Streaming/Subscriptions',
    utilities: 'Utilities',
    everything: 'Everything Else'
  };

  // Bar chart colors
  const barColors = [
    '#2563eb', '#059669', '#d97706', '#dc2626',
    '#7c3aed', '#0891b2', '#be185d', '#6b7280'
  ];

  let currentSpending = { ...defaultSpending };
  let showCrypto = false;
  let compareSelected = new Set();
  let activeFilter = 'all';
  let yearView = 'first'; // 'first' or 'ongoing'
  let previousRankings = {}; // Store previous rankings for comparison
  let walletCards = []; // Wallet state
  let walletOpen = false; // Track if wallet panel is open
  let includeAnnualCredits = false; // Include annual credits in first-year value

  // ===================== NEW STATE =====================
  let noAnnualFee = false; // Filter: hide cards with annualFee > 0
  let spendingMode = 'monthly'; // 'monthly' or 'annual'
  let cardsOwnership = {}; // { cardId: 'have' | 'had' } — persisted in localStorage
  let customCategories = []; // [{ id, name, amount, mapTo }] — persisted in localStorage
  let nextCustomId = 1;

  // Foreign transaction fee map (derived from perks + known data)
  // Cards NOT listed with a fee and not saying "No foreign transaction fees" are assumed to have 3%
  const ftxFeeMap = {
    'citi-double-cash': 0,
    'fidelity-rewards-visa': 0,
    'paypal-cashback-mastercard': 0,
    'chase-sapphire-preferred': 0,
    'amex-gold': 0,
    'capital-one-venture-x': 0,
    'capital-one-venture': 0,
    'amazon-prime-visa': 0,
    'discover-it-cash-back': 0,
    'chase-freedom-flex': 3,
    'wells-fargo-active-cash': 3,
    'us-bank-cash-plus': 3,
    'citi-custom-cash': 3,
    'amex-blue-cash-preferred': 3,
    'amex-blue-cash-everyday': 3,
    'coinbase-card': 0,
    'coinbase-one-credit': 0,
    'gemini-credit': 0,
    'square-cash-card': 0
  };

  function getForeignTransactionFee(card) {
    // Try perks first
    if (card.perks && card.perks.some(p => p.includes('No foreign transaction fee'))) return 0;
    // Then check our map
    if (card.id in ftxFeeMap) return ftxFeeMap[card.id];
    // Default: no fee info means 0 for non-travel cards, 3% for travel
    if (card.type === 'travel') return 3;
    return 0;
  }

  function getFtxBadge(card) {
    const fee = getForeignTransactionFee(card);
    if (fee > 0) {
      return `<span class="ftx-badge ftx-fee" title="${fee}% foreign transaction fee">⚠️ ${fee}% FTX fee</span>`;
    }
    if (card.type === 'travel' || card.id === 'amazon-prime-visa') {
      return `<span class="ftx-badge ftx-free" title="No foreign transaction fee">✅ No FTX fee</span>`;
    }
    return '';
  }

  // ===================== CALCULATIONS =====================

  // Check if signup bonus requirements are met
  function isSignupBonusEligible(card, spending) {
    // If no signup bonus or no requirement, it's eligible
    if (!card.signupBonus || !card.signupBonus.requirement) {
      return { eligible: true };
    }
    
    const req = card.signupBonus.requirement;
    
    // Parse requirement like "$4,000 spend in 3 months"
    const match = req.match(/\$(\d+(?:,\d+)?)\s+spend\s+in\s+(\d+)\s+months?/i);
    if (!match) {
      return { eligible: true }; // If we can't parse, assume eligible
    }
    
    const requiredAmount = parseInt(match[1].replace(/,/g, ''));
    const requiredMonths = parseInt(match[2]);
    
    // Calculate projected spending over required months
    const totalMonthly = Object.values(spending).reduce((sum, v) => sum + v, 0);
    const projectedSpending = totalMonthly * requiredMonths;
    
    return { 
      eligible: projectedSpending >= requiredAmount,
      requiredAmount,
      requiredMonths,
      projectedSpending
    };
  }

  // Get effective spending, incorporating annual toggle and custom categories
  function getEffectiveSpending() {
    const spending = { ...currentSpending };
    // Add custom categories mapped to standard ones
    customCategories.forEach(cat => {
      if (cat.mapTo && spending.hasOwnProperty(cat.mapTo)) {
        spending[cat.mapTo] += cat.amount;
      } else {
        // Unmapped custom categories go into "everything"
        spending.everything += cat.amount;
      }
    });
    return spending;
  }

  // Generate "Why this card?" reasoning
  function generateReasoning(card, calcResult, spending) {
    const breakdown = calcResult.breakdown;
    if (!breakdown) return '';
    // Find the category with the highest annual value
    let bestCat = null;
    let bestValue = 0;
    let bestRate = 0;
    for (const cat of Object.keys(breakdown)) {
      if (breakdown[cat].annualValue > bestValue) {
        bestValue = breakdown[cat].annualValue;
        bestCat = cat;
        bestRate = breakdown[cat].rate;
      }
    }
    if (!bestCat) return '';
    const monthlySpend = spending[bestCat] || 0;
    const catName = categoryLabels[bestCat] || bestCat;
    let reason = `${bestRate > 1 ? bestRate + '% on ' + catName + ' (your highest spend at $' + monthlySpend.toLocaleString() + '/mo)' : 'flat-rate earnings across all categories'}`;
    if (calcResult.signupBonusValue > 0) {
      reason += `, plus the $${calcResult.signupBonusValue} welcome bonus`;
    }
    if (card.annualFee === 0) {
      reason += ', with no annual fee';
    }
    return reason;
  }

  function calculateCardRewards(card, spending, yearView = 'ongoing') {
    const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];
    const breakdown = {};
    let totalAnnual = 0;

    // Special handling for Citi Custom Cash
    if (card.id === 'citi-custom-cash') {
      return calculateCitiCustomCash(spending, card.pointValue, yearView);
    }

    // Special handling for US Bank Cash+
    if (card.id === 'us-bank-cash-plus') {
      return calculateUSBCashPlus(spending, card.pointValue, yearView);
    }

    // Special handling for Chase Freedom Flex (rotating categories)
    if (card.id === 'chase-freedom-flex') {
      return calculateChaseFreedomFlex(spending, card.pointValue, yearView);
    }

    // Special handling for Discover it Cash Back (rotating categories)
    if (card.id === 'discover-it-cash-back') {
      return calculateDiscoverItCashBack(spending, yearView);
    }

    // Special handling for Amex Gold (grocery cap)
    if (card.id === 'amex-gold') {
      return calculateAmexGold(spending, card.pointValue, yearView);
    }

    // Special handling for Amex Blue Cash Preferred (grocery cap)
    if (card.id === 'amex-blue-cash-preferred') {
      return calculateAmexBCP(spending, card.pointValue, yearView);
    }

    // Special handling for Amex Blue Cash Everyday (grocery cap)
    if (card.id === 'amex-blue-cash-everyday') {
      return calculateAmexBCE(spending, card.pointValue, yearView);
    }

    // Standard calculation for all other cards
    for (const cat of categories) {
      const monthlySpend = spending[cat] || 0;
      const reward = card.rewards[cat];
      if (!reward) continue;

      const rate = reward.rate;
      let annualValue;

      if (card.pointValue === 1.0) {
        // Cashback: rate is already the cashback percentage
        annualValue = monthlySpend * (rate / 100) * 12;
      } else {
        // Points card: rate = points per dollar, pointValue = cents per point
        const annualPoints = monthlySpend * rate * 12;
        annualValue = annualPoints * (card.pointValue / 100);
      }

      breakdown[cat] = {
        monthlySpend,
        rate,
        annualPoints: card.pointValue !== 1.0 ? monthlySpend * rate * 12 : 0,
        annualValue
      };
      totalAnnual += annualValue;
    }

    // Calculate net annual value
    let netAnnual = totalAnnual - card.annualFee;
    let grossAnnual = totalAnnual;
    let signupBonusValue = 0;
    let bonusNote = '';
    let annualCreditsNote = '';
    
    // Handle signup bonus for first year view
    if (yearView === 'first' && card.signupBonus && card.signupBonus.value > 0) {
      const eligibility = isSignupBonusEligible(card, spending);
      if (eligibility.eligible) {
        signupBonusValue = card.signupBonus.value;
        // Add annual credits if toggle is on
        if (includeAnnualCredits && card.annualCredits && card.annualCredits > 0) {
          signupBonusValue += card.annualCredits;
          annualCreditsNote = ` <span style="font-size:0.75rem;color:var(--text-muted);">incl. $${card.annualCredits} annual credits</span>`;
        }
        netAnnual += signupBonusValue;
        grossAnnual += signupBonusValue;
      } else {
        bonusNote = `Bonus not eligible: Need $${eligibility.requiredAmount.toLocaleString()} in ${eligibility.requiredMonths} months, projected $${eligibility.projectedSpending.toLocaleString()}`;
      }
    }

    return {
      grossAnnual,
      annualFee: card.annualFee,
      netAnnual,
      signupBonusValue,
      annualCreditsNote,
      bonusNote,
      breakdown
    };
  }

  function calculateCitiCustomCash(spending, pointValue, yearView = 'ongoing') {
    const eligibleCategories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities'];
    const breakdown = {};
    let totalAnnual = 0;

    // Find top eligible category
    let topCat = 'everything';
    let topSpend = 0;
    for (const cat of eligibleCategories) {
      if ((spending[cat] || 0) > topSpend) {
        topSpend = spending[cat] || 0;
        topCat = cat;
      }
    }

    const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];

    for (const cat of categories) {
      const monthlySpend = spending[cat] || 0;
      let rate = 1; // base rate

      if (cat === topCat) {
        // 5% on up to $500, then 1%
        const cappedSpend = Math.min(monthlySpend, 500);
        const overSpend = Math.max(0, monthlySpend - 500);
        const annualValue = cappedSpend * 0.05 * 12 + overSpend * 0.01 * 12;
        breakdown[cat] = { monthlySpend, rate: 5, annualPoints: 0, annualValue, note: '5% up to $500/mo' };
        totalAnnual += annualValue;
      } else {
        const annualValue = monthlySpend * 0.01 * 12;
        breakdown[cat] = { monthlySpend, rate: 1, annualPoints: 0, annualValue };
        totalAnnual += annualValue;
      }
    }

    // Calculate net annual value
    let netAnnual = totalAnnual;
    let grossAnnual = totalAnnual;
    let signupBonusValue = 0;
    let bonusNote = '';
    let annualCreditsNote = '';
    
    // Handle signup bonus for first year view
    const card = cardsData.find(c => c.id === 'citi-custom-cash');
    if (yearView === 'first' && card && card.signupBonus && card.signupBonus.value > 0) {
      const eligibility = isSignupBonusEligible(card, spending);
      if (eligibility.eligible) {
        signupBonusValue = card.signupBonus.value;
        // Add annual credits if toggle is on
        if (includeAnnualCredits && card.annualCredits && card.annualCredits > 0) {
          signupBonusValue += card.annualCredits;
          annualCreditsNote = ` <span style="font-size:0.75rem;color:var(--text-muted);">incl. $${card.annualCredits} annual credits</span>`;
        }
        netAnnual += signupBonusValue;
        grossAnnual += signupBonusValue;
      } else {
        bonusNote = `Bonus not eligible: Need $${eligibility.requiredAmount.toLocaleString()} in ${eligibility.requiredMonths} months, projected $${eligibility.projectedSpending.toLocaleString()}`;
      }
    }

    return {
      grossAnnual,
      annualFee: 0,
      netAnnual,
      signupBonusValue,
      annualCreditsNote,
      bonusNote,
      breakdown,
      note: `Top category: ${categoryLabels[topCat]} ($${topSpend}/mo)`
    };
  }

  function calculateUSBCashPlus(spending, pointValue, yearView = 'ongoing') {
    const breakdown = {};
    let totalAnnual = 0;
    const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];

    // User-chosen 5% categories (spendKey level) and 2% category
    const fivePctSpendKeys = usbFivePctSelections;
    const twoPctSpendKey = usbTwoPctSelection;

    // Track combined 5% spending for the quarterly cap
    let combined5PctAnnualSpend = 0;

    for (const cat of categories) {
      const monthlySpend = spending[cat] || 0;
      let rate = 1; // default 1% on everything

      if (fivePctSpendKeys.includes(cat)) {
        rate = 5;
      } else if (cat === twoPctSpendKey) {
        rate = 2;
      }

      if (rate === 5) {
        combined5PctAnnualSpend += monthlySpend * 12;
        breakdown[cat] = { monthlySpend, rate, annualPoints: 0, annualValue: 0, note: '5% (user chosen)' };
        // annualValue calculated after the loop once we know total 5% spending
      } else {
        const annualValue = monthlySpend * (rate / 100) * 12;
        breakdown[cat] = { monthlySpend, rate, annualPoints: 0, annualValue };
        totalAnnual += annualValue;
      }
    }

    // Apply combined 5% quarterly cap: $2,000/quarter = $8,000/year at 5%, then drops to 1%
    if (combined5PctAnnualSpend > 0) {
      const cappedSpend = Math.min(combined5PctAnnualSpend, USB_ANNUAL_5PCT_CAP);
      const overCapSpend = Math.max(0, combined5PctAnnualSpend - USB_ANNUAL_5PCT_CAP);

      for (const cat of categories) {
        if (fivePctSpendKeys.includes(cat)) {
          const monthlySpend = spending[cat] || 0;
          const catAnnualSpend = monthlySpend * 12;
          const proportion = combined5PctAnnualSpend > 0 ? catAnnualSpend / combined5PctAnnualSpend : 1;

          const catCappedSpend = cappedSpend * proportion;
          const catOverCapSpend = overCapSpend * proportion;

          const annualValue = catCappedSpend * 0.05 + catOverCapSpend * 0.01;
          totalAnnual += annualValue;
          breakdown[cat].annualValue = annualValue;
          if (overCapSpend > 0) {
            breakdown[cat].note = `5% up to $${USB_QUARTERLY_CAP.toLocaleString()}/qtr combined, then 1%`;
          }
        }
      }
    }

    // Calculate net annual value
    let netAnnual = totalAnnual;
    let grossAnnual = totalAnnual;
    let signupBonusValue = 0;
    let bonusNote = '';
    let annualCreditsNote = '';

    // Handle signup bonus for first year view
    const card = cardsData.find(c => c.id === 'us-bank-cash-plus');
    if (yearView === 'first' && card && card.signupBonus && card.signupBonus.value > 0) {
      const eligibility = isSignupBonusEligible(card, spending);
      if (eligibility.eligible) {
        signupBonusValue = card.signupBonus.value;
        // Add annual credits if toggle is on
        if (includeAnnualCredits && card.annualCredits && card.annualCredits > 0) {
          signupBonusValue += card.annualCredits;
          annualCreditsNote = ` <span style="font-size:0.75rem;color:var(--text-muted);">incl. $${card.annualCredits} annual credits</span>`;
        }
        netAnnual += signupBonusValue;
        grossAnnual += signupBonusValue;
      } else {
        bonusNote = `Bonus not eligible: Need $${eligibility.requiredAmount.toLocaleString()} in ${eligibility.requiredMonths} days, projected $${eligibility.projectedSpending.toLocaleString()}`;
      }
    }

    // Build choice note
    const fiveLabels = usbFivePctOptionLabels.join(' + ');
    const twoLabel = usbTwoPctOptionLabel;
    const choiceNote = `Your picks: 5% on ${fiveLabels}, 2% on ${twoLabel}`;

    return {
      grossAnnual,
      annualFee: 0,
      netAnnual,
      signupBonusValue,
      annualCreditsNote,
      bonusNote,
      breakdown,
      note: choiceNote,
      usbChosenCategories: true
    };
  }

  // ===================== US BANK CASH+ CATEGORY PICKER =====================

  // Eligible 5% categories for US Bank Cash+
  // Each option maps to one of our 8 spending categories and has a human-readable label
  const usbFivePercentOptions = [
    { spendKey: 'utilities', label: 'Home Utilities', description: 'Electric, gas, water, internet' },
    { spendKey: 'streaming', label: 'TV, Internet & Streaming', description: 'Netflix, Hulu, Spotify, internet bill' },
    { spendKey: 'dining', label: 'Fast Food', description: 'Fast food restaurants' },
    { spendKey: 'gas', label: 'Ground Transportation', description: 'Gas stations, rideshare, transit, parking' },
    { spendKey: 'online', label: 'Department Stores', description: "Macy's, Kohl's, JCPenney, etc." },
    { spendKey: 'online', label: 'Electronics Stores', description: 'Best Buy, Apple Store, etc.' },
    { spendKey: 'online', label: 'Select Clothing Stores', description: 'Qualifying clothing retailers' },
    { spendKey: 'online', label: 'Cell Phone Providers', description: 'Wireless carriers & plans' },
    { spendKey: 'dining', label: 'Movie Theaters', description: 'Cinema purchases' },
    { spendKey: 'online', label: 'Gyms/Fitness Centers', description: 'Gym memberships & fitness' },
    { spendKey: 'online', label: 'Sporting Goods Stores', description: 'Sporting goods purchases' },
    { spendKey: 'online', label: 'Furniture Stores', description: 'Furniture & home furnishing stores' }
  ];

  const usbTwoPercentOptions = [
    { spendKey: 'groceries', label: 'Grocery Stores', description: 'Supermarkets & grocery' },
    { spendKey: 'dining', label: 'Restaurants', description: 'Full-service dining' },
    { spendKey: 'gas', label: 'Gas Stations & EV Charging', description: 'Gas & electric vehicle charging' }
  ];

  // Default selections: high-value picks for most users
  let usbFivePctSelections = ['utilities', 'streaming']; // Two 5% spend-category keys
  let usbFivePctOptionLabels = ['Home Utilities', 'TV, Internet & Streaming'];
  let usbTwoPctSelection = 'dining'; // One 2% spend-category key
  let usbTwoPctOptionLabel = 'Restaurants';

  // Quarterly combined cap for 5% categories
  const USB_QUARTERLY_CAP = 2000;  // $2,000/quarter combined spending cap at 5%
  const USB_ANNUAL_5PCT_CAP = USB_QUARTERLY_CAP * 4; // $8,000/year

  // Load saved selections from localStorage
  function loadUSBSelections() {
    try {
      const saved = localStorage.getItem('usb_cash_plus_selections');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.fivePct && data.fivePct.length === 2) {
          usbFivePctSelections = data.fivePct;
          usbFivePctOptionLabels = data.fivePctLabels || usbFivePctOptionLabels;
        }
        if (data.twoPct) {
          usbTwoPctSelection = data.twoPct;
          usbTwoPctOptionLabel = data.twoPctLabel || usbTwoPctOptionLabel;
        }
      }
    } catch (e) {
      // Ignore parse errors, use defaults
    }
  }

  // Save selections to localStorage
  function saveUSBSelections() {
    try {
      localStorage.setItem('usb_cash_plus_selections', JSON.stringify({
        fivePct: usbFivePctSelections,
        fivePctLabels: usbFivePctOptionLabels,
        twoPct: usbTwoPctSelection,
        twoPctLabel: usbTwoPctOptionLabel
      }));
    } catch (e) {
      // Ignore storage errors
    }
  }

  function calculateChaseFreedomFlex(spending, pointValue, yearView = 'ongoing') {
    const breakdown = {};
    let totalAnnual = 0;
    const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];

    for (const cat of categories) {
      const monthlySpend = spending[cat] || 0;
      let rate = 1; // base

      if (cat === 'dining') {
        rate = 3;
      }
      // Rotating categories: estimate ~2% effective across non-dining categories
      // (5% on ~25% of spend, 1% on rest = ~2% average)
      if (cat !== 'dining') {
        rate = 2;
      }

      const annualValue = monthlySpend * (rate / 100) * 12 * (pointValue / 100);
      breakdown[cat] = { monthlySpend, rate, annualPoints: 0, annualValue, note: cat === 'dining' ? '3x dining' : '~2% avg (rotating 5%)' };
      totalAnnual += annualValue;
    }

    // Calculate net annual value
    let netAnnual = totalAnnual;
    let grossAnnual = totalAnnual;
    let signupBonusValue = 0;
    let bonusNote = '';
    let annualCreditsNote = '';
    
    // Handle signup bonus for first year view
    const card = cardsData.find(c => c.id === 'chase-freedom-flex');
    if (yearView === 'first' && card && card.signupBonus && card.signupBonus.value > 0) {
      const eligibility = isSignupBonusEligible(card, spending);
      if (eligibility.eligible) {
        signupBonusValue = card.signupBonus.value;
        // Add annual credits if toggle is on
        if (includeAnnualCredits && card.annualCredits && card.annualCredits > 0) {
          signupBonusValue += card.annualCredits;
          annualCreditsNote = ` <span style="font-size:0.75rem;color:var(--text-muted);">incl. $${card.annualCredits} annual credits</span>`;
        }
        netAnnual += signupBonusValue;
        grossAnnual += signupBonusValue;
      } else {
        bonusNote = `Bonus not eligible: Need $${eligibility.requiredAmount.toLocaleString()} in ${eligibility.requiredMonths} months, projected $${eligibility.projectedSpending.toLocaleString()}`;
      }
    }

    return {
      grossAnnual,
      annualFee: 0,
      netAnnual,
      signupBonusValue,
      annualCreditsNote,
      bonusNote,
      breakdown
    };
  }

  function calculateDiscoverItCashBack(spending, yearView = 'ongoing') {
    const breakdown = {};
    let totalAnnual = 0;
    const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];

    for (const cat of categories) {
      const monthlySpend = spending[cat] || 0;
      // ~2% effective average (5% rotating on ~25% of spend)
      const rate = 2;
      const annualValue = monthlySpend * (rate / 100) * 12;
      breakdown[cat] = { monthlySpend, rate, annualPoints: 0, annualValue, note: '~2% avg (5% rotating)' };
      totalAnnual += annualValue;
    }

    // Calculate net annual value
    let netAnnual = totalAnnual;
    let grossAnnual = totalAnnual;
    let signupBonusValue = 0;
    let bonusNote = '';
    let annualCreditsNote = '';
    let note = '';
    
    // Handle signup bonus for first year view
    const card = cardsData.find(c => c.id === 'discover-it-cash-back');
    if (yearView === 'first') {
      // For Discover it, the "bonus" is the cashback match which doubles earnings
      // This is handled differently - it's not a traditional signup bonus
      note = 'First year: Cashback Match doubles earnings!';
      // In first year, the value is doubled
      netAnnual = totalAnnual * 2;
      grossAnnual = totalAnnual * 2;
    } else {
      note = 'Second year+: Regular cashback earnings';
    }

    return {
      grossAnnual,
      annualFee: 0,
      netAnnual,
      signupBonusValue,
      annualCreditsNote,
      bonusNote,
      breakdown,
      note
    };
  }

  function calculateAmexGold(spending, pointValue, yearView = 'ongoing') {
    const breakdown = {};
    let totalAnnual = 0;
    const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];

    for (const cat of categories) {
      const monthlySpend = spending[cat] || 0;
      let rate = 1;

      if (cat === 'groceries') {
        rate = 4;
        // Cap: $25,000/yr = $2,083.33/mo
        const monthlyCap = 2083.33;
        const cappedSpend = Math.min(monthlySpend, monthlyCap);
        const overSpend = Math.max(0, monthlySpend - monthlyCap);
        const annualValue = (cappedSpend * 0.04 * 12 + overSpend * 0.01 * 12) * (pointValue / 100);
        breakdown[cat] = { monthlySpend, rate: 4, annualPoints: 0, annualValue, note: '4x up to $25k/yr' };
        totalAnnual += annualValue;
        continue;
      }

      if (cat === 'dining') rate = 4;
      if (cat === 'travel') rate = 3;

      const annualValue = monthlySpend * (rate / 100) * 12 * (pointValue / 100);
      breakdown[cat] = { monthlySpend, rate, annualPoints: 0, annualValue };
      totalAnnual += annualValue;
    }

    // Calculate net annual value
    let netAnnual = totalAnnual - 250; // Subtract annual fee
    let grossAnnual = totalAnnual;
    let signupBonusValue = 0;
    let bonusNote = '';
    let annualCreditsNote = '';
    let note = 'Includes $240/yr in credits (Uber + Dining)';
    
    // Handle signup bonus for first year view
    const card = cardsData.find(c => c.id === 'amex-gold');
    if (yearView === 'first' && card && card.signupBonus && card.signupBonus.value > 0) {
      const eligibility = isSignupBonusEligible(card, spending);
      if (eligibility.eligible) {
        signupBonusValue = card.signupBonus.value;
        // Add annual credits if toggle is on
        if (includeAnnualCredits && card.annualCredits && card.annualCredits > 0) {
          signupBonusValue += card.annualCredits;
          annualCreditsNote = ` <span style="font-size:0.75rem;color:var(--text-muted);">incl. $${card.annualCredits} annual credits</span>`;
        }
        netAnnual += signupBonusValue;
        grossAnnual += signupBonusValue;
      } else {
        bonusNote = `Bonus not eligible: Need $${eligibility.requiredAmount.toLocaleString()} in ${eligibility.requiredMonths} months, projected $${eligibility.projectedSpending.toLocaleString()}`;
      }
    }

    return {
      grossAnnual,
      annualFee: 250,
      netAnnual,
      signupBonusValue,
      annualCreditsNote,
      bonusNote,
      breakdown,
      note
    };
  }

  function calculateAmexBCP(spending, pointValue, yearView = 'ongoing') {
    const breakdown = {};
    let totalAnnual = 0;
    const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];

    for (const cat of categories) {
      const monthlySpend = spending[cat] || 0;
      let rate = 1;

      if (cat === 'groceries') {
        rate = 6;
        // Cap: $6,000/yr = $500/mo
        const cappedSpend = Math.min(monthlySpend, 500);
        const overSpend = Math.max(0, monthlySpend - 500);
        const annualValue = cappedSpend * 0.06 * 12 + overSpend * 0.01 * 12;
        breakdown[cat] = { monthlySpend, rate: 6, annualPoints: 0, annualValue, note: '6% up to $6k/yr' };
        totalAnnual += annualValue;
        continue;
      }

      if (cat === 'streaming') rate = 6;
      if (cat === 'gas') rate = 3;

      const annualValue = monthlySpend * (rate / 100) * 12;
      breakdown[cat] = { monthlySpend, rate, annualPoints: 0, annualValue };
      totalAnnual += annualValue;
    }

    // Calculate net annual value
    let netAnnual = totalAnnual - 95; // Subtract annual fee
    let grossAnnual = totalAnnual;
    let signupBonusValue = 0;
    let bonusNote = '';
    let annualCreditsNote = '';
    
    // Handle signup bonus for first year view
    const card = cardsData.find(c => c.id === 'amex-blue-cash-preferred');
    if (yearView === 'first' && card && card.signupBonus && card.signupBonus.value > 0) {
      const eligibility = isSignupBonusEligible(card, spending);
      if (eligibility.eligible) {
        signupBonusValue = card.signupBonus.value;
        // Add annual credits if toggle is on
        if (includeAnnualCredits && card.annualCredits && card.annualCredits > 0) {
          signupBonusValue += card.annualCredits;
          annualCreditsNote = ` <span style="font-size:0.75rem;color:var(--text-muted);">incl. $${card.annualCredits} annual credits</span>`;
        }
        netAnnual += signupBonusValue;
        grossAnnual += signupBonusValue;
      } else {
        bonusNote = `Bonus not eligible: Need $${eligibility.requiredAmount.toLocaleString()} in ${eligibility.requiredMonths} months, projected $${eligibility.projectedSpending.toLocaleString()}`;
      }
    }

    return {
      grossAnnual,
      annualFee: 95,
      netAnnual,
      signupBonusValue,
      annualCreditsNote,
      bonusNote,
      breakdown
    };
  }

  function calculateAmexBCE(spending, pointValue, yearView = 'ongoing') {
    const breakdown = {};
    let totalAnnual = 0;
    const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];

    for (const cat of categories) {
      const monthlySpend = spending[cat] || 0;
      let rate = 1;

      if (cat === 'groceries') {
        rate = 3;
        const cappedSpend = Math.min(monthlySpend, 500);
        const overSpend = Math.max(0, monthlySpend - 500);
        const annualValue = cappedSpend * 0.03 * 12 + overSpend * 0.01 * 12;
        breakdown[cat] = { monthlySpend, rate: 3, annualPoints: 0, annualValue, note: '3% up to $6k/yr' };
        totalAnnual += annualValue;
        continue;
      }

      if (cat === 'gas') rate = 3;
      if (cat === 'online') rate = 3;

      const annualValue = monthlySpend * (rate / 100) * 12;
      breakdown[cat] = { monthlySpend, rate, annualPoints: 0, annualValue };
      totalAnnual += annualValue;
    }

    // Calculate net annual value
    let netAnnual = totalAnnual;
    let grossAnnual = totalAnnual;
    let signupBonusValue = 0;
    let bonusNote = '';
    let annualCreditsNote = '';
    
    // Handle signup bonus for first year view
    const card = cardsData.find(c => c.id === 'amex-blue-cash-everyday');
    if (yearView === 'first' && card && card.signupBonus && card.signupBonus.value > 0) {
      const eligibility = isSignupBonusEligible(card, spending);
      if (eligibility.eligible) {
        signupBonusValue = card.signupBonus.value;
        // Add annual credits if toggle is on
        if (includeAnnualCredits && card.annualCredits && card.annualCredits > 0) {
          signupBonusValue += card.annualCredits;
          annualCreditsNote = ` <span style="font-size:0.75rem;color:var(--text-muted);">incl. $${card.annualCredits} annual credits</span>`;
        }
        netAnnual += signupBonusValue;
        grossAnnual += signupBonusValue;
      } else {
        bonusNote = `Bonus not eligible: Need $${eligibility.requiredAmount.toLocaleString()} in ${eligibility.requiredMonths} months, projected $${eligibility.projectedSpending.toLocaleString()}`;
      }
    }

    return {
      grossAnnual,
      annualFee: 0,
      netAnnual,
      signupBonusValue,
      annualCreditsNote,
      bonusNote,
      breakdown
    };
  }

  // ===================== RENDERING =====================

  function formatCurrency(amount) {
    if (amount < 0) return '-$' + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function renderResults() {
    const container = document.getElementById('results-container');
    if (!container) return;

    // Show skeleton
    const skeleton = document.getElementById('rewards-skeleton');
    if (skeleton) {
      skeleton.classList.add('active');
      container.setAttribute('aria-busy', 'true');
    }

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        // Get effective spending (with custom categories)
        const effectiveSpending = getEffectiveSpending();

        // Calculate all cards with current year view
        const results = cardsData.map(card => {
          // Filter out crypto cards if toggle is off
          if (card.isCrypto && !showCrypto) return null;

          // Check if user currently has this card → exclude from results
          const ownership = cardsOwnership[card.id];
          if (ownership === 'have') return null;

          // Filter out cards with annual fee if noAnnualFee toggle is on
          if (noAnnualFee && card.annualFee > 0) return null;

          // For "had" cards, enable signup bonus eligibility
          const effectiveYearView = ownership === 'had' && yearView === 'ongoing' ? 'first' : yearView;
          const calc = calculateCardRewards(card, effectiveSpending, effectiveYearView);
          return { ...card, ...calc };
        }).filter(Boolean);

        // Sort by net annual value
        results.sort((a, b) => b.netAnnual - a.netAnnual);

        // Store current rankings for next comparison
        const currentRankings = {};
        results.forEach((card, index) => {
          currentRankings[card.id] = index + 1;
        });

        // Apply filter
        let filtered = results;
        if (activeFilter !== 'all') {
          filtered = results.filter(r => r.type === activeFilter);
        }

        if (filtered.length === 0) {
          container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px 0;">No cards match your filters. Try adjusting your filters or removing some exclusions.</p>';
          hideSkeleton(skeleton);
          // Still show What's Next CTA
          renderWhatsNext();
          return;
        }

        container.innerHTML = filtered.map((card, index) => {
          const rank = index + 1;
          const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default';
          const cardType = typeConfig[card.type] || typeConfig.cashback;
          const isNegative = card.netAnnual < 0;

          // Check for ranking change
          let rankChangeBadge = '';
          if (previousRankings[card.id] && previousRankings[card.id] !== rank) {
            const change = previousRankings[card.id] - rank;
            if (change > 0) {
              rankChangeBadge = `<span class="rank-change-badge" style="background:#10b981;color:white;padding:2px 6px;border-radius:10px;font-size:0.7rem;margin-left:8px;">↑${change} ${yearView === 'first' ? 'in Year 1' : 'in Ongoing'}</span>`;
            } else {
              rankChangeBadge = `<span class="rank-change-badge" style="background:#ef4444;color:white;padding:2px 6px;border-radius:10px;font-size:0.7rem;margin-left:8px;">↓${Math.abs(change)} ${yearView === 'first' ? 'in Year 1' : 'in Ongoing'}</span>`;
            }
          } else if (!previousRankings[card.id] && yearView === 'first') {
            // New to the list in first year view
            rankChangeBadge = `<span class="rank-change-badge" style="background:#3b82f6;color:white;padding:2px 6px;border-radius:10px;font-size:0.7rem;margin-left:8px;">New in Year 1</span>`;
          }

          // Build breakdown bar
          const breakdownHTML = buildBreakdownBar(card.breakdown);

          // Build perks list
          const perksHTML = card.perks.map(p => `<li>${p}</li>`).join('');

          // Compare checkbox
          const isChecked = compareSelected.has(card.id) ? 'checked' : '';

          // Why this card? reasoning (top 3 only)
          let reasoningHTML = '';
          if (rank <= 3) {
            const reason = generateReasoning(card, card, effectiveSpending);
            if (reason) {
              reasoningHTML = `<div class="result-reasoning">💡 ${reason}</div>`;
            }
          }

          // FTX badge
          const ftxBadge = getFtxBadge(card);

          // Previously had badge
          const hadBadge = cardsOwnership[card.id] === 'had' ? '<span class="had-badge" title="You previously had this card — signup bonus eligible">🔄 Bonus eligible again</span>' : '';

          return `
            <div class="result-card rank-${rank}" data-card-id="${card.id}">
              <span class="result-rank-badge ${rankClass}">#${rank}</span>
              <div class="result-top-row">
                <div class="result-card-info">
                  <div class="result-card-name">${card.name}${rankChangeBadge}</div>
                  <div class="result-card-issuer">${card.issuer}</div>
                  <span class="result-card-type-badge" style="background:${cardType.bg};color:${cardType.color};">${cardType.icon} ${cardType.label}</span>
                </div>
                <div class="result-value-section">
                  <div class="result-net-value ${isNegative ? 'negative' : ''}">${formatCurrency(card.netAnnual)}</div>
                  <div class="result-gross-label">net annual value</div>
                </div>
              </div>

              <div class="result-badges-row">${ftxBadge}${hadBadge}</div>

              ${card.bestFor ? `<div class="result-best-for">🏷️ Best for: ${card.bestFor}</div>` : ''}

              ${reasoningHTML}

              ${card.bonusNote ? `<div style="font-size:0.8rem;color:var(--warning);background:var(--warning-light);padding:6px 10px;border-radius:6px;margin-bottom:12px;">⚠️ ${card.bonusNote}</div>` : ''}
              ${card.note ? `<div style="font-size:0.8rem;color:var(--warning);background:var(--warning-light);padding:6px 10px;border-radius:6px;margin-bottom:12px;">${card.note}</div>` : ''}

              ${card.id === 'us-bank-cash-plus' ? renderUSBCategoryPicker() : ''}

              <div class="rewards-breakdown">
                <div class="rewards-breakdown-title">Rewards Breakdown</div>
                ${breakdownHTML}
              </div>

              <div class="result-value-details">
                <div class="value-detail">
                  <span class="value-detail-label">Gross Rewards</span>
                  <span class="value-detail-value positive">${formatCurrency(card.grossAnnual)}</span>
                </div>
                <div class="value-detail">
                  <span class="value-detail-label">Annual Fee</span>
                  <span class="value-detail-value negative">-${formatCurrency(card.annualFee)}</span>
                </div>
                <div class="value-detail">
                  <span class="value-detail-label">Point Value</span>
                  <span class="value-detail-value">${card.pointValue}¢</span>
                </div>
                ${card.signupBonusValue && card.signupBonusValue > 0 ? `
                <div class="value-detail">
                  <span class="value-detail-label">Signup Bonus</span>
                  <span class="value-detail-value positive">${formatCurrency(card.signupBonusValue)}${card.annualCreditsNote || ''}</span>
                </div>` : ''}
              </div>

              <div class="result-perks">
                <div class="result-perks-title">Key Perks</div>
                <ul class="result-perks-list">${perksHTML}</ul>
              </div>

              ${window.renderApplyButton ? window.renderApplyButton(card) : (card.affiliateLink ? `
              <a href="${card.affiliateLink}" class="btn-apply" target="_blank" rel="nofollow sponsored noopener">Apply Now →</a>
              <div class="ftc-disclosure">We may earn a commission when you apply. <a href="/disclosure.html">See our disclosure</a>.</div>
              ` : `
              <a href="#card-${card.id}" class="btn-apply btn-learn-more">Learn More</a>
              `)}

              <label class="result-compare-check">
                <input type="checkbox" data-card-id="${card.id}" ${isChecked} onchange="toggleCompare(this)">
                Compare this card
              </label>
              
              <button class="btn-add-to-wallet" onclick="addToWallet('${card.id}')">
                Add to Wallet
              </button>
            </div>
          `;
        }).join('');

        // Store current rankings for next comparison
        previousRankings = currentRankings;

        // Sync USB category picker after re-render
        syncUSBPickerToState();

        // Render comparison if 2+ selected
        renderComparison(results);

        // Render crypto corner
        renderCryptoCorner(results);

        // Render wallet
        renderWallet();

        // Render What's Next CTA
        renderWhatsNext();

        // Render data stamp
        renderDataStamp();
      } finally {
        // Hide skeleton after rendering
        hideSkeleton(skeleton);
      }
    }, 0);
  }

  function renderWhatsNext() {
    const section = document.getElementById('whats-next-section');
    if (!section) return;
    section.innerHTML = `
      <div class="whats-next-panel">
        <h3>🔍 What's Next?</h3>
        <div class="whats-next-cards">
          <a href="/debt-planner/" class="whats-next-card">
            <div class="whats-next-icon">💰</div>
            <div class="whats-next-title">Pay Off Existing Debt</div>
            <div class="whats-next-desc">Plan your debt payoff strategy and see how fast you can be debt-free.</div>
          </a>
          <a href="/compare/" class="whats-next-card">
            <div class="whats-next-icon">⚖️</div>
            <div class="whats-next-title">Compare Payment Options</div>
            <div class="whats-next-desc">Find the cheapest way to pay for a specific purchase.</div>
          </a>
        </div>
      </div>
    `;
  }

  function renderDataStamp() {
    const mount = document.getElementById('data-stamp-mount');
    if (!mount) return;
    // Only set the stamp if not already set by share.js
    const existing = mount.textContent || mount.innerHTML;
    if (!existing || existing.trim() === '') {
      mount.innerHTML = '<span class="data-verified-stamp">Rates verified: 2026-04-28</span>';
    }
  }

  function hideSkeleton(skeleton) {
    if (skeleton) {
      skeleton.classList.remove('active');
      const container = document.getElementById('results-container');
      if (container) {
        container.removeAttribute('aria-busy');
      }
    }
  }

  function buildBreakdownBar(breakdown) {
    const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];
    const total = Object.values(breakdown).reduce((sum, b) => sum + b.annualValue, 0);
    if (total === 0) return '<div style="font-size:0.8rem;color:var(--text-secondary);">No rewards earned</div>';

    let barHTML = '<div class="breakdown-bar">';
    let legendHTML = '<div class="breakdown-legend">';

    // Find best card for each category in wallet
    const categoryBestCards = {};
    if (walletCards.length > 0) {
      categories.forEach(cat => {
        let bestCard = null;
        let bestValue = -1;
        
        walletCards.forEach(card => {
          const calc = calculateCardRewards(card, currentSpending, yearView);
          const value = calc.breakdown[cat] ? calc.breakdown[cat].annualValue : 0;
          if (value > bestValue) {
            bestValue = value;
            bestCard = card;
          }
        });
        
        if (bestCard && bestValue > 0) {
          categoryBestCards[cat] = bestCard.id;
        }
      });
    }

    categories.forEach((cat, i) => {
      const b = breakdown[cat];
      if (!b || b.annualValue <= 0) return;
      const pct = Math.max((b.annualValue / total) * 100, 3);
      const color = barColors[i];
      
      // Check if this is the best card in wallet for this category
      const isBestInWallet = walletCards.length > 0 && categoryBestCards[cat] === breakdown.cardId;
      const highlightClass = isBestInWallet ? ' best-in-wallet' : '';

      barHTML += `<div class="breakdown-segment${highlightClass}" style="width:${pct}%;background:${color};" title="${categoryLabels[cat]}: ${formatCurrency(b.annualValue)}">${pct > 12 ? formatCurrency(b.annualValue) : ''}</div>`;
      legendHTML += `<span class="breakdown-legend-item"><span class="breakdown-legend-dot" style="background:${color}"></span>${categoryLabels[cat]}: ${formatCurrency(b.annualValue)}${isBestInWallet ? ' ★' : ''}</span>`;
    });

    barHTML += '</div>';
    legendHTML += '</div>';

    return barHTML + legendHTML;
  }

  function renderComparison(allResults) {
    const section = document.getElementById('comparison-section');
    if (!section) return;

    const selected = allResults.filter(c => compareSelected.has(c.id));

    if (selected.length < 2) {
      section.classList.add('hidden');
      return;
    }

    if (selected.length > 3) {
      // Remove the last selected
      const lastId = Array.from(compareSelected).pop();
      compareSelected.delete(lastId);
    }

    section.classList.remove('hidden');

    const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];

    let html = `
      <div class="comparison-header">
        <h3>📊 Side-by-Side Comparison</h3>
        <button class="btn-ghost btn-small" onclick="clearCompare()">Clear Selection</button>
      </div>
      <div class="comparison-table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Category</th>
              ${selected.map(c => `<th>${c.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    // Category earnings rows
    for (const cat of categories) {
      const values = selected.map(c => c.breakdown[cat]?.annualValue || 0);
      const maxVal = Math.max(...values);

      html += `<tr class="category-row">
        <td>${categoryIcons[cat]} ${categoryLabels[cat]}</td>
        ${values.map(v => {
          const isWinner = v === maxVal && maxVal > 0;
          return `<td class="${isWinner ? 'winner-cell' : ''}">${formatCurrency(v)}</td>`;
        }).join('')}
      </tr>`;
    }

    // Annual fee row
    html += `<tr>
      <td><strong>Annual Fee</strong></td>
      ${selected.map(c => `<td class="negative" style="color:var(--danger);">-${formatCurrency(c.annualFee)}</td>`).join('')}
    </tr>`;

    // Total row
    html += `<tr class="total-row">
      <td><strong>Net Annual Value</strong></td>
      ${selected.map(c => `<td style="color:var(--success);font-size:1.05rem;">${formatCurrency(c.netAnnual)}</td>`).join('')}
    </tr>`;

    // Perks row
    html += `<tr>
      <td><strong>Key Perks</strong></td>
      ${selected.map(c => `<td><ul style="padding-left:16px;margin:0;font-size:0.8rem;">${c.perks.map(p => `<li>${p}</li>`).join('')}</ul></td>`).join('')}
    </tr>`;

    html += '</tbody></table></div>';

    section.innerHTML = html;
  }

  function renderCryptoCorner(allResults) {
    const section = document.getElementById('crypto-corner');
    if (!section) return;

    if (!showCrypto) {
      section.classList.add('hidden');
      return;
    }

    section.classList.remove('hidden');

    const coinbaseCard = allResults.find(c => c.id === 'coinbase-card');
    const coinbaseOne = allResults.find(c => c.id === 'coinbase-one-credit');
    const bestNonCrypto = allResults.find(c => !c.isCrypto);

    const totalMonthlySpend = Object.values(currentSpending).reduce((s, v) => s + v, 0);
    const coinbaseAnnual = coinbaseCard ? coinbaseCard.grossAnnual : 0;

    // Crypto projections
    const projections = [
      { label: 'Current Value', value: coinbaseAnnual, growth: 0 },
      { label: '+10% growth (1yr)', value: coinbaseAnnual * 1.10, growth: 10 },
      { label: '+25% growth (1yr)', value: coinbaseAnnual * 1.25, growth: 25 },
      { label: '+50% growth (1yr)', value: coinbaseAnnual * 1.50, growth: 50 },
      { label: '-20% drop (1yr)', value: coinbaseAnnual * 0.80, growth: -20 }
    ];

    // Estimate BTC earned (at ~$85,000/BTC)
    const btcPrice = 85000;
    const btcEarned = coinbaseAnnual / btcPrice;

    html = `
      <div class="crypto-corner-header">
        <span style="font-size:1.5rem;">₿</span>
        <h3>Crypto Rewards Corner</h3>
      </div>

      <div class="crypto-corner-grid">
        <div class="crypto-stat-card">
          <div class="crypto-stat-label">Annual Crypto Rewards</div>
          <div class="crypto-stat-value">${formatCurrency(coinbaseAnnual)}</div>
        </div>
        <div class="crypto-stat-card">
          <div class="crypto-stat-label">Estimated BTC Earned</div>
          <div class="crypto-stat-value">₿${btcEarned.toFixed(6)}</div>
        </div>
        <div class="crypto-stat-card">
          <div class="crypto-stat-label">Earn Rate</div>
          <div class="crypto-stat-value">Up to 4%</div>
        </div>
        <div class="crypto-stat-card">
          <div class="crypto-stat-label">Card Type</div>
          <div class="crypto-stat-value" style="font-size:1rem;">Visa Debit</div>
        </div>
      </div>

      ${bestNonCrypto ? `
      <div style="margin-top:16px;background:white;border-radius:var(--radius-sm);padding:14px 16px;">
        <strong style="font-size:0.85rem;">💡 Credit vs Crypto Comparison</strong>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin:8px 0 0;">
          Your best credit card (<strong>${bestNonCrypto.name}</strong>) earns you <strong>${formatCurrency(bestNonCrypto.netAnnual)}/year</strong> in rewards.
          If your Coinbase rewards grow <strong>10%/year</strong>, they'd be worth <strong>${formatCurrency(coinbaseAnnual * 1.10)}</strong> — 
          ${coinbaseAnnual * 1.10 > bestNonCrypto.netAnnual ? 'outperforming your best credit card!' : 'still below your best credit card.'}
        </p>
      </div>` : ''}

      <div class="crypto-projection">
        <h4>📈 Value Projection (1 Year)</h4>
        ${projections.map(p => `
          <div class="projection-row">
            <span>${p.label}</span>
            <span style="font-weight:${p.growth !== 0 ? '700' : '500'};color:${p.growth > 0 ? 'var(--success)' : p.growth < 0 ? 'var(--danger)' : 'var(--text)'};">${formatCurrency(p.value)}</span>
          </div>
        `).join('')}
      </div>

      <div class="crypto-volatility-note">
        <strong>⚠️ Crypto rewards are volatile</strong>
        Your ${formatCurrency(coinbaseAnnual)} in Bitcoin today could be worth significantly more or less tomorrow. 
        The Coinbase Card is a <strong>debit card</strong> (not credit) — you spend from your existing crypto balance. 
        Spending crypto may be a taxable event. Consult a tax professional.
      </div>

      ${coinbaseOne ? `
      <div style="margin-top:16px;background:white;border-radius:var(--radius-sm);padding:14px 16px;">
        <strong style="font-size:0.85rem;">Coinbase One Credit Card</strong>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin:8px 0 0;">
          Earns <strong>4% Bitcoin back</strong> on all purchases with a Coinbase One subscription (~$30/mo).
          Net annual value: <strong style="color:${coinbaseOne.netAnnual >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatCurrency(coinbaseOne.netAnnual)}</strong>
          ${coinbaseOne.netAnnual >= 0 ? '— worth it if you value Bitcoin rewards!' : '— the subscription cost outweighs rewards at your current spending.'}
        </p>
      </div>` : ''}
    `;

    section.innerHTML = html;
  }

  // ===================== WALLET RENDERING =====================

  function renderWallet() {
    const section = document.getElementById('wallet-section');
    if (!section) return;

    // Calculate wallet totals
    let walletTotal = 0;
    let bestSingleCardValue = 0;
    
    if (walletCards.length > 0) {
      // Calculate combined wallet value
      walletTotal = walletCards.reduce((total, card) => {
        const calc = calculateCardRewards(card, currentSpending, yearView);
        return total + calc.netAnnual;
      }, 0);
      
      // Find best single card value from results
      // We need to get the results from the current context
      // For now, we'll leave this as 0 and calculate it properly later
    }

    if (walletCards.length === 0) {
      section.innerHTML = `
        <div class="wallet-header">
          <h3>💳 My Card Wallet</h3>
          <button id="wallet-toggle" class="btn-ghost btn-small" onclick="toggleWallet()">Show Wallet ▼</button>
        </div>
        <div class="wallet-content">
          <p style="text-align:center;color:var(--text-secondary);padding:20px;">Your wallet is empty. Add cards to your wallet to see category recommendations and combined value.</p>
        </div>
      `;
      return;
    }

    // Build wallet card tiles
    const walletCardsHTML = walletCards.map(card => {
      const calc = calculateCardRewards(card, currentSpending, yearView);
      const cardType = typeConfig[card.type] || typeConfig.cashback;
      
      // Find best categories for this card
      const bestCategories = [];
      const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];
      
      categories.forEach(cat => {
        let bestCard = null;
        let bestValue = -1;
        
        walletCards.forEach(walletCard => {
          const walletCalc = calculateCardRewards(walletCard, currentSpending, yearView);
          const value = walletCalc.breakdown[cat] ? walletCalc.breakdown[cat].annualValue : 0;
          if (value > bestValue) {
            bestValue = value;
            bestCard = walletCard;
          }
        });
        
        if (bestCard && bestCard.id === card.id && bestValue > 0) {
          bestCategories.push({
            category: cat,
            label: categoryLabels[cat],
            icon: categoryIcons[cat],
            value: bestValue
          });
        }
      });
      
      const bestCategoriesHTML = bestCategories.map(cat => `
        <span class="category-badge" title="${cat.label}: ${formatCurrency(cat.value)}">
          ${cat.icon} ${cat.label.split(' ')[0]}
        </span>
      `).join('');
      
      return `
        <div class="wallet-card-tile">
          <div class="wallet-card-header">
            <div>
              <div class="wallet-card-name">${card.name}</div>
              <div class="wallet-card-issuer">${card.issuer}</div>
            </div>
            <button class="btn-remove-wallet" onclick="removeFromWallet('${card.id}')" title="Remove from wallet">✕</button>
          </div>
          <div class="wallet-card-type">
            <span class="result-card-type-badge" style="background:${cardType.bg};color:${cardType.color};font-size:0.7rem;padding:2px 6px;">${cardType.icon} ${cardType.label}</span>
          </div>
          <div class="wallet-card-value">
            <div class="wallet-card-net-value">${formatCurrency(calc.netAnnual)}</div>
            <div class="wallet-card-value-label">net annual value</div>
          </div>
          ${bestCategories.length > 0 ? `
          <div class="wallet-card-categories">
            <div class="wallet-card-categories-title">Best for:</div>
            <div class="category-badges">
              ${bestCategoriesHTML}
            </div>
          </div>` : ''}
        </div>
      `;
    }).join('');

    section.innerHTML = `
      <div class="wallet-header">
        <h3>💳 My Card Wallet</h3>
        <button id="wallet-toggle" class="btn-ghost btn-small" onclick="toggleWallet()">${walletOpen ? 'Hide Wallet ▲' : 'Show Wallet ▼'}</button>
      </div>
      <div class="wallet-content ${walletOpen ? 'open' : ''}">
        <div class="wallet-stats">
          <div class="wallet-stat">
            <div class="wallet-stat-label">Cards in Wallet</div>
            <div class="wallet-stat-value">${walletCards.length}</div>
          </div>
          <div class="wallet-stat">
            <div class="wallet-stat-label">Combined Annual Value</div>
            <div class="wallet-stat-value">${formatCurrency(walletTotal)}</div>
          </div>
        </div>
        <div class="wallet-cards-grid">
          ${walletCardsHTML}
        </div>
      </div>
    `;
  }

  // ===================== SPENDING INPUTS =====================

  function initSpendingInputs() {
    const grid = document.getElementById('spending-grid');
    if (!grid) return;

    const categories = ['groceries', 'dining', 'gas', 'travel', 'online', 'streaming', 'utilities', 'everything'];

    const isAnnual = spendingMode === 'annual';
    const sliderMax = isAnnual ? 50000 : 5000;

    grid.innerHTML = categories.map(cat => {
      const displayValue = isAnnual ? currentSpending[cat] * 12 : currentSpending[cat];
      return `
      <div class="spending-item">
        <label>
          <span><span class="category-icon">${categoryIcons[cat]}</span>${categoryLabels[cat]}</span>
          <span class="value-display" id="display-${cat}">$${displayValue.toLocaleString()}</span>
        </label>
        <input type="range" class="spending-slider" id="slider-${cat}" 
          min="0" max="${sliderMax}" step="10" value="${displayValue}"
          oninput="updateSpending('${cat}', this.value)">
        <input type="number" class="spending-number-input" id="input-${cat}"
          value="${displayValue}" min="0" step="10"
          oninput="updateSpending('${cat}', this.value)">
      </div>
    `;}).join('');

    // Add custom categories
    renderCustomCategories(grid);

    updateSpendingSummary();
  }

  function updateSpending(category, value) {
    const num = parseInt(value) || 0;
    const isAnnual = spendingMode === 'annual';
    const divisor = isAnnual ? 12 : 1;
    currentSpending[category] = Math.max(0, Math.round(num / divisor));

    const displayValue = isAnnual ? currentSpending[category] * 12 : currentSpending[category];
    const slider = document.getElementById(`slider-${category}`);
    const input = document.getElementById(`input-${category}`);
    const display = document.getElementById(`display-${category}`);

    if (slider) slider.value = displayValue;
    if (input && document.activeElement !== input) input.value = displayValue;
    if (display) display.textContent = '$' + displayValue.toLocaleString();

    updateSpendingSummary();
    renderResults();
    // Show email capture after first results
    if (!emailCaptureShown && typeof EmailCapture !== 'undefined') {
      emailCaptureShown = true;
      setTimeout(function() { new EmailCapture('rewards').showIfEligible(); }, 2000);
    }
  }

  function updateSpendingSummary() {
    const total = Object.values(currentSpending).reduce((s, v) => s + v, 0);
    const isAnnual = spendingMode === 'annual';

    const monthlyEl = document.getElementById('total-monthly');
    const annualEl = document.getElementById('total-annual');

    if (monthlyEl) monthlyEl.textContent = '$' + total.toLocaleString();
    if (annualEl) annualEl.textContent = '$' + (total * 12).toLocaleString();

    // Update mode indicator
    const modeNote = document.getElementById('spending-mode-note');
    if (modeNote) {
      modeNote.textContent = isAnnual ? 'Showing annual amounts' : 'Showing monthly amounts';
      modeNote.style.color = isAnnual ? '#d97706' : 'var(--text-secondary)';
    }
  }

  // ===================== EVENT HANDLERS =====================

  window.updateSpending = updateSpending;

  window.toggleCompare = function(checkbox) {
    const cardId = checkbox.dataset.cardId;
    if (checkbox.checked) {
      if (compareSelected.size >= 3) {
        checkbox.checked = false;
        alert('You can compare up to 3 cards at a time.');
        return;
      }
      compareSelected.add(cardId);
    } else {
      compareSelected.delete(cardId);
    }
    renderResults();
  };

  window.clearCompare = function() {
    compareSelected.clear();
    renderResults();
  };

  window.setFilter = function(type) {
    activeFilter = type;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === type);
    });
    renderResults();
  };

  window.setYearView = function(view) {
    yearView = view;
    renderResults();
  };

  window.toggleCrypto = function(checkbox) {
    showCrypto = checkbox.checked;
    renderResults();
  };

  // ===================== WALLET FUNCTIONS =====================

  window.addToWallet = function(cardId) {
    const card = cardsData.find(c => c.id === cardId);
    if (!card) return;
    
    // Check if card is already in wallet
    if (walletCards.some(c => c.id === cardId)) return;
    
    // Add to wallet (limit to 10 cards)
    if (walletCards.length >= 10) {
      alert('You can only have 10 cards in your wallet.');
      return;
    }
    
    walletCards.push(card);
    renderWallet();
    renderResults(); // Re-render to update category highlights
  };

  window.removeFromWallet = function(cardId) {
    walletCards = walletCards.filter(c => c.id !== cardId);
    renderWallet();
    renderResults(); // Re-render to update category highlights
  };

  window.toggleWallet = function() {
    walletOpen = !walletOpen;
    const walletSection = document.getElementById('wallet-section');
    const toggleBtn = document.getElementById('wallet-toggle');
    
    if (walletSection) {
      walletSection.classList.toggle('open', walletOpen);
    }
    
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', walletOpen);
      toggleBtn.innerHTML = walletOpen ? 'Hide Wallet ▲' : 'Show Wallet ▼';
    }
    
    if (walletOpen) {
      renderWallet();
    }
  };

  // ===================== US BANK CASH+ CATEGORY PICKER UI =====================

  function renderUSBCategoryPicker() {
    const fivePctOpts = usbFivePercentOptions.map(opt =>
      `<option value="${opt.spendKey}" data-label="${opt.label}">${opt.label} — ${opt.description}</option>`
    ).join('');

    const twoPctOpts = usbTwoPercentOptions.map(opt =>
      `<option value="${opt.spendKey}" data-label="${opt.label}">${opt.label} — ${opt.description}</option>`
    ).join('');

    return `
      <div class="usb-picker" id="usb-picker">
        <div class="usb-picker-header" onclick="toggleUSBPicker()" role="button" tabindex="0" aria-expanded="false" aria-controls="usb-picker-body">
          <span class="usb-picker-title">⚙️ Customize Your Categories</span>
          <span class="usb-picker-toggle" id="usb-picker-chevron">▼</span>
        </div>
        <div class="usb-picker-body" id="usb-picker-body" style="display:none;">
          <p class="usb-picker-explainer">US Bank Cash+ lets you <strong>pick your own 5% categories</strong> — that's what makes it powerful. Choose the two categories where you spend the most to maximize your rewards.</p>
          <div class="usb-picker-row">
            <label class="usb-picker-label">5% Category 1</label>
            <select class="usb-picker-select" id="usb-five-1" onchange="updateUSBPicks()">
              ${fivePctOpts}
            </select>
          </div>
          <div class="usb-picker-row">
            <label class="usb-picker-label">5% Category 2</label>
            <select class="usb-picker-select" id="usb-five-2" onchange="updateUSBPicks()">
              ${fivePctOpts}
            </select>
          </div>
          <div class="usb-picker-row">
            <label class="usb-picker-label">2% Category</label>
            <select class="usb-picker-select" id="usb-two" onchange="updateUSBPicks()">
              ${twoPctOpts}
            </select>
          </div>
          <div class="usb-picker-note">5% rewards capped at $2,000 combined spend per quarter ($8,000/year), then drops to 1%. 2% has no cap.</div>
        </div>
      </div>
    `;
  }

  window.toggleUSBPicker = function() {
    const body = document.getElementById('usb-picker-body');
    const chevron = document.getElementById('usb-picker-chevron');
    const header = document.querySelector('.usb-picker-header');
    if (!body) return;
    if (body.style.display === 'none') {
      body.style.display = 'block';
      chevron.textContent = '▲';
      header.setAttribute('aria-expanded', 'true');
    } else {
      body.style.display = 'none';
      chevron.textContent = '▼';
      header.setAttribute('aria-expanded', 'false');
    }
  };

  window.updateUSBPicks = function() {
    const sel5_1 = document.getElementById('usb-five-1');
    const sel5_2 = document.getElementById('usb-five-2');
    const sel2 = document.getElementById('usb-two');
    if (!sel5_1 || !sel5_2 || !sel2) return;

    let val5_1 = sel5_1.value;
    let val5_2 = sel5_2.value;
    const opt5_1 = sel5_1.options[sel5_1.selectedIndex];
    const opt5_2 = sel5_2.options[sel5_2.selectedIndex];
    const opt2 = sel2.options[sel2.selectedIndex];

    let label5_1 = opt5_1.getAttribute('data-label');
    let label5_2 = opt5_2.getAttribute('data-label');
    const label2 = opt2.getAttribute('data-label');

    // Validation: can't pick the exact same option twice
    if (val5_1 === val5_2 && label5_1 === label5_2) {
      // Different labels mapping to the same spendKey is OK
      // But same label means same real category — not allowed
      sel5_2.selectedIndex = sel5_1.selectedIndex === 0 ? 1 : 0;
      val5_2 = sel5_2.value;
      label5_2 = sel5_2.options[sel5_2.selectedIndex].getAttribute('data-label');
    }

    usbFivePctSelections = [val5_1, val5_2];
    usbFivePctOptionLabels = [label5_1, label5_2];
    usbTwoPctSelection = sel2.value;
    usbTwoPctOptionLabel = label2;

    saveUSBSelections();
    renderResults();
  };

  function syncUSBPickerToState() {
    const sel5_1 = document.getElementById('usb-five-1');
    const sel5_2 = document.getElementById('usb-five-2');
    const sel2 = document.getElementById('usb-two');
    if (!sel5_1 || !sel5_2 || !sel2) return;

    for (let i = 0; i < sel5_1.options.length; i++) {
      if (sel5_1.options[i].value === usbFivePctSelections[0] && sel5_1.options[i].getAttribute('data-label') === usbFivePctOptionLabels[0]) {
        sel5_1.selectedIndex = i;
        break;
      }
    }
    for (let i = 0; i < sel5_2.options.length; i++) {
      if (sel5_2.options[i].value === usbFivePctSelections[1] && sel5_2.options[i].getAttribute('data-label') === usbFivePctOptionLabels[1]) {
        sel5_2.selectedIndex = i;
        break;
      }
    }
    for (let i = 0; i < sel2.options.length; i++) {
      if (sel2.options[i].value === usbTwoPctSelection && sel2.options[i].getAttribute('data-label') === usbTwoPctOptionLabel) {
        sel2.selectedIndex = i;
        break;
      }
    }
  }

  // ===================== CUSTOM CATEGORIES =====================

  const categoryMapOptions = [
    { value: '', label: '1% flat (no match)' },
    { value: 'groceries', label: 'Treat as Groceries' },
    { value: 'dining', label: 'Treat as Dining' },
    { value: 'gas', label: 'Treat as Gas/Transport' },
    { value: 'travel', label: 'Treat as Travel' },
    { value: 'online', label: 'Treat as Online Shopping' },
    { value: 'streaming', label: 'Treat as Streaming' },
    { value: 'utilities', label: 'Treat as Utilities' }
  ];

  function renderCustomCategories(grid) {
    // Remove existing custom items
    grid.querySelectorAll('.custom-category-item').forEach(el => el.remove());
    // Remove add button if exists
    const existingBtn = document.getElementById('add-custom-category-btn');
    if (existingBtn) existingBtn.remove();

    customCategories.forEach((cat, idx) => {
      const isAnnual = spendingMode === 'annual';
      const displayAmount = isAnnual ? cat.amount * 12 : cat.amount;
      const item = document.createElement('div');
      item.className = 'spending-item custom-category-item';
      item.dataset.customId = cat.id;
      item.innerHTML = `
        <label>
          <span style="display:flex;align-items:center;gap:6px;">
            <span class="category-icon">📦</span>
            <input type="text" class="custom-cat-name" value="${cat.name}" placeholder="Category name" style="width:100px;border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-size:0.85rem;"
              oninput="updateCustomCatName('${cat.id}', this.value)">
          </span>
          <span class="value-display" id="display-custom-${cat.id}">$${displayAmount.toLocaleString()}</span>
        </label>
        <div style="display:flex;gap:8px;align-items:center;">
          <select class="custom-cat-map" style="flex:1;padding:6px;border:1px solid var(--border);border-radius:4px;font-size:0.8rem;" onchange="updateCustomCatMap('${cat.id}', this.value)">
            ${categoryMapOptions.map(opt => `<option value="${opt.value}" ${opt.value === cat.mapTo ? 'selected' : ''}>${opt.label}</option>`).join('')}
          </select>
          <button class="btn-remove-custom" onclick="removeCustomCategory('${cat.id}')" title="Remove" style="background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--danger);padding:4px;">✕</button>
        </div>
        <input type="range" class="spending-slider" id="slider-custom-${cat.id}" min="0" max="${isAnnual ? 50000 : 5000}" step="10" value="${displayAmount}"
          oninput="updateCustomCategoryAmount('${cat.id}', this.value)">
        <input type="number" class="spending-number-input" id="input-custom-${cat.id}" value="${displayAmount}" min="0" step="10"
          oninput="updateCustomCategoryAmount('${cat.id}', this.value)">
      `;
      grid.appendChild(item);
    });

    // Add button
    const addBtn = document.createElement('button');
    addBtn.id = 'add-custom-category-btn';
    addBtn.className = 'btn-add-category';
    addBtn.innerHTML = '+ Add a custom category';
    addBtn.onclick = addCustomCategory;
    grid.appendChild(addBtn);
  }

  window.updateCustomCatName = function(id, name) {
    const cat = customCategories.find(c => c.id === id);
    if (cat) { cat.name = name; saveCustomCategories(); }
  };

  window.updateCustomCatMap = function(id, mapTo) {
    const cat = customCategories.find(c => c.id === id);
    if (cat) { cat.mapTo = mapTo || null; saveCustomCategories(); renderResults(); }
  };

  window.updateCustomCategoryAmount = function(id, value) {
    const num = parseInt(value) || 0;
    const isAnnual = spendingMode === 'annual';
    const divisor = isAnnual ? 12 : 1;
    const cat = customCategories.find(c => c.id === id);
    if (cat) {
      cat.amount = Math.max(0, Math.round(num / divisor));
      const displayValue = isAnnual ? cat.amount * 12 : cat.amount;
      const slider = document.getElementById(`slider-custom-${id}`);
      const input = document.getElementById(`input-custom-${id}`);
      const display = document.getElementById(`display-custom-${id}`);
      if (slider) slider.value = displayValue;
      if (input && document.activeElement !== input) input.value = displayValue;
      if (display) display.textContent = '$' + displayValue.toLocaleString();
      updateSpendingSummary();
      renderResults();
    }
  };

  window.removeCustomCategory = function(id) {
    customCategories = customCategories.filter(c => c.id !== id);
    saveCustomCategories();
    initSpendingInputs();
    renderResults();
  };

  function addCustomCategory() {
    const id = 'custom-' + nextCustomId++;
    customCategories.push({ id, name: '', amount: 100, mapTo: null });
    saveCustomCategories();
    initSpendingInputs();
  }

  function syncCustomCategoryDisplay(catKey) {
    // Sync custom categories that map to this key
    customCategories.forEach(cat => {
      if (cat.mapTo === catKey) {
        const isAnnual = spendingMode === 'annual';
        const displayValue = isAnnual ? cat.amount * 12 : cat.amount;
        const display = document.getElementById(`display-custom-${cat.id}`);
        if (display) display.textContent = '$' + displayValue.toLocaleString();
      }
    });
  }

  function saveCustomCategories() {
    try {
      localStorage.setItem('rewards_customCategories', JSON.stringify(customCategories));
      localStorage.setItem('rewards_customNextId', nextCustomId);
    } catch (e) {}
  }

  function loadCustomCategories() {
    try {
      const saved = localStorage.getItem('rewards_customCategories');
      if (saved) customCategories = JSON.parse(saved);
      const savedId = localStorage.getItem('rewards_customNextId');
      if (savedId) nextCustomId = parseInt(savedId);
    } catch (e) {}
  }

  // ===================== CARDS OWNERSHIP =====================

  function loadCardsOwnership() {
    try {
      const saved = localStorage.getItem('cardsOwned');
      if (saved) cardsOwnership = JSON.parse(saved);
    } catch (e) {}
  }

  function saveCardsOwnership() {
    try {
      localStorage.setItem('cardsOwned', JSON.stringify(cardsOwnership));
    } catch (e) {}
  }

  window.toggleCardsOwnedPanel = function() {
    const panel = document.getElementById('cards-owned-panel');
    if (!panel) return;
    panel.classList.toggle('open');
  };

  window.setCardOwnership = function(cardId, status) {
    if (status === 'none') {
      delete cardsOwnership[cardId];
    } else {
      cardsOwnership[cardId] = status;
    }
    saveCardsOwnership();
    // Update count display
    const countEl = document.getElementById('cards-owned-count');
    const ownedCount = Object.keys(cardsOwnership).length;
    if (countEl) countEl.textContent = ownedCount > 0 ? ownedCount : '';
    renderResults();
  };

  function renderCardsOwnedPanel() {
    const container = document.getElementById('cards-owned-list');
    if (!container) return;
    container.innerHTML = cardsData.map(card => {
      const ownership = cardsOwnership[card.id] || 'none';
      return `
        <div class="cards-owned-row">
          <span class="cards-owned-name">${card.name}</span>
          <div class="cards-owned-options">
            <label class="cards-owned-radio"><input type="radio" name="own-${card.id}" value="none" ${ownership === 'none' ? 'checked' : ''} onchange="setCardOwnership('${card.id}', 'none')"> Don't have</label>
            <label class="cards-owned-radio"><input type="radio" name="own-${card.id}" value="have" ${ownership === 'have' ? 'checked' : ''} onchange="setCardOwnership('${card.id}', 'have')"> I have it</label>
            <label class="cards-owned-radio"><input type="radio" name="own-${card.id}" value="had" ${ownership === 'had' ? 'checked' : ''} onchange="setCardOwnership('${card.id}', 'had')"> Had it before</label>
          </div>
        </div>
      `;
    }).join('');
  }

  // ===================== ANNUAL/MONTHLY TOGGLE =====================

  window.setSpendingMode = function(mode) {
    spendingMode = mode;
    try { localStorage.setItem('rewards_spendingMode', mode); } catch (e) {}
    // Update toggle UI
    document.querySelectorAll('.spending-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    // Re-render spending inputs with new mode
    initSpendingInputs();
    renderResults();
  };

  // ===================== FILTER: NO ANNUAL FEE =====================

  window.toggleNoAnnualFee = function(checkbox) {
    noAnnualFee = checkbox.checked;
    try { localStorage.setItem('rewards_noAnnualFee', noAnnualFee ? '1' : '0'); } catch (e) {}
    renderResults();
  };

  // ===================== INIT =====================

  function init() {
    loadUSBSelections();
    loadCardsOwnership();
    loadCustomCategories();

    // Load saved filters
    try {
      const savedMode = localStorage.getItem('rewards_spendingMode');
      if (savedMode) spendingMode = savedMode;
      const savedNoAF = localStorage.getItem('rewards_noAnnualFee');
      if (savedNoAF === '1') noAnnualFee = true;
    } catch (e) {}

    // Update UI to reflect loaded state
    const modeNote = document.getElementById('spending-mode-note');
    if (modeNote) {
      modeNote.textContent = spendingMode === 'annual' ? 'Showing annual amounts' : 'Showing monthly amounts';
      modeNote.style.color = spendingMode === 'annual' ? '#d97706' : 'var(--text-secondary)';
    }

    const noAFCheckbox = document.getElementById('no-annual-fee-toggle');
    if (noAFCheckbox) noAFCheckbox.checked = noAnnualFee;

    // Update spending mode buttons
    document.querySelectorAll('.spending-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === spendingMode);
    });

    // Render cards owned panel
    renderCardsOwnedPanel();
    const ownedCount = Object.keys(cardsOwnership).length;
    const countEl = document.getElementById('cards-owned-count');
    if (countEl) countEl.textContent = ownedCount > 0 ? ownedCount : '';

    initSpendingInputs();
    renderResults();

    // Animate numbers on load
    setTimeout(() => {
      document.querySelectorAll('.result-card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.05}s`;
      });
    }, 100);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Event delegation for data-action attributes
  document.addEventListener('click', function(event) {
    const action = event.target.closest('[data-action]')?.getAttribute('data-action');
    if (!action) return;
    
    switch (action) {
      case 'set-filter':
        const filter = event.target.closest('[data-filter]')?.getAttribute('data-filter');
        if (filter) setFilter(filter);
        break;
      case 'set-year-view':
        const yearView = event.target.getAttribute('value');
        if (yearView) setYearView(yearView);
        break;
    }
  });
  
  // Handle crypto toggle change
  document.addEventListener('change', function(event) {
    if (event.target.id === 'crypto-toggle' && event.target.hasAttribute('data-action')) {
      toggleCrypto(event.target);
    }
    if (event.target.id === 'include-annual-credits') {
      includeAnnualCredits = event.target.checked;
      renderCards(currentFilter);
    }
  });
})();
