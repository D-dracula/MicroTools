/**
 * Saudi VAT Calculator Logic (15%)
 * 
 * Calculates VAT for Saudi Arabia with add/extract modes.
 * Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
 */

export type VATMode = 'add' | 'extract';

export interface SaudiVATInputs {
  amount: number;
  mode: VATMode;
}

export interface SaudiVATOutputs {
  vatAmount: number;
  amountBeforeVAT: number;
  totalWithVAT: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/** Fixed Saudi VAT rate - Requirement: 8.8 */
export const SAUDI_VAT_RATE = 15;

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
 * Validates that a mode is valid ('add' or 'extract').
 */
export function isValidMode(mode: unknown): mode is VATMode {
  return mode === 'add' || mode === 'extract';
}

/**
 * Validates Saudi VAT calculation inputs.
 * Returns validation result with error message if invalid.
 * Requirement: 8.9
 */
export function validateInputs(inputs: Partial<SaudiVATInputs>): ValidationResult {
  const { amount, mode } = inputs;

  if (!isValidPositiveNumber(amount)) {
    return { isValid: false, error: 'Amount must be a positive number' };
  }

  if (!isValidMode(mode)) {
    return { isValid: false, error: 'Mode must be either "add" or "extract"' };
  }

  return { isValid: true };
}

/**
 * Adds VAT to an amount.
 * Formula: totalWithVAT = amount × 1.15
 * Requirement: 8.3
 */
export function addVAT(amount: number): number {
  return amount * (1 + SAUDI_VAT_RATE / 100);
}

/**
 * Extracts VAT from an amount (amount includes VAT).
 * Formula: amountBeforeVAT = amount / 1.15
 * Requirement: 8.4
 */
export function extractVAT(amountWithVAT: number): number {
  return amountWithVAT / (1 + SAUDI_VAT_RATE / 100);
}

/**
 * Calculates VAT amount from amount before VAT.
 * Formula: vatAmount = amountBeforeVAT × 0.15
 * Requirement: 8.5
 */
export function calculateVATFromBase(amountBeforeVAT: number): number {
  return amountBeforeVAT * (SAUDI_VAT_RATE / 100);
}

/**
 * Calculates VAT amount from total with VAT.
 * Formula: vatAmount = totalWithVAT - (totalWithVAT / 1.15)
 * Requirement: 8.5
 */
export function calculateVATFromTotal(totalWithVAT: number): number {
  const amountBeforeVAT = extractVAT(totalWithVAT);
  return totalWithVAT - amountBeforeVAT;
}

/**
 * Performs Saudi VAT calculations based on mode.
 * Returns null if inputs are invalid.
 * Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
 */
export function calculateSaudiVAT(
  inputs: Partial<SaudiVATInputs>
): SaudiVATOutputs | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { amount, mode } = inputs as SaudiVATInputs;

  if (mode === 'add') {
    // Amount is before VAT, calculate total with VAT
    const amountBeforeVAT = amount;
    const vatAmount = calculateVATFromBase(amountBeforeVAT);
    const totalWithVAT = addVAT(amountBeforeVAT);
    
    return {
      vatAmount,
      amountBeforeVAT,
      totalWithVAT,
    };
  } else {
    // Amount includes VAT, extract the base amount
    const totalWithVAT = amount;
    const amountBeforeVAT = extractVAT(totalWithVAT);
    const vatAmount = calculateVATFromTotal(totalWithVAT);
    
    return {
      vatAmount,
      amountBeforeVAT,
      totalWithVAT,
    };
  }
}

/**
 * Formats a number to a specified number of decimal places.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Formats a currency value with SAR symbol.
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)} SAR`;
}
