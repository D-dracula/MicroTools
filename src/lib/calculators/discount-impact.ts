/**
 * Discount Impact Simulator
 * 
 * Simulates the impact of discounts on profit margin and calculates break-even units.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

export interface DiscountImpactInput {
  originalPrice: number;
  productCost: number;
  discountPercentage: number;
  currentMonthlySales: number;
}

export interface ProfitComparison {
  salesVolume: number;
  originalProfit: number;
  discountedProfit: number;
  difference: number;
}

export interface DiscountImpactResult {
  originalMargin: number; // percentage
  discountedPrice: number;
  discountedMargin: number; // percentage
  marginReduction: number; // percentage points
  breakEvenUnits: number;
  salesIncreaseNeeded: number; // percentage
  profitComparison: ProfitComparison[];
  isViable: boolean;
  warning?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates input values for the discount impact simulator.
 */
export function validateDiscountInput(input: Partial<DiscountImpactInput>): ValidationResult {
  const { originalPrice, productCost, discountPercentage, currentMonthlySales } = input;

  if (originalPrice === undefined || originalPrice === null) {
    return { isValid: false, error: 'Original price is required' };
  }
  if (originalPrice <= 0) {
    return { isValid: false, error: 'Original price must be greater than 0' };
  }
  if (productCost === undefined || productCost === null) {
    return { isValid: false, error: 'Product cost is required' };
  }
  if (productCost < 0) {
    return { isValid: false, error: 'Product cost cannot be negative' };
  }
  if (discountPercentage === undefined || discountPercentage === null) {
    return { isValid: false, error: 'Discount percentage is required' };
  }
  if (discountPercentage < 0) {
    return { isValid: false, error: 'Discount percentage cannot be negative' };
  }
  if (discountPercentage > 100) {
    return { isValid: false, error: 'Discount percentage cannot exceed 100%' };
  }
  if (currentMonthlySales === undefined || currentMonthlySales === null) {
    return { isValid: false, error: 'Current monthly sales is required' };
  }
  if (currentMonthlySales < 0) {
    return { isValid: false, error: 'Current monthly sales cannot be negative' };
  }

  return { isValid: true };
}

/**
 * Calculates original margin percentage.
 * Formula: Original Margin = (Original Price - Cost) / Original Price × 100
 * Requirements: 4.2
 */
export function calculateOriginalMargin(originalPrice: number, productCost: number): number {
  if (originalPrice <= 0) return 0;
  return ((originalPrice - productCost) / originalPrice) * 100;
}

/**
 * Calculates discounted price.
 * Formula: Discounted Price = Original Price × (1 - Discount Percentage / 100)
 * Requirements: 4.3
 */
export function calculateDiscountedPrice(originalPrice: number, discountPercentage: number): number {
  return originalPrice * (1 - discountPercentage / 100);
}

/**
 * Calculates discounted margin percentage.
 * Formula: Discounted Margin = (Discounted Price - Cost) / Discounted Price × 100
 * Requirements: 4.3
 */
export function calculateDiscountedMargin(discountedPrice: number, productCost: number): number {
  if (discountedPrice <= 0) return -Infinity;
  return ((discountedPrice - productCost) / discountedPrice) * 100;
}


/**
 * Calculates break-even units needed to maintain same total profit.
 * Formula: Break Even Units = Current Units × (Original Margin / Discounted Margin)
 * Requirements: 4.4
 */
export function calculateBreakEvenUnits(
  currentMonthlySales: number,
  originalMargin: number,
  discountedMargin: number
): number {
  if (discountedMargin <= 0) return Infinity;
  return currentMonthlySales * (originalMargin / discountedMargin);
}

/**
 * Calculates the percentage increase in sales needed to break even.
 * Formula: Sales Increase Needed = ((Break Even Units / Current Units) - 1) × 100
 * Requirements: 4.5
 */
export function calculateSalesIncreaseNeeded(
  breakEvenUnits: number,
  currentMonthlySales: number
): number {
  if (currentMonthlySales <= 0) return Infinity;
  if (breakEvenUnits === Infinity) return Infinity;
  return ((breakEvenUnits / currentMonthlySales) - 1) * 100;
}

/**
 * Calculates profit at a given sales volume.
 * Original Profit = Sales Volume × Original Price × (Original Margin / 100)
 * Discounted Profit = Sales Volume × Discounted Price × (Discounted Margin / 100)
 * Requirements: 4.6
 */
export function calculateProfitAtVolume(
  salesVolume: number,
  originalPrice: number,
  discountedPrice: number,
  originalMargin: number,
  discountedMargin: number
): ProfitComparison {
  // Profit per unit = Price - Cost = Price × (Margin / 100)
  const originalProfitPerUnit = originalPrice * (originalMargin / 100);
  const discountedProfitPerUnit = discountedMargin > 0 
    ? discountedPrice * (discountedMargin / 100) 
    : discountedPrice - (originalPrice * (1 - originalMargin / 100)); // Use cost directly if margin is negative

  const originalProfit = salesVolume * originalProfitPerUnit;
  const discountedProfit = salesVolume * discountedProfitPerUnit;

  return {
    salesVolume,
    originalProfit,
    discountedProfit,
    difference: discountedProfit - originalProfit,
  };
}

/**
 * Generates profit comparison table at different sales volumes.
 * Requirements: 4.6
 */
export function generateProfitComparisonTable(
  currentMonthlySales: number,
  originalPrice: number,
  discountedPrice: number,
  originalMargin: number,
  discountedMargin: number,
  breakEvenUnits: number
): ProfitComparison[] {
  const comparisons: ProfitComparison[] = [];
  
  // Generate comparison at various volume levels
  const volumeLevels = [
    currentMonthlySales,                    // Current sales
    Math.ceil(currentMonthlySales * 1.1),   // +10%
    Math.ceil(currentMonthlySales * 1.25),  // +25%
    Math.ceil(currentMonthlySales * 1.5),   // +50%
    Math.ceil(currentMonthlySales * 2),     // +100%
  ];

  // Add break-even point if it's finite and reasonable
  if (breakEvenUnits !== Infinity && breakEvenUnits > 0 && breakEvenUnits < currentMonthlySales * 10) {
    volumeLevels.push(Math.ceil(breakEvenUnits));
  }

  // Sort and remove duplicates
  const uniqueVolumes = [...new Set(volumeLevels)].sort((a, b) => a - b);

  for (const volume of uniqueVolumes) {
    comparisons.push(
      calculateProfitAtVolume(volume, originalPrice, discountedPrice, originalMargin, discountedMargin)
    );
  }

  return comparisons;
}


/**
 * Checks if discount exceeds margin and generates warning.
 * Requirements: 4.7
 */
export function checkDiscountViability(
  originalMargin: number,
  discountedMargin: number
): { isViable: boolean; warning?: string } {
  // If discounted margin is zero or negative, each sale results in a loss
  if (discountedMargin <= 0) {
    return {
      isViable: false,
      warning: 'Warning: This discount exceeds your profit margin. Each sale will result in a loss.',
    };
  }

  // If margin reduction is more than 50%, warn about significant impact
  if (discountedMargin < originalMargin * 0.5) {
    return {
      isViable: true,
      warning: 'Caution: This discount significantly reduces your profit margin. Ensure increased sales volume justifies the discount.',
    };
  }

  return { isViable: true };
}

/**
 * Main function to simulate discount impact.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
export function simulateDiscountImpact(input: DiscountImpactInput): DiscountImpactResult {
  const { originalPrice, productCost, discountPercentage, currentMonthlySales } = input;

  // Calculate original margin (Requirement 4.2)
  const originalMargin = calculateOriginalMargin(originalPrice, productCost);

  // Calculate discounted price (Requirement 4.3)
  const discountedPrice = calculateDiscountedPrice(originalPrice, discountPercentage);

  // Calculate discounted margin (Requirement 4.3)
  const discountedMargin = calculateDiscountedMargin(discountedPrice, productCost);

  // Calculate margin reduction
  const marginReduction = originalMargin - discountedMargin;

  // Calculate break-even units (Requirement 4.4)
  const breakEvenUnits = calculateBreakEvenUnits(currentMonthlySales, originalMargin, discountedMargin);

  // Calculate sales increase needed (Requirement 4.5)
  const salesIncreaseNeeded = calculateSalesIncreaseNeeded(breakEvenUnits, currentMonthlySales);

  // Generate profit comparison table (Requirement 4.6)
  const profitComparison = generateProfitComparisonTable(
    currentMonthlySales,
    originalPrice,
    discountedPrice,
    originalMargin,
    discountedMargin,
    breakEvenUnits
  );

  // Check viability and generate warning if needed (Requirement 4.7)
  const { isViable, warning } = checkDiscountViability(originalMargin, discountedMargin);

  return {
    originalMargin,
    discountedPrice,
    discountedMargin,
    marginReduction,
    breakEvenUnits,
    salesIncreaseNeeded,
    profitComparison,
    isViable,
    warning,
  };
}

/**
 * Formats currency value for display.
 */
export function formatCurrency(value: number, currency: string = 'SAR'): string {
  if (!isFinite(value)) return '∞';
  return `${value.toFixed(2)} ${currency}`;
}

/**
 * Formats percentage value for display.
 */
export function formatPercentage(value: number): string {
  if (!isFinite(value)) return '∞';
  return `${value.toFixed(2)}%`;
}

/**
 * Formats units for display.
 */
export function formatUnits(value: number): string {
  if (!isFinite(value)) return '∞';
  return Math.ceil(value).toLocaleString();
}
