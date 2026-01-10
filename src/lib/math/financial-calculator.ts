/**
 * Financial Calculator Module
 * High-precision financial calculations using decimal.js
 * Used by AI tools via Tool Use pattern for accurate calculations
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// Types
export interface CalculationResult {
  value: number;
  formatted: string;
  precision: number;
}

export type CalculatorOperation = 
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'percentage'
  | 'profit_margin'
  | 'net_profit'
  | 'roi'
  | 'sum'
  | 'average'
  | 'cost_breakdown';

export interface CalculatorInput {
  operation: CalculatorOperation;
  numbers: number[];
  options?: {
    decimalPlaces?: number;
    currency?: string;
  };
}

export interface CostBreakdownInput {
  revenue: number;
  costs: { category: string; amount: number }[];
}

export interface CostBreakdownResult {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  costPercentages: { category: string; amount: number; percentage: number }[];
}

/**
 * Main calculator function - entry point for AI Tool Use
 */
export function calculate(input: CalculatorInput): CalculationResult {
  const { operation, numbers, options = {} } = input;
  const { decimalPlaces = 2, currency = 'USD' } = options;

  let result: Decimal;

  switch (operation) {
    case 'add':
      result = add(numbers);
      break;
    case 'subtract':
      result = subtract(numbers);
      break;
    case 'multiply':
      result = multiply(numbers);
      break;
    case 'divide':
      result = divide(numbers[0], numbers[1]);
      break;
    case 'percentage':
      result = percentage(numbers[0], numbers[1]);
      break;
    case 'profit_margin':
      result = profitMargin(numbers[0], numbers[1]); // profit, revenue
      break;
    case 'net_profit':
      result = netProfit(numbers[0], numbers[1]); // revenue, costs
      break;
    case 'roi':
      result = roi(numbers[0], numbers[1], numbers[2]); // gain, cost, investment
      break;
    case 'sum':
      result = sum(numbers);
      break;
    case 'average':
      result = average(numbers);
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  const value = result.toDecimalPlaces(decimalPlaces).toNumber();
  
  return {
    value,
    formatted: formatCurrency(value, currency, decimalPlaces),
    precision: decimalPlaces,
  };
}

/**
 * Calculate cost breakdown with percentages
 */
export function calculateCostBreakdown(input: CostBreakdownInput): CostBreakdownResult {
  const revenue = new Decimal(input.revenue);
  const costs = input.costs.map(c => ({
    category: c.category,
    amount: new Decimal(c.amount),
  }));

  const totalCosts = costs.reduce((sum, c) => sum.plus(c.amount), new Decimal(0));
  const profit = revenue.minus(totalCosts);
  const margin = revenue.isZero() 
    ? new Decimal(0) 
    : profit.dividedBy(revenue).times(100);

  const costPercentages = costs.map(c => ({
    category: c.category,
    amount: c.amount.toDecimalPlaces(2).toNumber(),
    percentage: revenue.isZero() 
      ? 0 
      : c.amount.dividedBy(revenue).times(100).toDecimalPlaces(2).toNumber(),
  }));

  return {
    totalRevenue: revenue.toDecimalPlaces(2).toNumber(),
    totalCosts: totalCosts.toDecimalPlaces(2).toNumber(),
    netProfit: profit.toDecimalPlaces(2).toNumber(),
    profitMargin: margin.toDecimalPlaces(2).toNumber(),
    costPercentages,
  };
}

// Basic operations
function add(numbers: number[]): Decimal {
  return numbers.reduce((sum, n) => sum.plus(new Decimal(n)), new Decimal(0));
}

function subtract(numbers: number[]): Decimal {
  if (numbers.length === 0) return new Decimal(0);
  return numbers.slice(1).reduce(
    (result, n) => result.minus(new Decimal(n)), 
    new Decimal(numbers[0])
  );
}

function multiply(numbers: number[]): Decimal {
  return numbers.reduce((product, n) => product.times(new Decimal(n)), new Decimal(1));
}

function divide(a: number, b: number): Decimal {
  const divisor = new Decimal(b);
  if (divisor.isZero()) {
    throw new Error('Division by zero');
  }
  return new Decimal(a).dividedBy(divisor);
}

function percentage(value: number, total: number): Decimal {
  const t = new Decimal(total);
  if (t.isZero()) return new Decimal(0);
  return new Decimal(value).dividedBy(t).times(100);
}

function sum(numbers: number[]): Decimal {
  return add(numbers);
}

function average(numbers: number[]): Decimal {
  if (numbers.length === 0) return new Decimal(0);
  return add(numbers).dividedBy(numbers.length);
}

// Financial calculations
function profitMargin(profit: number, revenue: number): Decimal {
  const r = new Decimal(revenue);
  if (r.isZero()) return new Decimal(0);
  return new Decimal(profit).dividedBy(r).times(100);
}

function netProfit(revenue: number, costs: number): Decimal {
  return new Decimal(revenue).minus(new Decimal(costs));
}

function roi(gain: number, cost: number, investment: number): Decimal {
  const inv = new Decimal(investment);
  if (inv.isZero()) return new Decimal(0);
  return new Decimal(gain).minus(new Decimal(cost)).dividedBy(inv).times(100);
}

// Formatting
function formatCurrency(value: number, currency: string, decimals: number): string {
  // Use appropriate locale based on currency
  const currencyLocales: Record<string, string> = {
    SAR: 'ar-SA',
    AED: 'ar-AE',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
  };
  const locale = currencyLocales[currency] || 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Batch calculate multiple operations
 */
export function batchCalculate(inputs: CalculatorInput[]): CalculationResult[] {
  return inputs.map(input => calculate(input));
}

/**
 * Calculate order profit analysis
 */
export function calculateOrderProfit(
  revenue: number,
  costs: Record<string, number>
): { totalCosts: number; netProfit: number; isProfitable: boolean; profitMargin: number } {
  const rev = new Decimal(revenue);
  const totalCosts = Object.values(costs).reduce(
    (sum, c) => sum.plus(new Decimal(c)), 
    new Decimal(0)
  );
  const profit = rev.minus(totalCosts);
  const margin = rev.isZero() ? new Decimal(0) : profit.dividedBy(rev).times(100);

  return {
    totalCosts: totalCosts.toDecimalPlaces(2).toNumber(),
    netProfit: profit.toDecimalPlaces(2).toNumber(),
    isProfitable: profit.greaterThan(0),
    profitMargin: margin.toDecimalPlaces(2).toNumber(),
  };
}

/**
 * Aggregate multiple orders
 */
export function aggregateOrders(
  orders: { revenue: number; costs: number }[]
): { totalRevenue: number; totalCosts: number; netProfit: number; profitMargin: number } {
  const totals = orders.reduce(
    (acc, order) => ({
      revenue: acc.revenue.plus(new Decimal(order.revenue)),
      costs: acc.costs.plus(new Decimal(order.costs)),
    }),
    { revenue: new Decimal(0), costs: new Decimal(0) }
  );

  const profit = totals.revenue.minus(totals.costs);
  const margin = totals.revenue.isZero() 
    ? new Decimal(0) 
    : profit.dividedBy(totals.revenue).times(100);

  return {
    totalRevenue: totals.revenue.toDecimalPlaces(2).toNumber(),
    totalCosts: totals.costs.toDecimalPlaces(2).toNumber(),
    netProfit: profit.toDecimalPlaces(2).toNumber(),
    profitMargin: margin.toDecimalPlaces(2).toNumber(),
  };
}
