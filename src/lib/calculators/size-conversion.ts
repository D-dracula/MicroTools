/**
 * Size Conversion Calculator Logic
 * 
 * Converts clothing and shoe sizes between Chinese and international systems (US/EU/UK).
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

export type SizeCategory = 'men-clothing' | 'women-clothing' | 'kids-clothing' | 'shoes';
export type SizeSystem = 'CN' | 'US' | 'EU' | 'UK';

export interface SizeConversionInput {
  category: SizeCategory;
  sourceSystem: SizeSystem;
  size: string;
}

export interface MeasurementInput {
  category: SizeCategory;
  chest?: number;
  waist?: number;
  hip?: number;
  footLength?: number;
}

export interface SizeConversionResult {
  CN: string;
  US: string;
  EU: string;
  UK: string;
  measurementRange?: {
    chest?: [number, number];
    waist?: [number, number];
    hip?: [number, number];
    footLength?: number;
  };
}

export interface SizeRecommendation {
  recommendedSize: string;
  system: SizeSystem;
  confidence: 'exact' | 'approximate';
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Size charts for different categories
 * Requirements: 1.1, 1.2
 */
export const SIZE_CHARTS = {
  'men-clothing': {
    CN: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    US: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    EU: ['44', '46', '48', '50', '52', '54'],
    UK: ['34', '36', '38', '40', '42', '44'],
    measurements: {
      chest: [[86, 91], [91, 96], [96, 101], [101, 106], [106, 111], [111, 116]] as [number, number][],
      waist: [[71, 76], [76, 81], [81, 86], [86, 91], [91, 96], [96, 101]] as [number, number][],
    }
  },
  'women-clothing': {
    CN: ['S', 'M', 'L', 'XL', 'XXL'],
    US: ['2-4', '6-8', '10-12', '14-16', '18-20'],
    EU: ['34-36', '38-40', '42-44', '46-48', '50-52'],
    UK: ['6-8', '10-12', '14-16', '18-20', '22-24'],
    measurements: {
      chest: [[80, 84], [84, 88], [88, 92], [92, 96], [96, 100]] as [number, number][],
      waist: [[60, 64], [64, 68], [68, 72], [72, 76], [76, 80]] as [number, number][],
      hip: [[86, 90], [90, 94], [94, 98], [98, 102], [102, 106]] as [number, number][],
    }
  },
  'kids-clothing': {
    CN: ['100', '110', '120', '130', '140', '150', '160'],
    US: ['3T', '4T', '5-6', '7-8', '10-12', '14', '16'],
    EU: ['98', '104', '116', '128', '140', '152', '164'],
    UK: ['3-4', '4-5', '5-6', '7-8', '9-10', '11-12', '13-14'],
    measurements: {
      chest: [[52, 54], [54, 56], [56, 60], [60, 64], [64, 68], [68, 72], [72, 76]] as [number, number][],
      waist: [[48, 50], [50, 52], [52, 54], [54, 56], [56, 58], [58, 60], [60, 62]] as [number, number][],
    }
  },
  'shoes': {
    CN: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
    US: ['4', '4.5', '5', '5.5', '6', '7', '8', '9', '10', '11', '12'],
    EU: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
    UK: ['2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11'],
    measurements: {
      footLength: [22.5, 23, 23.5, 24, 24.5, 25.5, 26, 27, 27.5, 28.5, 29.5] as number[],
    }
  }
} as const;

/**
 * Category display names for UI
 */
export const CATEGORY_NAMES: Record<SizeCategory, { en: string; ar: string }> = {
  'men-clothing': { en: "Men's Clothing", ar: 'ملابس رجالية' },
  'women-clothing': { en: "Women's Clothing", ar: 'ملابس نسائية' },
  'kids-clothing': { en: "Kids' Clothing", ar: 'ملابس أطفال' },
  'shoes': { en: 'Shoes', ar: 'أحذية' },
};

/**
 * Size system display names
 */
export const SYSTEM_NAMES: Record<SizeSystem, { en: string; ar: string }> = {
  CN: { en: 'Chinese', ar: 'صيني' },
  US: { en: 'US', ar: 'أمريكي' },
  EU: { en: 'EU', ar: 'أوروبي' },
  UK: { en: 'UK', ar: 'بريطاني' },
};

export const ALL_CATEGORIES: SizeCategory[] = ['men-clothing', 'women-clothing', 'kids-clothing', 'shoes'];
export const ALL_SYSTEMS: SizeSystem[] = ['CN', 'US', 'EU', 'UK'];

/**
 * Validates that a size exists in the given category and system
 */
export function isValidSize(category: SizeCategory, system: SizeSystem, size: string): boolean {
  const chart = SIZE_CHARTS[category];
  const sizes = chart[system] as readonly string[];
  return sizes.includes(size);
}

/**
 * Validates conversion input
 */
export function validateInput(input: Partial<SizeConversionInput>): ValidationResult {
  const { category, sourceSystem, size } = input;

  if (!category || !ALL_CATEGORIES.includes(category)) {
    return { isValid: false, error: 'Invalid category' };
  }

  if (!sourceSystem || !ALL_SYSTEMS.includes(sourceSystem)) {
    return { isValid: false, error: 'Invalid size system' };
  }

  if (!size || typeof size !== 'string' || size.trim() === '') {
    return { isValid: false, error: 'Size is required' };
  }

  if (!isValidSize(category, sourceSystem, size)) {
    return { isValid: false, error: 'Size not found in the selected system' };
  }

  return { isValid: true };
}

/**
 * Converts a size from one system to all other systems
 * Requirements: 1.2, 1.4
 */
export function convertSize(input: SizeConversionInput): SizeConversionResult | null {
  const validation = validateInput(input);
  if (!validation.isValid) {
    return null;
  }

  const { category, sourceSystem, size } = input;
  const chart = SIZE_CHARTS[category];
  const sourceIndex = (chart[sourceSystem] as readonly string[]).indexOf(size);

  if (sourceIndex === -1) {
    return null;
  }

  const result: SizeConversionResult = {
    CN: chart.CN[sourceIndex],
    US: chart.US[sourceIndex],
    EU: chart.EU[sourceIndex],
    UK: chart.UK[sourceIndex],
  };

  // Add measurement ranges if available
  if (category !== 'shoes') {
    const measurements = chart.measurements as { chest?: [number, number][]; waist?: [number, number][]; hip?: [number, number][] };
    result.measurementRange = {};
    
    if (measurements.chest && measurements.chest[sourceIndex]) {
      result.measurementRange.chest = measurements.chest[sourceIndex];
    }
    if (measurements.waist && measurements.waist[sourceIndex]) {
      result.measurementRange.waist = measurements.waist[sourceIndex];
    }
    if ('hip' in measurements && measurements.hip && measurements.hip[sourceIndex]) {
      result.measurementRange.hip = measurements.hip[sourceIndex];
    }
  } else {
    const shoeChart = chart as typeof SIZE_CHARTS['shoes'];
    result.measurementRange = {
      footLength: shoeChart.measurements.footLength[sourceIndex],
    };
  }

  return result;
}

/**
 * Recommends a size based on body measurements
 * Requirements: 1.3
 */
export function recommendSizeByMeasurement(input: MeasurementInput): SizeRecommendation | null {
  const { category, chest, waist, hip, footLength } = input;

  if (!category || !ALL_CATEGORIES.includes(category)) {
    return null;
  }

  const chart = SIZE_CHARTS[category];

  // For shoes, use foot length
  if (category === 'shoes') {
    if (footLength === undefined || footLength <= 0) {
      return null;
    }

    const shoeChart = chart as typeof SIZE_CHARTS['shoes'];
    const footLengths = shoeChart.measurements.footLength;
    
    // Find the closest foot length
    let closestIndex = 0;
    let minDiff = Math.abs(footLengths[0] - footLength);
    
    for (let i = 1; i < footLengths.length; i++) {
      const diff = Math.abs(footLengths[i] - footLength);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    const isExact = minDiff <= 0.5;
    
    return {
      recommendedSize: shoeChart.CN[closestIndex],
      system: 'CN',
      confidence: isExact ? 'exact' : 'approximate',
    };
  }

  // For clothing, use chest/waist/hip measurements
  const measurements = chart.measurements as { chest?: [number, number][]; waist?: [number, number][]; hip?: [number, number][] };
  
  // Determine which measurement to use based on what's provided
  let measurementToUse: number | undefined;
  let ranges: [number, number][] | undefined;

  if (chest !== undefined && chest > 0 && measurements.chest) {
    measurementToUse = chest;
    ranges = measurements.chest;
  } else if (waist !== undefined && waist > 0 && measurements.waist) {
    measurementToUse = waist;
    ranges = measurements.waist;
  } else if (hip !== undefined && hip > 0 && 'hip' in measurements && measurements.hip) {
    measurementToUse = hip;
    ranges = measurements.hip;
  }

  if (measurementToUse === undefined || !ranges) {
    return null;
  }

  // Find the size where measurement falls within range
  for (let i = 0; i < ranges.length; i++) {
    const [min, max] = ranges[i];
    if (measurementToUse >= min && measurementToUse <= max) {
      return {
        recommendedSize: chart.CN[i],
        system: 'CN',
        confidence: 'exact',
      };
    }
  }

  // If not in any range, find the closest
  let closestIndex = 0;
  let minDistance = Infinity;

  for (let i = 0; i < ranges.length; i++) {
    const [min, max] = ranges[i];
    const midpoint = (min + max) / 2;
    const distance = Math.abs(measurementToUse - midpoint);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return {
    recommendedSize: chart.CN[closestIndex],
    system: 'CN',
    confidence: 'approximate',
  };
}

/**
 * Gets all sizes for a category as a comparison table
 * Requirement: 1.5
 */
export function getSizeComparisonTable(category: SizeCategory): {
  headers: SizeSystem[];
  rows: string[][];
} {
  const chart = SIZE_CHARTS[category];
  const headers: SizeSystem[] = ['CN', 'US', 'EU', 'UK'];
  const rows: string[][] = [];

  const numSizes = chart.CN.length;
  for (let i = 0; i < numSizes; i++) {
    rows.push([
      chart.CN[i],
      chart.US[i],
      chart.EU[i],
      chart.UK[i],
    ]);
  }

  return { headers, rows };
}

/**
 * Gets available sizes for a category and system
 */
export function getAvailableSizes(category: SizeCategory, system: SizeSystem): string[] {
  const chart = SIZE_CHARTS[category];
  return [...chart[system]];
}

/**
 * Formats a measurement range for display
 */
export function formatMeasurementRange(range: [number, number], unit: string = 'cm'): string {
  return `${range[0]}-${range[1]} ${unit}`;
}

/**
 * Formats a single measurement for display
 */
export function formatMeasurement(value: number, unit: string = 'cm'): string {
  return `${value} ${unit}`;
}
