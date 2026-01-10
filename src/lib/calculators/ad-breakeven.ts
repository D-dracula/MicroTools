/**
 * Ad Campaign Break-Even Calculator Logic
 * 
 * Calculates break-even point, required traffic, and maximum CPC for ad campaigns.
 * Requirements: 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11
 */

export interface AdBreakEvenInputs {
  sellingPrice: number;
  productCost: number;
  adSpend: number;
  conversionRate: number;  // percentage (0-100)
}

export interface AdBreakEvenOutputs {
  profitPerSale: number;
  breakEvenSales: number;
  requiredTraffic: number;
  maxCPC: number;
  isViable: boolean;
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
 * Validates that a percentage is within valid range (0-100).
 */
export function isValidPercentage(value: unknown): value is number {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'number') return false;
  if (Number.isNaN(value)) return false;
  if (!Number.isFinite(value)) return false;
  return value > 0 && value <= 100;
}

/**
 * Validates ad break-even calculation inputs.
 * Returns validation result with error message if invalid.
 * Requirement: 6.11
 */
export function validateInputs(inputs: Partial<AdBreakEvenInputs>): ValidationResult {
  const { sellingPrice, productCost, adSpend, conversionRate } = inputs;

  if (!isValidPositiveNumber(sellingPrice)) {
    return { isValid: false, error: 'Selling price must be a positive number' };
  }

  if (!isValidPositiveNumber(productCost)) {
    return { isValid: false, error: 'Product cost must be a positive number' };
  }

  if (!isValidPositiveNumber(adSpend)) {
    return { isValid: false, error: 'Ad spend must be a positive number' };
  }

  if (!isValidPercentage(conversionRate)) {
    return { isValid: false, error: 'Conversion rate must be between 0 and 100' };
  }

  return { isValid: true };
}


/**
 * Calculates profit per sale.
 * Formula: profitPerSale = sellingPrice - productCost
 * Requirement: 6.5
 */
export function calculateProfitPerSale(
  sellingPrice: number,
  productCost: number
): number {
  return sellingPrice - productCost;
}

/**
 * Checks if the product is viable (profit per sale > 0).
 * Requirement: 6.10
 */
export function isProductViable(sellingPrice: number, productCost: number): boolean {
  return sellingPrice > productCost;
}

/**
 * Calculates break-even sales.
 * Formula: breakEvenSales = adSpend / profitPerSale
 * Requirement: 6.6
 */
export function calculateBreakEvenSales(
  adSpend: number,
  profitPerSale: number
): number {
  if (profitPerSale <= 0) return Infinity;
  return adSpend / profitPerSale;
}

/**
 * Calculates required traffic to break even.
 * Formula: requiredTraffic = breakEvenSales / (conversionRate / 100)
 * Requirement: 6.7
 */
export function calculateRequiredTraffic(
  breakEvenSales: number,
  conversionRate: number
): number {
  if (conversionRate <= 0) return Infinity;
  return breakEvenSales / (conversionRate / 100);
}

/**
 * Calculates maximum cost per click.
 * Formula: maxCPC = profitPerSale × (conversionRate / 100)
 * Requirement: 6.8
 */
export function calculateMaxCPC(
  profitPerSale: number,
  conversionRate: number
): number {
  if (profitPerSale <= 0) return 0;
  return profitPerSale * (conversionRate / 100);
}

/**
 * Performs all ad break-even calculations.
 * Returns null if inputs are invalid.
 * Requirements: 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11
 */
export function calculateAdBreakEven(
  inputs: Partial<AdBreakEvenInputs>
): AdBreakEvenOutputs | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { sellingPrice, productCost, adSpend, conversionRate } = inputs as AdBreakEvenInputs;

  const profitPerSale = calculateProfitPerSale(sellingPrice, productCost);
  const isViable = isProductViable(sellingPrice, productCost);
  const breakEvenSales = calculateBreakEvenSales(adSpend, profitPerSale);
  const requiredTraffic = calculateRequiredTraffic(breakEvenSales, conversionRate);
  const maxCPC = calculateMaxCPC(profitPerSale, conversionRate);

  return {
    profitPerSale,
    breakEvenSales,
    requiredTraffic,
    maxCPC,
    isViable,
  };
}

/**
 * Formats a number to a specified number of decimal places.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) return '∞';
  return value.toFixed(decimals);
}

/**
 * Formats a currency value.
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) return '∞';
  return value.toFixed(decimals);
}
