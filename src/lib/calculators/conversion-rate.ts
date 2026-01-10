/**
 * Conversion Rate Calculator Logic
 * 
 * Implements conversion rate calculations with benchmark comparisons and recommendations.
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

export type TimePeriod = 'day' | 'week' | 'month' | 'year';

export interface ConversionRateInput {
  visitors: number;
  conversions: number;
  timePeriod?: TimePeriod;
}

export interface BenchmarkComparison {
  industry: string;
  averageRate: number;
  status: 'below' | 'average' | 'above' | 'excellent';
}

export interface ConversionRateResult {
  rate: number;
  isValid: boolean;
  benchmark: BenchmarkComparison;
  recommendations: string[];
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * E-commerce industry benchmarks for conversion rates
 */
export const ECOMMERCE_BENCHMARKS = {
  poor: 1,
  average: 2.5,
  good: 4,
  excellent: 6,
};

/**
 * Validates that a value is a valid non-negative number for calculations.
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
 * Validates conversion rate inputs.
 * Returns validation result with error message if invalid.
 * Requirement: 6.4
 */
export function validateInputs(inputs: Partial<ConversionRateInput>): ValidationResult {
  const { visitors, conversions } = inputs;

  if (!isValidNonNegativeNumber(visitors)) {
    return { isValid: false, error: 'Visitors must be a non-negative number' };
  }

  if (!isValidNonNegativeNumber(conversions)) {
    return { isValid: false, error: 'Conversions must be a non-negative number' };
  }

  if (visitors === 0) {
    return { isValid: false, error: 'Visitors cannot be zero' };
  }

  if (conversions > visitors) {
    return { isValid: false, error: 'Conversions cannot exceed visitors' };
  }

  return { isValid: true };
}

/**
 * Calculates conversion rate percentage.
 * Formula: rate = (conversions / visitors) × 100
 * Requirement: 6.1
 */
export function calculateRate(visitors: number, conversions: number): number {
  if (visitors === 0) return 0;
  return (conversions / visitors) * 100;
}

/**
 * Determines benchmark status based on conversion rate.
 * Requirement: 6.2
 */
export function getBenchmarkStatus(rate: number): BenchmarkComparison['status'] {
  if (rate >= ECOMMERCE_BENCHMARKS.excellent) return 'excellent';
  if (rate >= ECOMMERCE_BENCHMARKS.good) return 'above';
  if (rate >= ECOMMERCE_BENCHMARKS.average) return 'average';
  return 'below';
}

/**
 * Gets benchmark comparison for the calculated rate.
 * Requirement: 6.2
 */
export function getBenchmarkComparison(rate: number): BenchmarkComparison {
  return {
    industry: 'E-commerce',
    averageRate: ECOMMERCE_BENCHMARKS.average,
    status: getBenchmarkStatus(rate),
  };
}

/**
 * Gets recommendations based on conversion rate.
 * Requirement: 6.3
 */
export function getRecommendations(rate: number, language: 'ar' | 'en' = 'en'): string[] {
  const recommendations: string[] = [];

  if (language === 'ar') {
    if (rate < ECOMMERCE_BENCHMARKS.poor) {
      recommendations.push('راجع تجربة المستخدم على موقعك');
      recommendations.push('تأكد من سرعة تحميل الصفحات');
      recommendations.push('حسّن صفحات المنتجات بصور وأوصاف أفضل');
      recommendations.push('راجع أسعارك مقارنة بالمنافسين');
    } else if (rate < ECOMMERCE_BENCHMARKS.average) {
      recommendations.push('جرّب اختبارات A/B لتحسين صفحات الهبوط');
      recommendations.push('أضف شهادات العملاء والتقييمات');
      recommendations.push('بسّط عملية الدفع');
    } else if (rate < ECOMMERCE_BENCHMARKS.good) {
      recommendations.push('ركّز على استهداف الجمهور المناسب');
      recommendations.push('جرّب عروض محدودة الوقت');
      recommendations.push('حسّن رسائل البريد الإلكتروني للسلات المتروكة');
    } else {
      recommendations.push('حافظ على أدائك الممتاز!');
      recommendations.push('جرّب التوسع في قنوات تسويقية جديدة');
      recommendations.push('ركّز على زيادة قيمة الطلب المتوسط');
    }
  } else {
    if (rate < ECOMMERCE_BENCHMARKS.poor) {
      recommendations.push('Review your website user experience');
      recommendations.push('Ensure fast page load times');
      recommendations.push('Improve product pages with better images and descriptions');
      recommendations.push('Review your pricing compared to competitors');
    } else if (rate < ECOMMERCE_BENCHMARKS.average) {
      recommendations.push('Try A/B testing to improve landing pages');
      recommendations.push('Add customer testimonials and reviews');
      recommendations.push('Simplify the checkout process');
    } else if (rate < ECOMMERCE_BENCHMARKS.good) {
      recommendations.push('Focus on targeting the right audience');
      recommendations.push('Try limited-time offers');
      recommendations.push('Improve abandoned cart email campaigns');
    } else {
      recommendations.push('Maintain your excellent performance!');
      recommendations.push('Try expanding to new marketing channels');
      recommendations.push('Focus on increasing average order value');
    }
  }

  return recommendations;
}

/**
 * Calculates conversion rate with full analysis.
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function calculateConversionRate(
  input: Partial<ConversionRateInput>,
  language: 'ar' | 'en' = 'en'
): ConversionRateResult {
  const validation = validateInputs(input);

  if (!validation.isValid) {
    return {
      rate: 0,
      isValid: false,
      benchmark: {
        industry: 'E-commerce',
        averageRate: ECOMMERCE_BENCHMARKS.average,
        status: 'below',
      },
      recommendations: [],
      error: validation.error,
    };
  }

  const { visitors, conversions } = input as ConversionRateInput;
  const rate = calculateRate(visitors, conversions);

  return {
    rate,
    isValid: true,
    benchmark: getBenchmarkComparison(rate),
    recommendations: getRecommendations(rate, language),
  };
}

/**
 * Formats conversion rate for display.
 */
export function formatRate(rate: number, decimals: number = 2): string {
  return `${rate.toFixed(decimals)}%`;
}

/**
 * Gets status color class based on benchmark status.
 */
export function getStatusColor(status: BenchmarkComparison['status']): string {
  switch (status) {
    case 'excellent':
      return 'text-green-600';
    case 'above':
      return 'text-blue-600';
    case 'average':
      return 'text-yellow-600';
    case 'below':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}
