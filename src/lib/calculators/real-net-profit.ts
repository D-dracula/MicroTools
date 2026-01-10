/**
 * Real Net Profit Calculator
 * 
 * Calculates true profit after all expenses including ad spend, shipping, and returns.
 * Requirements: 1.3, 1.5, 1.6, 1.7
 */

export interface RealNetProfitInput {
  revenue: number;
  productCost: number;
  adSpend: number;
  shippingCost: number;
  returnRate: number; // percentage (0-100)
  otherCosts?: number;
}

export interface CostComponent {
  amount: number;
  percentage: number;
}

export interface CostBreakdown {
  productCost: CostComponent;
  adSpend: CostComponent;
  shippingCost: CostComponent;
  returnLosses: CostComponent;
  otherCosts: CostComponent;
}

export interface RealNetProfitResult {
  netProfit: number;
  netProfitMargin: number;
  returnLosses: number;
  totalCosts: number;
  costBreakdown: CostBreakdown;
  isProfitable: boolean;
  largestCostContributor: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates input values for the calculator.
 */
export function validateInput(input: Partial<RealNetProfitInput>): ValidationResult {
  const { revenue, productCost, adSpend, shippingCost, returnRate } = input;

  if (revenue === undefined || revenue === null) {
    return { isValid: false, error: 'Revenue is required' };
  }
  if (revenue < 0) {
    return { isValid: false, error: 'Revenue cannot be negative' };
  }
  if (productCost !== undefined && productCost < 0) {
    return { isValid: false, error: 'Product cost cannot be negative' };
  }
  if (adSpend !== undefined && adSpend < 0) {
    return { isValid: false, error: 'Ad spend cannot be negative' };
  }
  if (shippingCost !== undefined && shippingCost < 0) {
    return { isValid: false, error: 'Shipping cost cannot be negative' };
  }
  if (returnRate !== undefined && (returnRate < 0 || returnRate > 100)) {
    return { isValid: false, error: 'Return rate must be between 0 and 100' };
  }

  return { isValid: true };
}

/**
 * Calculates the percentage of a cost component relative to revenue.
 */
function calculatePercentage(amount: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (amount / revenue) * 100;
}

/**
 * Identifies the largest cost contributor.
 */
function findLargestCostContributor(breakdown: CostBreakdown): string {
  const costs = [
    { name: 'productCost', amount: breakdown.productCost.amount },
    { name: 'adSpend', amount: breakdown.adSpend.amount },
    { name: 'shippingCost', amount: breakdown.shippingCost.amount },
    { name: 'returnLosses', amount: breakdown.returnLosses.amount },
    { name: 'otherCosts', amount: breakdown.otherCosts.amount },
  ];

  const largest = costs.reduce((max, cost) => 
    cost.amount > max.amount ? cost : max
  , costs[0]);

  return largest.name;
}

/**
 * Calculates real net profit after all expenses.
 * 
 * Formula: Net Profit = Revenue - (Product Cost + Ad Spend + Shipping Cost + Return Losses + Other Costs)
 * Return Losses = Revenue × (Return Rate / 100)
 * 
 * Requirements: 1.3, 1.5, 1.6, 1.7
 */
export function calculateRealNetProfit(input: RealNetProfitInput): RealNetProfitResult {
  const {
    revenue,
    productCost = 0,
    adSpend = 0,
    shippingCost = 0,
    returnRate = 0,
    otherCosts = 0,
  } = input;

  // Calculate return losses (Requirement 1.5)
  const returnLosses = revenue * (returnRate / 100);

  // Calculate total costs
  const totalCosts = productCost + adSpend + shippingCost + returnLosses + otherCosts;

  // Calculate net profit (Requirement 1.3)
  const netProfit = revenue - totalCosts;

  // Calculate net profit margin
  const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // Build cost breakdown (Requirement 1.6)
  const costBreakdown: CostBreakdown = {
    productCost: {
      amount: productCost,
      percentage: calculatePercentage(productCost, revenue),
    },
    adSpend: {
      amount: adSpend,
      percentage: calculatePercentage(adSpend, revenue),
    },
    shippingCost: {
      amount: shippingCost,
      percentage: calculatePercentage(shippingCost, revenue),
    },
    returnLosses: {
      amount: returnLosses,
      percentage: calculatePercentage(returnLosses, revenue),
    },
    otherCosts: {
      amount: otherCosts,
      percentage: calculatePercentage(otherCosts, revenue),
    },
  };

  // Determine profitability and largest contributor (Requirement 1.7)
  const isProfitable = netProfit >= 0;
  const largestCostContributor = findLargestCostContributor(costBreakdown);

  return {
    netProfit,
    netProfitMargin,
    returnLosses,
    totalCosts,
    costBreakdown,
    isProfitable,
    largestCostContributor,
  };
}

/**
 * Formats currency value for display.
 */
export function formatCurrency(value: number, currency: string = 'SAR'): string {
  return `${value.toFixed(2)} ${currency}`;
}

/**
 * Formats percentage value for display.
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}
