import { debtPlannerCalculator } from '../engine.js';

export async function handleDebtPlanner(params, request) {
  const debtsParam = params.get('debts');
  const extra = parseFloat(params.get('extra')) || 0;

  if (!debtsParam) {
    return {
      error: 'Missing required parameter: debts (JSON array of debt objects)',
      status: 400,
      docs: 'https://creditstud.io/api/',
      example: '/api/debt-planner?debts=[{"balance":5000,"apr":22.24,"minPayment":125}]&extra=200',
      debtFormat: {
        balance: 'number (required) - current balance',
        apr: 'number (required) - annual percentage rate',
        minPayment: 'number (optional) - minimum monthly payment',
        name: 'string (optional) - label for the debt',
      },
    };
  }

  let debts;
  try {
    debts = JSON.parse(debtsParam);
  } catch (e) {
    return {
      error: 'Invalid JSON in debts parameter',
      status: 400,
      docs: 'https://creditstud.io/api/',
    };
  }

  if (!Array.isArray(debts) || debts.length === 0) {
    return {
      error: 'debts must be a non-empty JSON array',
      status: 400,
      docs: 'https://creditstud.io/api/',
    };
  }

  // Validate each debt
  for (const debt of debts) {
    if (!debt.balance || debt.balance <= 0) {
      return { error: 'Each debt must have a positive balance', status: 400 };
    }
    if (debt.apr === undefined || debt.apr < 0) {
      return { error: 'Each debt must have a non-negative apr', status: 400 };
    }
  }

  return debtPlannerCalculator({ debts, extra });
}