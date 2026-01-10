/**
 * Duplicate Remover Property Tests
 * 
 * Feature: content-technical-tools
 * Tests Properties 4, 5 from design document
 */

import * as fc from 'fast-check';
import { removeDuplicateLines } from './duplicate-remover';

describe('Duplicate Remover Properties', () => {
  /**
   * Feature: content-technical-tools, Property 4: Count invariant
   * For any text input, the sum of unique lines remaining plus duplicates removed
   * SHALL equal the original line count.
   * **Validates: Requirements 2.4, 2.5**
   */
  describe('Property 4: Count invariant (unique + removed = original)', () => {
    it('count invariant holds for case-sensitive mode', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 0, maxLength: 50 }),
          (lines: string[]) => {
            const text = lines.join('\n');
            const result = removeDuplicateLines({
              text,
              caseSensitive: true,
              trimWhitespace: false,
            });
            
            // unique + removed = original
            return result.uniqueLineCount + result.duplicatesRemoved === result.originalLineCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('count invariant holds for case-insensitive mode', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 0, maxLength: 50 }),
          (lines: string[]) => {
            const text = lines.join('\n');
            const result = removeDuplicateLines({
              text,
              caseSensitive: false,
              trimWhitespace: false,
            });
            
            return result.uniqueLineCount + result.duplicatesRemoved === result.originalLineCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('count invariant holds with trim whitespace option', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 0, maxLength: 50 }),
          (lines: string[]) => {
            const text = lines.join('\n');
            const result = removeDuplicateLines({
              text,
              caseSensitive: true,
              trimWhitespace: true,
            });
            
            return result.uniqueLineCount + result.duplicatesRemoved === result.originalLineCount;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: content-technical-tools, Property 5: Output has no duplicates
   * For any text input processed by the duplicate remover, the output SHALL contain
   * no duplicate lines (according to the selected comparison mode).
   * **Validates: Requirements 2.1, 2.2, 2.3**
   */
  describe('Property 5: Output has no duplicates', () => {
    it('output has no duplicates in case-sensitive mode', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 0, maxLength: 50 }),
          (lines: string[]) => {
            const text = lines.join('\n');
            const result = removeDuplicateLines({
              text,
              caseSensitive: true,
              trimWhitespace: false,
            });
            
            if (!result.cleanedText) return true;
            
            const outputLines = result.cleanedText.split('\n');
            const uniqueSet = new Set(outputLines);
            
            return uniqueSet.size === outputLines.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('output has no duplicates in case-insensitive mode', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 0, maxLength: 50 }),
          (lines: string[]) => {
            const text = lines.join('\n');
            const result = removeDuplicateLines({
              text,
              caseSensitive: false,
              trimWhitespace: false,
            });
            
            if (!result.cleanedText) return true;
            
            const outputLines = result.cleanedText.split('\n');
            const normalizedSet = new Set(outputLines.map(l => l.toLowerCase()));
            
            return normalizedSet.size === outputLines.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('output has no duplicates with trim whitespace', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 0, maxLength: 50 }),
          (lines: string[]) => {
            const text = lines.join('\n');
            const result = removeDuplicateLines({
              text,
              caseSensitive: true,
              trimWhitespace: true,
            });
            
            if (!result.cleanedText) return true;
            
            const outputLines = result.cleanedText.split('\n');
            const normalizedSet = new Set(outputLines.map(l => l.trim()));
            
            return normalizedSet.size === outputLines.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
