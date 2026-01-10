/**
 * Property-Based Tests for Refund Policy Generator
 * 
 * Feature: marketing-content-tools, Property 7: Policy Document Completeness
 * Validates: Requirements 8.1, 8.5
 */

import fc from 'fast-check';
import { generateRefundPolicy, RefundCondition, RefundMethod } from './policy-generator';

/**
 * Custom arbitrary for store names
 */
function storeName(): fc.Arbitrary<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
  return fc.string({ 
    unit: fc.integer({ min: 0, max: chars.length - 1 }).map(n => chars[n]),
    minLength: 1, 
    maxLength: 50 
  }).filter(s => s.trim().length > 0);
}

/**
 * Custom arbitrary for refund conditions
 */
function refundConditions(): fc.Arbitrary<RefundCondition[]> {
  const allConditions: RefundCondition[] = ['unused', 'original_packaging', 'with_receipt', 'no_sale_items', 'no_personalized'];
  return fc.subarray(allConditions, { minLength: 1 });
}

/**
 * Custom arbitrary for refund methods
 */
function refundMethod(): fc.Arbitrary<RefundMethod> {
  return fc.constantFrom('original', 'store_credit', 'both');
}

describe('Refund Policy Generator Properties', () => {
  /**
   * Property 7: Policy Document Completeness
   * 
   * For any set of policy options selected, the generated refund policy SHALL 
   * contain sections addressing all selected options, and the store name SHALL 
   * appear in the document.
   * 
   * Validates: Requirements 8.1, 8.5
   */
  it('Property 7: generates complete policy with store name and all selected options', () => {
    fc.assert(
      fc.property(
        storeName(),
        fc.integer({ min: 1, max: 365 }),
        refundConditions(),
        refundMethod(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (name, returnWindow, conditions, method, language) => {
          const result = generateRefundPolicy({
            storeName: name,
            returnWindow,
            conditions,
            refundMethod: method,
            language,
          });

          expect(result.isComplete).toBe(true);
          
          // Store name should appear in the policy
          expect(result.policy).toContain(name);
          
          // Policy should have sections
          expect(result.sections.length).toBeGreaterThan(0);
          
          // Return window should be mentioned
          expect(result.policy).toContain(String(returnWindow));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7b: Policy sections are properly structured
   */
  it('Property 7b: policy sections have titles and content', () => {
    fc.assert(
      fc.property(
        storeName(),
        fc.integer({ min: 1, max: 365 }),
        refundConditions(),
        refundMethod(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (name, returnWindow, conditions, method, language) => {
          const result = generateRefundPolicy({
            storeName: name,
            returnWindow,
            conditions,
            refundMethod: method,
            language,
          });

          if (result.isComplete) {
            for (const section of result.sections) {
              expect(section.title).toBeDefined();
              expect(section.title.length).toBeGreaterThan(0);
              expect(section.content).toBeDefined();
              expect(section.content.length).toBeGreaterThan(0);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7c: Invalid inputs should not generate complete policy
   */
  it('Property 7c: incomplete inputs result in incomplete policy', () => {
    const result = generateRefundPolicy({
      storeName: '',
      returnWindow: 14,
      conditions: ['unused'],
      refundMethod: 'original',
      language: 'en',
    });

    expect(result.isComplete).toBe(false);
  });
});
