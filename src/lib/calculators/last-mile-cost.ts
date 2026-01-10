/**
 * Last Mile Cost Calculator Logic
 * 
 * Calculates last mile delivery costs for Saudi delivery providers.
 * Requirements: 4.1, 4.2, 4.4
 */

export type DeliveryRegion = 'city' | 'suburban' | 'remote';

export interface LastMileCostInput {
  weight: number;
  length: number;
  width: number;
  height: number;
  region: DeliveryRegion;
  provider?: string;
}

export interface ProviderCostResult {
  provider: string;
  baseFee: number;
  weightFee: number;
  zoneSurcharge: number;
  totalCost: number;
  deliveryTime: string;
}

export interface LastMileCostResult {
  chargeableWeight: number;
  volumetricWeight: number;
  actualWeight: number;
  providerComparison: ProviderCostResult[];
  cheapest: string;
  fastest: string;
  warnings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Provider pricing data for Saudi delivery companies
 * Requirement: 4.1, 4.2
 */
export interface ProviderPricing {
  name: string;
  nameAr: string;
  baseFee: number;
  perKgRate: number;
  zoneSurcharges: Record<DeliveryRegion, number>;
  deliveryTimes: Record<DeliveryRegion, string>;
  deliveryTimesAr: Record<DeliveryRegion, string>;
}

export const PROVIDER_PRICING: Record<string, ProviderPricing> = {
  'SMSA': {
    name: 'SMSA',
    nameAr: 'سمسا',
    baseFee: 20,
    perKgRate: 3,
    zoneSurcharges: {
      city: 0,
      suburban: 5,
      remote: 15,
    },
    deliveryTimes: {
      city: '1-2 days',
      suburban: '2-3 days',
      remote: '3-5 days',
    },
    deliveryTimesAr: {
      city: '1-2 يوم',
      suburban: '2-3 أيام',
      remote: '3-5 أيام',
    },
  },
  'Aramex': {
    name: 'Aramex',
    nameAr: 'أرامكس',
    baseFee: 22,
    perKgRate: 3.5,
    zoneSurcharges: {
      city: 0,
      suburban: 7,
      remote: 18,
    },
    deliveryTimes: {
      city: '1-2 days',
      suburban: '2-3 days',
      remote: '4-6 days',
    },
    deliveryTimesAr: {
      city: '1-2 يوم',
      suburban: '2-3 أيام',
      remote: '4-6 أيام',
    },
  },
  'Naqel': {
    name: 'Naqel',
    nameAr: 'ناقل',
    baseFee: 18,
    perKgRate: 2.5,
    zoneSurcharges: {
      city: 0,
      suburban: 4,
      remote: 12,
    },
    deliveryTimes: {
      city: '1-2 days',
      suburban: '2-4 days',
      remote: '4-7 days',
    },
    deliveryTimesAr: {
      city: '1-2 يوم',
      suburban: '2-4 أيام',
      remote: '4-7 أيام',
    },
  },
  'Saudi Post': {
    name: 'Saudi Post',
    nameAr: 'البريد السعودي',
    baseFee: 15,
    perKgRate: 2,
    zoneSurcharges: {
      city: 0,
      suburban: 3,
      remote: 8,
    },
    deliveryTimes: {
      city: '2-3 days',
      suburban: '3-5 days',
      remote: '5-10 days',
    },
    deliveryTimesAr: {
      city: '2-3 أيام',
      suburban: '3-5 أيام',
      remote: '5-10 أيام',
    },
  },
};

export const ALL_PROVIDERS = Object.keys(PROVIDER_PRICING);

/**
 * Region display names
 */
export const REGION_NAMES: Record<DeliveryRegion, { en: string; ar: string }> = {
  city: { en: 'City Center', ar: 'داخل المدينة' },
  suburban: { en: 'Suburban', ar: 'الضواحي' },
  remote: { en: 'Remote Area', ar: 'مناطق نائية' },
};

/**
 * Volumetric weight divisor for last mile
 */
const VOLUMETRIC_DIVISOR = 5000;

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
 * Validates last mile cost calculation inputs.
 */
export function validateInputs(inputs: Partial<LastMileCostInput>): ValidationResult {
  const { weight, length, width, height, region } = inputs;

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

  if (!region || !['city', 'suburban', 'remote'].includes(region)) {
    return { isValid: false, error: 'Invalid delivery region' };
  }

  return { isValid: true };
}

/**
 * Calculates volumetric weight
 */
export function calculateVolumetricWeight(length: number, width: number, height: number): number {
  return (length * width * height) / VOLUMETRIC_DIVISOR;
}

/**
 * Calculates chargeable weight (greater of actual or volumetric)
 */
export function calculateChargeableWeight(actualWeight: number, volumetricWeight: number): number {
  return Math.max(actualWeight, volumetricWeight);
}

/**
 * Calculates cost for a single provider
 * Requirement: 4.4 - Cost breakdown (base fee + weight fee + zone surcharge)
 */
export function calculateProviderCost(
  provider: string,
  chargeableWeight: number,
  region: DeliveryRegion,
  locale: string = 'en'
): ProviderCostResult | null {
  const pricing = PROVIDER_PRICING[provider];
  if (!pricing) return null;

  const baseFee = pricing.baseFee;
  const weightFee = Math.ceil(chargeableWeight) * pricing.perKgRate;
  const zoneSurcharge = pricing.zoneSurcharges[region];
  const totalCost = baseFee + weightFee + zoneSurcharge;
  const deliveryTime = locale === 'ar' 
    ? pricing.deliveryTimesAr[region] 
    : pricing.deliveryTimes[region];

  return {
    provider,
    baseFee: Math.round(baseFee * 100) / 100,
    weightFee: Math.round(weightFee * 100) / 100,
    zoneSurcharge: Math.round(zoneSurcharge * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    deliveryTime,
  };
}

/**
 * Performs all last mile cost calculations
 * Requirements: 4.1, 4.2, 4.4
 */
export function calculateLastMileCost(
  inputs: Partial<LastMileCostInput>,
  locale: string = 'en'
): LastMileCostResult | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { weight, length, width, height, region } = inputs as LastMileCostInput;

  // Calculate weights
  const volumetricWeight = calculateVolumetricWeight(length, width, height);
  const chargeableWeight = calculateChargeableWeight(weight, volumetricWeight);

  // Calculate costs for all providers
  const providerComparison: ProviderCostResult[] = [];
  
  for (const provider of ALL_PROVIDERS) {
    const result = calculateProviderCost(provider, chargeableWeight, region, locale);
    if (result) {
      providerComparison.push(result);
    }
  }

  // Sort by total cost
  providerComparison.sort((a, b) => a.totalCost - b.totalCost);

  // Find cheapest and fastest
  const cheapest = providerComparison[0]?.provider || '';
  
  // Find fastest by parsing delivery time (take the minimum days)
  const fastest = [...providerComparison].sort((a, b) => {
    const aMin = parseInt(a.deliveryTime.match(/\d+/)?.[0] || '999');
    const bMin = parseInt(b.deliveryTime.match(/\d+/)?.[0] || '999');
    return aMin - bMin;
  })[0]?.provider || '';

  // Generate warnings
  const warnings: string[] = [];
  
  // Requirement 4.5 - Remote area warning
  if (region === 'remote') {
    warnings.push(locale === 'ar' 
      ? 'تحذير: التوصيل للمناطق النائية قد يستغرق وقتاً أطول ويتضمن رسوم إضافية'
      : 'Warning: Delivery to remote areas may take longer and includes additional fees'
    );
  }

  if (volumetricWeight > weight) {
    warnings.push(locale === 'ar'
      ? 'الوزن الحجمي أعلى من الوزن الفعلي - سيتم المحاسبة على الوزن الحجمي'
      : 'Volumetric weight exceeds actual weight - you will be charged based on volumetric weight'
    );
  }

  return {
    chargeableWeight: Math.round(chargeableWeight * 100) / 100,
    volumetricWeight: Math.round(volumetricWeight * 100) / 100,
    actualWeight: Math.round(weight * 100) / 100,
    providerComparison,
    cheapest,
    fastest,
    warnings,
  };
}

/**
 * Gets provider display name based on locale
 */
export function getProviderName(provider: string, locale: string = 'en'): string {
  const pricing = PROVIDER_PRICING[provider];
  if (!pricing) return provider;
  return locale === 'ar' ? pricing.nameAr : pricing.name;
}

/**
 * Formats currency for display
 */
export function formatCurrency(value: number, locale: string = 'en'): string {
  return locale === 'ar' ? `${value.toFixed(2)} ريال` : `${value.toFixed(2)} SAR`;
}
