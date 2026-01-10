/**
 * CBM (Cubic Meter) Calculator Logic
 * 
 * Calculates container utilization and CBM for shipping containers.
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

export type ContainerType = '20ft' | '40ft' | '40hc' | '45hc';

export interface CartonDimensions {
  id: string;
  length: number;
  width: number;
  height: number;
  quantity: number;
}

export interface CBMInput {
  containerType: ContainerType;
  cartons: CartonDimensions[];
  unitSystem: 'cm' | 'inch';
}

export interface CartonCBMResult {
  id: string;
  cbmPerCarton: number;
  totalCBM: number;
  quantity: number;
}

export interface CBMResult {
  cartonResults: CartonCBMResult[];
  totalCBM: number;
  containerCapacity: number;
  utilizationPercentage: number;
  remainingCapacity: number;
  isOverCapacity: boolean;
  warnings: string[];
  containerType: ContainerType;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Container specifications in CBM
 * Requirement: 7.1
 */
export interface ContainerSpec {
  name: string;
  nameAr: string;
  capacityCBM: number;
  internalDimensions: {
    length: number; // meters
    width: number;
    height: number;
  };
  maxWeight: number; // kg
}

export const CONTAINER_SPECS: Record<ContainerType, ContainerSpec> = {
  '20ft': {
    name: '20ft Standard',
    nameAr: 'حاوية 20 قدم قياسية',
    capacityCBM: 33,
    internalDimensions: { length: 5.9, width: 2.35, height: 2.39 },
    maxWeight: 28000,
  },
  '40ft': {
    name: '40ft Standard',
    nameAr: 'حاوية 40 قدم قياسية',
    capacityCBM: 67,
    internalDimensions: { length: 12.03, width: 2.35, height: 2.39 },
    maxWeight: 28000,
  },
  '40hc': {
    name: '40ft High Cube',
    nameAr: 'حاوية 40 قدم عالية',
    capacityCBM: 76,
    internalDimensions: { length: 12.03, width: 2.35, height: 2.69 },
    maxWeight: 28000,
  },
  '45hc': {
    name: '45ft High Cube',
    nameAr: 'حاوية 45 قدم عالية',
    capacityCBM: 86,
    internalDimensions: { length: 13.56, width: 2.35, height: 2.69 },
    maxWeight: 28000,
  },
};

export const ALL_CONTAINER_TYPES = Object.keys(CONTAINER_SPECS) as ContainerType[];

/**
 * Conversion factor from cm³ to m³
 */
const CM3_TO_M3 = 1000000;

/**
 * Conversion factor from inch³ to m³
 */
const INCH3_TO_M3 = 61023.7;

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
 * Validates CBM calculation inputs.
 */
export function validateInputs(inputs: Partial<CBMInput>): ValidationResult {
  const { containerType, cartons } = inputs;

  if (!containerType || !ALL_CONTAINER_TYPES.includes(containerType)) {
    return { isValid: false, error: 'Invalid container type' };
  }

  if (!cartons || !Array.isArray(cartons) || cartons.length === 0) {
    return { isValid: false, error: 'At least one carton is required' };
  }

  for (const carton of cartons) {
    if (!isValidPositiveNumber(carton.length)) {
      return { isValid: false, error: 'Carton length must be a positive number' };
    }
    if (!isValidPositiveNumber(carton.width)) {
      return { isValid: false, error: 'Carton width must be a positive number' };
    }
    if (!isValidPositiveNumber(carton.height)) {
      return { isValid: false, error: 'Carton height must be a positive number' };
    }
    if (!isValidPositiveNumber(carton.quantity) || !Number.isInteger(carton.quantity)) {
      return { isValid: false, error: 'Carton quantity must be a positive integer' };
    }
  }

  return { isValid: true };
}

/**
 * Calculates CBM for a single carton
 * Requirement: 7.2
 */
export function calculateCartonCBM(
  length: number,
  width: number,
  height: number,
  unitSystem: 'cm' | 'inch' = 'cm'
): number {
  const volume = length * width * height;
  const divisor = unitSystem === 'cm' ? CM3_TO_M3 : INCH3_TO_M3;
  return volume / divisor;
}

/**
 * Performs CBM calculation for all cartons
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export function calculateCBM(
  inputs: Partial<CBMInput>,
  locale: string = 'en'
): CBMResult | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { containerType, cartons, unitSystem = 'cm' } = inputs as CBMInput;
  const containerSpec = CONTAINER_SPECS[containerType];
  const warnings: string[] = [];

  // Calculate CBM for each carton type
  const cartonResults: CartonCBMResult[] = cartons.map((carton) => {
    const cbmPerCarton = calculateCartonCBM(
      carton.length,
      carton.width,
      carton.height,
      unitSystem
    );
    return {
      id: carton.id,
      cbmPerCarton: Math.round(cbmPerCarton * 10000) / 10000,
      totalCBM: Math.round(cbmPerCarton * carton.quantity * 10000) / 10000,
      quantity: carton.quantity,
    };
  });

  // Calculate total CBM
  const totalCBM = cartonResults.reduce((sum, r) => sum + r.totalCBM, 0);
  const roundedTotalCBM = Math.round(totalCBM * 10000) / 10000;

  // Calculate utilization
  const containerCapacity = containerSpec.capacityCBM;
  const utilizationPercentage = Math.round((totalCBM / containerCapacity) * 10000) / 100;
  const remainingCapacity = Math.max(0, Math.round((containerCapacity - totalCBM) * 10000) / 10000);
  const isOverCapacity = totalCBM > containerCapacity;

  // Generate warnings
  if (isOverCapacity) {
    const overflow = Math.round((totalCBM - containerCapacity) * 100) / 100;
    warnings.push(locale === 'ar'
      ? `تحذير: تجاوز سعة الحاوية بـ ${overflow} متر مكعب. يُنصح باستخدام حاوية أكبر.`
      : `Warning: Container capacity exceeded by ${overflow} CBM. Consider using a larger container.`
    );

    // Suggest next container size
    const currentIndex = ALL_CONTAINER_TYPES.indexOf(containerType);
    if (currentIndex < ALL_CONTAINER_TYPES.length - 1) {
      const nextContainer = ALL_CONTAINER_TYPES[currentIndex + 1];
      const nextSpec = CONTAINER_SPECS[nextContainer];
      warnings.push(locale === 'ar'
        ? `اقتراح: استخدم ${nextSpec.nameAr} (${nextSpec.capacityCBM} متر مكعب)`
        : `Suggestion: Use ${nextSpec.name} (${nextSpec.capacityCBM} CBM)`
      );
    }
  } else if (utilizationPercentage > 90) {
    warnings.push(locale === 'ar'
      ? 'ملاحظة: نسبة الاستخدام عالية جداً. تأكد من وجود مساحة للتحميل والتفريغ.'
      : 'Note: Utilization is very high. Ensure there is space for loading and unloading.'
    );
  } else if (utilizationPercentage < 50) {
    warnings.push(locale === 'ar'
      ? 'ملاحظة: نسبة الاستخدام منخفضة. قد يكون من الأفضل استخدام حاوية أصغر أو الشحن المشترك (LCL).'
      : 'Note: Low utilization. Consider using a smaller container or LCL (Less than Container Load) shipping.'
    );
  }

  return {
    cartonResults,
    totalCBM: roundedTotalCBM,
    containerCapacity,
    utilizationPercentage,
    remainingCapacity,
    isOverCapacity,
    warnings,
    containerType,
  };
}

/**
 * Gets container display name based on locale
 */
export function getContainerName(type: ContainerType, locale: string = 'en'): string {
  const spec = CONTAINER_SPECS[type];
  return locale === 'ar' ? spec.nameAr : spec.name;
}

/**
 * Formats CBM for display
 */
export function formatCBM(value: number, locale: string = 'en'): string {
  return locale === 'ar' 
    ? `${value.toFixed(4)} م³`
    : `${value.toFixed(4)} m³`;
}

/**
 * Generates a unique ID for cartons
 */
export function generateCartonId(): string {
  return `carton-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a default carton entry
 */
export function createDefaultCarton(): CartonDimensions {
  return {
    id: generateCartonId(),
    length: 0,
    width: 0,
    height: 0,
    quantity: 1,
  };
}
