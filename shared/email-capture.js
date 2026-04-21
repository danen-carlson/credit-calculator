// Email Capture Module — CreditStud.io
// Shows a slide-up signup after calculator results. Dismissable for 7 days.
// Admin mode: ?admin=emails

(function() {
  'use strict';

  const STORAGE_KEY = 'cs_email_signups';
  const DISMISS_KEY = 'cs_email_capture_dismissed';

  function EmailCapture(calculatorType) {
    if (!['rewards', 'debt', 'bnpl'].includes(calculatorType)) {
      calculatorType = 'general';
    }
    this.calculatorType = calculatorType;
  }

  EmailCapture.prototype.isDismissed = function() {
    try {
      var dismissUntil = localStorage.getItem(DISMISS_KEY);
      if (!dismissUntil) return false;
      var dismissDate = new Date(dismissUntil);
      if (dismissDate < new Date()) {
        localStorage.removeItem(DISMISS_KEY);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  EmailCapture.prototype.dismiss = function() {
    try {
      var d = new Date();
      d.setDate(d.getDate() + 7);
      localStorage.setItem(DISMISS_KEY, d.toISOString());
    } catch (e) { /* non-critical */ }
  };

  EmailCapture.prototype.saveSignup = function(email) {
    try {
      var signups = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      signups.push({
        email: email,
        calculator: this.calculatorType,
        timestamp: new Date().toISOString(),
        id: Date.now()
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(signups));
    } catch (e) {
      console.error('Error saving email signup:', e);
    }
  };

  EmailCapture.prototype.showIfEligible = function() {
    if (this.isDismissed()) return;
    this.show();
  };

  EmailCapture.prototype.show = function() {
    var self = this;
    // Remove existing overlay if any
    var existing = document.getElementById('email-capture-overlay');
    if (existing) existing.remove();

    var typeLabels = { rewards: 'credit card offers', debt: 'debt payoff strategies', bnpl: 'BNPL options', general: 'financial tools' };
    var label = typeLabels[this.calculatorType] || 'financial tools';

    var overlay = document.createElement('div');
    overlay.id = 'email-capture-overlay';
    overlay.className = 'email-capture-overlay';
    overlay.innerHTML =
      '<div class="email-capture-modal">' +
        '<button class="email-capture-close" aria-label="Close">&times;</button>' +
        '<h3 class="email-capture-title">Get Alerts for Better Deals</h3>' +
        '<p class="email-capture-text">Be the first to know when 0% APR offers end or new signup bonuses drop for ' + label + '.</p>' +
        '<div class="email-capture-form">' +
          '<input type="email" class="email-capture-input" placeholder="you@email.com" autocomplete="email" />' +
          '<button class="email-capture-submit">Notify Me</button>' +
        '</div>' +
        '<p class="email-capture-privacy">We never sell your email. Unsubscribe anytime.</p>' +
      '</div>';

    document.body.appendChild(overlay);

    // Animate in
    setTimeout(function() { overlay.classList.add('visible'); }, 50);

    // Close button
    overlay.querySelector('.email-capture-close').addEventListener('click', function() {
      self.hide(overlay);
      self.dismiss();
    });

    // Click outside modal
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        self.hide(overlay);
        self.dismiss();
      }
    });

    // Escape key
    function handleEsc(e) {
      if (e.key === 'Escape') {
        self.hide(overlay);
        self.dismiss();
        document.removeEventListener('keydown', handleEsc);
      }
    }
    document.addEventListener('keydown', handleEsc);

    // Submit
    var submitBtn = overlay.querySelector('.email-capture-submit');
    var emailInput = overlay.querySelector('.email-capture-input');

    submitBtn.addEventListener('click', function() {
      var email = emailInput.value.trim();
      if (!email || !email.includes('@')) {
        emailInput.classList.add('email-capture-error');
        emailInput.placeholder = 'Please enter a valid email';
        return;
      }
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;
      self.saveSignup(email);
      submitBtn.textContent = '✓ Saved!';
      setTimeout(function() {
        self.hide(overlay);
        self.dismiss();
      }, 1500);
    });

    // Enter key submits
    emailInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') submitBtn.click();
    });
  };

  EmailCapture.prototype.hide = function(overlay) {
    if (!overlay) overlay = document.getElementById('email-capture-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(function() { overlay.remove(); }, 300);
    }
  };

  // Admin mode: ?admin=emails
  function showAdminPanel() {
    var panel = document.createElement('div');
    panel.id = 'email-capture-admin';
    panel.style.cssText = 'position:fixed;top:20px;right:20px;background:#fff;border:2px solid #2563eb;border-radius:8px;padding:20px;z-index:99998;max-width:500px;max-height:80vh;overflow:auto;box-shadow:0 4px 20px rgba(0,0,0,.15);';

    try {
      var signups = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      var rows = signups.map(function(s) {
        return '<tr><td>' + s.email + '</td><td>' + s.calculator + '</td><td>' + s.timestamp + '</td></tr>';
      }).join('');

      var csvContent = 'ID,Email,Calculator,Timestamp\n' +
        signups.map(function(s) { return s.id + ',' + s.email + ',' + s.calculator + ',' + s.timestamp; }).join('\n');

      panel.innerHTML =
        '<h3 style="margin-top:0;color:#2563eb">Email Signups (' + signups.length + ')</h3>' +
        '<table style="width:100%;border-collapse:collapse;font-size:0.85rem">' +
          '<thead><tr><th>Email</th><th>Source</th><th>Date</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '<div style="margin-top:12px">' +
          '<button id="email-capture-csv" style="background:#2563eb;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600">Export CSV</button>' +
          '<button id="email-capture-close-admin" style="background:#6b7280;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-left:8px;font-weight:600">Close</button>' +
        '</div>';

      document.body.appendChild(panel);

      document.getElementById('email-capture-csv').addEventListener('click', function() {
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'creditstudio-email-signups.csv';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      document.getElementById('email-capture-close-admin').addEventListener('click', function() {
        panel.remove();
      });
    } catch (e) {
      panel.innerHTML = '<p>Error loading signups: ' + e.message + '</p>';
      document.body.appendChild(panel);
    }
  }

  // Auto-init admin panel if ?admin=emails
  if (window.location.search.includes('admin=emails')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showAdminPanel);
    } else {
      showAdminPanel();
    }
  }

  // Expose globally
  window.EmailCapture = EmailCapture;
})();