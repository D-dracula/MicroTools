/**
 * Customer Lifetime Value (LTV) Calculator Logic
 * 
 * Implements LTV calculations with CAC ratio analysis and recommendations.
 * Requirements: 7.1, 7.2, 7.4, 7.5
 */

export interface LTVInput {
  averageOrderValue: number;
  purchaseFrequency: number;  // Per year
  customerLifespan: number;   // In years
  customerAcquisitionCost?: number;
}

export interface LTVResult {
  ltv: number;
  ltvCacRatio?: number;
  isHealthy: boolean;
  recommendations: string[];
  warning?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Industry benchmarks for LTV:CAC ratio
 */
export const LTV_CAC_BENCHMARKS = {
  poor: 1,      // LTV = CAC (break-even)
  minimum: 3,   // Minimum healthy ratio
  good: 4,      // Good ratio
  excellent: 5, // Excellent ratio
};

/**
 * Validates that a value is a valid positive number for calculations.
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
 * Validates LTV inputs.
 * Returns validation result with error message if invalid.
 */
export function validateInputs(inputs: Partial<LTVInput>): ValidationResult {
  const { averageOrderValue, purchaseFrequency, customerLifespan, customerAcquisitionCost } = inputs;

  if (!isValidPositiveNumber(averageOrderValue)) {
    return { isValid: false, error: 'Average order value must be a positive number' };
  }

  if (!isValidPositiveNumber(purchaseFrequency)) {
    return { isValid: false, error: 'Purchase frequency must be a positive number' };
  }

  if (!isValidPositiveNumber(customerLifespan)) {
    return { isValid: false, error: 'Customer lifespan must be a positive number' };
  }

  // CAC is optional, but if provided must be positive
  if (customerAcquisitionCost !== undefined && !isValidPositiveNumber(customerAcquisitionCost)) {
    return { isValid: false, error: 'Customer acquisition cost must be a positive number' };
  }

  return { isValid: true };
}

/**
 * Calculates Customer Lifetime Value.
 * Formula: LTV = AOV × Purchase Frequency × Customer Lifespan
 * Requirement: 7.1
 */
export function calculateLTVValue(
  averageOrderValue: number,
  purchaseFrequency: number,
  customerLifespan: number
): number {
  return averageOrderValue * purchaseFrequency * customerLifespan;
}

/**
 * Calculates LTV:CAC ratio.
 * Requirement: 7.2
 */
export function calculateLTVCACRatio(ltv: number, cac: number): number {
  if (cac === 0) return Infinity;
  return ltv / cac;
}

/**
 * Determines if the business model is healthy based on LTV and CAC.
 * Requirement: 7.5
 */
export function isBusinessHealthy(ltv: number, cac?: number): boolean {
  if (cac === undefined) return true; // Can't determine without CAC
  return ltv >= cac;
}

/**
 * Gets the ratio status based on LTV:CAC ratio.
 */
export function getRatioStatus(ratio: number): 'poor' | 'minimum' | 'good' | 'excellent' {
  if (ratio >= LTV_CAC_BENCHMARKS.excellent) return 'excellent';
  if (ratio >= LTV_CAC_BENCHMARKS.good) return 'good';
  if (ratio >= LTV_CAC_BENCHMARKS.minimum) return 'minimum';
  return 'poor';
}

/**
 * Gets recommendations based on LTV and CAC.
 * Requirement: 7.4
 */
export function getLTVRecommendations(
  ltv: number,
  cac?: number,
  language: 'ar' | 'en' = 'en'
): string[] {
  const recommendations: string[] = [];
  const ratio = cac ? ltv / cac : undefined;

  if (language === 'ar') {
    // General LTV improvement recommendations
    recommendations.push('زيادة متوسط قيمة الطلب من خلال البيع المتقاطع والبيع الإضافي');
    recommendations.push('تحسين برامج الولاء لزيادة تكرار الشراء');
    
    if (ratio !== undefined) {
      if (ratio < LTV_CAC_BENCHMARKS.poor) {
        recommendations.push('⚠️ تحذير: نموذج العمل غير مستدام - قيمة العميل أقل من تكلفة اكتسابه');
        recommendations.push('خفض تكلفة اكتساب العملاء بشكل عاجل');
        recommendations.push('ركز على القنوات التسويقية الأكثر كفاءة');
      } else if (ratio < LTV_CAC_BENCHMARKS.minimum) {
        recommendations.push('حسّن نسبة LTV:CAC للوصول إلى 3:1 على الأقل');
        recommendations.push('راجع استراتيجية التسعير');
      } else if (ratio < LTV_CAC_BENCHMARKS.good) {
        recommendations.push('نسبة جيدة! استمر في تحسين الاحتفاظ بالعملاء');
      } else {
        recommendations.push('نسبة ممتازة! فكر في زيادة الإنفاق على اكتساب العملاء للنمو');
      }
    }
    
    recommendations.push('تحسين تجربة العملاء لزيادة فترة البقاء');
  } else {
    // General LTV improvement recommendations
    recommendations.push('Increase average order value through cross-selling and upselling');
    recommendations.push('Improve loyalty programs to increase purchase frequency');
    
    if (ratio !== undefined) {
      if (ratio < LTV_CAC_BENCHMARKS.poor) {
        recommendations.push('⚠️ Warning: Unsustainable business model - LTV is less than CAC');
        recommendations.push('Urgently reduce customer acquisition cost');
        recommendations.push('Focus on the most efficient marketing channels');
      } else if (ratio < LTV_CAC_BENCHMARKS.minimum) {
        recommendations.push('Improve LTV:CAC ratio to reach at least 3:1');
        recommendations.push('Review your pricing strategy');
      } else if (ratio < LTV_CAC_BENCHMARKS.good) {
        recommendations.push('Good ratio! Continue improving customer retention');
      } else {
        recommendations.push('Excellent ratio! Consider increasing acquisition spend for growth');
      }
    }
    
    recommendations.push('Improve customer experience to increase lifespan');
  }

  return recommendations;
}

/**
 * Calculates LTV with full analysis.
 * Requirements: 7.1, 7.2, 7.4, 7.5
 */
export function calculateLTV(
  input: Partial<LTVInput>,
  language: 'ar' | 'en' = 'en'
): LTVResult | { isValid: false; error: string } {
  const validation = validateInputs(input);

  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.error || 'Invalid input',
    };
  }

  const { averageOrderValue, purchaseFrequency, customerLifespan, customerAcquisitionCost } = input as LTVInput;
  
  const ltv = calculateLTVValue(averageOrderValue, purchaseFrequency, customerLifespan);
  const ltvCacRatio = customerAcquisitionCost 
    ? calculateLTVCACRatio(ltv, customerAcquisitionCost) 
    : undefined;
  const isHealthy = isBusinessHealthy(ltv, customerAcquisitionCost);

  let warning: string | undefined;
  if (customerAcquisitionCost && ltv < customerAcquisitionCost) {
    warning = language === 'ar'
      ? 'تحذير: قيمة العميل الدائم أقل من تكلفة اكتساب العميل. نموذج العمل غير مستدام.'
      : 'Warning: Customer Lifetime Value is less than Customer Acquisition Cost. Business model is unsustainable.';
  }

  return {
    ltv,
    ltvCacRatio,
    isHealthy,
    recommendations: getLTVRecommendations(ltv, customerAcquisitionCost, language),
    warning,
  };
}

/**
 * Formats currency value for display.
 */
export function formatCurrency(value: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats ratio for display.
 */
export function formatRatio(ratio: number): string {
  if (!Number.isFinite(ratio)) return '∞';
  return `${ratio.toFixed(1)}:1`;
}

/**
 * Gets status color class based on ratio status.
 */
export function getStatusColor(status: 'poor' | 'minimum' | 'good' | 'excellent'): string {
  switch (status) {
    case 'excellent':
      return 'text-green-600';
    case 'good':
      return 'text-blue-600';
    case 'minimum':
      return 'text-yellow-600';
    case 'poor':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}
