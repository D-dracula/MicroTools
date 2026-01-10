/**
 * Lead Time Calculator Logic
 * 
 * Calculates shipping lead times including supplier processing,
 * shipping transit, customs clearance, and peak season adjustments.
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */

export type ShippingMethod = 'air' | 'sea' | 'express' | 'rail';
export type SupplierLocation = 'china' | 'india' | 'turkey' | 'usa' | 'europe';

export interface LeadTimeInput {
  supplierLocation: SupplierLocation;
  shippingMethod: ShippingMethod;
  supplierProcessingDays: number;
  includeCustoms: boolean;
  isPeakSeason: boolean;
}

export interface LeadTimeBreakdown {
  supplierProcessing: number;
  shippingTransit: number;
  customsClearance: number;
  peakSeasonBuffer: number;
  totalDays: number;
}

export interface LeadTimeResult {
  breakdown: LeadTimeBreakdown;
  estimatedArrival: Date;
  warnings: string[];
  isPeakSeason: boolean;
  shippingMethod: ShippingMethod;
  supplierLocation: SupplierLocation;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Shipping transit times in days by method and origin
 * Requirement: 6.2
 */
export const TRANSIT_TIMES: Record<SupplierLocation, Record<ShippingMethod, { min: number; max: number }>> = {
  china: {
    air: { min: 5, max: 10 },
    sea: { min: 25, max: 40 },
    express: { min: 3, max: 5 },
    rail: { min: 15, max: 25 },
  },
  india: {
    air: { min: 4, max: 8 },
    sea: { min: 20, max: 35 },
    express: { min: 3, max: 5 },
    rail: { min: 18, max: 28 },
  },
  turkey: {
    air: { min: 3, max: 6 },
    sea: { min: 12, max: 20 },
    express: { min: 2, max: 4 },
    rail: { min: 10, max: 15 },
  },
  usa: {
    air: { min: 5, max: 10 },
    sea: { min: 30, max: 45 },
    express: { min: 3, max: 5 },
    rail: { min: 0, max: 0 }, // Not applicable
  },
  europe: {
    air: { min: 3, max: 7 },
    sea: { min: 15, max: 25 },
    express: { min: 2, max: 4 },
    rail: { min: 12, max: 18 },
  },
};

/**
 * Customs clearance times in days by origin country
 * Requirement: 6.3
 */
export const CUSTOMS_CLEARANCE: Record<SupplierLocation, { min: number; max: number }> = {
  china: { min: 3, max: 7 },
  india: { min: 3, max: 6 },
  turkey: { min: 2, max: 5 },
  usa: { min: 2, max: 4 },
  europe: { min: 2, max: 4 },
};

/**
 * Peak season buffer (additional days)
 * Requirement: 6.5
 */
export const PEAK_SEASON_BUFFER = 7;

/**
 * Peak season months (October to January)
 */
export const PEAK_SEASON_MONTHS = [10, 11, 12, 1];

/**
 * Location display names
 */
export const LOCATION_NAMES: Record<SupplierLocation, { en: string; ar: string }> = {
  china: { en: 'China', ar: 'الصين' },
  india: { en: 'India', ar: 'الهند' },
  turkey: { en: 'Turkey', ar: 'تركيا' },
  usa: { en: 'USA', ar: 'أمريكا' },
  europe: { en: 'Europe', ar: 'أوروبا' },
};

/**
 * Shipping method display names
 */
export const METHOD_NAMES: Record<ShippingMethod, { en: string; ar: string }> = {
  air: { en: 'Air Freight', ar: 'الشحن الجوي' },
  sea: { en: 'Sea Freight', ar: 'الشحن البحري' },
  express: { en: 'Express Courier', ar: 'الشحن السريع' },
  rail: { en: 'Rail Freight', ar: 'الشحن بالقطار' },
};

/**
 * Validates that a value is a valid positive number.
 */
export function isValidPositiveNumber(value: unknown): value is number {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'number') return false;
  if (Number.isNaN(value)) return false;
  if (!Number.isFinite(value)) return false;
  if (value < 0) return false;
  return true;
}

/**
 * Validates lead time calculation inputs.
 */
export function validateInputs(inputs: Partial<LeadTimeInput>): ValidationResult {
  const { supplierLocation, shippingMethod, supplierProcessingDays } = inputs;

  if (!supplierLocation || !Object.keys(LOCATION_NAMES).includes(supplierLocation)) {
    return { isValid: false, error: 'Invalid supplier location' };
  }

  if (!shippingMethod || !Object.keys(METHOD_NAMES).includes(shippingMethod)) {
    return { isValid: false, error: 'Invalid shipping method' };
  }

  // Rail not available from USA
  if (supplierLocation === 'usa' && shippingMethod === 'rail') {
    return { isValid: false, error: 'Rail freight not available from USA' };
  }

  if (!isValidPositiveNumber(supplierProcessingDays)) {
    return { isValid: false, error: 'Supplier processing days must be a positive number' };
  }

  return { isValid: true };
}

/**
 * Checks if current date is in peak season
 */
export function isCurrentlyPeakSeason(): boolean {
  const currentMonth = new Date().getMonth() + 1;
  return PEAK_SEASON_MONTHS.includes(currentMonth);
}

/**
 * Calculates the average of min and max values
 */
function getAverageDays(range: { min: number; max: number }): number {
  return Math.ceil((range.min + range.max) / 2);
}

/**
 * Performs lead time calculation
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */
export function calculateLeadTime(
  inputs: Partial<LeadTimeInput>,
  locale: string = 'en'
): LeadTimeResult | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { 
    supplierLocation, 
    shippingMethod, 
    supplierProcessingDays,
    includeCustoms = true,
    isPeakSeason = isCurrentlyPeakSeason()
  } = inputs as LeadTimeInput;

  const warnings: string[] = [];

  // Get transit time
  const transitRange = TRANSIT_TIMES[supplierLocation][shippingMethod];
  const shippingTransit = getAverageDays(transitRange);

  // Get customs clearance time
  const customsRange = CUSTOMS_CLEARANCE[supplierLocation];
  const customsClearance = includeCustoms ? getAverageDays(customsRange) : 0;

  // Peak season buffer
  const peakSeasonBuffer = isPeakSeason ? PEAK_SEASON_BUFFER : 0;

  // Calculate total
  const totalDays = supplierProcessingDays + shippingTransit + customsClearance + peakSeasonBuffer;

  // Calculate estimated arrival date
  const estimatedArrival = new Date();
  estimatedArrival.setDate(estimatedArrival.getDate() + totalDays);

  // Generate warnings
  if (isPeakSeason) {
    warnings.push(locale === 'ar'
      ? 'تحذير: موسم الذروة - قد تتأخر الشحنات بسبب ارتفاع الطلب'
      : 'Warning: Peak season - shipments may be delayed due to high demand'
    );
  }

  if (shippingMethod === 'sea' && supplierLocation === 'china') {
    warnings.push(locale === 'ar'
      ? 'ملاحظة: الشحن البحري من الصين قد يتأثر بازدحام الموانئ'
      : 'Note: Sea freight from China may be affected by port congestion'
    );
  }

  if (supplierProcessingDays > 14) {
    warnings.push(locale === 'ar'
      ? 'تنبيه: وقت معالجة المورد طويل - تأكد من التواصل مع المورد'
      : 'Alert: Long supplier processing time - ensure communication with supplier'
    );
  }

  const breakdown: LeadTimeBreakdown = {
    supplierProcessing: supplierProcessingDays,
    shippingTransit,
    customsClearance,
    peakSeasonBuffer,
    totalDays,
  };

  return {
    breakdown,
    estimatedArrival,
    warnings,
    isPeakSeason,
    shippingMethod,
    supplierLocation,
  };
}

/**
 * Gets location display name based on locale
 */
export function getLocationName(location: SupplierLocation, locale: string = 'en'): string {
  return locale === 'ar' ? LOCATION_NAMES[location].ar : LOCATION_NAMES[location].en;
}

/**
 * Gets shipping method display name based on locale
 */
export function getMethodName(method: ShippingMethod, locale: string = 'en'): string {
  return locale === 'ar' ? METHOD_NAMES[method].ar : METHOD_NAMES[method].en;
}

/**
 * Formats date for display
 */
export function formatDate(date: Date, locale: string = 'en'): string {
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Gets transit time range string
 */
export function getTransitTimeRange(
  location: SupplierLocation, 
  method: ShippingMethod, 
  locale: string = 'en'
): string {
  const range = TRANSIT_TIMES[location][method];
  if (range.min === 0 && range.max === 0) {
    return locale === 'ar' ? 'غير متاح' : 'N/A';
  }
  return locale === 'ar' 
    ? `${range.min}-${range.max} يوم`
    : `${range.min}-${range.max} days`;
}
