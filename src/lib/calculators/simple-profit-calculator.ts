/**
 * Simple Profit Calculator - NO AI
 * Pure mathematical calculations using decimal.js
 * Fast, accurate, and cost-free
 */

import { calculateOrderProfit, aggregateOrders } from '../math/financial-calculator';

// Types
export interface SimpleOrder {
  orderId: string;
  date: string;
  productName: string;
  quantity: number;
  revenue: number;
  costs: Record<string, number>;
}

export interface SimpleProfitResult {
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    orderCount: number;
  };
  costBreakdown: Record<string, number>;
  orders: SimpleOrder[];
  dateRange: { start: string; end: string };
}

export interface ColumnMapping {
  revenue?: string | null;
  unitPrice?: string | null;
  quantity?: string | null;
  productName?: string | null;
  date?: string | null;
  orderId?: string | null;
  costs?: string[];
}

/**
 * Parse CSV data into orders using simple logic (NO AI)
 */
export function parseOrdersFromCSV(
  data: Record<string, unknown>[],
  mapping: ColumnMapping
): SimpleOrder[] {
  const orders: SimpleOrder[] = [];
  let orderCounter = 1;

  for (const row of data) {
    try {
      // Parse basic fields
      const orderId = mapping.orderId ? String(row[mapping.orderId] || `ORDER-${orderCounter}`) : `ORDER-${orderCounter}`;
      const productName = mapping.productName ? String(row[mapping.productName] || 'Unknown Product') : 'Unknown Product';
      const quantity = mapping.quantity ? parseFloat(String(row[mapping.quantity] || '1')) : 1;
      const date = mapping.date ? String(row[mapping.date] || new Date().toISOString()) : new Date().toISOString();

      // Calculate revenue
      let revenue = 0;
      if (mapping.revenue && row[mapping.revenue]) {
        revenue = parseFloat(String(row[mapping.revenue]).replace(/[^0-9.-]/g, '')) || 0;
      } else if (mapping.unitPrice && row[mapping.unitPrice]) {
        const unitPrice = parseFloat(String(row[mapping.unitPrice]).replace(/[^0-9.-]/g, '')) || 0;
        revenue = unitPrice * quantity;
      }

      // Skip invalid orders
      if (revenue <= 0 || quantity <= 0) continue;

      // Parse costs
      const costs: Record<string, number> = {};
      if (mapping.costs) {
        for (const costCol of mapping.costs) {
          if (row[costCol]) {
            const costValue = parseFloat(String(row[costCol]).replace(/[^0-9.-]/g, '')) || 0;
            if (costValue > 0) {
              costs[costCol] = costValue;
            }
          }
        }
      }

      orders.push({
        orderId,
        date,
        productName,
        quantity,
        revenue,
        costs,
      });

      orderCounter++;
    } catch (error) {
      // Skip invalid rows
      continue;
    }
  }

  return orders;
}

/**
 * Calculate profit summary (NO AI)
 */
export function calculateProfitSummary(orders: SimpleOrder[]): SimpleProfitResult {
  if (orders.length === 0) {
    return {
      summary: {
        totalRevenue: 0,
        totalCosts: 0,
        netProfit: 0,
        profitMargin: 0,
        orderCount: 0,
      },
      costBreakdown: {},
      orders: [],
      dateRange: { start: '', end: '' },
    };
  }

  // Calculate totals
  let totalRevenue = 0;
  let totalCosts = 0;
  const costBreakdown: Record<string, number> = {};

  for (const order of orders) {
    totalRevenue += order.revenue;
    
    // Sum all costs for this order
    const orderCosts = Object.values(order.costs).reduce((sum, cost) => sum + cost, 0);
    totalCosts += orderCosts;

    // Add to cost breakdown
    for (const [costType, amount] of Object.entries(order.costs)) {
      costBreakdown[costType] = (costBreakdown[costType] || 0) + amount;
    }
  }

  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Date range
  const dates = orders.map(o => o.date).sort();
  const dateRange = {
    start: dates[0] || '',
    end: dates[dates.length - 1] || '',
  };

  return {
    summary: {
      totalRevenue,
      totalCosts,
      netProfit,
      profitMargin,
      orderCount: orders.length,
    },
    costBreakdown,
    orders,
    dateRange,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Simple cost classification (NO AI)
 */
export function classifyCostColumns(headers: string[]): Record<string, string[]> {
  const categories = {
    shipping: [] as string[],
    fees: [] as string[],
    taxes: [] as string[],
    refunds: [] as string[],
    other: [] as string[],
  };

  for (const header of headers) {
    const lower = header.toLowerCase();
    
    if (lower.includes('shipping') || lower.includes('delivery')) {
      categories.shipping.push(header);
    } else if (lower.includes('fee') || lower.includes('commission')) {
      categories.fees.push(header);
    } else if (lower.includes('tax') || lower.includes('vat')) {
      categories.taxes.push(header);
    } else if (lower.includes('refund') || lower.includes('return')) {
      categories.refunds.push(header);
    } else {
      categories.other.push(header);
    }
  }

  return categories;
}