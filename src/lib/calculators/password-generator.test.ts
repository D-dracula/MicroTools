/**
 * Password Generator Property Tests
 * 
 * Feature: content-technical-tools
 * Tests Properties 10, 11 from design document
 */

import * as fc from 'fast-check';
import { generatePassword, type PasswordOptions } from './password-generator';

// Character sets for validation
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

describe('Password Generator Properties', () => {
  /**
   * Feature: content-technical-tools, Property 10: Length invariant
   * For any requested password length between 8 and 128,
   * the generated password SHALL have exactly that length.
   * **Validates: Requirements 5.1, 5.2**
   */
  describe('Property 10: Length invariant', () => {
    it('generated password has exactly the requested length', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 128 }),
          (length: number) => {
            const result = generatePassword({
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
            });
            
            return result.isValid && result.password.length === length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('length is correct with only uppercase', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 128 }),
          (length: number) => {
            const result = generatePassword({
              length,
              includeUppercase: true,
              includeLowercase: false,
              includeNumbers: false,
              includeSymbols: false,
            });
            
            return result.isValid && result.password.length === length;
          }
        ),
        { numRuns: 100 }
      );
    });


    it('rejects length below 8', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 7 }),
          (length: number) => {
            const result = generatePassword({
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
            });
            
            return !result.isValid && result.error !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects length above 128', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 129, max: 500 }),
          (length: number) => {
            const result = generatePassword({
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
            });
            
            return !result.isValid && result.error !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: content-technical-tools, Property 11: Character type inclusion
   * For any password generation request with specific character types enabled,
   * the generated password SHALL contain at least one character of each enabled type.
   * **Validates: Requirements 5.3, 5.4, 5.5, 5.6**
   */
  describe('Property 11: Character type inclusion', () => {
    it('includes uppercase when enabled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 128 }),
          (length: number) => {
            const result = generatePassword({
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
            });
            
            if (!result.isValid) return false;
            return result.password.split('').some(c => UPPERCASE.includes(c));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('includes lowercase when enabled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 128 }),
          (length: number) => {
            const result = generatePassword({
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
            });
            
            if (!result.isValid) return false;
            return result.password.split('').some(c => LOWERCASE.includes(c));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('includes numbers when enabled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 128 }),
          (length: number) => {
            const result = generatePassword({
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
            });
            
            if (!result.isValid) return false;
            return result.password.split('').some(c => NUMBERS.includes(c));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('includes symbols when enabled', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 128 }),
          (length: number) => {
            const result = generatePassword({
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
            });
            
            if (!result.isValid) return false;
            return result.password.split('').some(c => SYMBOLS.includes(c));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects when no character types selected', () => {
      const result = generatePassword({
        length: 16,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
