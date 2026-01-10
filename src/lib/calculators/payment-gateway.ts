/**
 * Payment Gateway Fee Calculator Logic
 * 
 * Calculates fees for local payment gateways (Tab, Paytabs, Moyasar, HyperPay).
 * Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

export type GatewayProvider = 'tab' | 'paytabs' | 'moyasar' | 'hyperpay';
export type PaymentMethod = 'mada' | 'visa_mc' | 'apple_pay';

export interface PaymentGatewayInputs {
  amount: number;
  provider: GatewayProvider;
  paymentMethod: PaymentMethod;
}

export interface PaymentGatewayOutputs {
  fee: number;
  netAmount: number;
  feePercentage: number;
  comparison: ProviderComparison[];
}

export interface ProviderComparison {
  provider: GatewayProvider;
  fee: number;
  netAmount: number;
  feePercentage: number;
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
 * Payment Gateway Rates (2026)
 * Requirement: 3.9
 */
export const GATEWAY_RATES: Record<GatewayProvider, Record<PaymentMethod, FeeRate>> = {
  tab: {
    mada: { percentage: 1.5, fixed: 0 },
    visa_mc: { percentage: 2.5, fixed: 0 },
    apple_pay: { percentage: 2.5, fixed: 0 },
  },
  paytabs: {
    mada: { percentage: 1.75, fixed: 0 },
    visa_mc: { percentage: 2.65, fixed: 0 },
    apple_pay: { percentage: 2.65, fixed: 0 },
  },
  moyasar: {
    mada: { percentage: 1.5, fixed: 1 },
    visa_mc: { percentage: 2.5, fixed: 1 },
    apple_pay: { percentage: 2.5, fixed: 1 },
  },
  hyperpay: {
    mada: { percentage: 1.6, fixed: 0 },
    visa_mc: { percentage: 2.4, fixed: 0 },
    apple_pay: { percentage: 2.4, fixed: 0 },
  },
};

export const PROVIDER_NAMES: Record<GatewayProvider, string> = {
  tab: 'Tab',
  paytabs: 'Paytabs',
  moyasar: 'Moyasar',
  hyperpay: 'HyperPay',
};

export const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  mada: 'Mada',
  visa_mc: 'Visa/Mastercard',
  apple_pay: 'Apple Pay',
};

export const ALL_PROVIDERS: GatewayProvider[] = ['tab', 'paytabs', 'moyasar', 'hyperpay'];
export const ALL_PAYMENT_METHODS: PaymentMethod[] = ['mada', 'visa_mc', 'apple_pay'];


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
 * Validates that a provider is valid.
 */
export function isValidProvider(value: unknown): value is GatewayProvider {
  if (typeof value !== 'string') return false;
  return ALL_PROVIDERS.includes(value as GatewayProvider);
}

/**
 * Validates that a payment method is valid.
 */
export function isValidPaymentMethod(value: unknown): value is PaymentMethod {
  if (typeof value !== 'string') return false;
  return ALL_PAYMENT_METHODS.includes(value as PaymentMethod);
}

/**
 * Validates payment gateway calculation inputs.
 * Returns validation result with error message if invalid.
 * Requirement: 3.10
 */
export function validateInputs(inputs: Partial<PaymentGatewayInputs>): ValidationResult {
  const { amount, provider, paymentMethod } = inputs;

  if (!isValidPositiveNumber(amount)) {
    return { isValid: false, error: 'Transaction amount must be a positive number' };
  }

  if (!isValidProvider(provider)) {
    return { isValid: false, error: 'Invalid payment gateway provider' };
  }

  if (!isValidPaymentMethod(paymentMethod)) {
    return { isValid: false, error: 'Invalid payment method' };
  }

  return { isValid: true };
}

/**
 * Gets the fee rate for a specific provider and payment method.
 */
export function getFeeRate(provider: GatewayProvider, paymentMethod: PaymentMethod): FeeRate {
  return GATEWAY_RATES[provider][paymentMethod];
}

/**
 * Calculates the transaction fee for a given amount, provider, and payment method.
 * Formula: fee = (amount × percentage / 100) + fixed
 * Requirement: 3.4, 3.5
 */
export function calculateFee(
  amount: number,
  provider: GatewayProvider,
  paymentMethod: PaymentMethod
): number {
  const rate = getFeeRate(provider, paymentMethod);
  return (amount * rate.percentage / 100) + rate.fixed;
}

/**
 * Calculates the net amount after fees.
 * Formula: netAmount = amount - fee
 * Requirement: 3.6
 */
export function calculateNetAmount(amount: number, fee: number): number {
  return amount - fee;
}

/**
 * Calculates the effective fee percentage.
 * Formula: feePercentage = (fee / amount) × 100
 * Requirement: 3.7
 */
export function calculateFeePercentage(amount: number, fee: number): number {
  if (amount === 0) return 0;
  return (fee / amount) * 100;
}

/**
 * Generates comparison data for all providers for a given amount and payment method.
 * Requirement: 3.8
 */
export function generateComparison(
  amount: number,
  paymentMethod: PaymentMethod
): ProviderComparison[] {
  return ALL_PROVIDERS.map(provider => {
    const fee = calculateFee(amount, provider, paymentMethod);
    const netAmount = calculateNetAmount(amount, fee);
    const feePercentage = calculateFeePercentage(amount, fee);
    
    return {
      provider,
      fee,
      netAmount,
      feePercentage,
    };
  });
}

/**
 * Performs all payment gateway fee calculations.
 * Returns null if inputs are invalid.
 * Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */
export function calculatePaymentGatewayFee(
  inputs: Partial<PaymentGatewayInputs>
): PaymentGatewayOutputs | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { amount, provider, paymentMethod } = inputs as PaymentGatewayInputs;

  const fee = calculateFee(amount, provider, paymentMethod);
  const netAmount = calculateNetAmount(amount, fee);
  const feePercentage = calculateFeePercentage(amount, fee);
  const comparison = generateComparison(amount, paymentMethod);

  return {
    fee,
    netAmount,
    feePercentage,
    comparison,
  };
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

/**
 * Formats a percentage value with % symbol.
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
