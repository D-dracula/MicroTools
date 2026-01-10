/**
 * Profit Margin Calculator Logic
 * 
 * Implements profit, margin, and markup calculations with input validation.
 * Requirements: 6.3, 6.4, 6.5, 6.6, 6.7
 */

export interface ProfitCalculationInputs {
  costPrice: number;
  sellingPrice: number;
}

export interface ProfitCalculationOutputs {
  profit: number;
  profitMargin: number;  // percentage
  markup: number;        // percentage
  isLoss: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates that a value is a valid positive number for calculations.
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
 * Validates calculation inputs.
 * Returns validation result with error message if invalid.
 */
export function validateInputs(inputs: Partial<ProfitCalculationInputs>): ValidationResult {
  const { costPrice, sellingPrice } = inputs;

  if (!isValidPositiveNumber(costPrice)) {
    return { isValid: false, error: 'Cost price must be a positive number' };
  }

  if (!isValidPositiveNumber(sellingPrice)) {
    return { isValid: false, error: 'Selling price must be a positive number' };
  }

  return { isValid: true };
}

/**
 * Calculates profit amount.
 * Formula: profit = sellingPrice - costPrice
 * Requirement: 6.3
 */
export function calculateProfit(costPrice: number, sellingPrice: number): number {
  return sellingPrice - costPrice;
}

/**
 * Calculates profit margin percentage.
 * Formula: profitMargin = ((sellingPrice - costPrice) / sellingPrice) × 100
 * Requirement: 6.4
 */
export function calculateProfitMargin(costPrice: number, sellingPrice: number): number {
  const profit = sellingPrice - costPrice;
  return (profit / sellingPrice) * 100;
}

/**
 * Calculates markup percentage.
 * Formula: markup = ((sellingPrice - costPrice) / costPrice) × 100
 * Requirement: 6.5
 */
export function calculateMarkup(costPrice: number, sellingPrice: number): number {
  const profit = sellingPrice - costPrice;
  return (profit / costPrice) * 100;
}

/**
 * Determines if the calculation results in a loss.
 * Requirement: 6.6
 */
export function isLoss(costPrice: number, sellingPrice: number): boolean {
  return sellingPrice < costPrice;
}

/**
 * Performs all profit margin calculations.
 * Returns null if inputs are invalid.
 * Requirements: 6.3, 6.4, 6.5, 6.6, 6.7
 */
export function calculateProfitMargin_Full(
  inputs: Partial<ProfitCalculationInputs>
): ProfitCalculationOutputs | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { costPrice, sellingPrice } = inputs as ProfitCalculationInputs;

  return {
    profit: calculateProfit(costPrice, sellingPrice),
    profitMargin: calculateProfitMargin(costPrice, sellingPrice),
    markup: calculateMarkup(costPrice, sellingPrice),
    isLoss: isLoss(costPrice, sellingPrice),
  };
}

/**
 * Formats a number to a specified number of decimal places.
 * Useful for displaying calculation results.
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
