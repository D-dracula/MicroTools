/**
 * Import Duty Estimator Logic
 * 
 * Calculates customs duties, VAT, and total landed cost for imports.
 * Requirements: 4.6, 4.7, 4.8, 4.9, 4.10, 4.11
 */

export type DestinationCountry = 'saudi' | 'uae' | 'kuwait' | 'bahrain' | 'oman' | 'qatar';
export type ProductCategory = 'electronics' | 'clothing' | 'food' | 'cosmetics' | 'general';

export interface ImportDutyInputs {
  fobValue: number;
  shippingCost: number;
  insuranceCost: number;
  destinationCountry: DestinationCountry;
  productCategory: ProductCategory;
}

export interface ImportDutyOutputs {
  cifValue: number;
  customsDuty: number;
  vatAmount: number;
  totalLandedCost: number;
  breakdown: {
    fob: number;
    shipping: number;
    insurance: number;
    duty: number;
    vat: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Customs Duty Rates by Country and Category (percentage)
 */
export const DUTY_RATES: Record<DestinationCountry, Record<ProductCategory, number>> = {
  saudi: {
    electronics: 5,
    clothing: 5,
    food: 0,
    cosmetics: 5,
    general: 5,
  },
  uae: {
    electronics: 5,
    clothing: 5,
    food: 0,
    cosmetics: 5,
    general: 5,
  },
  kuwait: {
    electronics: 5,
    clothing: 5,
    food: 0,
    cosmetics: 5,
    general: 5,
  },
  bahrain: {
    electronics: 5,
    clothing: 5,
    food: 0,
    cosmetics: 5,
    general: 5,
  },
  oman: {
    electronics: 5,
    clothing: 5,
    food: 0,
    cosmetics: 5,
    general: 5,
  },
  qatar: {
    electronics: 5,
    clothing: 5,
    food: 0,
    cosmetics: 5,
    general: 5,
  },
};

/**
 * VAT Rates by Country (percentage)
 */
export const VAT_RATES: Record<DestinationCountry, number> = {
  saudi: 15,
  uae: 5,
  kuwait: 0,
  bahrain: 10,
  oman: 5,
  qatar: 0,
};

export const COUNTRY_NAMES: Record<DestinationCountry, { en: string; ar: string }> = {
  saudi: { en: 'Saudi Arabia', ar: 'السعودية' },
  uae: { en: 'UAE', ar: 'الإمارات' },
  kuwait: { en: 'Kuwait', ar: 'الكويت' },
  bahrain: { en: 'Bahrain', ar: 'البحرين' },
  oman: { en: 'Oman', ar: 'عُمان' },
  qatar: { en: 'Qatar', ar: 'قطر' },
};

export const CATEGORY_NAMES: Record<ProductCategory, { en: string; ar: string }> = {
  electronics: { en: 'Electronics', ar: 'إلكترونيات' },
  clothing: { en: 'Clothing', ar: 'ملابس' },
  food: { en: 'Food', ar: 'أغذية' },
  cosmetics: { en: 'Cosmetics', ar: 'مستحضرات تجميل' },
  general: { en: 'General', ar: 'عام' },
};

export const ALL_COUNTRIES: DestinationCountry[] = ['saudi', 'uae', 'kuwait', 'bahrain', 'oman', 'qatar'];
export const ALL_CATEGORIES: ProductCategory[] = ['electronics', 'clothing', 'food', 'cosmetics', 'general'];

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
 * Validates that a country is valid.
 */
export function isValidCountry(value: unknown): value is DestinationCountry {
  if (typeof value !== 'string') return false;
  return ALL_COUNTRIES.includes(value as DestinationCountry);
}

/**
 * Validates that a category is valid.
 */
export function isValidCategory(value: unknown): value is ProductCategory {
  if (typeof value !== 'string') return false;
  return ALL_CATEGORIES.includes(value as ProductCategory);
}

/**
 * Validates import duty calculation inputs.
 * Returns validation result with error message if invalid.
 * Requirement: 4.11
 */
export function validateInputs(inputs: Partial<ImportDutyInputs>): ValidationResult {
  const { fobValue, shippingCost, insuranceCost, destinationCountry, productCategory } = inputs;

  if (!isValidNonNegativeNumber(fobValue)) {
    return { isValid: false, error: 'FOB value must be a non-negative number' };
  }

  if (!isValidNonNegativeNumber(shippingCost)) {
    return { isValid: false, error: 'Shipping cost must be a non-negative number' };
  }

  if (!isValidNonNegativeNumber(insuranceCost)) {
    return { isValid: false, error: 'Insurance cost must be a non-negative number' };
  }

  if (!isValidCountry(destinationCountry)) {
    return { isValid: false, error: 'Invalid destination country' };
  }

  if (!isValidCategory(productCategory)) {
    return { isValid: false, error: 'Invalid product category' };
  }

  return { isValid: true };
}

/**
 * Gets the duty rate for a specific country and category.
 */
export function getDutyRate(country: DestinationCountry, category: ProductCategory): number {
  return DUTY_RATES[country][category];
}

/**
 * Gets the VAT rate for a specific country.
 */
export function getVATRate(country: DestinationCountry): number {
  return VAT_RATES[country];
}

/**
 * Calculates CIF (Cost, Insurance, Freight) value.
 * Formula: CIF = FOB + Shipping + Insurance
 * Requirement: 4.6
 */
export function calculateCIF(fobValue: number, shippingCost: number, insuranceCost: number): number {
  return fobValue + shippingCost + insuranceCost;
}

/**
 * Calculates customs duty based on CIF value and duty rate.
 * Formula: customsDuty = CIF × (dutyRate / 100)
 * Requirement: 4.7
 */
export function calculateCustomsDuty(
  cifValue: number,
  country: DestinationCountry,
  category: ProductCategory
): number {
  const dutyRate = getDutyRate(country, category);
  return cifValue * (dutyRate / 100);
}

/**
 * Calculates VAT amount on (CIF + Duty).
 * Formula: VAT = (CIF + Duty) × (vatRate / 100)
 * Requirement: 4.8
 */
export function calculateVAT(
  cifValue: number,
  customsDuty: number,
  country: DestinationCountry
): number {
  const vatRate = getVATRate(country);
  return (cifValue + customsDuty) * (vatRate / 100);
}

/**
 * Calculates total landed cost.
 * Formula: totalLandedCost = CIF + customsDuty + VAT
 * Requirement: 4.9
 */
export function calculateTotalLandedCost(
  cifValue: number,
  customsDuty: number,
  vatAmount: number
): number {
  return cifValue + customsDuty + vatAmount;
}

/**
 * Performs all import duty calculations.
 * Returns null if inputs are invalid.
 * Requirements: 4.6, 4.7, 4.8, 4.9, 4.10, 4.11
 */
export function calculateImportDuty(
  inputs: Partial<ImportDutyInputs>
): ImportDutyOutputs | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { fobValue, shippingCost, insuranceCost, destinationCountry, productCategory } = inputs as ImportDutyInputs;

  const cifValue = calculateCIF(fobValue, shippingCost, insuranceCost);
  const customsDuty = calculateCustomsDuty(cifValue, destinationCountry, productCategory);
  const vatAmount = calculateVAT(cifValue, customsDuty, destinationCountry);
  const totalLandedCost = calculateTotalLandedCost(cifValue, customsDuty, vatAmount);

  return {
    cifValue,
    customsDuty,
    vatAmount,
    totalLandedCost,
    breakdown: {
      fob: fobValue,
      shipping: shippingCost,
      insurance: insuranceCost,
      duty: customsDuty,
      vat: vatAmount,
    },
  };
}

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
