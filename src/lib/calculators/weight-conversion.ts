/**
 * Weight Conversion Calculator Logic
 * 
 * Converts weights between grams, ounces, pounds, and kilograms.
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */

export type WeightUnit = 'g' | 'oz' | 'lb' | 'kg';

export type ShippingCategory = 'light' | 'medium' | 'heavy';

export interface WeightConversionInput {
  value: number;
  unit: WeightUnit;
}

export interface WeightConversionResult {
  grams: number;
  ounces: number;
  pounds: number;
  kilograms: number;
  shippingCategory: ShippingCategory;
  reference?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Conversion constants
 * Requirement: 5.1, 5.2
 */
const GRAMS_PER_OUNCE = 28.3495;
const GRAMS_PER_POUND = 453.592;
const GRAMS_PER_KILOGRAM = 1000;

/**
 * Shipping category thresholds (in grams)
 * Requirement: 5.5
 */
const LIGHT_THRESHOLD = 500; // < 500g
const MEDIUM_THRESHOLD = 2000; // 500g - 2kg

/**
 * Common product weight references
 * Requirement: 5.4
 */
export interface ProductReference {
  name: string;
  nameAr: string;
  weightGrams: number;
}

export const PRODUCT_REFERENCES: ProductReference[] = [
  { name: 'iPhone 15 Pro', nameAr: 'آيفون 15 برو', weightGrams: 187 },
  { name: 'MacBook Air 13"', nameAr: 'ماك بوك إير 13"', weightGrams: 1240 },
  { name: 'iPad Pro 11"', nameAr: 'آيباد برو 11"', weightGrams: 466 },
  { name: 'AirPods Pro', nameAr: 'إيربودز برو', weightGrams: 50.8 },
  { name: 'Apple Watch', nameAr: 'ساعة أبل', weightGrams: 38.7 },
  { name: 'Standard T-Shirt', nameAr: 'تيشيرت قياسي', weightGrams: 150 },
  { name: 'Jeans', nameAr: 'جينز', weightGrams: 600 },
  { name: 'Running Shoes', nameAr: 'حذاء رياضي', weightGrams: 300 },
  { name: 'Hardcover Book', nameAr: 'كتاب غلاف صلب', weightGrams: 500 },
  { name: 'Water Bottle (500ml)', nameAr: 'زجاجة ماء (500 مل)', weightGrams: 530 },
  { name: 'Laptop Bag', nameAr: 'حقيبة لابتوب', weightGrams: 800 },
  { name: 'Perfume (100ml)', nameAr: 'عطر (100 مل)', weightGrams: 350 },
];

/**
 * Unit display names
 */
export const UNIT_NAMES: Record<WeightUnit, { en: string; ar: string; symbol: string }> = {
  g: { en: 'Grams', ar: 'جرام', symbol: 'g' },
  oz: { en: 'Ounces', ar: 'أونصة', symbol: 'oz' },
  lb: { en: 'Pounds', ar: 'باوند', symbol: 'lb' },
  kg: { en: 'Kilograms', ar: 'كيلوجرام', symbol: 'kg' },
};

/**
 * Shipping category display names
 */
export const CATEGORY_NAMES: Record<ShippingCategory, { en: string; ar: string; description: string; descriptionAr: string }> = {
  light: { 
    en: 'Light', 
    ar: 'خفيف', 
    description: 'Under 500g - Ideal for small items and documents',
    descriptionAr: 'أقل من 500 جرام - مثالي للأغراض الصغيرة والمستندات'
  },
  medium: { 
    en: 'Medium', 
    ar: 'متوسط', 
    description: '500g - 2kg - Standard shipping rates apply',
    descriptionAr: '500 جرام - 2 كجم - تطبق أسعار الشحن القياسية'
  },
  heavy: { 
    en: 'Heavy', 
    ar: 'ثقيل', 
    description: 'Over 2kg - May incur additional shipping fees',
    descriptionAr: 'أكثر من 2 كجم - قد تُفرض رسوم شحن إضافية'
  },
};

export const ALL_UNITS: WeightUnit[] = ['g', 'oz', 'lb', 'kg'];

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
 * Validates weight conversion inputs.
 */
export function validateInputs(inputs: Partial<WeightConversionInput>): ValidationResult {
  const { value, unit } = inputs;

  if (!isValidPositiveNumber(value)) {
    return { isValid: false, error: 'Weight must be a positive number' };
  }

  if (!unit || !ALL_UNITS.includes(unit)) {
    return { isValid: false, error: 'Invalid weight unit' };
  }

  return { isValid: true };
}

/**
 * Converts any weight unit to grams
 */
export function toGrams(value: number, unit: WeightUnit): number {
  switch (unit) {
    case 'g':
      return value;
    case 'oz':
      return value * GRAMS_PER_OUNCE;
    case 'lb':
      return value * GRAMS_PER_POUND;
    case 'kg':
      return value * GRAMS_PER_KILOGRAM;
    default:
      return value;
  }
}

/**
 * Converts grams to any weight unit
 */
export function fromGrams(grams: number, unit: WeightUnit): number {
  switch (unit) {
    case 'g':
      return grams;
    case 'oz':
      return grams / GRAMS_PER_OUNCE;
    case 'lb':
      return grams / GRAMS_PER_POUND;
    case 'kg':
      return grams / GRAMS_PER_KILOGRAM;
    default:
      return grams;
  }
}

/**
 * Determines shipping category based on weight in grams
 * Requirement: 5.5
 */
export function getShippingCategory(grams: number): ShippingCategory {
  if (grams < LIGHT_THRESHOLD) {
    return 'light';
  } else if (grams <= MEDIUM_THRESHOLD) {
    return 'medium';
  } else {
    return 'heavy';
  }
}

/**
 * Finds the closest product reference for a given weight
 */
export function findClosestReference(grams: number): ProductReference | undefined {
  if (PRODUCT_REFERENCES.length === 0) return undefined;
  
  let closest = PRODUCT_REFERENCES[0];
  let minDiff = Math.abs(grams - closest.weightGrams);
  
  for (const ref of PRODUCT_REFERENCES) {
    const diff = Math.abs(grams - ref.weightGrams);
    if (diff < minDiff) {
      minDiff = diff;
      closest = ref;
    }
  }
  
  // Only return if within 50% of the reference weight
  if (minDiff <= closest.weightGrams * 0.5) {
    return closest;
  }
  
  return undefined;
}

/**
 * Performs weight conversion
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */
export function convertWeight(inputs: Partial<WeightConversionInput>): WeightConversionResult | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { value, unit } = inputs as WeightConversionInput;

  // Convert to grams first
  const grams = toGrams(value, unit);

  // Convert to all units
  const result: WeightConversionResult = {
    grams: Math.round(grams * 1000) / 1000,
    ounces: Math.round(fromGrams(grams, 'oz') * 1000) / 1000,
    pounds: Math.round(fromGrams(grams, 'lb') * 1000) / 1000,
    kilograms: Math.round(fromGrams(grams, 'kg') * 1000) / 1000,
    shippingCategory: getShippingCategory(grams),
  };

  // Find closest reference
  const reference = findClosestReference(grams);
  if (reference) {
    result.reference = reference.name;
  }

  return result;
}

/**
 * Formats weight value with unit
 * Requirement: 5.3 - precision up to 3 decimal places
 */
export function formatWeight(value: number, unit: WeightUnit, decimals: number = 3): string {
  return `${value.toFixed(decimals)} ${UNIT_NAMES[unit].symbol}`;
}

/**
 * Gets unit display name based on locale
 */
export function getUnitName(unit: WeightUnit, locale: string = 'en'): string {
  return locale === 'ar' ? UNIT_NAMES[unit].ar : UNIT_NAMES[unit].en;
}

/**
 * Gets shipping category display name based on locale
 */
export function getCategoryName(category: ShippingCategory, locale: string = 'en'): string {
  return locale === 'ar' ? CATEGORY_NAMES[category].ar : CATEGORY_NAMES[category].en;
}

/**
 * Gets shipping category description based on locale
 */
export function getCategoryDescription(category: ShippingCategory, locale: string = 'en'): string {
  return locale === 'ar' ? CATEGORY_NAMES[category].descriptionAr : CATEGORY_NAMES[category].description;
}

/**
 * Gets product reference name based on locale
 */
export function getReferenceName(reference: ProductReference, locale: string = 'en'): string {
  return locale === 'ar' ? reference.nameAr : reference.name;
}
