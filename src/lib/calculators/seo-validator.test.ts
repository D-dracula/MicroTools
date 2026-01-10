/**
 * Property-Based Tests for SEO Title Validator
 * 
 * Feature: marketing-content-tools, Property 10: SEO Title Validation Consistency
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4
 */

import fc from 'fast-check';
import { validateSEOTitle, getLengthStatus, detectKeywordStuffing, calculateSEOScore } from './seo-validator';

/**
 * Custom arbitrary for short titles (< 50 chars)
 */
function shortTitle(): fc.Arbitrary<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
  return fc.string({ 
    unit: fc.integer({ min: 0, max: chars.length - 1 }).map(n => chars[n]),
    minLength: 1, 
    maxLength: 49 
  }).filter(s => s.trim().length > 0);
}

/**
 * Custom arbitrary for optimal titles (50-60 chars)
 */
function optimalTitle(): fc.Arbitrary<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
  return fc.string({ 
    unit: fc.integer({ min: 0, max: chars.length - 1 }).map(n => chars[n]),
    minLength: 50, 
    maxLength: 60 
  }).filter(s => s.trim().length >= 50);
}

/**
 * Custom arbitrary for long titles (> 60 chars)
 */
function longTitle(): fc.Arbitrary<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
  return fc.string({ 
    unit: fc.integer({ min: 0, max: chars.length - 1 }).map(n => chars[n]),
    minLength: 61, 
    maxLength: 100 
  }).filter(s => s.trim().length > 60);
}

/**
 * Custom arbitrary for titles with keyword stuffing
 */
function stuffedTitle(): fc.Arbitrary<string> {
  // Generate actual words (letters only) to avoid edge cases with punctuation
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return fc.string({ 
    unit: fc.integer({ min: 0, max: chars.length - 1 }).map(n => chars[n]),
    minLength: 3, 
    maxLength: 10 
  })
    .filter(s => s.trim().length >= 3 && /^[a-zA-Z]+$/.test(s))
    .map(word => `${word} ${word} ${word} ${word} ${word}`); // Repeat 5 times
}

describe('SEO Title Validator Properties', () => {
  /**
   * Property 10: SEO Title Validation Consistency
   * 
   * For any product title, the SEO validator SHALL:
   * - Return lengthStatus='short' when length < 50 characters
   * - Return lengthStatus='optimal' when length is 50-60 characters
   * - Return lengthStatus='long' when length > 60 characters
   * - Detect keyword stuffing when any word appears more than 3 times
   * - Calculate a score between 0-100 based on issues found
   * 
   * Validates: Requirements 11.1, 11.2, 11.3, 11.4
   */
  it('Property 10a: returns short status for titles < 50 chars', () => {
    fc.assert(
      fc.property(
        shortTitle(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (title, language) => {
          const result = validateSEOTitle({ title, language });

          expect(result.lengthStatus).toBe('short');
          expect(result.characterCount).toBeLessThan(50);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 10b: returns optimal status for titles 50-60 chars', () => {
    fc.assert(
      fc.property(
        optimalTitle(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (title, language) => {
          const result = validateSEOTitle({ title, language });

          expect(result.lengthStatus).toBe('optimal');
          expect(result.characterCount).toBeGreaterThanOrEqual(50);
          expect(result.characterCount).toBeLessThanOrEqual(60);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 10c: returns long status for titles > 60 chars', () => {
    fc.assert(
      fc.property(
        longTitle(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (title, language) => {
          const result = validateSEOTitle({ title, language });

          expect(result.lengthStatus).toBe('long');
          expect(result.characterCount).toBeGreaterThan(60);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 10d: detects keyword stuffing', () => {
    fc.assert(
      fc.property(
        stuffedTitle(),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (title, language) => {
          const hasStuffing = detectKeywordStuffing(title);
          
          // Title with word repeated 5 times should be detected as stuffing
          expect(hasStuffing).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 10e: score is always between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (title, language) => {
          const result = validateSEOTitle({ title, language });

          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10f: character count matches actual title length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.constantFrom('ar', 'en') as fc.Arbitrary<'ar' | 'en'>,
        (title, language) => {
          const result = validateSEOTitle({ title, language });

          expect(result.characterCount).toBe(title.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
