/**
 * Smart Profit Audit Module
 * AI-powered sales file analysis and expense classification
 * Uses Tool Use pattern for accurate financial calculations
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { chat, chatWithTools, estimateTokens, ChatMessage, CALCULATOR_TOOLS } from './openrouter-client';
import { calculateOrderProfit, aggregateOrders, calculateCostBreakdown } from '../math/financial-calculator';
import {
  parseNumber,
  parseDate,
  selectDiverseSample,
  formatSampleForAI,
  validateData,
  validateColumnMapping,
  explainDataProblem,
  generateFallbackExplanation,
  keywordClassify,
  logStep,
  logComplete,
  getLanguageInstruction,
  type ValidationResult,
  type DataQualityInfo,
} from './shared-utils';

// Types
export interface OrderRecord {
  orderId: string;
  date: string;
  productName: string;
  quantity: number;
  revenue: number;
  rawCosts: Record<string, number>;
}

export interface SalesFileData {
  orders: OrderRecord[];
  platform: 'salla' | 'zid' | 'shopify' | 'unknown';
  dateRange: { start: string; end: string };
  totalRows: number;
  // Data quality info
  dataQuality?: {
    skippedRows: number;
    warnings: string[];
    explanation?: string; // AI explanation of any issues
  };
}

export type ExpenseCategory = 'payment_gateway' | 'shipping' | 'tax' | 'refund' | 'other';

export interface ClassifiedCost {
  category: ExpenseCategory;
  amount: number;
  originalLabel: string;
}

export interface OrderProfitAnalysis {
  orderId: string;
  productName: string;
  date: string;
  revenue: number;
  classifiedCosts: ClassifiedCost[];
  totalCosts: number;
  netProfit: number;
  isProfitable: boolean;
}

export interface ProductLossAnalysis {
  productName: string;
  totalOrders: number;
  totalRevenue: number;
  totalCosts: number;
  totalLoss: number;
  averageLossPerOrder: number;
  lossReason: ExpenseCategory;
  recommendation: string;
}

export interface CostBreakdown {
  paymentGatewayFees: number;
  shippingCosts: number;
  taxes: number;
  refunds: number;
  otherCosts: number;
}

export interface SmartProfitResult {
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    totalOrders: number;
    profitableOrders: number;
    unprofitableOrders: number;
  };
  costBreakdown: CostBreakdown;
  orderAnalysis: OrderProfitAnalysis[];
  losingProducts: ProductLossAnalysis[];
  aiRecommendations: string[];
  tokensUsed: number;
  processingTime: number;
}

// ============================================
// Expense Classification Patterns (for keyword matching)
// ============================================
const EXPENSE_PATTERNS: Record<ExpenseCategory, string[]> = {
  payment_gateway: ['payment', 'gateway', 'fee', 'visa', 'mada', 'apple pay', 'tabby', 'stripe', 'paypal', 'stc'],
  shipping: ['shipping', 'delivery', 'aramex', 'smsa', 'dhl', 'fedex'],
  tax: ['tax', 'vat'],
  refund: ['refund', 'return', 'cancelled'],
  other: [],
};

// ============================================
// AI Prompts (tool-specific, not shared)
// ============================================
const EXPENSE_CLASSIFICATION_PROMPT = `You are a financial analyst specializing in e-commerce. Your task is to classify expenses in sales files.

Classify each expense into one of the following categories:
- payment_gateway: Payment gateway fees (Mada, Visa, Apple Pay, Tabby, STC Pay, PayPal, Stripe)
- shipping: Shipping costs (Aramex, SMSA, DHL, FedEx, Saudi Post, Naqel, SPL)
- tax: Taxes (VAT, value added tax)
- refund: Returns and refunds (refund, return, cancellation)
- other: Other expenses

Return the result in JSON format only without any additional text.`;

// Note: This prompt is a template. Use getRecommendationsPrompt(locale) to get the localized version.
const RECOMMENDATIONS_SYSTEM_PROMPT_BASE = `You are a business consultant specializing in e-commerce. Based on the profit analysis provided, give practical recommendations to improve profitability.

Provide 3-5 specific and actionable recommendations.
Focus on:
1. Reducing high costs
2. Improving profit margin
3. Dealing with losing products
4. Improving pricing strategy

Return the result as a JSON array of strings only.`;

/**
 * Get recommendations prompt with locale-specific response language
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', 'custom:Hindi')
 */
function getRecommendationsPrompt(responseLanguage?: string): string {
  const languageInstruction = getLanguageInstruction(responseLanguage);
  return `${RECOMMENDATIONS_SYSTEM_PROMPT_BASE}\n\n${languageInstruction}`;
}

const SALES_DATA_PARSER_SYSTEM_PROMPT = `You are a data analyst specializing in e-commerce sales files. Your task is to correctly identify and extract sales data.

CRITICAL RULES:
1. Revenue/Total Price is the SALE AMOUNT for the order (what customer paid for products)
2. Costs are SEPARATE columns like: shipping, fees, tax, refund - these are NOT part of revenue
3. Do NOT add costs to revenue - they should be extracted separately
4. Look for columns like: "Total", "Price", "Amount", "Revenue", "Sales" for the revenue value
5. Look for columns like: "Shipping", "Fee", "Tax", "Refund", "Cost" for cost values

IMPORTANT - REVENUE CALCULATION:
- If there's a "Total" or "Revenue" column with the full order amount, use that directly
- If there's a "UnitPrice" or "Price" column AND a "Quantity" column, revenue = UnitPrice × Quantity
- NEVER use UnitPrice alone as revenue when Quantity exists - you MUST multiply them

Extract for each row:
- orderId: order identifier (ID, Order Number, etc.)
- date: order date (format as YYYY-MM-DD)
- productName: product name
- quantity: quantity (default 1 if not found)
- revenue: the TOTAL SALE PRICE (UnitPrice × Quantity if no total column exists)
- costs: object with cost column names and their values (shipping, fees, tax, refund, etc.)

IMPORTANT: Revenue should be the total product sale price. Shipping, fees, tax, and refunds are COSTS, not revenue.

Return JSON format:
{"orders": [{"orderId": "...", "date": "YYYY-MM-DD", "productName": "...", "quantity": 1, "revenue": 0, "costs": {"Shipping Cost": 0, "Payment Fee": 0, "Tax": 0, "Refund": 0}}]}`;

// Local validation function with extended stats for sales data
export function validateSalesData(
  data: Record<string, unknown>[],
  headers: string[]
): { isValid: boolean; errors: string[]; warnings: string[]; stats: { totalRows: number; validRows: number; skippedRows: number; emptyRevenue: number; invalidDates: number } } {
  // Use shared validateData as base
  const baseValidation = validateData(data, headers, {
    requiredKeywords: ['total', 'price', 'amount', 'revenue'],
    minRows: 1,
    maxRows: 50000,
  });

  // Extended stats for sales data
  let emptyRevenue = 0;
  const invalidDates = 0;

  if (data && data.length > 0) {
    for (const row of data) {
      const hasNumericValue = Object.values(row).some(v => {
        const num = parseNumber(v);
        return num > 0;
      });
      if (!hasNumericValue) {
        emptyRevenue++;
      }
    }
  }

  return {
    isValid: baseValidation.isValid,
    errors: baseValidation.errors,
    warnings: baseValidation.warnings,
    stats: {
      ...baseValidation.stats,
      emptyRevenue,
      invalidDates,
    },
  };
}

/**
 * Local wrapper for column mapping validation with custom error messages
 */
function validateSalesColumnMapping(
  mapping: Record<string, unknown>,
  headers: string[]
): { isValid: boolean; errors: string[] } {
  const result = validateColumnMapping(mapping, headers, ['revenue']);
  
  // Convert warnings to errors for required fields
  const errors = [...result.errors];
  if (!mapping?.revenue) {
    errors.push('AI did not identify revenue column');
  }

  return { isValid: errors.length === 0, errors };
}

/**
// Export types for component use
export interface DataProblemExplanation {
  hasProblems: boolean;
  explanation: string;
  stats: {
    totalRows: number;
    validRows: number;
    skippedRows: number;
  };
}

/**
 * Parse sales file data using AI
 */
export async function parseSalesData(
  apiKey: string,
  data: Record<string, unknown>[],
  headers: string[] | Record<string, unknown>,
  platform: string
): Promise<SalesFileData> {
  // Ensure headers is an array
  const headerArray = Array.isArray(headers) 
    ? headers 
    : Object.keys(headers);
  
  // Validate data first
  console.log('   🔍 Validating CSV data...');
  const validation = validateSalesData(data, headerArray);
  
  if (!validation.isValid) {
    console.log('   ❌ Validation failed:', validation.errors);
    throw new Error(validation.errors.join('. '));
  }
  
  if (validation.warnings.length > 0) {
    console.log('   ⚠️ Warnings:', validation.warnings);
  }
  
  console.log(`   ✅ Validation passed: ${validation.stats.validRows}/${validation.stats.totalRows} valid rows`);

  // Select diverse sample rows for AI (9 rows representing different scenarios)
  const sampleRows = selectDiverseSample(data, headerArray, 9);
  const dataPreview = `Columns: ${headerArray.join(', ')}\n\nSample rows (${sampleRows.length} diverse examples):\n${sampleRows.map((row, i) => 
    `Row ${i + 1}: ${headerArray.map(h => `${h}: ${row[h] ?? 'N/A'}`).join(' | ')}`
  ).join('\n')}\n\nTotal rows in file: ${data.length}`;

  console.log(`   📄 Sending ${sampleRows.length} diverse sample rows to AI (file has ${data.length} rows)`);

  const messages: ChatMessage[] = [
    { role: 'system', content: SALES_DATA_PARSER_SYSTEM_PROMPT + `\n\nIMPORTANT: Return the column mapping so we can parse ALL ${data.length} rows. Format:
{
  "columnMapping": {
    "orderId": "column_name_for_order_id",
    "date": "column_name_for_date", 
    "productName": "column_name_for_product",
    "quantity": "column_name_for_quantity",
    "revenue": "column_name_for_total_revenue",
    "unitPrice": "column_name_for_unit_price_if_no_total",
    "costs": ["cost_column_1", "cost_column_2", ...]
  }
}

NOTE: 
- If there's a "Total" or "Revenue" column, use it for "revenue"
- If there's only "UnitPrice" or "Price" column, put it in "unitPrice" and leave "revenue" null
- We will calculate: revenue = unitPrice × quantity` },
    { role: 'user', content: `Analyze the following sales data columns:\n\n${dataPreview}` }
  ];

  try {
    const response = await chat(apiKey, messages, { temperature: 0.1, maxTokens: 2000 });
    const parsed = JSON.parse(response.content);
    
    // If AI returned column mapping, use it to parse ALL data
    if (parsed.columnMapping) {
      console.log('   🗺️ AI returned column mapping, validating...');
      const mapping = parsed.columnMapping;
      
      // Validate the mapping
      const mappingValidation = validateColumnMapping(mapping, headerArray);
      if (!mappingValidation.isValid) {
        console.log('   ⚠️ Column mapping has issues:', mappingValidation.errors);
        // Continue anyway, will use fallback for missing columns
      }
      
      console.log('   📊 Parsing all rows locally...');
      const orders: OrderRecord[] = [];
      let minDate = '';
      let maxDate = '';
      let skippedRows = 0;

      for (const row of data) {
        try {
          const quantity = Number(row[mapping.quantity]) || 1;
          
          // Calculate revenue: use direct revenue column OR unitPrice × quantity
          let revenue: number;
          if (mapping.revenue && row[mapping.revenue] !== undefined) {
            revenue = parseNumber(row[mapping.revenue]);
          } else if (mapping.unitPrice && row[mapping.unitPrice] !== undefined) {
            const unitPrice = parseNumber(row[mapping.unitPrice]);
            revenue = unitPrice * quantity;
          } else {
            revenue = 0;
          }
          
          const order: OrderRecord = {
            orderId: String(row[mapping.orderId] || `order-${orders.length + 1}`),
            date: parseDate(row[mapping.date]),
            productName: String(row[mapping.productName] || 'Unknown Product'),
            quantity,
            revenue,
            rawCosts: {},
          };

          if (order.revenue <= 0) {
            skippedRows++;
            continue;
          }

          // Extract costs from mapped columns
          if (Array.isArray(mapping.costs)) {
            for (const costCol of mapping.costs) {
              const val = parseNumber(row[costCol]);
              if (val > 0) {
                order.rawCosts[costCol] = val;
              }
            }
          }

          orders.push(order);
          if (!minDate || order.date < minDate) minDate = order.date;
          if (!maxDate || order.date > maxDate) maxDate = order.date;
        } catch (rowError) {
          skippedRows++;
          continue;
        }
      }

      console.log(`   ✅ Parsed ${orders.length} orders from ${data.length} rows (skipped: ${skippedRows})`);
      
      if (orders.length === 0) {
        console.log('   ⚠️ No valid orders found, falling back to basic parsing...');
        return fallbackParseSalesData(data, headerArray, platform);
      }

      // Generate explanation if there were issues
      let explanation: string | undefined;
      if (skippedRows > 0 || validation.warnings.length > 0) {
        console.log('   💬 Generating AI explanation for data issues...');
        try {
          // Note: locale will be passed from UI component, defaulting to 'en' for now
          explanation = await explainDataProblem(apiKey, {
            toolName: 'Smart Profit Audit',
            headers: headerArray,
            sampleRow: data[0] as Record<string, unknown>,
            errors: [],
            warnings: validation.warnings,
            skippedRows,
            totalRows: data.length,
          });
        } catch {
          explanation = generateFallbackExplanation({
            errors: [],
            warnings: validation.warnings,
            skippedRows,
            totalRows: data.length,
          });
        }
      }

      return {
        orders,
        platform: platform as SalesFileData['platform'],
        dateRange: { start: minDate || new Date().toISOString().split('T')[0], end: maxDate || new Date().toISOString().split('T')[0] },
        totalRows: orders.length,
        dataQuality: {
          skippedRows,
          warnings: validation.warnings,
          explanation,
        },
      };
    }
    
    // Fallback: AI returned parsed orders directly (old format)
    if (parsed.orders && Array.isArray(parsed.orders)) {
      const orders: OrderRecord[] = [];
      let minDate = '';
      let maxDate = '';

      for (const o of parsed.orders) {
        const order: OrderRecord = {
          orderId: String(o.orderId || ''),
          date: String(o.date || new Date().toISOString().split('T')[0]),
          productName: String(o.productName || 'Unknown Product'),
          quantity: Number(o.quantity) || 1,
          revenue: Number(o.revenue) || 0,
          rawCosts: {},
        };

        if (!order.orderId || order.revenue <= 0) continue;

        // Extract costs
        if (o.costs && typeof o.costs === 'object') {
          for (const [key, value] of Object.entries(o.costs)) {
            const numVal = Number(value);
            if (!isNaN(numVal) && numVal > 0) {
              order.rawCosts[key] = numVal;
            }
          }
        }

        orders.push(order);
        if (!minDate || order.date < minDate) minDate = order.date;
        if (!maxDate || order.date > maxDate) maxDate = order.date;
      }

      return {
        orders,
        platform: platform as SalesFileData['platform'],
        dateRange: { start: minDate, end: maxDate },
        totalRows: orders.length,
      };
    }
  } catch {
    // Fallback to basic parsing
  }

  return fallbackParseSalesData(data, headerArray, platform);
}

/**
 * Fallback parsing without AI
 */
function fallbackParseSalesData(
  data: Record<string, unknown>[],
  headers: string[],
  platform: string
): SalesFileData {
  const orders: OrderRecord[] = [];
  let minDate = '';
  let maxDate = '';

  // Identify column types by keywords
  const totalRevenueKeywords = ['total', 'amount', 'revenue', 'sales'];
  const unitPriceKeywords = ['unitprice', 'unit_price', 'price'];
  const costKeywords = ['shipping', 'fee', 'tax', 'refund', 'cost'];
  const idKeywords = ['id', 'order', 'number', 'invoice'];
  const dateKeywords = ['date'];
  const productKeywords = ['product', 'name', 'item', 'description'];
  const quantityKeywords = ['quantity', 'qty'];

  // Find column mappings
  let totalRevenueCol = '';
  let unitPriceCol = '';
  let idCol = '';
  let dateCol = '';
  let productCol = '';
  let quantityCol = '';
  const costCols: string[] = [];

  for (const header of headers) {
    const headerLower = header.toLowerCase();
    
    // Check for cost columns first (more specific)
    if (costKeywords.some(kw => headerLower.includes(kw))) {
      costCols.push(header);
    }
    // Check for total revenue (direct total amount)
    else if (totalRevenueKeywords.some(kw => headerLower.includes(kw)) && !totalRevenueCol) {
      totalRevenueCol = header;
    }
    // Check for unit price (needs to be multiplied by quantity)
    else if (unitPriceKeywords.some(kw => headerLower.includes(kw)) && !unitPriceCol) {
      unitPriceCol = header;
    }
    
    if (idKeywords.some(kw => headerLower.includes(kw)) && !idCol) {
      idCol = header;
    }
    if (dateKeywords.some(kw => headerLower.includes(kw)) && !dateCol) {
      dateCol = header;
    }
    if (productKeywords.some(kw => headerLower.includes(kw)) && !productCol) {
      productCol = header;
    }
    if (quantityKeywords.some(kw => headerLower.includes(kw)) && !quantityCol) {
      quantityCol = header;
    }
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Extract values
    const orderId = idCol ? String(row[idCol] || `order-${i + 1}`) : `order-${i + 1}`;
    const productName = productCol ? String(row[productCol] || 'Unknown Product') : 'Unknown Product';
    const quantity = quantityCol ? Number(row[quantityCol]) || 1 : 1;
    
    // Parse date
    let date = new Date().toISOString().split('T')[0];
    if (dateCol && row[dateCol]) {
      const dateStr = String(row[dateCol]);
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        date = parsed.toISOString().split('T')[0];
      }
    }

    // Parse revenue: use total revenue column OR unitPrice × quantity
    let revenue = 0;
    if (totalRevenueCol && row[totalRevenueCol] !== undefined) {
      const val = String(row[totalRevenueCol]).replace(/[^0-9.-]/g, '');
      revenue = parseFloat(val) || 0;
    } else if (unitPriceCol && row[unitPriceCol] !== undefined) {
      const val = String(row[unitPriceCol]).replace(/[^0-9.-]/g, '');
      const unitPrice = parseFloat(val) || 0;
      revenue = unitPrice * quantity; // Calculate total revenue
    }

    // Parse costs
    const rawCosts: Record<string, number> = {};
    for (const costCol of costCols) {
      if (row[costCol] !== undefined) {
        const val = String(row[costCol]).replace(/[^0-9.-]/g, '');
        const numVal = parseFloat(val) || 0;
        if (numVal > 0) {
          rawCosts[costCol] = numVal;
        }
      }
    }

    if (revenue > 0 || Object.keys(rawCosts).length > 0) {
      orders.push({
        orderId,
        date,
        productName,
        quantity,
        revenue,
        rawCosts,
      });

      if (!minDate || date < minDate) minDate = date;
      if (!maxDate || date > maxDate) maxDate = date;
    }
  }

  const today = new Date().toISOString().split('T')[0];
  
  return {
    orders,
    platform: platform as SalesFileData['platform'],
    dateRange: { start: minDate || today, end: maxDate || today },
    totalRows: orders.length,
  };
}

/**
 * Classify expenses - uses fast keyword matching first, AI only for unknowns
 */
export async function classifyExpenses(
  apiKey: string,
  costLabels: string[]
): Promise<Record<string, ExpenseCategory>> {
  if (costLabels.length === 0) return {};

  // Step 1: Try keyword classification first (instant) using shared utility
  const keywordResults = keywordClassify<ExpenseCategory>(
    costLabels,
    EXPENSE_PATTERNS,
    'other'
  );
  
  // Step 2: Find labels that couldn't be classified (marked as 'other')
  const unknownLabels = costLabels.filter(label => keywordResults[label] === 'other');
  
  // If all labels were classified by keywords, skip AI
  if (unknownLabels.length === 0) {
    console.log('   ⚡ All labels classified by keywords, skipping AI');
    return keywordResults;
  }

  // Step 3: Use AI only for unknown labels
  console.log(`   🤖 ${unknownLabels.length} unknown labels, asking AI...`);
  
  const messages: ChatMessage[] = [
    { role: 'system', content: EXPENSE_CLASSIFICATION_PROMPT },
    {
      role: 'user',
      content: `Classify the following expenses:\n${unknownLabels.map((label, i) => `${i + 1}. ${label}`).join('\n')}\n\nReturn JSON: {"classifications": {"label": "category", ...}}`,
    },
  ];

  try {
    const response = await chat(apiKey, messages, { temperature: 0.1, maxTokens: 500 });
    const parsed = JSON.parse(response.content);
    const aiClassifications = parsed.classifications || {};
    
    // Merge AI results with keyword results
    return { ...keywordResults, ...aiClassifications };
  } catch {
    // If AI fails, keep keyword results (unknowns stay as 'other')
    return keywordResults;
  }
}

/**
 * Calculate net profit for each order using precise calculations
 */
export function calculateOrderProfits(
  orders: OrderRecord[],
  classifications: Record<string, ExpenseCategory>
): OrderProfitAnalysis[] {
  return orders.map(order => {
    const classifiedCosts: ClassifiedCost[] = [];
    const costsForCalculation: Record<string, number> = {};

    for (const [label, amount] of Object.entries(order.rawCosts)) {
      const category = classifications[label] || 'other';
      classifiedCosts.push({ category, amount, originalLabel: label });
      costsForCalculation[label] = amount;
    }

    // Use precise calculation from financial-calculator
    const profitAnalysis = calculateOrderProfit(order.revenue, costsForCalculation);

    return {
      orderId: order.orderId,
      productName: order.productName,
      date: order.date,
      revenue: order.revenue,
      classifiedCosts,
      totalCosts: profitAnalysis.totalCosts,
      netProfit: profitAnalysis.netProfit,
      isProfitable: profitAnalysis.isProfitable,
    };
  });
}

/**
 * Aggregate cost breakdown from order analysis
 */
export function aggregateCostBreakdown(orderAnalysis: OrderProfitAnalysis[]): CostBreakdown {
  const breakdown: CostBreakdown = {
    paymentGatewayFees: 0,
    shippingCosts: 0,
    taxes: 0,
    refunds: 0,
    otherCosts: 0,
  };

  for (const order of orderAnalysis) {
    for (const cost of order.classifiedCosts) {
      switch (cost.category) {
        case 'payment_gateway':
          breakdown.paymentGatewayFees += cost.amount;
          break;
        case 'shipping':
          breakdown.shippingCosts += cost.amount;
          break;
        case 'tax':
          breakdown.taxes += cost.amount;
          break;
        case 'refund':
          breakdown.refunds += cost.amount;
          break;
        default:
          breakdown.otherCosts += cost.amount;
      }
    }
  }

  return breakdown;
}

/**
 * Identify losing products
 */
export function identifyLosingProducts(orderAnalysis: OrderProfitAnalysis[]): ProductLossAnalysis[] {
  // Group by product
  const productMap = new Map<string, OrderProfitAnalysis[]>();
  
  for (const order of orderAnalysis) {
    const existing = productMap.get(order.productName) || [];
    existing.push(order);
    productMap.set(order.productName, existing);
  }

  const losingProducts: ProductLossAnalysis[] = [];

  for (const [productName, orders] of productMap) {
    const totalRevenue = orders.reduce((sum, o) => sum + o.revenue, 0);
    const totalCosts = orders.reduce((sum, o) => sum + o.totalCosts, 0);
    const totalProfit = totalRevenue - totalCosts;

    // Only include products with net loss
    if (totalProfit < 0) {
      // Find the main cost contributor
      const costByCategory: Record<ExpenseCategory, number> = {
        payment_gateway: 0,
        shipping: 0,
        tax: 0,
        refund: 0,
        other: 0,
      };

      for (const order of orders) {
        for (const cost of order.classifiedCosts) {
          costByCategory[cost.category] += cost.amount;
        }
      }

      const mainCostCategory = (Object.entries(costByCategory) as [ExpenseCategory, number][])
        .sort((a, b) => b[1] - a[1])[0][0];

      const recommendation = generateProductRecommendation(productName, mainCostCategory, Math.abs(totalProfit));

      losingProducts.push({
        productName,
        totalOrders: orders.length,
        totalRevenue,
        totalCosts,
        totalLoss: Math.abs(totalProfit),
        averageLossPerOrder: Math.abs(totalProfit) / orders.length,
        lossReason: mainCostCategory,
        recommendation,
      });
    }
  }

  // Sort by total loss descending
  return losingProducts.sort((a, b) => b.totalLoss - a.totalLoss);
}

/**
 * Generate recommendation for a losing product
 */
function generateProductRecommendation(
  productName: string,
  lossReason: ExpenseCategory,
  totalLoss: number
): string {
  const recommendations: Record<ExpenseCategory, string> = {
    shipping: `High shipping costs for "${productName}". Consider raising product price or offering free shipping above a threshold.`,
    payment_gateway: `Payment gateway fees are eating profits for "${productName}". Consider encouraging cash on delivery or bank transfer.`,
    refund: `High return rate for "${productName}". Review product quality or description in store.`,
    tax: `Taxes are affecting profitability of "${productName}". Ensure tax is included in selling price.`,
    other: `Review additional costs for "${productName}" and try to reduce them.`,
  };

  return recommendations[lossReason];
}

/**
 * Generate AI recommendations using Tool Use for calculations
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', 'custom:Hindi')
 * @param currency - User's preferred currency code (e.g., 'USD', 'SAR', 'EUR')
 */
export async function generateRecommendationsWithTools(
  apiKey: string,
  summary: SmartProfitResult['summary'],
  costBreakdown: CostBreakdown,
  losingProducts: ProductLossAnalysis[],
  responseLanguage?: string,
  currency: string = 'USD'
): Promise<string[]> {
  const analysisContext = `
Profit Analysis:
- Total Revenue: ${formatCurrency(summary.totalRevenue, 'en-US', currency)}
- Total Costs: ${formatCurrency(summary.totalCosts, 'en-US', currency)}
- Net Profit: ${formatCurrency(summary.netProfit, 'en-US', currency)}
- Profit Margin: ${summary.profitMargin.toFixed(1)}%
- Profitable Orders: ${summary.profitableOrders} of ${summary.totalOrders}

Cost Breakdown:
- Payment Gateway Fees: ${formatCurrency(costBreakdown.paymentGatewayFees, 'en-US', currency)}
- Shipping Costs: ${formatCurrency(costBreakdown.shippingCosts, 'en-US', currency)}
- Taxes: ${formatCurrency(costBreakdown.taxes, 'en-US', currency)}
- Refunds: ${formatCurrency(costBreakdown.refunds, 'en-US', currency)}

Losing Products: ${losingProducts.length}
${losingProducts.slice(0, 3).map(p => `- ${p.productName}: Loss ${formatCurrency(p.totalLoss, 'en-US', currency)}`).join('\n')}
`;

  const systemPrompt = `${getRecommendationsPrompt(responseLanguage)}

IMPORTANT: When you need to calculate percentages, ratios, or any mathematical operations, use the 'calculate' tool instead of calculating yourself. This ensures accuracy.

Available operations:
- percentage: calculate what percentage one number is of another
- profit_margin: calculate profit margin from profit and revenue
- sum: add multiple numbers
- average: calculate average of numbers`;

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
      return generateFallbackRecommendations(summary, costBreakdown, losingProducts, responseLanguage);
    }
  }
}

/**
 * Generate AI recommendations (legacy - without Tool Use)
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', 'custom:Hindi')
 * @param currency - User's preferred currency code (e.g., 'USD', 'SAR', 'EUR')
 */
export async function generateRecommendations(
  apiKey: string,
  summary: SmartProfitResult['summary'],
  costBreakdown: CostBreakdown,
  losingProducts: ProductLossAnalysis[],
  responseLanguage?: string,
  currency: string = 'USD'
): Promise<string[]> {
  const analysisContext = `
Profit Analysis:
- Total Revenue: ${formatCurrency(summary.totalRevenue, 'en-US', currency)}
- Total Costs: ${formatCurrency(summary.totalCosts, 'en-US', currency)}
- Net Profit: ${formatCurrency(summary.netProfit, 'en-US', currency)}
- Profit Margin: ${summary.profitMargin.toFixed(1)}%
- Profitable Orders: ${summary.profitableOrders} of ${summary.totalOrders}

Cost Breakdown:
- Payment Gateway Fees: ${formatCurrency(costBreakdown.paymentGatewayFees, 'en-US', currency)}
- Shipping Costs: ${formatCurrency(costBreakdown.shippingCosts, 'en-US', currency)}
- Taxes: ${formatCurrency(costBreakdown.taxes, 'en-US', currency)}
- Refunds: ${formatCurrency(costBreakdown.refunds, 'en-US', currency)}

Losing Products: ${losingProducts.length}
${losingProducts.slice(0, 3).map(p => `- ${p.productName}: Loss ${formatCurrency(p.totalLoss, 'en-US', currency)}`).join('\n')}
`;

  const messages: ChatMessage[] = [
    { role: 'system', content: getRecommendationsPrompt(responseLanguage) },
    { role: 'user', content: analysisContext },
  ];

  try {
    const response = await chat(apiKey, messages, { temperature: 0.7, maxTokens: 1500 });
    const parsed = JSON.parse(response.content);
    return Array.isArray(parsed) ? parsed : parsed.recommendations || [];
  } catch {
    // Fallback recommendations
    return generateFallbackRecommendations(summary, costBreakdown, losingProducts, responseLanguage);
  }
}

/**
 * Generate fallback recommendations without AI
 * @param responseLanguage - User's preferred response language
 */
function generateFallbackRecommendations(
  summary: SmartProfitResult['summary'],
  costBreakdown: CostBreakdown,
  losingProducts: ProductLossAnalysis[],
  responseLanguage?: string
): string[] {
  const recommendations: string[] = [];

  // Check profit margin
  if (summary.profitMargin < 10) {
    recommendations.push('Profit margin is very low. Consider raising prices or reducing costs.');
  }

  // Check shipping costs
  const shippingPercentage = (costBreakdown.shippingCosts / summary.totalRevenue) * 100;
  if (shippingPercentage > 15) {
    recommendations.push(`Shipping costs represent ${shippingPercentage.toFixed(1)}% of revenue. Consider negotiating with shipping companies or offering free shipping above a threshold.`);
  }

  // Check payment gateway fees
  const gatewayPercentage = (costBreakdown.paymentGatewayFees / summary.totalRevenue) * 100;
  if (gatewayPercentage > 5) {
    recommendations.push(`Payment gateway fees are high (${gatewayPercentage.toFixed(1)}%). Encourage customers to use cash on delivery or bank transfer.`);
  }

  // Check refunds
  const refundPercentage = (costBreakdown.refunds / summary.totalRevenue) * 100;
  if (refundPercentage > 5) {
    recommendations.push(`Refund rate is high (${refundPercentage.toFixed(1)}%). Review product quality and descriptions in your store.`);
  }

  // Losing products
  if (losingProducts.length > 0) {
    recommendations.push(`You have ${losingProducts.length} losing products. Consider discontinuing them or raising their prices.`);
  }

  // Unprofitable orders
  const unprofitablePercentage = (summary.unprofitableOrders / summary.totalOrders) * 100;
  if (unprofitablePercentage > 20) {
    recommendations.push(`${unprofitablePercentage.toFixed(0)}% of your orders are unprofitable. Review your pricing strategy.`);
  }

  return recommendations.length > 0 ? recommendations : [
    'Continue monitoring costs and improving profit margin.'
  ];
}

/**
 * Options for AI analysis
 */
export interface AIAnalysisOptions {
  responseLanguage?: string;
  currency?: string;
  locale?: string;
}

/**
 * Main analysis function - uses precise calculations
 * @param responseLanguage - User's preferred response language (e.g., 'ar', 'en', 'fr', 'custom:Hindi')
 * @param options - Optional analysis options including currency and locale
 */
export async function analyzeProfit(
  apiKey: string,
  salesData: SalesFileData,
  responseLanguage?: string,
  options?: AIAnalysisOptions
): Promise<SmartProfitResult> {
  // Extract options with defaults
  const currency = options?.currency || 'USD';
  const locale = options?.locale || 'en-US';
  const startTime = Date.now();
  let tokensUsed = 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 [Smart Profit Audit] Starting analysis...');
  console.log(`📊 Total orders to analyze: ${salesData.orders.length}`);
  console.log(`📅 Date range: ${salesData.dateRange.start} to ${salesData.dateRange.end}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Step 1: Collect all unique cost labels
  console.log('\n📌 [Step 1/7] Collecting cost labels...');
  const allCostLabels = new Set<string>();
  for (const order of salesData.orders) {
    for (const label of Object.keys(order.rawCosts)) {
      allCostLabels.add(label);
    }
  }
  console.log(`   ✅ Found ${allCostLabels.size} unique cost categories:`, Array.from(allCostLabels));

  // Step 2: Classify expenses using AI
  console.log('\n🤖 [Step 2/7] Classifying expenses with AI...');
  const classifyStart = Date.now();
  const classifications = await classifyExpenses(apiKey, Array.from(allCostLabels));
  console.log(`   ✅ Classification complete in ${Date.now() - classifyStart}ms`);
  console.log('   📋 Classifications:', classifications);
  tokensUsed += estimateTokens(Array.from(allCostLabels).join(' ')) * 2;

  // Step 3: Calculate order profits using precise calculations
  console.log('\n🧮 [Step 3/7] Calculating order profits with decimal.js...');
  const calcStart = Date.now();
  const orderAnalysis = calculateOrderProfits(salesData.orders, classifications);
  console.log(`   ✅ Calculated ${orderAnalysis.length} orders in ${Date.now() - calcStart}ms`);
  console.log(`   💰 Sample order:`, orderAnalysis[0] ? {
    orderId: orderAnalysis[0].orderId,
    revenue: orderAnalysis[0].revenue,
    totalCosts: orderAnalysis[0].totalCosts,
    netProfit: orderAnalysis[0].netProfit,
  } : 'No orders');

  // Step 4: Aggregate cost breakdown using precise calculations
  console.log('\n📊 [Step 4/7] Aggregating cost breakdown with decimal.js...');
  const costBreakdown = aggregateCostBreakdown(orderAnalysis);
  console.log('   ✅ Cost breakdown:', costBreakdown);

  // Step 5: Calculate summary using precise aggregation
  console.log('\n📈 [Step 5/7] Calculating summary with decimal.js...');
  const ordersForAggregation = orderAnalysis.map(o => ({
    revenue: o.revenue,
    costs: o.totalCosts,
  }));
  const aggregated = aggregateOrders(ordersForAggregation);
  console.log('   ✅ Aggregated totals:', aggregated);
  
  const profitableOrders = orderAnalysis.filter(o => o.isProfitable).length;

  const summary = {
    totalRevenue: aggregated.totalRevenue,
    totalCosts: aggregated.totalCosts,
    netProfit: aggregated.netProfit,
    profitMargin: aggregated.profitMargin,
    totalOrders: orderAnalysis.length,
    profitableOrders,
    unprofitableOrders: orderAnalysis.length - profitableOrders,
  };
  console.log('   📊 Summary:', summary);

  // Step 6: Identify losing products
  console.log('\n📉 [Step 6/7] Identifying losing products...');
  const losingProducts = identifyLosingProducts(orderAnalysis);
  console.log(`   ✅ Found ${losingProducts.length} losing products`);
  if (losingProducts.length > 0) {
    console.log('   ⚠️ Top losing product:', losingProducts[0]);
  }

  // Step 7: Generate AI recommendations with Tool Use for any calculations
  console.log('\n💡 [Step 7/7] Generating AI recommendations (with Tool Use)...');
  const recoStart = Date.now();
  const aiRecommendations = await generateRecommendationsWithTools(
    apiKey,
    summary,
    costBreakdown,
    losingProducts,
    responseLanguage,
    currency
  );
  console.log(`   ✅ Recommendations generated in ${Date.now() - recoStart}ms`);
  console.log('   📝 Recommendations:', aiRecommendations);
  tokensUsed += estimateTokens(JSON.stringify({ summary, costBreakdown, losingProducts })) * 2;

  const totalTime = Date.now() - startTime;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ [Smart Profit Audit] Analysis complete!`);
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`🎯 Tokens used: ~${tokensUsed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return {
    summary,
    costBreakdown,
    orderAnalysis,
    losingProducts,
    aiRecommendations,
    tokensUsed,
    processingTime: totalTime,
  };
}

/**
 * Estimate tokens for analysis
 */
export function estimateAnalysisTokens(salesData: SalesFileData | null): number {
  if (!salesData || !salesData.orders || !Array.isArray(salesData.orders)) {
    return 2000; // Default estimate
  }
  
  // Estimate based on number of orders and unique cost labels
  const uniqueLabels = new Set<string>();
  for (const order of salesData.orders) {
    if (order.rawCosts && typeof order.rawCosts === 'object') {
      for (const label of Object.keys(order.rawCosts)) {
        uniqueLabels.add(label);
      }
    }
  }

  // Classification prompt + response
  const classificationTokens = estimateTokens(Array.from(uniqueLabels).join(' ')) * 3;
  
  // Recommendations prompt + response
  const recommendationsTokens = 2000;

  return classificationTokens + recommendationsTokens;
}

/**
 * Format currency for display
 * @param amount - The amount to format
 * @param locale - The locale for formatting (e.g., 'en-US', 'ar-SA')
 * @param currency - The currency code (e.g., 'USD', 'SAR', 'EUR')
 */
export function formatCurrency(
  amount: number, 
  locale: string = 'en-US', 
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Get category label
 * Note: For multi-language support, use translations from messages/*.json
 * This function provides English fallback labels only
 */
export function getCategoryLabel(category: ExpenseCategory, locale: string = 'en'): string {
  const labels: Record<ExpenseCategory, Record<string, string>> = {
    payment_gateway: { en: 'Payment Gateway Fees' },
    shipping: { en: 'Shipping Costs' },
    tax: { en: 'Taxes' },
    refund: { en: 'Refunds' },
    other: { en: 'Other' },
  };
  return labels[category][locale] || labels[category]['en'];
}
