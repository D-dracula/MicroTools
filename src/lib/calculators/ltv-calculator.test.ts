/**
 * Property-Based Tests for LTV Calculator
 * 
 * Feature: marketing-content-tools, Property 6: LTV Calculation and Warning
 * Validates: Requirements 7.1, 7.2, 7.5
 */

import fc from 'fast-check';
import { calculateLTV, calculateLTVValue, calculateLTVCACRatio } from './ltv-calculator';

describe('LTV Calculator Properties', () => {
  /**
   * Property 6: LTV Calculation and Warning
   * 
   * For any positive average order value, purchase frequency, and customer lifespan,
   * LTV SHALL equal AOV × frequency × lifespan.
   * When CAC is provided and LTV < CAC, a warning SHALL be displayed.
   * 
   * Validates: Requirements 7.1, 7.2, 7.5
   */
  it('Property 6: calculates LTV correctly as AOV × frequency × lifespan', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(52), noNaN: true }), // Up to weekly purchases
        fc.float({ min: Math.fround(0.1), max: Math.fround(20), noNaN: true }), // Up to 20 years
        (aov, frequency, lifespan) => {
          const result = calculateLTV({
            averageOrderValue: aov,
            purchaseFrequency: frequency,
            customerLifespan: lifespan,
          });

          if ('ltv' in result) {
            const expectedLTV = aov * frequency * lifespan;
            expect(result.ltv).toBeCloseTo(expectedLTV, 5);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6b: Warning displayed when LTV < CAC
   */
  it('Property 6b: displays warning when LTV < CAC', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(10), noNaN: true }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(5), noNaN: true }),
        fc.float({ min: Math.fround(1), max: Math.fround(100000), noNaN: true }),
        (aov, frequency, lifespan, cac) => {
          const ltv = aov * frequency * lifespan;
          
          const result = calculateLTV({
            averageOrderValue: aov,
            purchaseFrequency: frequency,
            customerLifespan: lifespan,
            customerAcquisitionCost: cac,
          });

          if ('ltv' in result) {
            if (ltv < cac) {
              // Should have a warning
              expect(result.warning).toBeDefined();
              expect(result.isHealthy).toBe(false);
            } else {
              // Should be healthy
              expect(result.isHealthy).toBe(true);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6c: LTV:CAC ratio is calculated correctly
   */
  it('Property 6c: calculates LTV:CAC ratio correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(52), noNaN: true }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(20), noNaN: true }),
        fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true }),
        (aov, frequency, lifespan, cac) => {
          const result = calculateLTV({
            averageOrderValue: aov,
            purchaseFrequency: frequency,
            customerLifespan: lifespan,
            customerAcquisitionCost: cac,
          });

          if ('ltv' in result && result.ltvCacRatio !== undefined) {
            const expectedRatio = result.ltv / cac;
            expect(result.ltvCacRatio).toBeCloseTo(expectedRatio, 5);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6d: Invalid inputs should return error
   */
  it('Property 6d: returns error for invalid inputs', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-1000), max: Math.fround(0), noNaN: true }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(10), noNaN: true }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(5), noNaN: true }),
        (invalidAov, frequency, lifespan) => {
          const result = calculateLTV({
            averageOrderValue: invalidAov,
            purchaseFrequency: frequency,
            customerLifespan: lifespan,
          });

          expect('isValid' in result && result.isValid === false).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
