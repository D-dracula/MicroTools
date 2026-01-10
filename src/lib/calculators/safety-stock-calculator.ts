/**
 * Safety Stock and Reorder Point Calculator
 * 
 * Calculates safety stock levels and reorder points to prevent stockouts.
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7
 */

export interface SafetyStockInput {
  averageDailySales: number;
  leadTimeDays: number;
  safetyDays: number; // default 7
  currentStock?: number;
  salesVariability?: number; // standard deviation of daily sales (optional)
}

export type UrgencyLevel = 'normal' | 'warning' | 'critical';

export interface SafetyStockResult {
  safetyStock: number;
  reorderPoint: number;
  daysUntilStockout?: number;
  needsReorder: boolean;
  urgencyLevel: UrgencyLevel;
  projectedStockoutDate?: Date;
  recommendedOrderQuantity: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates input values for the safety stock calculator.
 */
export function validateSafetyStockInput(input: Partial<SafetyStockInput>): ValidationResult {
  const { averageDailySales, leadTimeDays, safetyDays, currentStock } = input;

  if (averageDailySales === undefined || averageDailySales === null) {
    return { isValid: false, error: 'Average daily sales is required' };
  }
  if (averageDailySales <= 0) {
    return { isValid: false, error: 'Average daily sales must be greater than 0' };
  }
  if (leadTimeDays === undefined || leadTimeDays === null) {
    return { isValid: false, error: 'Lead time is required' };
  }
  if (leadTimeDays <= 0) {
    return { isValid: false, error: 'Lead time must be greater than 0' };
  }
  if (safetyDays !== undefined && safetyDays < 0) {
    return { isValid: false, error: 'Safety days cannot be negative' };
  }
  if (currentStock !== undefined && currentStock < 0) {
    return { isValid: false, error: 'Current stock cannot be negative' };
  }

  return { isValid: true };
}

/**
 * Calculates safety stock.
 * Formula: Safety Stock = Average Daily Sales × Safety Days
 * Requirements: 3.3
 */
export function calculateSafetyStockAmount(
  averageDailySales: number,
  safetyDays: number
): number {
  return averageDailySales * safetyDays;
}

/**
 * Calculates reorder point.
 * Formula: Reorder Point = (Average Daily Sales × Lead Time) + Safety Stock
 * Requirements: 3.1, 3.2
 */
export function calculateReorderPoint(
  averageDailySales: number,
  leadTimeDays: number,
  safetyStock: number
): number {
  return (averageDailySales * leadTimeDays) + safetyStock;
}


/**
 * Calculates days until stockout.
 * Formula: Days Until Stockout = Current Stock / Average Daily Sales
 * Requirements: 3.6
 */
export function calculateDaysUntilStockout(
  currentStock: number,
  averageDailySales: number
): number {
  if (averageDailySales <= 0) return Infinity;
  return currentStock / averageDailySales;
}

/**
 * Determines urgency level based on stock situation.
 * - Critical: Days until stockout < lead time
 * - Warning: Days until stockout < lead time + safety days
 * - Normal: Otherwise
 * Requirements: 3.7
 */
export function determineUrgencyLevel(
  daysUntilStockout: number,
  leadTimeDays: number,
  safetyDays: number
): UrgencyLevel {
  if (daysUntilStockout < leadTimeDays) {
    return 'critical';
  }
  if (daysUntilStockout < leadTimeDays + safetyDays) {
    return 'warning';
  }
  return 'normal';
}

/**
 * Calculates projected stockout date.
 */
export function calculateProjectedStockoutDate(daysUntilStockout: number): Date {
  const today = new Date();
  const stockoutDate = new Date(today);
  stockoutDate.setDate(today.getDate() + Math.floor(daysUntilStockout));
  return stockoutDate;
}

/**
 * Calculates recommended order quantity.
 * Based on lead time demand plus safety stock to cover until next order.
 */
export function calculateRecommendedOrderQuantity(
  averageDailySales: number,
  leadTimeDays: number,
  safetyDays: number
): number {
  // Order enough to cover lead time + safety period + some buffer
  const coverageDays = leadTimeDays + safetyDays + 7; // Extra week buffer
  return Math.ceil(averageDailySales * coverageDays);
}

/**
 * Main function to calculate safety stock and reorder point.
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7
 */
export function calculateSafetyStock(input: SafetyStockInput): SafetyStockResult {
  const {
    averageDailySales,
    leadTimeDays,
    safetyDays = 7, // Default 7 days (Requirement 3.3)
    currentStock,
  } = input;

  // Calculate safety stock (Requirement 3.3)
  const safetyStock = calculateSafetyStockAmount(averageDailySales, safetyDays);

  // Calculate reorder point (Requirements 3.1, 3.2)
  const reorderPoint = calculateReorderPoint(averageDailySales, leadTimeDays, safetyStock);

  // Calculate recommended order quantity
  const recommendedOrderQuantity = calculateRecommendedOrderQuantity(
    averageDailySales,
    leadTimeDays,
    safetyDays
  );

  // If current stock is provided, calculate additional metrics
  let daysUntilStockout: number | undefined;
  let needsReorder = false;
  let urgencyLevel: UrgencyLevel = 'normal';
  let projectedStockoutDate: Date | undefined;

  if (currentStock !== undefined) {
    // Calculate days until stockout (Requirement 3.6)
    daysUntilStockout = calculateDaysUntilStockout(currentStock, averageDailySales);

    // Determine if reorder is needed (Requirement 3.5)
    needsReorder = currentStock <= reorderPoint;

    // Determine urgency level (Requirement 3.7)
    urgencyLevel = determineUrgencyLevel(daysUntilStockout, leadTimeDays, safetyDays);

    // Calculate projected stockout date
    if (daysUntilStockout !== Infinity) {
      projectedStockoutDate = calculateProjectedStockoutDate(daysUntilStockout);
    }
  }

  return {
    safetyStock,
    reorderPoint,
    daysUntilStockout,
    needsReorder,
    urgencyLevel,
    projectedStockoutDate,
    recommendedOrderQuantity,
  };
}

/**
 * Formats number for display with appropriate decimal places.
 */
export function formatQuantity(value: number): string {
  return Math.round(value).toLocaleString();
}

/**
 * Formats days for display.
 */
export function formatDays(value: number): string {
  if (value === Infinity) return '∞';
  return `${value.toFixed(1)} days`;
}

/**
 * Formats date for display.
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
