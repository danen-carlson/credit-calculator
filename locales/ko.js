// locales/ko.js — Korean locale
// CreditStud.io i18n Phase 2: Korean Translation

window.LOCALE = window.LOCALE || {};
window.LOCALE.ko = {
// ── Navigation ──
  "nav.home": "홈",
  "nav.calculators": "계산기",
  "nav.cardComparison": "신용카드 비교",
  "nav.debtPayoff": "부채 상환",
  "nav.cardFinder": "신용카드 찾기",
  "nav.learn": "학습",
  "nav.blog": "블로그",
  "nav.compareCreditCardsBNPL": "신용카드와 BNPL 비교",
  "nav.rewardsCalculator": "캐시백 계산기",
  "nav.cardReviews": "신용카드 리뷰",
  "nav.debtPayoffPlanner": "부채 상환 플래너",
  "nav.minimumPayment": "최소결제 계산기",
  "nav.loanVsBalanceTransfer": "대출 대 잔액이체",
  "nav.annualFeeCalculator": "연회비 계산기",
  "nav.creditScoreSimulator": "신용점수 시뮬레이터",
  "nav.subtitle": "신용카드, BNPL 및 상환 계획 비교",

  // ── Disclosure / Footer ──
  "footer.disclaimer": "CreditStud.io는 참고용으로만 제공됩니다. 실제 이자율, 조건 및 자격은 다를 수 있습니다.",
  "footer.affiliateDisclosure": "제휴사 공지",
  "disclosure.banner": "CreditStud.io는 제휴 링크를 통한 카드 신청 시 수수료를 받을 수 있습니다. 이는 저희의 순위나 추천에 영향을 미치지 않습니다.",
  "disclosure.learnMore": "더 알아보기",

  // ── Calculator Results ──
  "results.bestChoice": "최고의 선택",
  "results.secondBest": "두 번째 선택",
  "results.thirdPlace": "3위",
  "results.fourthPlace": "4위",
  "results.fifthPlace": "5위",
  "results.sixthPlace": "6위",
  "results.seventhPlace": "7위",
  "results.eighthPlace": "8위",
  "results.ninthPlace": "9위",
  "results.tenthPlace": "10위",
  "results.bestMatch": "최적의 선택",
  "results.bestMatchAlsoBelow": "⭐ 최적의 선택 — 동시 1위",
  "results.newCardOffer": "🎁 새 카드 오퍼",
  "results.monthlyPayment": "월 결제액",
  "results.interest": "이자",
  "results.interestFees": "이자 / 수수료",
  "results.term": "기간",
  "results.rewards": "캐시백",
  "results.schedule": "상환 계획",
  "results.netCost": "순비용",
  "results.netCostTooltip": "순비용 = 구매액 + 이자 + 수수료 - 획득한 캐시백. 낮을수록 좋습니다.",
  "results.inclRewards": "{amount} 캐시백 포함",
  "results.saveVsExisting": "기존 카드 대비 {amount} 절약",
  "results.lowestTotalCost": "최저 총비용",
  "results.interestRate": "이자율: ",
  "results.noMatchingOptions": "이 금액에 맞는 옵션을 찾을 수 없습니다. 선택을 조정해 주십시오.",
  "results.worstCaseWarning": "⚠️ <strong>최악의 상황:</strong> 이 결과에는 연체료와 한 번의 미납으로 인해 발생할 수 있는 소급 이자가 포함되어 있습니다.",
  "results.deferredInterestWarning": "⚠️ <strong>경고:</strong> 결제를 놓치면 이연 이자로 인해 비용이 훨씬 더 비쌉니다.",

  // ── Buttons ──
  "btn.applyNow": "지금 신청하기",
  "btn.signUp": "가입하기",
  "btn.learnMore": "더 알아보기",
  "btn.calculate": "계산하기",
  "btn.change": "변경하기",

  // ── Alerts / Validation ──
  "alerts.enterPurchaseAmount": "구매 금액을 입력해 주십시오.",
  "alerts.selectPaymentMethod": "비교할 결제 방법을 하나 이상 선택해 주십시오.",
  "alerts.enterCardName": "카드 또는 서비스 이름을 입력해 주십시오.",
  "alerts.enterMonthlyPayment": "월 결제 금액을 입력해 주십시오.",
  "alerts.somethingWrong": "문제가 발생했습니다: {message}",
  "alerts.paymentTooLow": "결제액이 너무 낮습니다",

  // ── Credit Score Tiers ──
  "credit.excellent": "아주 우수",
  "credit.veryGood": "우수",
  "credit.good": "양호",
  "credit.fair": "보통",
  "credit.poor": "나쁨",

  // ── Scenario Toggle ──
  "scenario.label": "상환 시나리오",
  "scenario.normalPayoff": "정상 상환",
  "scenario.worstCase": "최악의 상황 (1회 미납)",

  // ── Calculator Labels ──
  "calc.selectMethods": "기본값 사용",
  "calc.selectedCount": "({count}개 선택됨)",
  "calc.calculating": "계산 중...",
  "calc.estimatedPayment": "예상 월 결제액 (신용점수 {score} · ~{apr}% APR)",
  "calc.perMonth": "월 {amount}, 약 {months}개월",
  "calc.perMonthShort": "월 {amount}",
  "calc.total": "총 {amount}",
  "calc.taxAdded": "(+{amount} 세금)",
  "calc.monthsSingular": "1개월",
  "calc.monthsPlural": "{count}개월",

  // ── Late Fee Policy ──
  "lateFee.policy": "연체 수수료 정책:",
  "lateFee.perMissedPayment": "미납 1회당 ${amount}",
  "lateFee.noLateFees": "연체료 없음",
  "lateFee.gracePeriod": "({days}일 유예 기간)",
  "lateFee.retroactiveInterest": " ⚠️ {apr}% APR의 소급 이자가 적용될 수 있습니다.",

  // ── Language Switcher ──
  "lang.selectLanguage": "언어 선택",
  "lang.english": "English",
  "lang.spanish": "Español",
  "lang.chinese": "简体中文",
  "lang.tagalog": "Tagalog",
  "lang.korean": "한국어",
  "lang.hindi": "हिन्दी"
};
