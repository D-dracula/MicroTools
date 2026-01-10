/**
 * Property-Based Tests for Conversion Rate Calculator
 * 
 * Feature: marketing-content-tools, Property 5: Conversion Rate Calculation
 * Validates: Requirements 6.1, 6.4
 */

import fc from 'fast-check';
import { calculateConversionRate, calculateRate } from './conversion-rate';

describe('Conversion Rate Calculator Properties', () => {
  /**
   * Property 5: Conversion Rate Calculation
   * 
   * For any non-negative visitor count and conversion count where conversions ≤ visitors,
   * the conversion rate SHALL equal (conversions / visitors) × 100.
   * When conversions > visitors, an error SHALL be returned.
   * 
   * Validates: Requirements 6.1, 6.4
   */
  it('Property 5: calculates correct conversion rate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 0, max: 1000000 }),
        (visitors, conversions) => {
          // Ensure conversions <= visitors for valid input
          const validConversions = Math.min(conversions, visitors);
          
          const result = calculateConversionRate({
            visitors,
            conversions: validConversions,
          });

          expect(result.isValid).toBe(true);
          
          // Rate should equal (conversions / visitors) * 100
          const expectedRate = (validConversions / visitors) * 100;
          expect(result.rate).toBeCloseTo(expectedRate, 10);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5b: Conversions exceeding visitors should return error
   */
  it('Property 5b: returns error when conversions exceed visitors', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 1, max: 1000000 }),
        (visitors, extra) => {
          const conversions = visitors + extra; // Always greater than visitors
          
          const result = calculateConversionRate({
            visitors,
            conversions,
          });

          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).toContain('exceed');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5c: Zero visitors should return error
   */
  it('Property 5c: returns error for zero visitors', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (conversions) => {
          const result = calculateConversionRate({
            visitors: 0,
            conversions,
          });

          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5d: Rate is always between 0 and 100 for valid inputs
   */
  it('Property 5d: rate is always between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 0, max: 1000000 }),
        (visitors, conversions) => {
          const validConversions = Math.min(conversions, visitors);
          
          const result = calculateConversionRate({
            visitors,
            conversions: validConversions,
          });

          if (result.isValid) {
            expect(result.rate).toBeGreaterThanOrEqual(0);
            expect(result.rate).toBeLessThanOrEqual(100);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
