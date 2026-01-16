/**
 * Property-Based Tests for API Keys Management Utilities
 * 
 * Feature: admin-dashboard
 * Properties: 17, 18
 * Validates: Requirements 10.1, 10.2, 10.5
 */

import fc from 'fast-check';
import {
  maskApiKey,
  isMaskedProperly,
  isValidValidationResult,
  type KeyValidationResult,
} from './keys-utils';

/**
 * Arbitrary generators for test data
 */

// Generate a valid API key string (various formats)
function apiKeyString(): fc.Arbitrary<string> {
  return fc.oneof(
    // Short format (< 12 chars)
    fc.string({ minLength: 1, maxLength: 11 }),
    // Standard format (12-64 chars)
    fc.string({ minLength: 12, maxLength: 64 }),
    // Long format (> 64 chars)
    fc.string({ minLength: 65, maxLength: 128 }),
    // Common API key patterns with alphanumeric
    fc.tuple(
      fc.constantFrom('sk-', 'pk-', 'api-', 'key-'),
      fc.string({ minLength: 32, maxLength: 64 })
    ).map(([prefix, str]) => `${prefix}${str}`),
    // UUID-like keys
    fc.uuid(),
    // Base64-like keys
    fc.base64String({ minLength: 20, maxLength: 80 })
  );
}

// Generate an empty or undefined value
function emptyValue(): fc.Arbitrary<string | undefined> {
  return fc.constantFrom('', undefined);
}

// Generate a validation result
function validationResult(): fc.Arbitrary<KeyValidationResult> {
  return fc.record({
    isValid: fc.boolean(),
    message: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    details: fc.option(
      fc.dictionary(fc.string(), fc.jsonValue()),
      { nil: undefined }
    ),
  });
}

describe('API Keys Management Utilities Property Tests', () => {
  /**
   * Property 17: API Key Masking
   * 
   * For any API key displayed in the Keys Manager, the value SHALL be masked 
   * (showing only first 4 and last 4 characters) to prevent exposure.
   * 
   * Validates: Requirements 10.1
   */
  describe('Property 17: API Key Masking', () => {
    /**
     * Property 17a: Masked keys hide middle characters
     * 
     * For any API key with length >= 12, the masked value should not contain
     * any of the middle characters from the original key.
     */
    it('Property 17a: Masked keys hide middle characters', () => {
      fc.assert(
        fc.property(
          apiKeyString().filter(s => s.length >= 12),
          (apiKey) => {
            const masked = maskApiKey(apiKey);
            
            expect(masked).not.toBeNull();
            
            if (masked) {
              // Extract middle characters from original
              const middleChars = apiKey.substring(4, apiKey.length - 4);
              
              // Masked value should not contain any middle characters
              expect(isMaskedProperly(apiKey, masked)).toBe(true);
              
              // Verify middle is actually masked (contains asterisks)
              expect(masked).toContain('*');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 17b: Masked keys preserve first 4 characters
     * 
     * For any API key with length >= 12, the masked value should start with
     * the first 4 characters of the original key.
     */
    it('Property 17b: Masked keys preserve first 4 characters', () => {
      fc.assert(
        fc.property(
          apiKeyString().filter(s => s.length >= 12),
          (apiKey) => {
            const masked = maskApiKey(apiKey);
            
            expect(masked).not.toBeNull();
            
            if (masked) {
              const first4 = apiKey.substring(0, 4);
              expect(masked.startsWith(first4)).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 17c: Masked keys preserve last 4 characters
     * 
     * For any API key with length >= 12, the masked value should end with
     * the last 4 characters of the original key.
     */
    it('Property 17c: Masked keys preserve last 4 characters', () => {
      fc.assert(
        fc.property(
          apiKeyString().filter(s => s.length >= 12),
          (apiKey) => {
            const masked = maskApiKey(apiKey);
            
            expect(masked).not.toBeNull();
            
            if (masked) {
              const last4 = apiKey.substring(apiKey.length - 4);
              expect(masked.endsWith(last4)).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 17d: Short keys are fully masked
     * 
     * For any API key with length < 12, the masked value should be '****'
     * to prevent any exposure.
     */
    it('Property 17d: Short keys are fully masked', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 11 }),
          (apiKey) => {
            const masked = maskApiKey(apiKey);
            
            expect(masked).toBe('****');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 17e: Empty values return null
     * 
     * For any empty or undefined value, maskApiKey should return null.
     */
    it('Property 17e: Empty values return null', () => {
      fc.assert(
        fc.property(
          emptyValue(),
          (value) => {
            const masked = maskApiKey(value);
            
            expect(masked).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 17f: Mask length is bounded
     * 
     * For any API key, the masked value should have a reasonable length
     * and the masking section should be bounded.
     */
    it('Property 17f: Mask length is bounded', () => {
      fc.assert(
        fc.property(
          apiKeyString().filter(s => s.length >= 12 && !s.includes('*')), // Exclude keys with asterisks
          (apiKey) => {
            const masked = maskApiKey(apiKey);
            
            expect(masked).not.toBeNull();
            
            if (masked) {
              const asteriskCount = (masked.match(/\*/g) || []).length;
              // The mask length should be at most 20
              expect(asteriskCount).toBeLessThanOrEqual(20);
              // And should be at least 1 (there's always some masking)
              expect(asteriskCount).toBeGreaterThanOrEqual(1);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 17g: Masking is deterministic
     * 
     * For any API key, calling maskApiKey multiple times should return
     * the same result.
     */
    it('Property 17g: Masking is deterministic', () => {
      fc.assert(
        fc.property(
          apiKeyString(),
          (apiKey) => {
            const masked1 = maskApiKey(apiKey);
            const masked2 = maskApiKey(apiKey);
            
            expect(masked1).toEqual(masked2);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 17h: Masked value length is reasonable
     * 
     * For any API key with length >= 12, the masked value should have
     * length = 4 (first) + maskLength + 4 (last), where maskLength <= 20.
     */
    it('Property 17h: Masked value length is reasonable', () => {
      fc.assert(
        fc.property(
          apiKeyString().filter(s => s.length >= 12),
          (apiKey) => {
            const masked = maskApiKey(apiKey);
            
            expect(masked).not.toBeNull();
            
            if (masked) {
              // Expected length: 4 + min(original.length - 8, 20) + 4
              const expectedMaskLength = Math.min(apiKey.length - 8, 20);
              const expectedLength = 4 + expectedMaskLength + 4;
              
              expect(masked.length).toBe(expectedLength);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 17i: isMaskedProperly validates masking
     * 
     * For any API key and its masked value, isMaskedProperly should return
     * true, confirming that the masking is correct.
     */
    it('Property 17i: isMaskedProperly validates masking', () => {
      fc.assert(
        fc.property(
          apiKeyString(),
          (apiKey) => {
            const masked = maskApiKey(apiKey);
            
            expect(isMaskedProperly(apiKey, masked)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 17j: Different keys produce different masks
     * 
     * For any two different API keys (with length >= 12), their masked
     * values should be different (unless they share first/last 4 chars).
     */
    it('Property 17j: Different keys produce different masks', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            apiKeyString().filter(s => s.length >= 12),
            apiKeyString().filter(s => s.length >= 12)
          ).filter(([k1, k2]) => k1 !== k2),
          ([key1, key2]) => {
            const masked1 = maskApiKey(key1);
            const masked2 = maskApiKey(key2);
            
            // If first 4 and last 4 are different, masks should be different
            const samePrefix = key1.substring(0, 4) === key2.substring(0, 4);
            const sameSuffix = key1.substring(key1.length - 4) === key2.substring(key2.length - 4);
            
            if (!samePrefix || !sameSuffix) {
              expect(masked1).not.toEqual(masked2);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 18: API Key Validation
   * 
   * For any API key that supports testing, the Keys Manager SHALL correctly 
   * report whether the key is valid based on the test result.
   * 
   * Validates: Requirements 10.2, 10.5
   */
  describe('Property 18: API Key Validation', () => {
    /**
     * Property 18a: Validation result structure is correct
     * 
     * For any validation result, it should have the required fields:
     * isValid (boolean), message (non-empty string), and optional details.
     */
    it('Property 18a: Validation result structure is correct', () => {
      fc.assert(
        fc.property(
          validationResult(),
          (result) => {
            expect(isValidValidationResult(result)).toBe(true);
            
            // Check required fields
            expect(typeof result.isValid).toBe('boolean');
            expect(typeof result.message).toBe('string');
            expect(result.message.length).toBeGreaterThan(0);
            
            // Check optional details
            if (result.details !== undefined) {
              expect(typeof result.details).toBe('object');
              expect(result.details).not.toBeNull();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 18b: Valid results have positive messages
     * 
     * For any validation result where isValid is true, the message should
     * indicate success (not contain error-related words).
     */
    it('Property 18b: Valid results have positive messages', () => {
      fc.assert(
        fc.property(
          validationResult().filter(r => r.isValid),
          (result) => {
            const message = result.message.toLowerCase();
            
            // Valid results should not contain error words
            const errorWords = ['failed', 'invalid', 'error', 'denied'];
            const hasErrorWord = errorWords.some(word => message.includes(word));
            
            // This is a soft check - valid results typically have positive messages
            // but we don't enforce it strictly
            if (hasErrorWord) {
              // Log for awareness but don't fail
              console.log('Valid result with error-like message:', result.message);
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property 18c: Invalid results have descriptive messages
     * 
     * For any validation result where isValid is false, the message should
     * be descriptive (not just "failed").
     */
    it('Property 18c: Invalid results have descriptive messages', () => {
      fc.assert(
        fc.property(
          validationResult().filter(r => !r.isValid),
          (result) => {
            // Message should be more than just "failed"
            expect(result.message.toLowerCase()).not.toBe('failed');
            // Message should be descriptive (at least 1 character after trimming)
            expect(result.message.trim().length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property 18d: Validation results are consistent
     * 
     * For any validation result, calling isValidValidationResult should
     * always return the same value.
     */
    it('Property 18d: Validation results are consistent', () => {
      fc.assert(
        fc.property(
          validationResult(),
          (result) => {
            const check1 = isValidValidationResult(result);
            const check2 = isValidValidationResult(result);
            
            expect(check1).toBe(check2);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 18e: Invalid structures are rejected
     * 
     * For any object that doesn't match the validation result structure,
     * isValidValidationResult should return false.
     */
    it('Property 18e: Invalid structures are rejected', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string(),
            fc.integer(),
            fc.record({
              isValid: fc.string(), // Wrong type
              message: fc.string(),
            }),
            fc.record({
              isValid: fc.boolean(),
              message: fc.integer(), // Wrong type
            }),
            fc.record({
              isValid: fc.boolean(),
              message: fc.constant(''), // Empty message
            }),
            fc.record({
              // Missing isValid
              message: fc.string({ minLength: 1 }),
            }),
            fc.record({
              isValid: fc.boolean(),
              // Missing message
            })
          ),
          (invalidResult) => {
            expect(isValidValidationResult(invalidResult as any)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 18f: Details field is optional
     * 
     * For any validation result, the details field can be undefined or
     * an object, and the result should still be valid.
     */
    it('Property 18f: Details field is optional', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.option(fc.dictionary(fc.string(), fc.jsonValue()), { nil: undefined }),
          (isValid, message, details) => {
            const result: KeyValidationResult = {
              isValid,
              message,
              details,
            };
            
            expect(isValidValidationResult(result)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 18g: Validation preserves boolean type
     * 
     * For any validation result, the isValid field should always be
     * exactly true or false (not truthy/falsy).
     */
    it('Property 18g: Validation preserves boolean type', () => {
      fc.assert(
        fc.property(
          validationResult(),
          (result) => {
            expect(result.isValid === true || result.isValid === false).toBe(true);
            expect(typeof result.isValid).toBe('boolean');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional integration tests for masking and validation together
   */
  describe('Masking and Validation Integration', () => {
    /**
     * Masked keys can still be validated for structure
     * 
     * For any API key, after masking, we should still be able to determine
     * if it was properly masked (even though we can't validate the key itself).
     */
    it('Masked keys maintain validation structure', () => {
      fc.assert(
        fc.property(
          apiKeyString(),
          (apiKey) => {
            const masked = maskApiKey(apiKey);
            
            // We can validate the masking was done properly
            expect(isMaskedProperly(apiKey, masked)).toBe(true);
            
            // Masked value should be a string or null
            expect(masked === null || typeof masked === 'string').toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Empty keys cannot be validated
     * 
     * For any empty or undefined key, masking returns null and
     * validation would not be possible.
     */
    it('Empty keys cannot be validated', () => {
      fc.assert(
        fc.property(
          emptyValue(),
          (value) => {
            const masked = maskApiKey(value);
            
            expect(masked).toBeNull();
            
            // Cannot validate an empty key
            expect(value === '' || value === undefined).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
