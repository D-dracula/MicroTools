/**
 * Case Converter Property Tests
 * 
 * Feature: content-technical-tools
 * Tests Properties 1, 2, 3 from design document
 */

import * as fc from 'fast-check';
import {
  toUpperCase,
  toLowerCase,
  toToggleCase,
  convertCase,
  type CaseType,
} from './case-converter';

describe('Case Converter Properties', () => {
  /**
   * Feature: content-technical-tools, Property 1: Non-alphabetic preservation
   * For any text string containing non-alphabetic characters (numbers, symbols, spaces, punctuation),
   * when any case conversion is applied, all non-alphabetic characters SHALL remain unchanged
   * in their original positions.
   * **Validates: Requirements 1.7**
   */
  describe('Property 1: Non-alphabetic preservation', () => {
    it('uppercase preserves non-alphabetic characters', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const result = toUpperCase(text);
          
          // Extract non-alphabetic characters from original
          const originalNonAlpha = text.split('').filter(c => !/[a-zA-Z]/.test(c));
          // Extract non-alphabetic characters from result
          const resultNonAlpha = result.split('').filter(c => !/[a-zA-Z]/.test(c));
          
          // Non-alphabetic characters should be identical
          return originalNonAlpha.join('') === resultNonAlpha.join('');
        }),
        { numRuns: 100 }
      );
    });

    it('lowercase preserves non-alphabetic characters', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const result = toLowerCase(text);
          
          const originalNonAlpha = text.split('').filter(c => !/[a-zA-Z]/.test(c));
          const resultNonAlpha = result.split('').filter(c => !/[a-zA-Z]/.test(c));
          
          return originalNonAlpha.join('') === resultNonAlpha.join('');
        }),
        { numRuns: 100 }
      );
    });

    it('togglecase preserves non-alphabetic characters', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const result = toToggleCase(text);
          
          const originalNonAlpha = text.split('').filter(c => !/[a-zA-Z]/.test(c));
          const resultNonAlpha = result.split('').filter(c => !/[a-zA-Z]/.test(c));
          
          return originalNonAlpha.join('') === resultNonAlpha.join('');
        }),
        { numRuns: 100 }
      );
    });

    it('all case types preserve string length', () => {
      const caseTypes: CaseType[] = ['uppercase', 'lowercase', 'titlecase', 'sentencecase', 'togglecase'];
      
      fc.assert(
        fc.property(
          fc.string(),
          fc.constantFrom(...caseTypes),
          (text, caseType) => {
            const result = convertCase({ text, caseType });
            return result.originalLength === result.convertedLength;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: content-technical-tools, Property 2: Toggle case round-trip
   * For any text string, applying toggle case conversion twice SHALL return the original text exactly.
   * **Validates: Requirements 1.5**
   */
  describe('Property 2: Toggle case round-trip', () => {
    it('applying toggle case twice returns original text', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const toggled = toToggleCase(text);
          const toggledTwice = toToggleCase(toggled);
          return toggledTwice === text;
        }),
        { numRuns: 100 }
      );
    });

    it('toggle case is its own inverse for ASCII letters', () => {
      const asciiLetters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...asciiLetters.split('')), { minLength: 0, maxLength: 100 }).map(arr => arr.join('')),
          (text: string) => {
            const toggled = toToggleCase(text);
            const toggledTwice = toToggleCase(toggled);
            return toggledTwice === text;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: content-technical-tools, Property 3: Uppercase/lowercase idempotence
   * For any text string, applying uppercase conversion twice SHALL produce the same result
   * as applying it once. The same applies to lowercase conversion.
   * **Validates: Requirements 1.1, 1.2**
   */
  describe('Property 3: Uppercase/lowercase idempotence', () => {
    it('uppercase is idempotent', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const once = toUpperCase(text);
          const twice = toUpperCase(once);
          return once === twice;
        }),
        { numRuns: 100 }
      );
    });

    it('lowercase is idempotent', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const once = toLowerCase(text);
          const twice = toLowerCase(once);
          return once === twice;
        }),
        { numRuns: 100 }
      );
    });

    it('uppercase then lowercase equals lowercase', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const upperThenLower = toLowerCase(toUpperCase(text));
          const justLower = toLowerCase(text);
          return upperThenLower === justLower;
        }),
        { numRuns: 100 }
      );
    });

    it('lowercase then uppercase equals uppercase', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const lowerThenUpper = toUpperCase(toLowerCase(text));
          const justUpper = toUpperCase(text);
          return lowerThenUpper === justUpper;
        }),
        { numRuns: 100 }
      );
    });
  });
});
