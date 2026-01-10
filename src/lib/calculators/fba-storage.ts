/**
 * Amazon FBA Long-term Storage Fee Calculator Logic
 * 
 * Calculates storage fees including monthly fees, aged inventory surcharges,
 * and long-term storage fees based on 2026 FBA rates.
 * Requirements: 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12
 */

export type SizeTier = 'standard' | 'oversize';

export interface FBAStorageInputs {
  length: number;         // inches
  width: number;          // inches
  height: number;         // inches
  units: number;
  storageDuration: number; // months
  sizeTier: SizeTier;
}

export interface MonthlyBreakdown {
  month: number;
  fee: number;
  surcharge: number;
  total: number;
}

export interface FBAStorageOutputs {
  cubicFeet: number;
  monthlyFee: number;
  agedInventorySurcharge: number;
  longTermStorageFee: number;
  totalCost: number;
  costPerUnit: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * FBA Storage Rates (2026)
 * Rates are per cubic foot per month
 */
export const FBA_STORAGE_RATES = {
  standard: {
    jan_sep: 0.87,  // January - September
    oct_dec: 2.40,  // October - December (peak season)
  },
  oversize: {
    jan_sep: 0.56,
    oct_dec: 1.40,
  },
};

/**
 * Aged Inventory Surcharge (271-365 days / ~9-12 months)
 * Per cubic foot
 */
export const AGED_SURCHARGE_RATES = {
  standard: 1.50,
  oversize: 0.50,
};

/**
 * Long-term Storage Fee (365+ days / 12+ months)
 * Per cubic foot
 */
export const LONG_TERM_RATES = {
  standard: 6.90,
  oversize: 6.90,
};

/** Cubic inches per cubic foot */
const CUBIC_INCHES_PER_CUBIC_FOOT = 1728;

/** Months threshold for aged inventory surcharge */
const AGED_INVENTORY_THRESHOLD = 6;

/** Months threshold for long-term storage fee */
const LONG_TERM_THRESHOLD = 12;

/**
 * Validates that a value is a valid positive number.
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
 * Validates that a value is a valid positive integer.
 */
export function isValidPositiveInteger(value: unknown): value is number {
  if (!isValidPositiveNumber(value)) return false;
  return Number.isInteger(value);
}

/**
 * Validates that a size tier is valid.
 */
export function isValidSizeTier(tier: unknown): tier is SizeTier {
  return tier === 'standard' || tier === 'oversize';
}


/**
 * Validates FBA Storage calculation inputs.
 * Requirement: 9.12
 */
export function validateInputs(inputs: Partial<FBAStorageInputs>): ValidationResult {
  const { length, width, height, units, storageDuration, sizeTier } = inputs;

  if (!isValidPositiveNumber(length)) {
    return { isValid: false, error: 'Length must be a positive number' };
  }

  if (!isValidPositiveNumber(width)) {
    return { isValid: false, error: 'Width must be a positive number' };
  }

  if (!isValidPositiveNumber(height)) {
    return { isValid: false, error: 'Height must be a positive number' };
  }

  if (!isValidPositiveInteger(units)) {
    return { isValid: false, error: 'Units must be a positive integer' };
  }

  if (!isValidPositiveInteger(storageDuration)) {
    return { isValid: false, error: 'Storage duration must be a positive integer' };
  }

  if (!isValidSizeTier(sizeTier)) {
    return { isValid: false, error: 'Size tier must be either "standard" or "oversize"' };
  }

  return { isValid: true };
}

/**
 * Calculates cubic feet from dimensions and units.
 * Formula: CubicFeet = (L × W × H) / 1728 × Units
 * Requirement: 9.5
 */
export function calculateCubicFeet(
  length: number,
  width: number,
  height: number,
  units: number
): number {
  return (length * width * height) / CUBIC_INCHES_PER_CUBIC_FOOT * units;
}

/**
 * Gets the monthly storage rate based on size tier and month.
 * October-December has peak season rates.
 * Requirement: 9.6
 */
export function getMonthlyRate(sizeTier: SizeTier, month: number): number {
  const rates = FBA_STORAGE_RATES[sizeTier];
  // Month 1-9 = Jan-Sep, Month 10-12 = Oct-Dec
  const monthOfYear = ((month - 1) % 12) + 1;
  return monthOfYear >= 10 ? rates.oct_dec : rates.jan_sep;
}

/**
 * Calculates monthly storage fee.
 * Requirement: 9.6
 */
export function calculateMonthlyFee(cubicFeet: number, sizeTier: SizeTier, month: number): number {
  const rate = getMonthlyRate(sizeTier, month);
  return cubicFeet * rate;
}

/**
 * Calculates aged inventory surcharge for months 7-12 (271-365 days).
 * Requirement: 9.7
 */
export function calculateAgedSurcharge(cubicFeet: number, sizeTier: SizeTier): number {
  return cubicFeet * AGED_SURCHARGE_RATES[sizeTier];
}

/**
 * Calculates long-term storage fee for months 13+ (365+ days).
 * Requirement: 9.8
 */
export function calculateLongTermFee(cubicFeet: number, sizeTier: SizeTier): number {
  return cubicFeet * LONG_TERM_RATES[sizeTier];
}

/**
 * Generates monthly breakdown of fees.
 * Requirement: 9.9
 */
export function generateMonthlyBreakdown(
  cubicFeet: number,
  sizeTier: SizeTier,
  storageDuration: number
): MonthlyBreakdown[] {
  const breakdown: MonthlyBreakdown[] = [];

  for (let month = 1; month <= storageDuration; month++) {
    const fee = calculateMonthlyFee(cubicFeet, sizeTier, month);
    let surcharge = 0;

    // Add aged inventory surcharge for months 7-12
    if (month > AGED_INVENTORY_THRESHOLD && month <= LONG_TERM_THRESHOLD) {
      surcharge = calculateAgedSurcharge(cubicFeet, sizeTier);
    }
    // Add long-term storage fee for months 13+
    else if (month > LONG_TERM_THRESHOLD) {
      surcharge = calculateLongTermFee(cubicFeet, sizeTier);
    }

    breakdown.push({
      month,
      fee,
      surcharge,
      total: fee + surcharge,
    });
  }

  return breakdown;
}

/**
 * Performs FBA Storage calculations.
 * Returns null if inputs are invalid.
 * Requirements: 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12
 */
export function calculateFBAStorage(
  inputs: Partial<FBAStorageInputs>
): FBAStorageOutputs | null {
  const validation = validateInputs(inputs);

  if (!validation.isValid) {
    return null;
  }

  const { length, width, height, units, storageDuration, sizeTier } = inputs as FBAStorageInputs;

  // Calculate cubic feet - Requirement: 9.5
  const cubicFeet = calculateCubicFeet(length, width, height, units);

  // Generate monthly breakdown - Requirement: 9.9
  const monthlyBreakdown = generateMonthlyBreakdown(cubicFeet, sizeTier, storageDuration);

  // Calculate totals
  let totalMonthlyFees = 0;
  let totalAgedSurcharge = 0;
  let totalLongTermFee = 0;

  monthlyBreakdown.forEach((month) => {
    totalMonthlyFees += month.fee;
    if (month.month > AGED_INVENTORY_THRESHOLD && month.month <= LONG_TERM_THRESHOLD) {
      totalAgedSurcharge += month.surcharge;
    } else if (month.month > LONG_TERM_THRESHOLD) {
      totalLongTermFee += month.surcharge;
    }
  });

  // Average monthly fee for display
  const monthlyFee = totalMonthlyFees / storageDuration;

  // Total cost - Requirement: 9.10
  const totalCost = totalMonthlyFees + totalAgedSurcharge + totalLongTermFee;

  // Cost per unit - Requirement: 9.11
  const costPerUnit = totalCost / units;

  return {
    cubicFeet,
    monthlyFee,
    agedInventorySurcharge: totalAgedSurcharge,
    longTermStorageFee: totalLongTermFee,
    totalCost,
    costPerUnit,
    monthlyBreakdown,
  };
}

/**
 * Formats a number to a specified number of decimal places.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Formats a currency value with USD symbol.
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return `$${value.toFixed(decimals)}`;
}
