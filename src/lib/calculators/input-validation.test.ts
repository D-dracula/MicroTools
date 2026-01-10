/**
 * Property-Based Tests for Input Validation Module
 * 
 * Feature: advanced-merchant-calculators, Property 14: Input Validation for Invalid Values
 * Validates: Requirements 6.1, 6.2
 */

import fc from 'fast-check';
import {
  validatePositiveNumber,
  validateNonNegativeNumber,
  validatePercentage,
  validateRequiredFields,
  validateNumericFields,
  isValidPositiveNumber,
  isValidNonNegativeNumber,
  isValidPercentage,
} from './input-validation';

describe('Input Validation Properties', () => {
  /**
   * Property 14a: Negative values are rejected for positive number validation
   * 
   * For any negative number, validatePositiveNumber SHALL return isValid: false
   * with an appropriate error message.
   * 
   * Validates: Requirements 6.1
   */
  it('Property 14a: negative values are rejected for positive number validation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-1000000), max: Math.fround(-0.001), noNaN: true }),
        (negativeValue) => {
          const result = validatePositiveNumber(negativeValue, 'TestField');
          
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).toContain('negative');
          expect(result.errorKey).toBe('validation.cannotBeNegative');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14b: Negative values are rejected for non-negative number validation
   * 
   * For any negative number, validateNonNegativeNumber SHALL return isValid: false
   * with an appropriate error message.
   * 
   * Validates: Requirements 6.1
   */
  it('Property 14b: negative values are rejected for non-negative number validation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-1000000), max: Math.fround(-0.001), noNaN: true }),
        (negativeValue) => {
          const result = validateNonNegativeNumber(negativeValue, 'TestField');
          
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).toContain('negative');
          expect(result.errorKey).toBe('validation.cannotBeNegative');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14c: Percentages greater than 100 return warnings
   * 
   * For any percentage value > 100, validatePercentage SHALL return isValid: true
   * but hasWarning: true with an appropriate warning message.
   * 
   * Validates: Requirements 6.2
   */
  it('Property 14c: percentages greater than 100 return warnings', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(100.001), max: Math.fround(1000), noNaN: true }),
        (highPercentage) => {
          const result = validatePercentage(highPercentage, 'TestPercentage');
          
          // Should be valid but with warning
          expect(result.isValid).toBe(true);
          expect(result.hasWarning).toBe(true);
          expect(result.warning).toBeDefined();
          expect(result.warning).toContain('100%');
          expect(result.warningKey).toBe('validation.percentageExceeds100');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14d: Valid positive numbers pass validation
   * 
   * For any positive number, validatePositiveNumber SHALL return isValid: true.
   * 
   * Validates: Requirements 6.1
   */
  it('Property 14d: valid positive numbers pass validation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.001), max: Math.fround(1000000), noNaN: true }),
        (positiveValue) => {
          const result = validatePositiveNumber(positiveValue, 'TestField');
          
          expect(result.isValid).toBe(true);
          expect(result.error).toBeUndefined();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14e: Valid percentages (0-100) pass without warnings
   * 
   * For any percentage value between 0 and 100 (inclusive),
   * validatePercentage SHALL return isValid: true and hasWarning: false.
   * 
   * Validates: Requirements 6.2
   */
  it('Property 14e: valid percentages (0-100) pass without warnings', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        (validPercentage) => {
          const result = validatePercentage(validPercentage, 'TestPercentage');
          
          expect(result.isValid).toBe(true);
          expect(result.hasWarning).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14f: Zero is rejected for positive number validation
   * 
   * Zero SHALL be rejected by validatePositiveNumber since positive means > 0.
   * 
   * Validates: Requirements 6.1
   */
  it('Property 14f: zero is rejected for positive number validation', () => {
    const result = validatePositiveNumber(0, 'TestField');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.errorKey).toBe('validation.mustBePositive');
  });

  /**
   * Property 14g: Zero is accepted for non-negative number validation
   * 
   * Zero SHALL be accepted by validateNonNegativeNumber.
   * 
   * Validates: Requirements 6.1
   */
  it('Property 14g: zero is accepted for non-negative number validation', () => {
    const result = validateNonNegativeNumber(0, 'TestField');
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  /**
   * Property 14h: Type guards are consistent with validation functions
   * 
   * For any value, the type guard result SHALL match the validation result.
   * 
   * Validates: Requirements 6.1, 6.2
   */
  it('Property 14h: type guards are consistent with validation functions', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.float({ noNaN: true }),
          fc.constant(null),
          fc.constant(undefined),
          fc.string()
        ),
        (value) => {
          // Test positive number type guard
          const positiveResult = validatePositiveNumber(value);
          expect(isValidPositiveNumber(value)).toBe(positiveResult.isValid);
          
          // Test non-negative number type guard
          const nonNegativeResult = validateNonNegativeNumber(value);
          expect(isValidNonNegativeNumber(value)).toBe(nonNegativeResult.isValid);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14i: Invalid types are rejected
   * 
   * Non-number types (null, undefined, strings) SHALL be rejected.
   * 
   * Validates: Requirements 6.1
   */
  it('Property 14i: invalid types are rejected', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.string()
        ),
        (invalidValue) => {
          const positiveResult = validatePositiveNumber(invalidValue, 'TestField');
          expect(positiveResult.isValid).toBe(false);
          
          const nonNegativeResult = validateNonNegativeNumber(invalidValue, 'TestField');
          expect(nonNegativeResult.isValid).toBe(false);
          
          const percentageResult = validatePercentage(invalidValue, 'TestField');
          expect(percentageResult.isValid).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Required Fields Validation', () => {
  /**
   * Property 14j: Missing required fields are detected
   * 
   * For any object missing required fields, validateRequiredFields SHALL
   * return isValid: false with errors for each missing field.
   * 
   * Validates: Requirements 6.3
   */
  it('Property 14j: missing required fields are detected', () => {
    const requiredFields = ['field1', 'field2', 'field3'] as const;
    
    // Test with empty object
    const result = validateRequiredFields({}, requiredFields);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(3);
    expect(result.errors.every(e => e.errorKey === 'validation.required')).toBe(true);
  });

  /**
   * Property 14k: Present required fields pass validation
   * 
   * For any object with all required fields present,
   * validateRequiredFields SHALL return isValid: true.
   * 
   * Validates: Requirements 6.3
   */
  it('Property 14k: present required fields pass validation', () => {
    fc.assert(
      fc.property(
        fc.record({
          field1: fc.anything(),
          field2: fc.anything(),
          field3: fc.anything(),
        }).filter(obj => 
          obj.field1 !== undefined && obj.field1 !== null && obj.field1 !== '' &&
          obj.field2 !== undefined && obj.field2 !== null && obj.field2 !== '' &&
          obj.field3 !== undefined && obj.field3 !== null && obj.field3 !== ''
        ),
        (data) => {
          const requiredFields = ['field1', 'field2', 'field3'] as const;
          const result = validateRequiredFields(data, requiredFields);
          
          expect(result.isValid).toBe(true);
          expect(result.errors.length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Numeric Fields Batch Validation', () => {
  /**
   * Property 14l: Batch validation correctly aggregates errors
   * 
   * For any set of fields with mixed valid/invalid values,
   * validateNumericFields SHALL return all errors.
   * 
   * Validates: Requirements 6.1, 6.2
   */
  it('Property 14l: batch validation correctly aggregates errors', () => {
    const fields = [
      { value: -5, fieldName: 'negativeField', type: 'positive' as const },
      { value: 10, fieldName: 'validField', type: 'positive' as const },
      { value: 150, fieldName: 'highPercentage', type: 'percentage' as const },
    ];
    
    const result = validateNumericFields(fields);
    
    // Should have 1 error (negative value)
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].field).toBe('negativeField');
    
    // Should have 1 warning (percentage > 100)
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0].field).toBe('highPercentage');
    
    // Overall should be invalid due to error
    expect(result.isValid).toBe(false);
  });
});
