// locales/en.js — English locale (source of truth)
// CreditStud.io i18n Phase 0: Foundation
// These strings match the hardcoded English in the UI.
// When window.__lang === 'en' or undefined, the site works as before.

window.LOCALE = window.LOCALE || {};
window.LOCALE.en = {
  // ── Navigation ──
  "nav.home": "Home",
  "nav.calculators": "Calculators",
  "nav.cardComparison": "Card Comparison",
  "nav.debtPayoff": "Debt & Payoff",
  "nav.cardFinder": "Card Finder",
  "nav.learn": "Learn",
  "nav.blog": "Blog",
  "nav.compareCreditCardsBNPL": "Compare Credit Cards & BNPL",
  "nav.rewardsCalculator": "Rewards Calculator",
  "nav.cardReviews": "Card Reviews",
  "nav.debtPayoffPlanner": "Debt Payoff Planner",
  "nav.minimumPayment": "Minimum Payment Calculator",
  "nav.loanVsBalanceTransfer": "Loan vs Balance Transfer",
  "nav.annualFeeCalculator": "Annual Fee Calculator",
  "nav.creditScoreSimulator": "Credit Score Simulator",
  "nav.subtitle": "Compare credit cards, BNPL, and payment plans side by side",

  // ── Disclosure / Footer ──
  "footer.disclaimer": "CreditStud.io is for informational purposes only. Actual rates, terms, and eligibility may vary.",
  "footer.affiliateDisclosure": "Affiliate Disclosure",
  "disclosure.banner": "CreditStud.io may earn commissions from credit card applications through affiliate links. This does not affect our rankings or recommendations.",
  "disclosure.learnMore": "Learn more",

  // ── Calculator Results ──
  "results.bestChoice": "Best Choice",
  "results.secondBest": "2nd Best",
  "results.thirdPlace": "3rd",
  "results.fourthPlace": "4th",
  "results.fifthPlace": "5th",
  "results.sixthPlace": "6th",
  "results.seventhPlace": "7th",
  "results.eighthPlace": "8th",
  "results.ninthPlace": "9th",
  "results.tenthPlace": "10th",
  "results.bestMatch": "Best Match",
  "results.bestMatchAlsoBelow": "⭐ Best Match — also #1 below",
  "results.newCardOffer": "🎁 New Card Offer",
  "results.monthlyPayment": "Monthly Payment",
  "results.interest": "Interest",
  "results.interestFees": "Interest / Fees",
  "results.term": "Term",
  "results.rewards": "Rewards",
  "results.schedule": "Schedule",
  "results.netCost": "Net Cost",
  "results.netCostTooltip": "Net Cost = purchase + interest + fees − rewards earned. Lower is better.",
  "results.inclRewards": "Incl. {amount} rewards",
  "results.saveVsExisting": "Save {amount} vs existing card",
  "results.lowestTotalCost": "Lowest total cost",
  "results.interestRate": "Interest rate:",
  "results.noMatchingOptions": "No matching options found for this amount. Try adjusting your selections.",
  "results.worstCaseWarning": "⚠️ <strong>Worst Case Scenario:</strong> These results include late fees and potential retroactive interest for one missed payment.",
  "results.deferredInterestWarning": "⚠️ <strong>Warning:</strong> This option becomes dramatically more expensive if you miss a payment due to deferred interest.",

  // ── Buttons ──
  "btn.applyNow": "Apply Now",
  "btn.signUp": "Sign Up",
  "btn.learnMore": "Learn More",
  "btn.calculate": "Calculate",
  "btn.change": "Change",

  // ── Alerts / Validation ──
  "alerts.enterPurchaseAmount": "Please enter a purchase amount.",
  "alerts.selectPaymentMethod": "Please select at least one payment method to compare.",
  "alerts.enterCardName": "Please enter a name for your card or service.",
  "alerts.enterMonthlyPayment": "Please enter a monthly payment amount.",
  "alerts.somethingWrong": "Something went wrong: {message}",
  "alerts.paymentTooLow": "Payment too low",

  // ── Credit Score Tiers ──
  "credit.excellent": "Excellent",
  "credit.veryGood": "Very Good",
  "credit.good": "Good",
  "credit.fair": "Fair",
  "credit.poor": "Poor",

  // ── Scenario Toggle ──
  "scenario.label": "Payment Scenario",
  "scenario.normalPayoff": "Normal payoff",
  "scenario.worstCase": "Worst case (1 missed payment)",

  // ── Calculator Labels ──
  "calc.selectMethods": "Using defaults",
  "calc.selectedCount": "({count} selected)",
  "calc.calculating": "Calculating...",
  "calc.estimatedPayment": "Estimated Monthly Payment ({score} credit · ~{apr}% APR)",
  "calc.perMonth": "{amount}/mo for ~{months} months",
  "calc.perMonthShort": "{amount}/mo",
  "calc.total": "{amount} total",
  "calc.taxAdded": "(+{amount} tax)",
  "calc.monthsSingular": "1 month",
  "calc.monthsPlural": "{count} months",

  // ── Late Fee Policy ──
  "lateFee.policy": "Late Fee Policy:",
  "lateFee.perMissedPayment": "${amount} per missed payment",
  "lateFee.noLateFees": "No late fees",
  "lateFee.gracePeriod": "({days} day grace period)",
  "lateFee.retroactiveInterest": ". ⚠️ Retroactive interest of {apr}% APR may apply.",

  // ── Language Switcher ──
  "lang.selectLanguage": "Select language",
  "lang.english": "English",
  "lang.spanish": "Español",
  "lang.chinese": "简体中文",
  "lang.tagalog": "Tagalog",
  "lang.korean": "한국어",
  "lang.hindi": "हिन्दी"
};