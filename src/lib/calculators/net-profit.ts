/**
 * Net Profit Calculator Logic (After Returns)
 * 
 * Calculates real profit after accounting for returns and processing costs.
 * Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */

export interface NetProfitInputs {
  revenue: number;
  productCost: number;
  returnRate: number;      // percentage (0-100)
  processingCost: number;  // per returned item
}

export interface NetProfitOutputs {
  netProfit: number;
  effectiveMargin: number;
  returnLosses: number;
  hasHighReturnRate: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates that a value is a valid positive number.
 * Rejects: NaN, undefined, null, strings, zero, negative numbers, Infinity
 */
export function isValidPositiveNumber(value: unknown): value is number {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'number') return false;
  if (Number.isNaN(value)) return false;
  if (!Number.isFinite(value)) return false;
  if (value <= 0) return false;
  return true;
}

/**
 * Validates that a value is a valid non-negative number.
 * Rejects: NaN, undefined, null, strings, negative numbers, Infinity
 */
export function isValidNonNegativeNumber(value: unknown): value is number {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'number') return false;
  if (Number.isNaN(value)) return false;
  if (!Number.isFinite(value)) return false;
  if (value < 0) return false;
  return true;
}

/**
 * Validates that a percentage is within valid range (0-100).
 */
export function isValidPercentage(value: unknown): value is number {
  if (!isValidNonNegativeNumber(value)) return false;
  return value >= 0 && value <= 100;
}


/**
 * Validates net profit calculation inputs.
 * Returns validation result with error message if invalid.
 * Requirement: 2.10
 */
export function validateInputs(inputs: Partial<NetProfitInputs>): ValidationResult {
  const { revenue, productCost, returnRate, processingCost } = inputs;

  if (!isValidPositiveNumber(revenue)) {
    return { isValid: false, error: 'Revenue must be a positive number' };
  }

  if (!isValidPositiveNumber(productCost)) {
    return { isValid: false, error: 'Product cost must be a positive number' };
  }

  if (!isValidPercentage(returnRate)) {
    return { isValid: false, error: 'Return rate must be between 0 and 100' };
  }

  if (!isValidNonNegativeNumber(processingCost)) {
    return { isValid: false, error: 'Processing cost must be a non-negative number' };
  }

  return { isValid: true };
}

/**
 * Calculates return losses.
 * Formula: returnLosses = revenue × (returnRate/100) × processingCost
 * Requirement: 2.8
 */
export function calculateReturnLosses(
  revenue: number,
  returnRate: number,
  processingCost: number
): number {
  return revenue * (returnRate / 100) * processingCost;
}

/**
 * Calculates net profit after returns.
 * Formula: netProfit = revenue × (1 - returnRate/100) - productCost - returnLosses
 * Requirement: 2.5
 */
export function calculateNetProfit(
  revenue: number,
  productCost: number,
  returnRate: number,
  processingCost: number
): number {
  const effectiveRevenue = revenue * (1 - returnRate / 100);
  const returnLosses = calculateReturnLosses(revenue, returnRate, processingCost);
  return effectiveRevenue - productCost - returnLosses;
}

/**
 * Calculates effective profit margin percentage.
 * Formula: effectiveMargin = (netProfit / effectiveRevenue) × 100
 * Requirement: 2.7
 */
export function calculateEffectiveMargin(
  revenue: number,
  productCost: number,
  returnRate: number,
  processingCost: number
): number {
  const effectiveRevenue = revenue * (1 - returnRate / 100);
  if (effectiveRevenue === 0) return 0;
  const netProfit = calculateNetProfit(revenue, productCost, returnRate, processingCost);
  return (netProfit / effectiveRevenue) * 100;
}

/**
 * Checks if return rate is high (> 50%).
 * Requirement: 2.9
 */
export function hasHighReturnRate(returnRate: number): boolean {
  return returnRate > 50;
}

/**
 * Performs all net profit calculations.
 * Returns null if inputs are invalid.
 * Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */
export function calculateNetProfit_Full(
  inputs: Partial<NetProfitInputs>
): NetProfitOutputs | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { revenue, productCost, returnRate, processingCost } = inputs as NetProfitInputs;

  return {
    netProfit: calculateNetProfit(revenue, productCost, returnRate, processingCost),
    effectiveMargin: calculateEffectiveMargin(revenue, productCost, returnRate, processingCost),
    returnLosses: calculateReturnLosses(revenue, returnRate, processingCost),
    hasHighReturnRate: hasHighReturnRate(returnRate),
  };
}

/**
 * Formats a number to a specified number of decimal places.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Formats a percentage value with % symbol.
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
