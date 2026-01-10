/**
 * Shipping Carrier Cost Comparator Logic
 * 
 * Calculates and compares shipping costs between carriers.
 * Requirements: 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11
 */

export type ShippingCarrier = 'aramex' | 'smsa' | 'dhl' | 'fedex' | 'saudi_post';

export interface ShippingInputs {
  weight: number;      // kg
  length: number;      // cm
  width: number;       // cm
  height: number;      // cm
  originRegion: string;
  destinationRegion: string;
}

export interface CarrierResult {
  carrier: ShippingCarrier;
  cost: number;
  deliveryDays: string;
  isCheapest: boolean;
  isFastest: boolean;
}

export interface ShippingOutputs {
  volumetricWeight: number;
  chargeableWeight: number;
  carriers: CarrierResult[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface CarrierRate {
  baseRate: number;
  perKg: number;
  deliveryDays: string;
  minDeliveryDays: number; // For sorting fastest
}

/**
 * Shipping Carrier Rates (approximate, SAR)
 * Requirements: 7.7, 7.8
 */
export const SHIPPING_RATES: Record<ShippingCarrier, CarrierRate> = {
  aramex: { baseRate: 25, perKg: 8, deliveryDays: '2-3', minDeliveryDays: 2 },
  smsa: { baseRate: 20, perKg: 7, deliveryDays: '2-4', minDeliveryDays: 2 },
  dhl: { baseRate: 45, perKg: 15, deliveryDays: '1-2', minDeliveryDays: 1 },
  fedex: { baseRate: 40, perKg: 12, deliveryDays: '1-2', minDeliveryDays: 1 },
  saudi_post: { baseRate: 15, perKg: 5, deliveryDays: '3-7', minDeliveryDays: 3 },
};

export const CARRIER_NAMES: Record<ShippingCarrier, { en: string; ar: string }> = {
  aramex: { en: 'Aramex', ar: 'أرامكس' },
  smsa: { en: 'SMSA', ar: 'سمسا' },
  dhl: { en: 'DHL', ar: 'دي إتش إل' },
  fedex: { en: 'FedEx', ar: 'فيديكس' },
  saudi_post: { en: 'Saudi Post', ar: 'البريد السعودي' },
};

export const ALL_CARRIERS: ShippingCarrier[] = ['aramex', 'smsa', 'dhl', 'fedex', 'saudi_post'];

/**
 * Common regions for origin/destination
 */
export const REGIONS = [
  'riyadh',
  'jeddah',
  'dammam',
  'makkah',
  'madinah',
  'khobar',
  'tabuk',
  'abha',
  'other',
] as const;

export type Region = typeof REGIONS[number];

export const REGION_NAMES: Record<Region, { en: string; ar: string }> = {
  riyadh: { en: 'Riyadh', ar: 'الرياض' },
  jeddah: { en: 'Jeddah', ar: 'جدة' },
  dammam: { en: 'Dammam', ar: 'الدمام' },
  makkah: { en: 'Makkah', ar: 'مكة المكرمة' },
  madinah: { en: 'Madinah', ar: 'المدينة المنورة' },
  khobar: { en: 'Khobar', ar: 'الخبر' },
  tabuk: { en: 'Tabuk', ar: 'تبوك' },
  abha: { en: 'Abha', ar: 'أبها' },
  other: { en: 'Other', ar: 'أخرى' },
};

/**
 * Volumetric weight divisor (standard for air freight)
 */
const VOLUMETRIC_DIVISOR = 5000;

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
 * Validates that a region string is not empty.
 */
export function isValidRegion(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return value.trim().length > 0;
}

/**
 * Validates shipping calculation inputs.
 * Returns validation result with error message if invalid.
 * Requirement: 7.11
 */
export function validateInputs(inputs: Partial<ShippingInputs>): ValidationResult {
  const { weight, length, width, height, originRegion, destinationRegion } = inputs;

  if (!isValidPositiveNumber(weight)) {
    return { isValid: false, error: 'Weight must be a positive number' };
  }

  if (!isValidPositiveNumber(length)) {
    return { isValid: false, error: 'Length must be a positive number' };
  }

  if (!isValidPositiveNumber(width)) {
    return { isValid: false, error: 'Width must be a positive number' };
  }

  if (!isValidPositiveNumber(height)) {
    return { isValid: false, error: 'Height must be a positive number' };
  }

  if (!isValidRegion(originRegion)) {
    return { isValid: false, error: 'Origin region is required' };
  }

  if (!isValidRegion(destinationRegion)) {
    return { isValid: false, error: 'Destination region is required' };
  }

  return { isValid: true };
}

/**
 * Calculates volumetric weight from dimensions.
 * Formula: volumetricWeight = (L × W × H) / 5000
 * Requirement: 7.5
 */
export function calculateVolumetricWeight(length: number, width: number, height: number): number {
  return (length * width * height) / VOLUMETRIC_DIVISOR;
}

/**
 * Determines the chargeable weight (greater of actual or volumetric).
 * Requirement: 7.6
 */
export function calculateChargeableWeight(actualWeight: number, volumetricWeight: number): number {
  return Math.max(actualWeight, volumetricWeight);
}

/**
 * Calculates shipping cost for a specific carrier.
 * Formula: cost = baseRate + (chargeableWeight × perKg)
 * Requirement: 7.7
 */
export function calculateCarrierCost(carrier: ShippingCarrier, chargeableWeight: number): number {
  const rate = SHIPPING_RATES[carrier];
  return rate.baseRate + (chargeableWeight * rate.perKg);
}

/**
 * Gets delivery time for a carrier.
 * Requirement: 7.8
 */
export function getDeliveryDays(carrier: ShippingCarrier): string {
  return SHIPPING_RATES[carrier].deliveryDays;
}

/**
 * Generates comparison data for all carriers.
 * Highlights cheapest and fastest options.
 * Requirements: 7.7, 7.8, 7.9, 7.10
 */
export function generateCarrierComparison(chargeableWeight: number): CarrierResult[] {
  // Calculate costs for all carriers
  const results = ALL_CARRIERS.map(carrier => ({
    carrier,
    cost: calculateCarrierCost(carrier, chargeableWeight),
    deliveryDays: getDeliveryDays(carrier),
    minDeliveryDays: SHIPPING_RATES[carrier].minDeliveryDays,
    isCheapest: false,
    isFastest: false,
  }));

  // Find cheapest
  const minCost = Math.min(...results.map(r => r.cost));
  
  // Find fastest (minimum delivery days)
  const minDays = Math.min(...results.map(r => r.minDeliveryDays));

  // Mark cheapest and fastest
  return results.map(({ minDeliveryDays, ...result }) => ({
    ...result,
    isCheapest: result.cost === minCost,
    isFastest: minDeliveryDays === minDays,
  }));
}

/**
 * Performs all shipping calculations.
 * Returns null if inputs are invalid.
 * Requirements: 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11
 */
export function calculateShipping(inputs: Partial<ShippingInputs>): ShippingOutputs | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { weight, length, width, height } = inputs as ShippingInputs;

  const volumetricWeight = calculateVolumetricWeight(length, width, height);
  const chargeableWeight = calculateChargeableWeight(weight, volumetricWeight);
  const carriers = generateCarrierComparison(chargeableWeight);

  return {
    volumetricWeight,
    chargeableWeight,
    carriers,
  };
}

/**
 * Formats a number to a specified number of decimal places.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Formats a weight value with kg unit.
 */
export function formatWeight(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)} kg`;
}

/**
 * Formats a currency value with SAR symbol.
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)} SAR`;
}
