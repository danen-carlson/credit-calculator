// Quick smoke test for the API engine
import { compareCalculator, minPaymentCalculator, debtPlannerCalculator } from '../src/engine.js';

// Test 1: Compare calculator
console.log('=== Test: Compare Calculator ===');
const compareResult = compareCalculator({
  amount: 2000,
  months: 12,
  score: 720,
  category: 'restaurants',
});
console.log(`Results count: ${compareResult.results.length}`);
console.log(`Input: amount=${compareResult.input.amount}, months=${compareResult.input.months}, score=${compareResult.input.creditScore}`);
if (compareResult.results.length > 0) {
  console.log(`Top result: ${compareResult.results[0].name} — netCost: $${compareResult.results[0].netCost}`);
  console.log(`Deep link: ${compareResult.results[0].deepLink}`);
}
console.log('PASSED ✅\n');

// Test 2: Min Payment Calculator
console.log('=== Test: Min Payment Calculator ===');
const minPayResult = minPaymentCalculator({
  balance: 5000,
  apr: 22.24,
  minPct: 2,
});
console.log(`Total paid: $${minPayResult.results.totalPaid}`);
console.log(`Total interest: $${minPayResult.results.totalInterest}`);
console.log(`Months to payoff: ${minPayResult.results.monthsToPayoff}`);
console.log('PASSED ✅\n');

// Test 3: Debt Planner
console.log('=== Test: Debt Planner ===');
const debtResult = debtPlannerCalculator({
  debts: [
    { balance: 5000, apr: 22.24, name: 'Card 1' },
    { balance: 2000, apr: 18.99, name: 'Card 2' },
  ],
  extra: 200,
});
console.log(`Snowball: ${debtResult.results.snowball.monthsFree} months, $${debtResult.results.snowball.totalInterest} interest`);
console.log(`Avalanche: ${debtResult.results.avalanche.monthsFree} months, $${debtResult.results.avalanche.totalInterest} interest`);
console.log(`Savings vs minimum: $${debtResult.results.savingsVsMinimum}`);
console.log('PASSED ✅\n');

console.log('All tests passed! 🎉');