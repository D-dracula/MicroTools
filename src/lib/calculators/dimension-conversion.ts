/**
 * Dimension Conversion Calculator Logic
 * 
 * Converts carton dimensions between cm and inches with volume calculation.
 * Requirements: 3.1, 3.2, 3.3
 */

export type DimensionUnit = 'cm' | 'inch';

export interface DimensionInput {
  length: number;
  width: number;
  height: number;
  unit: DimensionUnit;
}

export interface DimensionConversionResult {
  cm: {
    length: number;
    width: number;
    height: number;
    volume: number;
  };
  inch: {
    length: number;
    width: number;
    height: number;
    volume: number;
  };
  recommendedBoxSize?: string;
}

export interface BatchDimensionInput {
  boxes: DimensionInput[];
}

export interface BatchDimensionResult {
  results: DimensionConversionResult[];
  totalVolumeCm: number;
  totalVolumeInch: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Conversion constants
 */
const INCH_TO_CM = 2.54;
const CM_TO_INCH = 1 / INCH_TO_CM;
const CUBIC_CM_TO_CUBIC_INCH = Math.pow(CM_TO_INCH, 3);
const CUBIC_INCH_TO_CUBIC_CM = Math.pow(INCH_TO_CM, 3);

/**
 * Common box sizes for recommendations
 */
export const COMMON_BOX_SIZES = [
  { name: 'Small', cm: { l: 20, w: 15, h: 10 }, inch: { l: 8, w: 6, h: 4 } },
  { name: 'Medium', cm: { l: 30, w: 25, h: 20 }, inch: { l: 12, w: 10, h: 8 } },
  { name: 'Large', cm: { l: 45, w: 35, h: 30 }, inch: { l: 18, w: 14, h: 12 } },
  { name: 'Extra Large', cm: { l: 60, w: 45, h: 40 }, inch: { l: 24, w: 18, h: 16 } },
  { name: 'Flat/Document', cm: { l: 35, w: 25, h: 5 }, inch: { l: 14, w: 10, h: 2 } },
  { name: 'Shoe Box', cm: { l: 35, w: 22, h: 13 }, inch: { l: 14, w: 9, h: 5 } },
];

export const BOX_SIZE_NAMES: Record<string, { en: string; ar: string }> = {
  'Small': { en: 'Small Box', ar: 'صندوق صغير' },
  'Medium': { en: 'Medium Box', ar: 'صندوق متوسط' },
  'Large': { en: 'Large Box', ar: 'صندوق كبير' },
  'Extra Large': { en: 'Extra Large Box', ar: 'صندوق كبير جداً' },
  'Flat/Document': { en: 'Flat/Document Box', ar: 'صندوق مسطح/مستندات' },
  'Shoe Box': { en: 'Shoe Box', ar: 'صندوق أحذية' },
};

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
 * Validates dimension conversion inputs.
 */
export function validateInput(input: Partial<DimensionInput>): ValidationResult {
  const { length, width, height, unit } = input;

  if (!isValidPositiveNumber(length)) {
    return { isValid: false, error: 'Length must be a positive number' };
  }

  if (!isValidPositiveNumber(width)) {
    return { isValid: false, error: 'Width must be a positive number' };
  }

  if (!isValidPositiveNumber(height)) {
    return { isValid: false, error: 'Height must be a positive number' };
  }

  if (unit !== 'cm' && unit !== 'inch') {
    return { isValid: false, error: 'Invalid unit' };
  }

  return { isValid: true };
}

/**
 * Converts centimeters to inches with precision
 * Requirement: 3.1
 */
export function cmToInch(cm: number): number {
  return Math.round((cm * CM_TO_INCH) * 100) / 100; // 2 decimal places
}

/**
 * Converts inches to centimeters with precision
 * Requirement: 3.2
 */
export function inchToCm(inch: number): number {
  return Math.round((inch * INCH_TO_CM) * 10) / 10; // 1 decimal place
}

/**
 * Calculates volume in cubic centimeters
 */
export function calculateVolumeCm(length: number, width: number, height: number): number {
  return Math.round(length * width * height * 100) / 100;
}

/**
 * Calculates volume in cubic inches
 */
export function calculateVolumeInch(length: number, width: number, height: number): number {
  return Math.round(length * width * height * 100) / 100;
}

/**
 * Converts cubic centimeters to cubic inches
 */
export function cubicCmToCubicInch(cubicCm: number): number {
  return Math.round(cubicCm * CUBIC_CM_TO_CUBIC_INCH * 100) / 100;
}

/**
 * Converts cubic inches to cubic centimeters
 */
export function cubicInchToCubicCm(cubicInch: number): number {
  return Math.round(cubicInch * CUBIC_INCH_TO_CUBIC_CM * 100) / 100;
}

/**
 * Finds the closest recommended box size based on dimensions
 * Requirement: 3.4
 */
export function findRecommendedBoxSize(lengthCm: number, widthCm: number, heightCm: number): string | undefined {
  // Sort dimensions to compare regardless of orientation
  const dims = [lengthCm, widthCm, heightCm].sort((a, b) => b - a);
  
  for (const box of COMMON_BOX_SIZES) {
    const boxDims = [box.cm.l, box.cm.w, box.cm.h].sort((a, b) => b - a);
    
    // Check if the item fits in this box (with 10% tolerance for padding)
    const fits = dims[0] <= boxDims[0] * 1.1 &&
                 dims[1] <= boxDims[1] * 1.1 &&
                 dims[2] <= boxDims[2] * 1.1;
    
    if (fits) {
      return box.name;
    }
  }
  
  return undefined;
}

/**
 * Converts dimensions between cm and inches
 * Requirements: 3.1, 3.2, 3.3
 */
export function convertDimensions(input: Partial<DimensionInput>): DimensionConversionResult | null {
  const validation = validateInput(input);
  
  if (!validation.isValid) {
    return null;
  }

  const { length, width, height, unit } = input as DimensionInput;

  let lengthCm: number, widthCm: number, heightCm: number;
  let lengthInch: number, widthInch: number, heightInch: number;

  if (unit === 'cm') {
    lengthCm = length;
    widthCm = width;
    heightCm = height;
    lengthInch = cmToInch(length);
    widthInch = cmToInch(width);
    heightInch = cmToInch(height);
  } else {
    lengthInch = length;
    widthInch = width;
    heightInch = height;
    lengthCm = inchToCm(length);
    widthCm = inchToCm(width);
    heightCm = inchToCm(height);
  }

  const volumeCm = calculateVolumeCm(lengthCm, widthCm, heightCm);
  const volumeInch = calculateVolumeInch(lengthInch, widthInch, heightInch);

  const recommendedBoxSize = findRecommendedBoxSize(lengthCm, widthCm, heightCm);

  return {
    cm: {
      length: lengthCm,
      width: widthCm,
      height: heightCm,
      volume: volumeCm,
    },
    inch: {
      length: lengthInch,
      width: widthInch,
      height: heightInch,
      volume: volumeInch,
    },
    recommendedBoxSize,
  };
}

/**
 * Converts multiple boxes (batch conversion)
 * Requirement: 3.5
 */
export function convertBatchDimensions(input: BatchDimensionInput): BatchDimensionResult | null {
  if (!input.boxes || input.boxes.length === 0) {
    return null;
  }

  const results: DimensionConversionResult[] = [];
  let totalVolumeCm = 0;
  let totalVolumeInch = 0;

  for (const box of input.boxes) {
    const result = convertDimensions(box);
    if (result === null) {
      return null; // If any box fails validation, return null
    }
    results.push(result);
    totalVolumeCm += result.cm.volume;
    totalVolumeInch += result.inch.volume;
  }

  return {
    results,
    totalVolumeCm: Math.round(totalVolumeCm * 100) / 100,
    totalVolumeInch: Math.round(totalVolumeInch * 100) / 100,
  };
}

/**
 * Formats dimensions for display
 */
export function formatDimensions(length: number, width: number, height: number, unit: string): string {
  return `${length} × ${width} × ${height} ${unit}`;
}

/**
 * Formats volume for display
 */
export function formatVolume(volume: number, unit: string): string {
  if (unit === 'cm') {
    return `${volume.toLocaleString()} cm³`;
  }
  return `${volume.toLocaleString()} in³`;
}

/**
 * Gets the conversion formula explanation
 */
export function getConversionFormula(): { cmToInch: string; inchToCm: string } {
  return {
    cmToInch: '1 inch = 2.54 cm',
    inchToCm: '1 cm = 0.3937 inch',
  };
}
