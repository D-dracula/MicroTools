/**
 * Property-Based Tests for Real Net Profit Calculator
 * 
 * Feature: advanced-merchant-calculators, Property 2: Net Profit Calculation Correctness
 * Validates: Requirements 1.3, 1.5, 1.6, 1.7
 */

import fc from 'fast-check';
import { calculateRealNetProfit, validateInput } from './real-net-profit';

describe('Real Net Profit Calculator', () => {
  /**
   * Property 2: Net Profit Calculation Correctness
   * 
   * For any valid input with revenue > 0, product cost ≥ 0, ad spend ≥ 0, 
   * shipping cost ≥ 0, and return rate between 0-100:
   * - Net Profit SHALL equal: Revenue - (Product Cost + Ad Spend + Shipping Cost + Return Losses)
   * - Each cost component percentage SHALL equal: (Component / Revenue) × 100
   * - All percentages SHALL sum to (Total Costs / Revenue) × 100
   * - When Net Profit < 0, the largest cost contributor SHALL be correctly identified
   * 
   * Validates: Requirements 1.3, 1.5, 1.6, 1.7
   */
  describe('Property 2: Net Profit Calculation Correctness', () => {
    it('should correctly calculate net profit using the formula', () => {
      fc.assert(
        fc.property(
          fc.record({
            revenue: fc.float({ min: 0.01, max: 1000000, noNaN: true }),
            productCost: fc.float({ min: 0, max: 500000, noNaN: true }),
            adSpend: fc.float({ min: 0, max: 500000, noNaN: true }),
            shippingCost: fc.float({ min: 0, max: 100000, noNaN: true }),
            returnRate: fc.float({ min: 0, max: 100, noNaN: true }),
            otherCosts: fc.float({ min: 0, max: 100000, noNaN: true }),
          }),
          (input) => {
            const result = calculateRealNetProfit(input);
            
            // Calculate expected values
            const expectedReturnLosses = input.revenue * (input.returnRate / 100);
            const expectedTotalCosts = input.productCost + input.adSpend + 
              input.shippingCost + expectedReturnLosses + (input.otherCosts || 0);
            const expectedNetProfit = input.revenue - expectedTotalCosts;

            // Verify net profit calculation (Requirement 1.3)
            expect(result.netProfit).toBeCloseTo(expectedNetProfit, 2);
            
            // Verify return losses calculation (Requirement 1.5)
            expect(result.returnLosses).toBeCloseTo(expectedReturnLosses, 2);
            
            // Verify total costs
            expect(result.totalCosts).toBeCloseTo(expectedTotalCosts, 2);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate cost breakdown percentages', () => {
      fc.assert(
        fc.property(
          fc.record({
            revenue: fc.float({ min: 1, max: 1000000, noNaN: true }),
            productCost: fc.float({ min: 0, max: 500000, noNaN: true }),
            adSpend: fc.float({ min: 0, max: 500000, noNaN: true }),
            shippingCost: fc.float({ min: 0, max: 100000, noNaN: true }),
            returnRate: fc.float({ min: 0, max: 100, noNaN: true }),
          }),
          (input) => {
            const result = calculateRealNetProfit(input);
            
            // Each percentage should equal (Component / Revenue) × 100 (Requirement 1.6)
            expect(result.costBreakdown.productCost.percentage)
              .toBeCloseTo((input.productCost / input.revenue) * 100, 2);
            expect(result.costBreakdown.adSpend.percentage)
              .toBeCloseTo((input.adSpend / input.revenue) * 100, 2);
            expect(result.costBreakdown.shippingCost.percentage)
              .toBeCloseTo((input.shippingCost / input.revenue) * 100, 2);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify largest cost contributor when unprofitable', () => {
      fc.assert(
        fc.property(
          fc.record({
            revenue: fc.float({ min: 100, max: 10000, noNaN: true }),
            productCost: fc.float({ min: 0, max: 20000, noNaN: true }),
            adSpend: fc.float({ min: 0, max: 20000, noNaN: true }),
            shippingCost: fc.float({ min: 0, max: 5000, noNaN: true }),
            returnRate: fc.float({ min: 0, max: 50, noNaN: true }),
          }),
          (input) => {
            const result = calculateRealNetProfit(input);
            
            // Find the actual largest cost
            const costs = [
              { name: 'productCost', amount: input.productCost },
              { name: 'adSpend', amount: input.adSpend },
              { name: 'shippingCost', amount: input.shippingCost },
              { name: 'returnLosses', amount: result.returnLosses },
              { name: 'otherCosts', amount: 0 },
            ];
            
            const expectedLargest = costs.reduce((max, cost) => 
              cost.amount > max.amount ? cost : max
            , costs[0]);

            // Verify largest contributor is correctly identified (Requirement 1.7)
            expect(result.largestCostContributor).toBe(expectedLargest.name);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly determine profitability', () => {
      fc.assert(
        fc.property(
          fc.record({
            revenue: fc.float({ min: 0.01, max: 100000, noNaN: true }),
            productCost: fc.float({ min: 0, max: 50000, noNaN: true }),
            adSpend: fc.float({ min: 0, max: 50000, noNaN: true }),
            shippingCost: fc.float({ min: 0, max: 10000, noNaN: true }),
            returnRate: fc.float({ min: 0, max: 100, noNaN: true }),
          }),
          (input) => {
            const result = calculateRealNetProfit(input);
            
            // isProfitable should match netProfit >= 0
            expect(result.isProfitable).toBe(result.netProfit >= 0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific scenarios
  describe('Unit Tests', () => {
    it('should calculate correct net profit for typical e-commerce scenario', () => {
      const input = {
        revenue: 10000,
        productCost: 4000,
        adSpend: 2000,
        shippingCost: 500,
        returnRate: 5,
      };
      const result = calculateRealNetProfit(input);
      
      // Return losses = 10000 * 0.05 = 500
      // Total costs = 4000 + 2000 + 500 + 500 = 7000
      // Net profit = 10000 - 7000 = 3000
      expect(result.netProfit).toBe(3000);
      expect(result.returnLosses).toBe(500);
      expect(result.isProfitable).toBe(true);
    });

    it('should identify unprofitable scenario correctly', () => {
      const input = {
        revenue: 10000,
        productCost: 6000,
        adSpend: 4000,
        shippingCost: 500,
        returnRate: 10,
      };
      const result = calculateRealNetProfit(input);
      
      expect(result.isProfitable).toBe(false);
      expect(result.largestCostContributor).toBe('productCost');
    });

    it('should handle zero revenue', () => {
      const input = {
        revenue: 0,
        productCost: 100,
        adSpend: 50,
        shippingCost: 20,
        returnRate: 5,
      };
      const result = calculateRealNetProfit(input);
      
      expect(result.netProfit).toBe(-170);
      expect(result.netProfitMargin).toBe(0);
      expect(result.isProfitable).toBe(false);
    });

    it('should handle 100% return rate', () => {
      const input = {
        revenue: 10000,
        productCost: 0,
        adSpend: 0,
        shippingCost: 0,
        returnRate: 100,
      };
      const result = calculateRealNetProfit(input);
      
      expect(result.returnLosses).toBe(10000);
      expect(result.netProfit).toBe(0);
    });
  });

  // Input validation tests
  describe('Input Validation', () => {
    it('should reject negative revenue', () => {
      const result = validateInput({ revenue: -100 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('should reject negative costs', () => {
      expect(validateInput({ revenue: 100, productCost: -50 }).isValid).toBe(false);
      expect(validateInput({ revenue: 100, adSpend: -50 }).isValid).toBe(false);
      expect(validateInput({ revenue: 100, shippingCost: -50 }).isValid).toBe(false);
    });

    it('should reject invalid return rate', () => {
      expect(validateInput({ revenue: 100, returnRate: -5 }).isValid).toBe(false);
      expect(validateInput({ revenue: 100, returnRate: 105 }).isValid).toBe(false);
    });

    it('should accept valid inputs', () => {
      const result = validateInput({
        revenue: 10000,
        productCost: 4000,
        adSpend: 2000,
        shippingCost: 500,
        returnRate: 5,
      });
      expect(result.isValid).toBe(true);
    });
  });
});
