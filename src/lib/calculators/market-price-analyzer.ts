/**
 * Market Price Positioning Analyzer
 * 
 * Analyzes product price compared to competitors to optimize pricing strategy.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

export interface MarketPriceInput {
  myPrice: number;
  competitorPrices: number[]; // minimum 3 prices
  productCategory?: string;
}

export type PositionCategory = 'budget' | 'value' | 'premium' | 'luxury';

export interface PriceRecommendation {
  action: 'increase' | 'decrease' | 'maintain';
  suggestedPrice?: number;
  reasoning: string;
}

export interface CompetitorAnalysis {
  belowMe: number;
  aboveMe: number;
  percentile: number;
}

export interface MarketPriceResult {
  pricePosition: number; // 0-100 percentage
  positionCategory: PositionCategory;
  marketAverage: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
  recommendation: PriceRecommendation;
  competitorAnalysis: CompetitorAnalysis;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates input values for the market price analyzer.
 * Requirements: 2.1
 */
export function validateMarketPriceInput(input: Partial<MarketPriceInput>): ValidationResult {
  const { myPrice, competitorPrices } = input;

  if (myPrice === undefined || myPrice === null) {
    return { isValid: false, error: 'Your price is required' };
  }
  if (myPrice <= 0) {
    return { isValid: false, error: 'Your price must be greater than 0' };
  }
  if (!competitorPrices || !Array.isArray(competitorPrices)) {
    return { isValid: false, error: 'Competitor prices are required' };
  }
  if (competitorPrices.length < 3) {
    return { isValid: false, error: 'Please enter at least 3 competitor prices' };
  }
  
  // Check for invalid competitor prices
  for (let i = 0; i < competitorPrices.length; i++) {
    if (competitorPrices[i] <= 0) {
      return { isValid: false, error: `Competitor price ${i + 1} must be greater than 0` };
    }
  }

  return { isValid: true };
}

/**
 * Calculates price position percentage.
 * Formula: Position = (My Price - Min Price) / (Max Price - Min Price) × 100
 * Requirements: 2.2
 */
export function calculatePricePosition(myPrice: number, minPrice: number, maxPrice: number): number {
  if (maxPrice === minPrice) {
    // All prices are the same, position is 50%
    return 50;
  }
  
  const position = ((myPrice - minPrice) / (maxPrice - minPrice)) * 100;
  
  // Clamp to 0-100 range for prices outside competitor range
  return Math.max(0, Math.min(100, position));
}

/**
 * Categorizes price position into market segments.
 * Requirements: 2.3
 */
export function categorizePosition(position: number): PositionCategory {
  if (position < 25) return 'budget';
  if (position < 50) return 'value';
  if (position < 75) return 'premium';
  return 'luxury';
}


/**
 * Generates pricing recommendations based on position and market average.
 * Requirements: 2.4, 2.5, 2.6
 */
export function generateRecommendation(
  myPrice: number,
  marketAverage: number,
  position: number,
  category: PositionCategory
): PriceRecommendation {
  const priceDiffPercent = ((myPrice - marketAverage) / marketAverage) * 100;
  
  // Price is below market average - opportunity to increase (Requirement 2.5)
  if (myPrice < marketAverage) {
    const suggestedIncrease = Math.min(marketAverage, myPrice * 1.1); // Suggest up to 10% increase or market average
    
    if (category === 'budget') {
      return {
        action: 'increase',
        suggestedPrice: suggestedIncrease,
        reasoning: `Your price is ${Math.abs(priceDiffPercent).toFixed(1)}% below market average. Consider increasing price to improve margins while maintaining competitive positioning.`
      };
    }
    
    return {
      action: 'increase',
      suggestedPrice: suggestedIncrease,
      reasoning: `Your price is ${Math.abs(priceDiffPercent).toFixed(1)}% below market average. There's room to increase price without losing competitive advantage.`
    };
  }
  
  // Price is above market average - warn about sales impact (Requirement 2.6)
  if (myPrice > marketAverage) {
    if (category === 'luxury') {
      return {
        action: 'maintain',
        reasoning: `Your price is ${priceDiffPercent.toFixed(1)}% above market average. As a luxury-positioned product, ensure your value proposition justifies the premium. Warning: Higher prices may impact sales volume.`
      };
    }
    
    if (category === 'premium') {
      return {
        action: 'maintain',
        reasoning: `Your price is ${priceDiffPercent.toFixed(1)}% above market average. Premium positioning can work with strong branding. Warning: Monitor sales volume as higher prices may reduce demand.`
      };
    }
    
    // Value or budget category but above average - consider decrease
    return {
      action: 'decrease',
      suggestedPrice: marketAverage,
      reasoning: `Your price is ${priceDiffPercent.toFixed(1)}% above market average. Warning: This may significantly impact sales volume. Consider adjusting price closer to market average.`
    };
  }
  
  // Price equals market average
  return {
    action: 'maintain',
    reasoning: 'Your price is at market average. This is a balanced position that offers competitive pricing while maintaining reasonable margins.'
  };
}

/**
 * Analyzes competitor positioning relative to user's price.
 */
export function analyzeCompetitors(myPrice: number, competitorPrices: number[]): CompetitorAnalysis {
  const belowMe = competitorPrices.filter(p => p < myPrice).length;
  const aboveMe = competitorPrices.filter(p => p > myPrice).length;
  
  // Calculate percentile (what percentage of competitors are below my price)
  const totalCompetitors = competitorPrices.length;
  const percentile = totalCompetitors > 0 ? (belowMe / totalCompetitors) * 100 : 50;
  
  return {
    belowMe,
    aboveMe,
    percentile
  };
}

/**
 * Main function to analyze market price positioning.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export function analyzeMarketPrice(input: MarketPriceInput): MarketPriceResult {
  const { myPrice, competitorPrices } = input;
  
  // Calculate market statistics
  const allPrices = [...competitorPrices, myPrice];
  const minPrice = Math.min(...competitorPrices);
  const maxPrice = Math.max(...competitorPrices);
  const priceRange = maxPrice - minPrice;
  const marketAverage = competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length;
  
  // Calculate price position (Requirement 2.2)
  const pricePosition = calculatePricePosition(myPrice, minPrice, maxPrice);
  
  // Categorize position (Requirement 2.3)
  const positionCategory = categorizePosition(pricePosition);
  
  // Generate recommendation (Requirements 2.4, 2.5, 2.6)
  const recommendation = generateRecommendation(myPrice, marketAverage, pricePosition, positionCategory);
  
  // Analyze competitor positioning
  const competitorAnalysis = analyzeCompetitors(myPrice, competitorPrices);
  
  return {
    pricePosition,
    positionCategory,
    marketAverage,
    minPrice,
    maxPrice,
    priceRange,
    recommendation,
    competitorAnalysis
  };
}

/**
 * Formats currency value for display.
 */
export function formatCurrency(value: number, currency: string = 'SAR'): string {
  return `${value.toFixed(2)} ${currency}`;
}

/**
 * Formats percentage value for display.
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
