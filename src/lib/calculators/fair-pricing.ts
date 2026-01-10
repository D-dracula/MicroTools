/**
 * Fair Product Pricing Calculator Logic
 * 
 * Calculates fair selling price for beginners based on costs and desired margins.
 * Requirements: 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12
 */

export interface FairPricingInputs {
  productCost: number;
  desiredMargin: number;     // percentage (0-100)
  shippingCost: number;
  gatewayFee: number;        // percentage (0-100)
  platformFee: number;       // percentage (0-100)
}

export interface FairPricingOutputs {
  recommendedPrice: number;
  profitPerSale: number;
  breakdown: {
    productCost: number;
    shippingCost: number;
    gatewayFeeAmount: number;
    platformFeeAmount: number;
    profit: number;
  };
  isValid: boolean;
  errorMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
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
 * Validates fair pricing calculation inputs.
 * Returns validation result with error message if invalid.
 * Requirement: 10.12
 */
export function validateInputs(inputs: Partial<FairPricingInputs>): ValidationResult {
  const { productCost, desiredMargin, shippingCost, gatewayFee, platformFee } = inputs;

  if (!isValidNonNegativeNumber(productCost)) {
    return { isValid: false, error: 'Product cost must be a non-negative number' };
  }

  if (!isValidPercentage(desiredMargin)) {
    return { isValid: false, error: 'Desired margin must be between 0 and 100' };
  }

  if (!isValidNonNegativeNumber(shippingCost)) {
    return { isValid: false, error: 'Shipping cost must be a non-negative number' };
  }

  if (!isValidPercentage(gatewayFee)) {
    return { isValid: false, error: 'Gateway fee must be between 0 and 100' };
  }

  if (!isValidPercentage(platformFee)) {
    return { isValid: false, error: 'Platform fee must be between 0 and 100' };
  }

  return { isValid: true };
}

/**
 * Checks if total fee percentages are valid (< 100%).
 * Requirement: 10.10
 */
export function areFeePercentagesValid(
  desiredMargin: number,
  gatewayFee: number,
  platformFee: number
): boolean {
  const totalPercentage = desiredMargin + gatewayFee + platformFee;
  return totalPercentage < 100;
}

/**
 * Calculates the recommended selling price.
 * Formula: SellingPrice = (Cost + Shipping) / (1 - ProfitMargin/100 - GatewayFee/100 - PlatformFee/100)
 * Requirement: 10.6
 */
export function calculateRecommendedPrice(
  productCost: number,
  shippingCost: number,
  desiredMargin: number,
  gatewayFee: number,
  platformFee: number
): number {
  const totalCost = productCost + shippingCost;
  const divisor = 1 - (desiredMargin / 100) - (gatewayFee / 100) - (platformFee / 100);
  return totalCost / divisor;
}

/**
 * Calculates profit per sale.
 * Requirement: 10.8
 */
export function calculateProfitPerSale(
  sellingPrice: number,
  desiredMargin: number
): number {
  return sellingPrice * (desiredMargin / 100);
}

/**
 * Calculates the breakdown of all costs and fees.
 * Requirement: 10.9
 */
export function calculateBreakdown(
  sellingPrice: number,
  productCost: number,
  shippingCost: number,
  gatewayFee: number,
  platformFee: number
): FairPricingOutputs['breakdown'] {
  const gatewayFeeAmount = sellingPrice * (gatewayFee / 100);
  const platformFeeAmount = sellingPrice * (platformFee / 100);
  const profit = sellingPrice - productCost - shippingCost - gatewayFeeAmount - platformFeeAmount;

  return {
    productCost,
    shippingCost,
    gatewayFeeAmount,
    platformFeeAmount,
    profit,
  };
}

/**
 * Performs all fair pricing calculations.
 * Returns result with isValid flag and optional error message.
 * Requirements: 10.6, 10.7, 10.8, 10.9, 10.10, 10.12
 */
export function calculateFairPricing(
  inputs: Partial<FairPricingInputs>
): FairPricingOutputs | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { productCost, desiredMargin, shippingCost, gatewayFee, platformFee } = inputs as FairPricingInputs;

  // Check if total fees exceed 100% - Requirement 10.10
  if (!areFeePercentagesValid(desiredMargin, gatewayFee, platformFee)) {
    return {
      recommendedPrice: 0,
      profitPerSale: 0,
      breakdown: {
        productCost: 0,
        shippingCost: 0,
        gatewayFeeAmount: 0,
        platformFeeAmount: 0,
        profit: 0,
      },
      isValid: false,
      errorMessage: 'Total fees exceed 100%',
    };
  }

  const recommendedPrice = calculateRecommendedPrice(
    productCost,
    shippingCost,
    desiredMargin,
    gatewayFee,
    platformFee
  );

  const profitPerSale = calculateProfitPerSale(recommendedPrice, desiredMargin);
  const breakdown = calculateBreakdown(
    recommendedPrice,
    productCost,
    shippingCost,
    gatewayFee,
    platformFee
  );

  return {
    recommendedPrice,
    profitPerSale,
    breakdown,
    isValid: true,
  };
}

/**
 * Preset scenarios for common use cases.
 * Requirement: 10.11
 */
export interface PricingPreset {
  id: string;
  nameKey: string;
  desiredMargin: number;
  gatewayFee: number;
  platformFee: number;
}

export const PRICING_PRESETS: PricingPreset[] = [
  {
    id: 'local_store',
    nameKey: 'presetLocalStore',
    desiredMargin: 30,
    gatewayFee: 2.5,
    platformFee: 0,
  },
  {
    id: 'marketplace',
    nameKey: 'presetMarketplace',
    desiredMargin: 25,
    gatewayFee: 2.5,
    platformFee: 15,
  },
  {
    id: 'dropshipping',
    nameKey: 'presetDropshipping',
    desiredMargin: 20,
    gatewayFee: 3,
    platformFee: 0,
  },
  {
    id: 'wholesale',
    nameKey: 'presetWholesale',
    desiredMargin: 15,
    gatewayFee: 1.5,
    platformFee: 0,
  },
];

/**
 * Formats a number to a specified number of decimal places.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Formats a currency value.
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Formats a percentage value with % symbol.
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
