/**
 * AI Inventory Forecaster Module
 * Predicts inventory stockout dates and generates reorder recommendations
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { chat, chatWithTools, estimateTokens, ChatMessage } from './openrouter-client';
import { 
  getLanguageInstruction, 
  formatCurrency, 
  selectDiverseSample, 
  formatSampleForAI,
  validateData,
  explainDataProblem,
  generateFallbackExplanation,
  logStep,
  logComplete,
  parseNumber,
  parseDate
} from './shared-utils';

// Types
export interface DailySalesRecord {
  date: string;
  productId: string;
  productName: string;
  quantitySold: number;
}

export interface ProductInventory {
  productId: string;
  productName: string;
  currentStock: number;
  reorderCost?: number;
  leadTimeDays?: number;
}

export interface SalesHistoryInput {
  salesData: DailySalesRecord[];
  products: ProductInventory[];
  defaultLeadTimeDays: number;
}

export interface ProductPrediction {
  productId: string;
  productName: string;
  currentStock: number;
  averageDailySales: number;
  predictedStockoutDate: string;
  daysUntilStockout: number;
  recommendedOrderQuantity: number;
  recommendedOrderDate: string;
  urgency: 'critical' | 'warning' | 'normal';
  salesTrend: 'increasing' | 'stable' | 'decreasing';
  weeklyBreakdown: WeeklySalesData[];
}

export interface WeeklySalesData {
  weekStart: string;
  weekEnd: string;
  totalSold: number;
  averageDaily: number;
}

export interface SeasonalPattern {
  period: string;
  periodArabic: string;
  expectedDemandIncrease: number;
  startDate: string;
  endDate: string;
  affectedProducts: string[];
  recommendation: string;
}

export interface UrgentAlert {
  productId: string;
  productName: string;
  message: string;
  messageArabic: string;
  severity: 'critical' | 'warning';
  daysUntilStockout: number;
  recommendedAction: string;
}

export interface InventoryForecastResult {
  predictions: ProductPrediction[];
  seasonalityPatterns: SeasonalPattern[];
  urgentAlerts: UrgentAlert[];
  recommendations: string[];
  summary: {
    totalProducts: number;
    criticalProducts: number;
    warningProducts: number;
    healthyProducts: number;
    totalCurrentStock: number;
    averageDaysUntilStockout: number;
  };
  tokensUsed: number;
  processingTime: number;
}

export interface ParsedSalesData {
  salesData: DailySalesRecord[];
  products: ProductInventory[];
  dateRange: { start: string; end: string };
  totalRows: number;
}

// Constants
const SAFETY_STOCK_DAYS = 7;
const DEFAULT_LEAD_TIME_DAYS = 14;
const CRITICAL_THRESHOLD_DAYS = 7;
const WARNING_THRESHOLD_DAYS = 21;

// Seasonal periods for Saudi Arabia / Middle East
const SEASONAL_PERIODS = [
  { id: 'ramadan', name: 'Ramadan', nameAr: 'رمضان', demandMultiplier: 1.5 },
  { id: 'eid_fitr', name: 'Eid Al-Fitr', nameAr: 'عيد الفطر', demandMultiplier: 2.0 },
  { id: 'eid_adha', name: 'Eid Al-Adha', nameAr: 'عيد الأضحى', demandMultiplier: 1.8 },
  { id: 'national_day', name: 'Saudi National Day', nameAr: 'اليوم الوطني', demandMultiplier: 1.3 },
  { id: 'summer', name: 'Summer Season', nameAr: 'موسم الصيف', demandMultiplier: 1.2 },
  { id: 'back_to_school', name: 'Back to School', nameAr: 'العودة للمدارس', demandMultiplier: 1.4 },
  { id: 'white_friday', name: 'White Friday', nameAr: 'الجمعة البيضاء', demandMultiplier: 2.5 },
];

// AI Prompt Templates
// Note: This prompt is a template. Use getSeasonalityPrompt(responseLanguage) to get the localized version.
const SEASONALITY_SYSTEM_PROMPT_BASE = `You are a data analyst specializing in e-commerce in Saudi Arabia and the Gulf region.
Your task is to analyze sales data and discover seasonal patterns.

Important seasons:
- Ramadan: increased demand for food and clothing
- Eid Al-Fitr: peak sales for clothing and gifts
- Eid Al-Adha: increased demand for clothing and supplies
- National Day: offers and discounts
- Summer: increased demand for electronics and entertainment
- Back to School: school supplies
- White Friday: highest sales peak

Analyze the data and identify:
1. Clear seasonal patterns
2. Products affected by each season
3. Expected demand increase percentage

Return the result in JSON format only.`;

/**
 * Get seasonality prompt with response language instruction
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', or 'custom:Hindi')
 */
function getSeasonalityPrompt(responseLanguage?: string): string {
  const languageInstruction = getLanguageInstruction(responseLanguage);
  return `${SEASONALITY_SYSTEM_PROMPT_BASE}\n\n${languageInstruction}`;
}

// Note: This prompt is a template. Use getInventoryRecommendationsPrompt(responseLanguage) to get the localized version.
const INVENTORY_RECOMMENDATIONS_PROMPT_BASE = `You are an inventory management consultant specializing in e-commerce.
Based on the inventory analysis provided, give practical recommendations to avoid stockouts.

Provide 3-5 specific and actionable recommendations.
Focus on:
1. Products that need urgent ordering
2. Suggested order quantities
3. Appropriate timing for orders
4. Preparing for upcoming seasons

Return the result as a JSON array of strings only.`;

/**
 * Get recommendations prompt with response language instruction
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', or 'custom:Hindi')
 */
function getInventoryRecommendationsPrompt(responseLanguage?: string): string {
  const languageInstruction = getLanguageInstruction(responseLanguage);
  return `${INVENTORY_RECOMMENDATIONS_PROMPT_BASE}\n\n${languageInstruction}`;
}

const INVENTORY_DATA_PARSER_SYSTEM_PROMPT = `You are a data analyst specializing in inventory management. Your task is to understand and analyze sales and inventory data from any file regardless of column names.

Analyze the provided data and extract for each row:
- date: sale date (YYYY-MM-DD)
- productId: product identifier (SKU or number)
- productName: product name
- quantitySold: quantity sold
- currentStock: current stock if available

Return the result in JSON format:
{"records": [{"date": "YYYY-MM-DD", "productId": "...", "productName": "...", "quantitySold": 0, "currentStock": 0}]}`;


/**
 * Parse sales history data using AI
 */
export async function parseSalesHistory(
  apiKey: string,
  data: Record<string, unknown>[],
  headers: string[]
): Promise<ParsedSalesData> {
  // Select diverse sample rows for AI (9 rows representing different scenarios)
  const sampleRows = selectDiverseSample(data, headers, 9);
  const dataPreview = formatSampleForAI(headers, sampleRows, data.length);

  const messages: ChatMessage[] = [
    { role: 'system', content: INVENTORY_DATA_PARSER_SYSTEM_PROMPT },
    { role: 'user', content: `Analyze the following inventory and sales data:\n\n${dataPreview}` }
  ];

  try {
    const response = await chat(apiKey, messages, { temperature: 0.1, maxTokens: 4000 });
    const parsed = JSON.parse(response.content);
    
    if (parsed.records && Array.isArray(parsed.records)) {
      const salesByProduct = new Map<string, DailySalesRecord[]>();
      const productInfo = new Map<string, { name: string; stock: number }>();
      let minDate = '';
      let maxDate = '';

      for (const r of parsed.records) {
        const record: DailySalesRecord = {
          date: String(r.date || new Date().toISOString().split('T')[0]),
          productId: String(r.productId || r.productName || ''),
          productName: String(r.productName || r.productId || ''),
          quantitySold: Number(r.quantitySold) || 1,
        };

        if (!record.productId) continue;

        const existing = salesByProduct.get(record.productId) || [];
        existing.push(record);
        salesByProduct.set(record.productId, existing);

        if (!productInfo.has(record.productId)) {
          productInfo.set(record.productId, {
            name: record.productName,
            stock: Number(r.currentStock) || 0,
          });
        }

        if (!minDate || record.date < minDate) minDate = record.date;
        if (!maxDate || record.date > maxDate) maxDate = record.date;
      }

      const salesData: DailySalesRecord[] = [];
      for (const records of salesByProduct.values()) {
        salesData.push(...records);
      }

      const products: ProductInventory[] = [];
      for (const [productId, info] of productInfo) {
        products.push({
          productId,
          productName: info.name,
          currentStock: info.stock,
        });
      }

      return {
        salesData,
        products,
        dateRange: { start: minDate, end: maxDate },
        totalRows: salesData.length,
      };
    }
  } catch {
    // Fallback to basic parsing
  }

  return fallbackParseSalesHistory(data, headers);
}

/**
 * Fallback parsing without AI
 */
function fallbackParseSalesHistory(data: Record<string, unknown>[], headers: string[]): ParsedSalesData {
  const salesByProduct = new Map<string, DailySalesRecord[]>();
  const productInfo = new Map<string, { name: string; stock: number }>();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const values = Object.entries(row);
    let productName = '';
    let quantity = 1;
    let stock = 0;

    for (const [, value] of values) {
      const numVal = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      if (typeof value === 'string' && value.length > 2 && !productName) {
        productName = value;
      }
      if (!isNaN(numVal) && numVal > 0 && numVal < 10000) {
        if (quantity === 1) quantity = numVal;
        else if (stock === 0) stock = numVal;
      }
    }

    if (productName) {
      const record: DailySalesRecord = {
        date: new Date().toISOString().split('T')[0],
        productId: productName,
        productName,
        quantitySold: quantity,
      };

      const existing = salesByProduct.get(productName) || [];
      existing.push(record);
      salesByProduct.set(productName, existing);

      if (!productInfo.has(productName)) {
        productInfo.set(productName, { name: productName, stock });
      }
    }
  }

  const salesData: DailySalesRecord[] = [];
  for (const records of salesByProduct.values()) {
    salesData.push(...records);
  }

  const products: ProductInventory[] = [];
  for (const [productId, info] of productInfo) {
    products.push({ productId, productName: info.name, currentStock: info.stock });
  }

  return { salesData, products, dateRange: { start: '', end: '' }, totalRows: salesData.length };
}

/**
 * Calculate average daily sales for a product
 */
export function calculateAverageDailySales(
  salesRecords: DailySalesRecord[],
  dateRange: { start: string; end: string }
): number {
  if (salesRecords.length === 0) return 0;

  const totalSold = salesRecords.reduce((sum, r) => sum + r.quantitySold, 0);
  
  // Calculate number of days in range
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return totalSold / daysDiff;
}

/**
 * Calculate weekly breakdown of sales
 */
export function calculateWeeklyBreakdown(
  salesRecords: DailySalesRecord[]
): WeeklySalesData[] {
  if (salesRecords.length === 0) return [];

  // Group by week
  const weeklyData = new Map<string, { sales: number; days: Set<string> }>();

  for (const record of salesRecords) {
    const date = new Date(record.date);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];

    const existing = weeklyData.get(weekKey) || { sales: 0, days: new Set() };
    existing.sales += record.quantitySold;
    existing.days.add(record.date);
    weeklyData.set(weekKey, existing);
  }

  // Convert to array
  const result: WeeklySalesData[] = [];
  for (const [weekStart, data] of weeklyData) {
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    result.push({
      weekStart,
      weekEnd: endDate.toISOString().split('T')[0],
      totalSold: data.sales,
      averageDaily: data.sales / Math.max(1, data.days.size),
    });
  }

  return result.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Get the start of the week (Sunday) for a date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculate sales trend (increasing, stable, decreasing)
 */
export function calculateSalesTrend(
  weeklyBreakdown: WeeklySalesData[]
): 'increasing' | 'stable' | 'decreasing' {
  if (weeklyBreakdown.length < 2) return 'stable';

  // Compare last 2 weeks with previous 2 weeks
  const recentWeeks = weeklyBreakdown.slice(-2);
  const previousWeeks = weeklyBreakdown.slice(-4, -2);

  if (previousWeeks.length === 0) return 'stable';

  const recentAvg = recentWeeks.reduce((sum, w) => sum + w.averageDaily, 0) / recentWeeks.length;
  const previousAvg = previousWeeks.reduce((sum, w) => sum + w.averageDaily, 0) / previousWeeks.length;

  const changePercent = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

  if (changePercent > 15) return 'increasing';
  if (changePercent < -15) return 'decreasing';
  return 'stable';
}

/**
 * Calculate stockout prediction for a product
 */
export function calculateStockoutPrediction(
  product: ProductInventory,
  averageDailySales: number,
  salesTrend: 'increasing' | 'stable' | 'decreasing',
  weeklyBreakdown: WeeklySalesData[],
  leadTimeDays: number
): ProductPrediction {
  const today = new Date();
  
  // Adjust average based on trend
  let adjustedDailySales = averageDailySales;
  if (salesTrend === 'increasing') {
    adjustedDailySales *= 1.15; // 15% increase expected
  } else if (salesTrend === 'decreasing') {
    adjustedDailySales *= 0.9; // 10% decrease expected
  }

  // Calculate days until stockout
  const daysUntilStockout = adjustedDailySales > 0 
    ? Math.round(product.currentStock / adjustedDailySales)
    : 999;

  // Calculate stockout date
  const stockoutDate = new Date(today);
  stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);

  // Determine urgency
  let urgency: 'critical' | 'warning' | 'normal' = 'normal';
  if (daysUntilStockout <= leadTimeDays) {
    urgency = 'critical';
  } else if (daysUntilStockout <= leadTimeDays + SAFETY_STOCK_DAYS) {
    urgency = 'warning';
  }

  // Calculate recommended order quantity (30 days of stock + safety stock)
  const targetDays = 30 + SAFETY_STOCK_DAYS;
  const recommendedQuantity = Math.ceil(adjustedDailySales * targetDays);

  // Calculate recommended order date (stockout date - lead time - safety days)
  const orderDate = new Date(stockoutDate);
  orderDate.setDate(orderDate.getDate() - leadTimeDays - SAFETY_STOCK_DAYS);

  return {
    productId: product.productId,
    productName: product.productName,
    currentStock: product.currentStock,
    averageDailySales: Math.round(adjustedDailySales * 100) / 100,
    predictedStockoutDate: stockoutDate.toISOString().split('T')[0],
    daysUntilStockout,
    recommendedOrderQuantity: recommendedQuantity,
    recommendedOrderDate: orderDate.toISOString().split('T')[0],
    urgency,
    salesTrend,
    weeklyBreakdown,
  };
}


/**
 * Generate urgent alerts for products
 */
export function generateUrgentAlerts(
  predictions: ProductPrediction[],
  leadTimeDays: number
): UrgentAlert[] {
  const alerts: UrgentAlert[] = [];

  for (const prediction of predictions) {
    if (prediction.urgency === 'critical') {
      alerts.push({
        productId: prediction.productId,
        productName: prediction.productName,
        severity: 'critical',
        daysUntilStockout: prediction.daysUntilStockout,
        message: `${prediction.productName} will run out in ${prediction.daysUntilStockout} days. Order ${prediction.recommendedOrderQuantity} units immediately!`,
        messageArabic: `${prediction.productName} سينفد خلال ${prediction.daysUntilStockout} يوم. اطلب ${prediction.recommendedOrderQuantity} وحدة فوراً!`,
        recommendedAction: `Order ${prediction.recommendedOrderQuantity} units by ${prediction.recommendedOrderDate}`,
      });
    } else if (prediction.urgency === 'warning') {
      alerts.push({
        productId: prediction.productId,
        productName: prediction.productName,
        severity: 'warning',
        daysUntilStockout: prediction.daysUntilStockout,
        message: `${prediction.productName} stock is low. Plan to order ${prediction.recommendedOrderQuantity} units soon.`,
        messageArabic: `مخزون ${prediction.productName} منخفض. خطط لطلب ${prediction.recommendedOrderQuantity} وحدة قريباً.`,
        recommendedAction: `Order ${prediction.recommendedOrderQuantity} units by ${prediction.recommendedOrderDate}`,
      });
    }
  }

  // Sort by severity and days until stockout
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'critical' ? -1 : 1;
    }
    return a.daysUntilStockout - b.daysUntilStockout;
  });
}

/**
 * Detect seasonality patterns using AI
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', or 'custom:Hindi')
 */
export async function detectSeasonality(
  apiKey: string,
  salesData: DailySalesRecord[],
  predictions: ProductPrediction[],
  responseLanguage?: string
): Promise<SeasonalPattern[]> {
  // Prepare sales summary by month
  const monthlySales = new Map<string, number>();
  for (const record of salesData) {
    const month = record.date.substring(0, 7); // YYYY-MM
    monthlySales.set(month, (monthlySales.get(month) || 0) + record.quantitySold);
  }

  const salesSummary = Array.from(monthlySales.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, sales]) => `${month}: ${sales} units`)
    .join('\n');

  const productNames = predictions.map(p => p.productName).slice(0, 10).join(', ');

  const messages: ChatMessage[] = [
    { role: 'system', content: getSeasonalityPrompt(responseLanguage) },
    {
      role: 'user',
      content: `Analyze the following sales data and discover seasonal patterns:

Monthly Sales:
${salesSummary}

Products: ${productNames}

Return the result in JSON format:
{
  "patterns": [
    {
      "period": "period_id",
      "periodArabic": "Season name in Arabic",
      "expectedDemandIncrease": 50,
      "affectedProducts": ["product1", "product2"],
      "recommendation": "Specific recommendation"
    }
  ]
}`,
    },
  ];

  try {
    const response = await chat(apiKey, messages, { temperature: 0.3, maxTokens: 1500 });
    const parsed = JSON.parse(response.content);
    
    if (parsed.patterns && Array.isArray(parsed.patterns)) {
      return parsed.patterns.map((p: Record<string, unknown>) => ({
        period: String(p.period || ''),
        periodArabic: String(p.periodArabic || ''),
        expectedDemandIncrease: Number(p.expectedDemandIncrease) || 0,
        startDate: String(p.startDate || ''),
        endDate: String(p.endDate || ''),
        affectedProducts: Array.isArray(p.affectedProducts) ? p.affectedProducts.map(String) : [],
        recommendation: String(p.recommendation || ''),
      }));
    }
    return [];
  } catch {
    // Return default seasonal patterns based on current date
    return getDefaultSeasonalPatterns();
  }
}

/**
 * Get default seasonal patterns based on current date
 */
function getDefaultSeasonalPatterns(): SeasonalPattern[] {
  const today = new Date();
  const month = today.getMonth() + 1;
  const patterns: SeasonalPattern[] = [];

  // Check upcoming seasons
  if (month >= 1 && month <= 3) {
    patterns.push({
      period: 'ramadan',
      periodArabic: 'رمضان',
      expectedDemandIncrease: 50,
      startDate: '',
      endDate: '',
      affectedProducts: [],
      recommendation: 'استعد لموسم رمضان بزيادة المخزون 50% للمنتجات الأساسية',
    });
  }

  if (month >= 8 && month <= 9) {
    patterns.push({
      period: 'back_to_school',
      periodArabic: 'العودة للمدارس',
      expectedDemandIncrease: 40,
      startDate: '',
      endDate: '',
      affectedProducts: [],
      recommendation: 'زد مخزون المستلزمات المدرسية استعداداً للعودة للمدارس',
    });
  }

  if (month >= 11 || month === 1) {
    patterns.push({
      period: 'white_friday',
      periodArabic: 'الجمعة البيضاء',
      expectedDemandIncrease: 150,
      startDate: '',
      endDate: '',
      affectedProducts: [],
      recommendation: 'الجمعة البيضاء قادمة - ضاعف المخزون للمنتجات الأكثر مبيعاً',
    });
  }

  return patterns;
}

/**
 * Generate AI recommendations with Tool Use for calculations
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', or 'custom:Hindi')
 * @param currency - User's preferred currency code (e.g., 'USD', 'SAR', 'EUR') - for future use with cost-based recommendations
 */
export async function generateRecommendations(
  apiKey: string,
  predictions: ProductPrediction[],
  alerts: UrgentAlert[],
  seasonalPatterns: SeasonalPattern[],
  responseLanguage?: string,
  currency: string = 'USD'
): Promise<string[]> {
  const criticalProducts = predictions.filter(p => p.urgency === 'critical');
  const warningProducts = predictions.filter(p => p.urgency === 'warning');

  const analysisContext = `
Inventory Analysis:
- Total Products: ${predictions.length}
- Critical Products (will run out soon): ${criticalProducts.length}
- Products needing attention: ${warningProducts.length}

Critical Products:
${criticalProducts.slice(0, 5).map(p => 
  `- ${p.productName}: ${p.currentStock} units remaining, will run out in ${p.daysUntilStockout} days`
).join('\n')}

Seasonal Patterns Detected:
${seasonalPatterns.map(s => `- ${s.period}: Expected demand increase ${s.expectedDemandIncrease}%`).join('\n')}
`;

  const systemPrompt = `${getInventoryRecommendationsPrompt(responseLanguage)}

IMPORTANT: When you need to calculate percentages, ratios, or any mathematical operations, use the 'calculate' tool instead of calculating yourself. This ensures accuracy.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: analysisContext },
  ];

  try {
    // Use chatWithTools for AI to use calculator when needed
    const response = await chatWithTools(apiKey, messages, { 
      temperature: 0.7, 
      maxTokens: 1500,
      enableCalculator: true,
    });
    const parsed = JSON.parse(response.content);
    return Array.isArray(parsed) ? parsed : parsed.recommendations || [];
  } catch {
    // Fallback to regular chat then fallback recommendations
    try {
      const response = await chat(apiKey, messages, { temperature: 0.7, maxTokens: 1500 });
      const parsed = JSON.parse(response.content);
      return Array.isArray(parsed) ? parsed : parsed.recommendations || [];
    } catch {
      return generateFallbackRecommendations(predictions, alerts, seasonalPatterns, responseLanguage, currency);
    }
  }
}

/**
 * Generate fallback recommendations without AI
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', or 'custom:Hindi')
 * @param currency - User's preferred currency code (e.g., 'USD', 'SAR', 'EUR') - for future use with cost-based recommendations
 */
function generateFallbackRecommendations(
  predictions: ProductPrediction[],
  alerts: UrgentAlert[],
  seasonalPatterns: SeasonalPattern[],
  responseLanguage?: string,
  currency: string = 'USD'
): string[] {
  const recommendations: string[] = [];
  // For fallback, we use simple language detection - Arabic if responseLanguage is 'ar'
  const isArabic = responseLanguage === 'ar';

  // Critical products
  const criticalCount = predictions.filter(p => p.urgency === 'critical').length;
  if (criticalCount > 0) {
    recommendations.push(isArabic
      ? `لديك ${criticalCount} منتج في حالة حرجة وسينفد قريباً. اطلب الكميات المطلوبة فوراً لتجنب توقف المبيعات.`
      : `You have ${criticalCount} products in critical condition that will run out soon. Order the required quantities immediately to avoid sales disruption.`
    );
  }

  // Warning products
  const warningCount = predictions.filter(p => p.urgency === 'warning').length;
  if (warningCount > 0) {
    recommendations.push(isArabic
      ? `${warningCount} منتج يحتاج انتباه. خطط لطلب الكميات خلال الأسبوع القادم.`
      : `${warningCount} products need attention. Plan to order quantities within the next week.`
    );
  }

  // Increasing trend products
  const increasingProducts = predictions.filter(p => p.salesTrend === 'increasing');
  if (increasingProducts.length > 0) {
    recommendations.push(isArabic
      ? `${increasingProducts.length} منتج يشهد زيادة في المبيعات. فكر في زيادة الكميات المطلوبة بنسبة 15-20%.`
      : `${increasingProducts.length} products are experiencing increased sales. Consider increasing order quantities by 15-20%.`
    );
  }

  // Seasonal recommendations
  for (const pattern of seasonalPatterns) {
    recommendations.push(pattern.recommendation);
  }

  // General recommendation
  if (recommendations.length === 0) {
    recommendations.push(isArabic
      ? 'مخزونك في حالة جيدة. استمر في مراقبة المبيعات وتحديث التوقعات أسبوعياً.'
      : 'Your inventory is in good condition. Continue monitoring sales and updating forecasts weekly.'
    );
  }

  return recommendations;
}

/**
 * Main forecast function - simplified single file approach
 */
export async function forecastInventory(
  apiKey: string,
  data: Record<string, unknown>[],
  headers: string[],
  options: { locale?: string; currency?: string; leadTimeDays?: number } = {}
): Promise<InventoryForecastResult> {
  const { locale = 'en', currency = 'USD', leadTimeDays = DEFAULT_LEAD_TIME_DAYS } = options;
  const startTime = Date.now();
  let tokensUsed = 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 [Inventory Forecaster] Starting analysis...');
  console.log(`📊 Data: ${data.length} rows`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Step 1: Parse sales history data
  const salesHistoryData = await parseSalesHistory(apiKey, data, headers);
  tokensUsed += estimateTokens(JSON.stringify(data.slice(0, 9))) * 2;

  const { salesData, products } = salesHistoryData;

  // Group sales by product
  const salesByProduct = new Map<string, DailySalesRecord[]>();
  for (const record of salesData) {
    const existing = salesByProduct.get(record.productId) || [];
    existing.push(record);
    salesByProduct.set(record.productId, existing);
  }

  // Calculate date range
  const dates = salesData.map(r => r.date).sort();
  const dateRange = {
    start: dates[0] || new Date().toISOString().split('T')[0],
    end: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
  };

  // Calculate predictions for each product
  const predictions: ProductPrediction[] = [];
  for (const product of products) {
    const productSales = salesByProduct.get(product.productId) || [];
    const avgDailySales = calculateAverageDailySales(productSales, dateRange);
    const weeklyBreakdown = calculateWeeklyBreakdown(productSales);
    const salesTrend = calculateSalesTrend(weeklyBreakdown);
    const productLeadTime = product.leadTimeDays || leadTimeDays;

    const prediction = calculateStockoutPrediction(
      product,
      avgDailySales,
      salesTrend,
      weeklyBreakdown,
      productLeadTime
    );
    predictions.push(prediction);
  }

  // Sort predictions by urgency and days until stockout
  predictions.sort((a, b) => {
    const urgencyOrder = { critical: 0, warning: 1, normal: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return a.daysUntilStockout - b.daysUntilStockout;
  });

  // Generate urgent alerts
  const urgentAlerts = generateUrgentAlerts(predictions, leadTimeDays);

  // Detect seasonality patterns
  const seasonalityPatterns = await detectSeasonality(apiKey, salesData, predictions, locale);
  tokensUsed += estimateTokens(JSON.stringify(salesData)) * 2;

  // Generate AI recommendations
  const recommendations = await generateRecommendations(
    apiKey,
    predictions,
    urgentAlerts,
    seasonalityPatterns,
    locale,
    currency
  );
  tokensUsed += estimateTokens(JSON.stringify({ predictions, urgentAlerts, seasonalityPatterns })) * 2;

  // Calculate summary
  const criticalProducts = predictions.filter(p => p.urgency === 'critical').length;
  const warningProducts = predictions.filter(p => p.urgency === 'warning').length;
  const healthyProducts = predictions.length - criticalProducts - warningProducts;
  const totalCurrentStock = products.reduce((sum, p) => sum + p.currentStock, 0);
  const avgDaysUntilStockout = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + Math.min(p.daysUntilStockout, 365), 0) / predictions.length
    : 0;

  return {
    predictions,
    seasonalityPatterns,
    urgentAlerts,
    recommendations,
    summary: {
      totalProducts: predictions.length,
      criticalProducts,
      warningProducts,
      healthyProducts,
      totalCurrentStock,
      averageDaysUntilStockout: Math.round(avgDaysUntilStockout),
    },
    tokensUsed,
    processingTime: Date.now() - startTime,
  };
}

/**
 * Estimate tokens for forecast analysis
 */
export function estimateForecastTokens(data: Record<string, unknown>[]): number {
  const salesTokens = estimateTokens(JSON.stringify(data.slice(0, 9))) * 2;
  const recommendationsTokens = 2000;
  return salesTokens + recommendationsTokens;
}

/**
 * Format number for display
 */
export function formatNumber(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string, locale: string = 'en-US'): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get urgency label
 * Note: For multi-language support, use translations from messages/*.json
 * This function provides English fallback labels only
 */
export function getUrgencyLabel(urgency: 'critical' | 'warning' | 'normal', locale: string = 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    critical: { en: 'Critical' },
    warning: { en: 'Warning' },
    normal: { en: 'Normal' },
  };
  return labels[urgency][locale] || labels[urgency]['en'];
}

/**
 * Get trend label
 * Note: For multi-language support, use translations from messages/*.json
 * This function provides English fallback labels only
 */
export function getTrendLabel(trend: 'increasing' | 'stable' | 'decreasing', locale: string = 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    increasing: { en: 'Increasing' },
    stable: { en: 'Stable' },
    decreasing: { en: 'Decreasing' },
  };
  return labels[trend][locale] || labels[trend]['en'];
}

/**
 * Get urgency color class
 */
export function getUrgencyColor(urgency: 'critical' | 'warning' | 'normal'): string {
  const colors: Record<string, string> = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-amber-600 bg-amber-50 border-amber-200',
    normal: 'text-green-600 bg-green-50 border-green-200',
  };
  return colors[urgency];
}

/**
 * Get trend icon name
 */
export function getTrendIcon(trend: 'increasing' | 'stable' | 'decreasing'): string {
  const icons: Record<string, string> = {
    increasing: 'TrendingUp',
    stable: 'Minus',
    decreasing: 'TrendingDown',
  };
  return icons[trend];
}
