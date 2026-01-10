/**
 * Volumetric Weight Calculator Logic
 * 
 * Calculates volumetric weight and compares chargeable weight across carriers.
 * Requirements: 2.1, 2.2, 2.4
 */

export type DimensionUnit = 'cm' | 'inch';
export type WeightUnit = 'kg' | 'lb';

export interface VolumetricWeightInput {
  length: number;
  width: number;
  height: number;
  actualWeight: number;
  unit: DimensionUnit;
  weightUnit: WeightUnit;
}

export interface CarrierVolumetricResult {
  carrier: string;
  divisor: number;
  volumetricWeight: number;
  chargeableWeight: number;
}

export interface VolumetricWeightResult {
  volumetricWeight: number;
  actualWeight: number;
  chargeableWeight: number;
  isVolumetricHigher: boolean;
  carrierComparison: CarrierVolumetricResult[];
  dimensionsInCm: { length: number; width: number; height: number };
  actualWeightInKg: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Carrier divisors for volumetric weight calculation
 * Requirement: 2.4
 */
export const CARRIER_DIVISORS: Record<string, number> = {
  'DHL': 5000,
  'FedEx': 5000,
  'UPS': 5000,
  'Aramex': 6000,
  'SMSA': 5000,
  'Saudi Post': 6000,
};

/**
 * Carrier display names for UI
 */
export const CARRIER_NAMES: Record<string, { en: string; ar: string }> = {
  'DHL': { en: 'DHL', ar: 'دي إتش إل' },
  'FedEx': { en: 'FedEx', ar: 'فيديكس' },
  'UPS': { en: 'UPS', ar: 'يو بي إس' },
  'Aramex': { en: 'Aramex', ar: 'أرامكس' },
  'SMSA': { en: 'SMSA', ar: 'سمسا' },
  'Saudi Post': { en: 'Saudi Post', ar: 'البريد السعودي' },
};

export const ALL_CARRIERS = Object.keys(CARRIER_DIVISORS);

/**
 * Conversion constants
 */
const INCH_TO_CM = 2.54;
const LB_TO_KG = 0.453592;

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
 * Validates volumetric weight calculation inputs.
 */
export function validateInputs(inputs: Partial<VolumetricWeightInput>): ValidationResult {
  const { length, width, height, actualWeight, unit, weightUnit } = inputs;

  if (!isValidPositiveNumber(length)) {
    return { isValid: false, error: 'Length must be a positive number' };
  }

  if (!isValidPositiveNumber(width)) {
    return { isValid: false, error: 'Width must be a positive number' };
  }

  if (!isValidPositiveNumber(height)) {
    return { isValid: false, error: 'Height must be a positive number' };
  }

  if (!isValidPositiveNumber(actualWeight)) {
    return { isValid: false, error: 'Actual weight must be a positive number' };
  }

  if (unit !== 'cm' && unit !== 'inch') {
    return { isValid: false, error: 'Invalid dimension unit' };
  }

  if (weightUnit !== 'kg' && weightUnit !== 'lb') {
    return { isValid: false, error: 'Invalid weight unit' };
  }

  return { isValid: true };
}

/**
 * Converts dimensions to centimeters
 */
export function convertToCm(value: number, unit: DimensionUnit): number {
  return unit === 'inch' ? value * INCH_TO_CM : value;
}

/**
 * Converts weight to kilograms
 */
export function convertToKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value * LB_TO_KG : value;
}

/**
 * Calculates volumetric weight using the standard formula
 * Formula: (L × W × H) / divisor
 * Requirement: 2.1
 */
export function calculateVolumetricWeightWithDivisor(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  divisor: number
): number {
  return (lengthCm * widthCm * heightCm) / divisor;
}

/**
 * Determines the chargeable weight (greater of actual or volumetric)
 * Requirement: 2.2
 */
export function calculateChargeableWeight(actualWeight: number, volumetricWeight: number): number {
  return Math.max(actualWeight, volumetricWeight);
}

/**
 * Performs all volumetric weight calculations
 * Requirements: 2.1, 2.2, 2.4
 */
export function calculateVolumetricWeight(inputs: Partial<VolumetricWeightInput>): VolumetricWeightResult | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { length, width, height, actualWeight, unit, weightUnit } = inputs as VolumetricWeightInput;

  // Convert to standard units (cm and kg)
  const lengthCm = convertToCm(length, unit);
  const widthCm = convertToCm(width, unit);
  const heightCm = convertToCm(height, unit);
  const actualWeightKg = convertToKg(actualWeight, weightUnit);

  // Calculate volumetric weight for each carrier
  const carrierComparison: CarrierVolumetricResult[] = Object.entries(CARRIER_DIVISORS).map(
    ([carrier, divisor]) => {
      const volumetricWeight = calculateVolumetricWeightWithDivisor(lengthCm, widthCm, heightCm, divisor);
      const chargeableWeight = calculateChargeableWeight(actualWeightKg, volumetricWeight);
      
      return {
        carrier,
        divisor,
        volumetricWeight: Math.round(volumetricWeight * 100) / 100,
        chargeableWeight: Math.round(chargeableWeight * 100) / 100,
      };
    }
  );

  // Standard volumetric weight (using 5000 divisor)
  const standardVolumetric = calculateVolumetricWeightWithDivisor(lengthCm, widthCm, heightCm, 5000);
  const standardChargeable = calculateChargeableWeight(actualWeightKg, standardVolumetric);

  return {
    volumetricWeight: Math.round(standardVolumetric * 100) / 100,
    actualWeight: Math.round(actualWeightKg * 100) / 100,
    chargeableWeight: Math.round(standardChargeable * 100) / 100,
    isVolumetricHigher: standardVolumetric > actualWeightKg,
    carrierComparison,
    dimensionsInCm: {
      length: Math.round(lengthCm * 100) / 100,
      width: Math.round(widthCm * 100) / 100,
      height: Math.round(heightCm * 100) / 100,
    },
    actualWeightInKg: Math.round(actualWeightKg * 100) / 100,
  };
}

/**
 * Formats a weight value with kg unit.
 */
export function formatWeight(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)} kg`;
}

/**
 * Formats dimensions for display
 */
export function formatDimensions(length: number, width: number, height: number, unit: string = 'cm'): string {
  return `${length} × ${width} × ${height} ${unit}`;
}

/**
 * Gets the volumetric weight formula explanation
 */
export function getFormulaExplanation(divisor: number = 5000): string {
  return `(L × W × H) / ${divisor}`;
}
