// Credit Score Simulator — CreditStud.io
(function () {
  'use strict';

  // DOM elements
  const scoreSlider = document.getElementById('currentScore');
  const utilSlider = document.getElementById('utilization');
  const limitInput = document.getElementById('totalLimit');
  const accountsSlider = document.getElementById('numAccounts');
  const inquiriesSlider = document.getElementById('hardInquiries');
  const ageSlider = document.getElementById('avgAge');
  const latePaymentsToggle = document.getElementById('latePayments');

  const scoreVal = document.getElementById('currentScoreVal');
  const utilVal = document.getElementById('utilizationVal');
  const accountsVal = document.getElementById('numAccountsVal');
  const inquiriesVal = document.getElementById('hardInquiriesVal');
  const ageVal = document.getElementById('avgAgeVal');
  const balanceHint = document.getElementById('totalBalanceHint');
  const lateStatus = document.getElementById('latePaymentsStatus');

  const gaugeCanvas = document.getElementById('scoreGauge');
  const gaugeScoreEl = document.getElementById('gaugeScore');
  const gaugeBracketEl = document.getElementById('gaugeBracket');
  const unlockGrid = document.getElementById('unlockGrid');

  // Score brackets
  const BRACKETS = [
    { min: 300, max: 579, label: 'Poor', color: '#dc2626' },
    { min: 580, max: 669, label: 'Fair', color: '#d97706' },
    { min: 670, max: 739, label: 'Good', color: '#2563eb' },
    { min: 740, max: 799, label: 'Very Good', color: '#059669' },
    { min: 800, max: 850, label: 'Excellent', color: '#047857' }
  ];

  // Unlock tiers
  const UNLOCK_TIERS = [
    { minScore: 300, icon: '📝', name: 'Secured Cards', desc: 'Start building credit', link: '/rewards/?filter=secured' },
    { minScore: 580, icon: '💳', name: 'Basic Cards', desc: 'Standard credit cards', link: '/rewards/?min-score=fair' },
    { minScore: 670, icon: '🏆', name: 'Rewards Cards', desc: 'Cashback and points', link: '/rewards/?min-score=good' },
    { minScore: 740, icon: '✈️', name: 'Premium Cards', desc: 'Travel and lounge perks', link: '/rewards/?filter=premium' },
    { minScore: 740, icon: '🏠', name: 'Better Mortgage Rates', desc: 'Save thousands on a home' },
    { minScore: 760, icon: '🚗', name: 'Best Auto Loan Rates', desc: '0% APR financing deals' },
    { minScore: 800, icon: '💎', name: 'Top-Tier Cards', desc: 'The best offers available', link: '/rewards/?filter=premium' }
  ];

  function getBracket(score) {
    for (const b of BRACKETS) {
      if (score >= b.min && score <= b.max) return b;
    }
    return BRACKETS[0];
  }

  // Calculate estimated deltas for scenarios
  function calculateDeltas() {
    const score = parseInt(scoreSlider.value);
    const util = parseInt(utilSlider.value);
    const inquiries = parseInt(inquiriesSlider.value);
    const age = parseFloat(ageSlider.value);
    const accounts = parseInt(accountsSlider.value);
    const hasLatePayments = latePaymentsToggle.checked;

    // Scenario deltas based on FICO weights (approximations)
    const deltas = {};

    // Pay off all debt (util → 0%)
    if (util > 0) {
      const currentUtilImpact = utilImpact(util);
      const newUtilImpact = utilImpact(0);
      deltas.payoff = newUtilImpact - currentUtilImpact;
    } else {
      deltas.payoff = 0;
    }

    // Lower util to <10%
    if (util > 10) {
      const currentImpact = utilImpact(util);
      const newImpact = utilImpact(8); // 8% as representative <10%
      deltas.util10 = newImpact - currentImpact;
    } else {
      deltas.util10 = 0;
    }

    // Lower util to <30%
    if (util > 30) {
      const currentImpact = utilImpact(util);
      const newImpact = utilImpact(25); // 25% as representative <30%
      deltas.util30 = newImpact - currentImpact;
    } else {
      deltas.util30 = 0;
    }

    // Open new card: inquiry hit (-5 to -10) + lower avg age + util improvement
    const inquiryHit = -8;
    const ageHit = -(2 / (accounts + 1)) * 3; // small hit from reducing avg age
    const newLimit = parseInt(limitInput.value) * 0.15; // assume new card adds ~15% to limit
    const newUtil = (parseInt(limitInput.value) * util / 100) / (parseInt(limitInput.value) + newLimit) * 100;
    let utilBenefit = 0;
    if (util > 30) {
      utilBenefit = (utilImpact(newUtil) - utilImpact(util)) * 0.5; // partial benefit, takes time to show
    }
    deltas.newcard = Math.round(inquiryHit + ageHit + utilBenefit);

    // Wait 6 months: inquiries age, payment history strengthens
    const inquiryAging6 = Math.min(inquiries * 2, 8); // inquiries lose impact over time
    const ageBenefit6 = 3;
    deltas.wait6 = Math.min(inquiryAging6 + ageBenefit6, 15);

    // Wait 12 months
    const inquiryAging12 = Math.min(inquiries * 3, 12);
    const ageBenefit12 = 6;
    deltas.wait12 = Math.min(inquiryAging12 + ageBenefit12, 25);

    // Late payment
    if (!hasLatePayments) {
      // Bigger impact for higher scores
      const base = score > 760 ? -110 : score > 720 ? -90 : score > 680 ? -75 : score > 640 ? -60 : -45;
      deltas.latepayment = base;
    } else {
      deltas.latepayment = -20; // additional late payment
    }

    // Close oldest card: hit to avg age + util increase if it had a limit
    const agePenalty = Math.min(Math.round(age * 2), 25); // lose the oldest account
    const utilPenalty = util > 0 ? Math.round(util / 5) : 5; // losing that limit hurts utilization
    deltas.closeOldest = -(agePenalty + utilPenalty);

    // Max out a card (90%+ utilization)
    if (util < 90) {
      const currentImpact = utilImpact(util);
      const maxImpact = utilImpact(92);
      deltas.maxout = maxImpact - currentImpact;
    } else {
      deltas.maxout = 0;
    }

    return deltas;
  }

  // Approximate utilization impact on score (centered around 0 change at ~25-30%)
  function utilImpact(pct) {
    if (pct <= 9) return 45; // best
    if (pct <= 29) return 20; // good
    if (pct <= 49) return -5; // fair
    if (pct <= 69) return -20; // hurting
    if (pct <= 89) return -35; // bad
    return -50; // maxed
  }

  // Calculate final projected score
  function calculateScore() {
    const baseScore = parseInt(scoreSlider.value);
    const deltas = calculateDeltas();

    let totalDelta = 0;
    for (const key in deltas) {
      const checkbox = document.getElementById('scenario-' + key);
      if (checkbox && checkbox.checked) {
        totalDelta += deltas[key];
      }
      // Display deltas
      const deltaEl = document.getElementById('delta-' + key);
      if (deltaEl) {
        const val = deltas[key];
        if (val > 0) {
          deltaEl.textContent = '+' + val;
          deltaEl.style.color = 'var(--success)';
        } else if (val < 0) {
          deltaEl.textContent = '' + val;
          deltaEl.style.color = 'var(--danger)';
        } else {
          deltaEl.textContent = '—';
          deltaEl.style.color = 'var(--text-muted)';
        }
      }
    }

    let projectedScore = Math.max(300, Math.min(850, baseScore + totalDelta));
    return projectedScore;
  }

  // Draw gauge
  function drawGauge(score) {
    const canvas = gaugeCanvas;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H - 20;
    const radius = Math.min(cx, cy) - 10;

    ctx.clearRect(0, 0, W, H);

    // Draw arc background segments
    const segments = [
      { start: -Math.PI, end: -Math.PI + Math.PI * 0.28, color: '#dc2626' }, // Poor 300-579
      { start: -Math.PI + Math.PI * 0.28, end: -Math.PI + Math.PI * 0.55, color: '#d97706' }, // Fair 580-669
      { start: -Math.PI + Math.PI * 0.55, end: -Math.PI + Math.PI * 0.74, color: '#2563eb' }, // Good 670-739
      { start: -Math.PI + Math.PI * 0.74, end: -Math.PI + Math.PI * 0.87, color: '#059669' }, // Very Good 740-799
      { start: -Math.PI + Math.PI * 0.87, end: 0, color: '#047857' } // Excellent 800-850
    ];

    segments.forEach(seg => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, seg.start, seg.end);
      ctx.lineWidth = 20;
      ctx.strokeStyle = seg.color + '33'; // transparent background
      ctx.lineCap = 'round';
      ctx.stroke();
    });

    // Draw active arc up to score
    const scorePct = (score - 300) / 550;
    const scoreAngle = -Math.PI + Math.PI * scorePct;
    const bracket = getBracket(score);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI, scoreAngle);
    ctx.lineWidth = 20;
    ctx.strokeStyle = bracket.color;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw endpoint dot
    const dotX = cx + radius * Math.cos(scoreAngle);
    const dotY = cy + radius * Math.sin(scoreAngle);
    ctx.beginPath();
    ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
    ctx.fillStyle = bracket.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels: 300 and 850
    ctx.fillStyle = 'var(--text-muted, #9ca3af)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('300', cx - radius - 5, cy + 16);
    ctx.textAlign = 'right';
    ctx.fillText('850', cx + radius + 5, cy + 16);

    // Update text elements
    gaugeScoreEl.textContent = score;
    gaugeScoreEl.style.color = bracket.color;
    gaugeBracketEl.textContent = bracket.label;
    gaugeBracketEl.style.color = bracket.color;
  }

  // Update unlock panel
  function updateUnlocks(score) {
    unlockGrid.innerHTML = '';
    UNLOCK_TIERS.forEach(tier => {
      const card = document.createElement('a');
      card.className = 'unlock-card ' + (score >= tier.minScore ? 'unlocked' : 'locked');
      card.href = tier.link || '#';
      card.innerHTML = `
        <div class="unlock-icon">${tier.icon}</div>
        <div class="unlock-name">${tier.name}</div>
        <div class="unlock-desc">${score >= tier.minScore ? tier.desc : 'Needs ' + tier.minScore + '+'}</div>
      `;
      if (!tier.link) card.removeAttribute('href');
      unlockGrid.appendChild(card);
    });

    // Update CTA link
    const bracket = getBracket(score);
    const ctaLink = document.getElementById('ctaCards');
    if (ctaLink) {
      ctaLink.href = '/rewards/?min-score=' + encodeURIComponent(bracket.label.toLowerCase().replace(' ', '-'));
    }
  }

  // Update slider displays
  function updateDisplays() {
    scoreVal.textContent = scoreSlider.value;
    utilVal.textContent = utilSlider.value + '%';
    accountsVal.textContent = accountsSlider.value;
    inquiriesVal.textContent = inquiriesSlider.value;
    ageVal.textContent = ageSlider.value + ' yr';

    const util = parseInt(utilSlider.value);
    const limit = parseInt(limitInput.value) || 20000;
    const balance = Math.round(limit * util / 100);
    balanceHint.textContent = '≈ $' + balance.toLocaleString() + ' balance';

    if (latePaymentsToggle.checked) {
      lateStatus.textContent = 'Has late payments ✗';
      lateStatus.style.color = 'var(--danger)';
    } else {
      lateStatus.textContent = 'No late payments ✓';
      lateStatus.style.color = 'var(--success)';
    }
  }

  // Main update
  function update() {
    updateDisplays();
    const score = calculateScore();
    drawGauge(score);
    updateUnlocks(score);
  }

  // Event listeners
  const allInputs = [scoreSlider, utilSlider, limitInput, accountsSlider, inquiriesSlider, ageSlider, latePaymentsToggle];
  allInputs.forEach(el => el.addEventListener('input', update));

  // Scenario checkboxes
  document.querySelectorAll('.scenario-card input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', update);
  });

  // Share config
  if (typeof ShareButtons !== 'undefined') {
    new ShareButtons({
      container: document.getElementById('shareBar'),
      url: window.location.href,
      title: 'Credit Score Simulator — CreditStud.io',
      description: 'See how financial actions affect your credit score!',
      inputs: [
        { id: 'currentScore', type: 'range', param: 'score' },
        { id: 'utilization', type: 'range', param: 'util' }
      ]
    });
  }

  // Cross-tool params
  const params = new URLSearchParams(window.location.search);
  if (params.has('score')) scoreSlider.value = params.get('score');
  if (params.has('util')) utilSlider.value = params.get('util');

  // Initial render
  update();
})();