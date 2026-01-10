/**
 * PayPal Fee Calculator Logic
 * 
 * Calculates PayPal fees for international transactions with 2026 fee structure.
 * Requirements: 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11
 */

export type Currency = 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED';
export type TransactionType = 'goods_services' | 'friends_family';

export interface PayPalFeeInputs {
  amount: number;
  senderCurrency: Currency;
  receiverCurrency: Currency;
  transactionType: TransactionType;
}

export interface PayPalFeeOutputs {
  paypalFee: number;
  conversionFee: number;
  totalFees: number;
  netAmount: number;
  effectiveFeePercentage: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FeeRate {
  percentage: number;
  fixed: number;
}

/**
 * PayPal Fee Structure (2026)
 * Requirement: 5.10
 */
export const PAYPAL_RATES: Record<TransactionType, Record<Currency, FeeRate>> = {
  goods_services: {
    USD: { percentage: 3.49, fixed: 0.49 },
    EUR: { percentage: 3.49, fixed: 0.39 },
    GBP: { percentage: 3.49, fixed: 0.29 },
    SAR: { percentage: 3.49, fixed: 1.99 },
    AED: { percentage: 3.49, fixed: 1.99 },
  },
  friends_family: {
    USD: { percentage: 0, fixed: 0 },
    EUR: { percentage: 0, fixed: 0 },
    GBP: { percentage: 0, fixed: 0 },
    SAR: { percentage: 0, fixed: 0 },
    AED: { percentage: 0, fixed: 0 },
  },
};

/**
 * International Friends & Family fee (when currencies differ)
 */
export const INTERNATIONAL_FF_RATE: FeeRate = { percentage: 5, fixed: 0 };

/**
 * Currency conversion fee percentage
 * Requirement: 5.6
 */
export const CONVERSION_FEE_PERCENTAGE = 4;

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'US Dollar (USD)',
  EUR: 'Euro (EUR)',
  GBP: 'British Pound (GBP)',
  SAR: 'Saudi Riyal (SAR)',
  AED: 'UAE Dirham (AED)',
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'SAR',
  AED: 'AED',
};

export const TRANSACTION_TYPE_NAMES: Record<TransactionType, string> = {
  goods_services: 'Goods & Services',
  friends_family: 'Friends & Family',
};

export const ALL_CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'SAR', 'AED'];
export const ALL_TRANSACTION_TYPES: TransactionType[] = ['goods_services', 'friends_family'];

/**
 * Validates that a value is a valid positive number.
 * Rejects: NaN, undefined, null, strings, zero, negative numbers, Infinity
 * Requirement: 5.11
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
 * Validates that a currency is valid.
 */
export function isValidCurrency(value: unknown): value is Currency {
  if (typeof value !== 'string') return false;
  return ALL_CURRENCIES.includes(value as Currency);
}

/**
 * Validates that a transaction type is valid.
 */
export function isValidTransactionType(value: unknown): value is TransactionType {
  if (typeof value !== 'string') return false;
  return ALL_TRANSACTION_TYPES.includes(value as TransactionType);
}

/**
 * Validates PayPal fee calculation inputs.
 * Returns validation result with error message if invalid.
 * Requirement: 5.11
 */
export function validateInputs(inputs: Partial<PayPalFeeInputs>): ValidationResult {
  const { amount, senderCurrency, receiverCurrency, transactionType } = inputs;

  if (!isValidPositiveNumber(amount)) {
    return { isValid: false, error: 'Transaction amount must be a positive number' };
  }

  if (!isValidCurrency(senderCurrency)) {
    return { isValid: false, error: 'Invalid sender currency' };
  }

  if (!isValidCurrency(receiverCurrency)) {
    return { isValid: false, error: 'Invalid receiver currency' };
  }

  if (!isValidTransactionType(transactionType)) {
    return { isValid: false, error: 'Invalid transaction type' };
  }

  return { isValid: true };
}

/**
 * Gets the fee rate for a specific transaction type and currency.
 */
export function getFeeRate(transactionType: TransactionType, currency: Currency): FeeRate {
  return PAYPAL_RATES[transactionType][currency];
}

/**
 * Calculates the PayPal transaction fee.
 * Formula: Fee = (Amount × PercentageFee / 100) + FixedFee
 * Requirement: 5.5
 */
export function calculatePayPalFee(
  amount: number,
  transactionType: TransactionType,
  receiverCurrency: Currency,
  isInternational: boolean
): number {
  // For Friends & Family international transactions, use international rate
  if (transactionType === 'friends_family' && isInternational) {
    return (amount * INTERNATIONAL_FF_RATE.percentage / 100) + INTERNATIONAL_FF_RATE.fixed;
  }
  
  const rate = getFeeRate(transactionType, receiverCurrency);
  return (amount * rate.percentage / 100) + rate.fixed;
}

/**
 * Calculates the currency conversion fee.
 * Applied when sender and receiver currencies differ.
 * Requirement: 5.6
 */
export function calculateConversionFee(
  amount: number,
  senderCurrency: Currency,
  receiverCurrency: Currency
): number {
  if (senderCurrency === receiverCurrency) {
    return 0;
  }
  return amount * (CONVERSION_FEE_PERCENTAGE / 100);
}

/**
 * Calculates the net amount after all fees.
 * Formula: netAmount = amount - totalFees
 * Requirement: 5.8
 */
export function calculateNetAmount(amount: number, totalFees: number): number {
  return amount - totalFees;
}

/**
 * Calculates the effective fee percentage.
 * Formula: effectiveFeePercentage = (totalFees / amount) × 100
 * Requirement: 5.9
 */
export function calculateEffectiveFeePercentage(amount: number, totalFees: number): number {
  if (amount === 0) return 0;
  return (totalFees / amount) * 100;
}

/**
 * Performs all PayPal fee calculations.
 * Returns null if inputs are invalid.
 * Requirements: 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11
 */
export function calculatePayPalFees(
  inputs: Partial<PayPalFeeInputs>
): PayPalFeeOutputs | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { amount, senderCurrency, receiverCurrency, transactionType } = inputs as PayPalFeeInputs;

  const isInternational = senderCurrency !== receiverCurrency;
  
  // Calculate PayPal fee - Requirement 5.5
  const paypalFee = calculatePayPalFee(amount, transactionType, receiverCurrency, isInternational);
  
  // Calculate conversion fee - Requirement 5.6
  const conversionFee = calculateConversionFee(amount, senderCurrency, receiverCurrency);
  
  // Calculate total fees - Requirement 5.7
  const totalFees = paypalFee + conversionFee;
  
  // Calculate net amount - Requirement 5.8
  const netAmount = calculateNetAmount(amount, totalFees);
  
  // Calculate effective fee percentage - Requirement 5.9
  const effectiveFeePercentage = calculateEffectiveFeePercentage(amount, totalFees);

  return {
    paypalFee,
    conversionFee,
    totalFees,
    netAmount,
    effectiveFeePercentage,
  };
}

/**
 * Formats a number to a specified number of decimal places.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Formats a currency value with currency symbol.
 */
export function formatCurrency(value: number, currency: Currency, decimals: number = 2): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (currency === 'SAR' || currency === 'AED') {
    return `${value.toFixed(decimals)} ${symbol}`;
  }
  return `${symbol}${value.toFixed(decimals)}`;
}

/**
 * Formats a percentage value with % symbol.
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
