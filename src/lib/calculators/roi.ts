/**
 * ROI (Return on Investment) Calculator Logic
 * 
 * Calculates ROI, annualized ROI, and payback period for business investments.
 * Requirements: 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11
 */

export interface ROIInputs {
  initialInvestment: number;
  expectedRevenue: number;
  timePeriod: number;  // months
  ongoingCosts: number;
}

export interface ROIOutputs {
  netProfit: number;
  roiPercentage: number;
  annualizedROI: number;
  paybackPeriod: number;  // months
  isPositive: boolean;
  lossAmount?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

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
 * Validates that a value is a valid non-negative number.
 * Rejects: NaN, undefined, null, strings, negative numbers, Infinity
 */
export function isValidNonNegativeNumber(value: unknown): value is number {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'number') return false;
  if (Number.isNaN(value)) return false;
  if (!Number.isFinite(value)) return false;
  if (value < 0) return false;
  return true;
}


/**
 * Validates ROI calculation inputs.
 * Returns validation result with error message if invalid.
 * Requirement: 11.11
 */
export function validateInputs(inputs: Partial<ROIInputs>): ValidationResult {
  const { initialInvestment, expectedRevenue, timePeriod, ongoingCosts } = inputs;

  if (!isValidPositiveNumber(initialInvestment)) {
    return { isValid: false, error: 'Initial investment must be a positive number' };
  }

  if (!isValidNonNegativeNumber(expectedRevenue)) {
    return { isValid: false, error: 'Expected revenue must be a non-negative number' };
  }

  if (!isValidPositiveNumber(timePeriod)) {
    return { isValid: false, error: 'Time period must be a positive number' };
  }

  if (!isValidNonNegativeNumber(ongoingCosts)) {
    return { isValid: false, error: 'Ongoing costs must be a non-negative number' };
  }

  return { isValid: true };
}

/**
 * Calculates net profit.
 * Formula: NetProfit = Revenue - Investment - OngoingCosts
 * Requirement: 11.5
 */
export function calculateNetProfit(
  expectedRevenue: number,
  initialInvestment: number,
  ongoingCosts: number
): number {
  return expectedRevenue - initialInvestment - ongoingCosts;
}

/**
 * Calculates ROI percentage.
 * Formula: ROI = (NetProfit / Investment) × 100
 * Requirement: 11.6
 */
export function calculateROIPercentage(
  netProfit: number,
  initialInvestment: number
): number {
  return (netProfit / initialInvestment) * 100;
}

/**
 * Calculates annualized ROI.
 * Formula: AnnualizedROI = ROI × (12 / timePeriod)
 * Requirement: 11.7
 */
export function calculateAnnualizedROI(
  roiPercentage: number,
  timePeriod: number
): number {
  return roiPercentage * (12 / timePeriod);
}

/**
 * Calculates payback period in months.
 * Formula: PaybackPeriod = Investment / (NetProfit / timePeriod)
 * Requirement: 11.8
 */
export function calculatePaybackPeriod(
  initialInvestment: number,
  netProfit: number,
  timePeriod: number
): number {
  if (netProfit <= 0) {
    return Infinity; // Never pays back if no profit
  }
  const monthlyProfit = netProfit / timePeriod;
  return initialInvestment / monthlyProfit;
}

/**
 * Performs all ROI calculations.
 * Returns result with all metrics and warning for negative ROI.
 * Requirements: 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11
 */
export function calculateROI(inputs: Partial<ROIInputs>): ROIOutputs | null {
  const validation = validateInputs(inputs);
  
  if (!validation.isValid) {
    return null;
  }

  const { initialInvestment, expectedRevenue, timePeriod, ongoingCosts } = inputs as ROIInputs;

  // Calculate net profit - Requirement 11.5
  const netProfit = calculateNetProfit(expectedRevenue, initialInvestment, ongoingCosts);

  // Calculate ROI percentage - Requirement 11.6
  const roiPercentage = calculateROIPercentage(netProfit, initialInvestment);

  // Calculate annualized ROI - Requirement 11.7
  const annualizedROI = calculateAnnualizedROI(roiPercentage, timePeriod);

  // Calculate payback period - Requirement 11.8
  const paybackPeriod = calculatePaybackPeriod(initialInvestment, netProfit, timePeriod);

  // Check if ROI is positive - Requirement 11.10
  const isPositive = roiPercentage >= 0;

  const result: ROIOutputs = {
    netProfit,
    roiPercentage,
    annualizedROI,
    paybackPeriod,
    isPositive,
  };

  // Add loss amount if ROI is negative - Requirement 11.10
  if (!isPositive) {
    result.lossAmount = Math.abs(netProfit);
  }

  return result;
}

/**
 * Formats a number to a specified number of decimal places.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) {
    return '∞';
  }
  return value.toFixed(decimals);
}

/**
 * Formats a currency value.
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) {
    return '∞';
  }
  return value.toFixed(decimals);
}

/**
 * Formats a percentage value with % symbol.
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) {
    return '∞%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats payback period in a human-readable format.
 */
export function formatPaybackPeriod(months: number): string {
  if (!Number.isFinite(months) || months <= 0) {
    return '∞';
  }
  
  if (months < 1) {
    const days = Math.round(months * 30);
    return `${days} days`;
  }
  
  if (months < 12) {
    return `${months.toFixed(1)} months`;
  }
  
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);
  
  if (remainingMonths === 0) {
    return `${years} year${years > 1 ? 's' : ''}`;
  }
  
  return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
}
