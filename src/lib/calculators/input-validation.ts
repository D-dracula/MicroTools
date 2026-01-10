/**
 * Input Validation Module for Advanced Merchant Calculators
 * 
 * Provides shared validation functions for validating user inputs across
 * all calculator tools. Returns structured validation results with error messages.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorKey?: string; // i18n key for error message
}

export interface ValidationWarning {
  hasWarning: boolean;
  warning?: string;
  warningKey?: string; // i18n key for warning message
}

export interface FieldValidationResult extends ValidationResult {
  field: string;
}

export interface MultiFieldValidationResult {
  isValid: boolean;
  errors: FieldValidationResult[];
  warnings: Array<{ field: string } & ValidationWarning>;
}

/**
 * Validates that a value is a positive number (greater than zero).
 * Rejects: NaN, undefined, null, strings, zero, negative numbers, Infinity
 * 
 * Requirement: 6.1 - WHEN a user enters a negative number for costs or prices,
 * THE System SHALL display an error message
 */
export function validatePositiveNumber(
  value: unknown,
  fieldName: string = 'Value'
): ValidationResult {
  // Check for undefined or null
  if (value === undefined || value === null) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
      errorKey: 'validation.required',
    };
  }

  // Check for non-number types
  if (typeof value !== 'number') {
    return {
      isValid: false,
      error: `${fieldName} must be a number`,
      errorKey: 'validation.mustBeNumber',
    };
  }

  // Check for NaN
  if (Number.isNaN(value)) {
    return {
      isValid: false,
      error: `${fieldName} is not a valid number`,
      errorKey: 'validation.invalidNumber',
    };
  }

  // Check for Infinity
  if (!Number.isFinite(value)) {
    return {
      isValid: false,
      error: `${fieldName} must be a finite number`,
      errorKey: 'validation.mustBeFinite',
    };
  }

  // Check for negative values - Requirement 6.1
  if (value < 0) {
    return {
      isValid: false,
      error: `${fieldName} cannot be negative`,
      errorKey: 'validation.cannotBeNegative',
    };
  }

  // Check for zero (positive means > 0)
  if (value === 0) {
    return {
      isValid: false,
      error: `${fieldName} must be greater than zero`,
      errorKey: 'validation.mustBePositive',
    };
  }

  return { isValid: true };
}

/**
 * Validates that a value is a non-negative number (zero or greater).
 * Useful for optional costs that can be zero.
 * 
 * Requirement: 6.1 - WHEN a user enters a negative number for costs or prices,
 * THE System SHALL display an error message
 */
export function validateNonNegativeNumber(
  value: unknown,
  fieldName: string = 'Value'
): ValidationResult {
  // Check for undefined or null
  if (value === undefined || value === null) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
      errorKey: 'validation.required',
    };
  }

  // Check for non-number types
  if (typeof value !== 'number') {
    return {
      isValid: false,
      error: `${fieldName} must be a number`,
      errorKey: 'validation.mustBeNumber',
    };
  }

  // Check for NaN
  if (Number.isNaN(value)) {
    return {
      isValid: false,
      error: `${fieldName} is not a valid number`,
      errorKey: 'validation.invalidNumber',
    };
  }

  // Check for Infinity
  if (!Number.isFinite(value)) {
    return {
      isValid: false,
      error: `${fieldName} must be a finite number`,
      errorKey: 'validation.mustBeFinite',
    };
  }

  // Check for negative values - Requirement 6.1
  if (value < 0) {
    return {
      isValid: false,
      error: `${fieldName} cannot be negative`,
      errorKey: 'validation.cannotBeNegative',
    };
  }

  return { isValid: true };
}

/**
 * Validates that a value is a valid percentage (0-100).
 * Returns a warning if percentage exceeds 100 but doesn't fail validation.
 * 
 * Requirement: 6.2 - WHEN a user enters a percentage greater than 100 for
 * return rate or discount, THE System SHALL display a warning
 */
export function validatePercentage(
  value: unknown,
  fieldName: string = 'Percentage'
): ValidationResult & ValidationWarning {
  // First validate as non-negative number
  const numberValidation = validateNonNegativeNumber(value, fieldName);
  if (!numberValidation.isValid) {
    return { ...numberValidation, hasWarning: false };
  }

  const numValue = value as number;

  // Check if percentage exceeds 100 - Requirement 6.2
  if (numValue > 100) {
    return {
      isValid: true, // Still valid, but with warning
      hasWarning: true,
      warning: `${fieldName} exceeds 100%. This may indicate an error.`,
      warningKey: 'validation.percentageExceeds100',
    };
  }

  return { isValid: true, hasWarning: false };
}

/**
 * Validates that all required fields are present and not empty.
 * 
 * Requirement: 6.3 - WHEN required fields are empty, THE System SHALL
 * highlight them and prevent calculation
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: Partial<T>,
  requiredFields: readonly (keyof T)[]
): MultiFieldValidationResult {
  const errors: FieldValidationResult[] = [];
  const warnings: Array<{ field: string } & ValidationWarning> = [];

  for (const field of requiredFields) {
    const value = data[field];
    const fieldName = String(field);

    // Check if field is missing or empty
    if (value === undefined || value === null || value === '') {
      errors.push({
        field: fieldName,
        isValid: false,
        error: `${fieldName} is required`,
        errorKey: 'validation.required',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates multiple numeric fields at once.
 * Useful for validating all inputs of a calculator form.
 */
export function validateNumericFields(
  fields: Array<{
    value: unknown;
    fieldName: string;
    type: 'positive' | 'nonNegative' | 'percentage';
  }>
): MultiFieldValidationResult {
  const errors: FieldValidationResult[] = [];
  const warnings: Array<{ field: string } & ValidationWarning> = [];

  for (const { value, fieldName, type } of fields) {
    let result: ValidationResult & Partial<ValidationWarning>;

    switch (type) {
      case 'positive':
        result = validatePositiveNumber(value, fieldName);
        break;
      case 'nonNegative':
        result = validateNonNegativeNumber(value, fieldName);
        break;
      case 'percentage':
        result = validatePercentage(value, fieldName);
        break;
    }

    if (!result.isValid) {
      errors.push({
        field: fieldName,
        isValid: false,
        error: result.error,
        errorKey: result.errorKey,
      });
    }

    if ('hasWarning' in result && result.hasWarning) {
      warnings.push({
        field: fieldName,
        hasWarning: true,
        warning: result.warning,
        warningKey: result.warningKey,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Type guard to check if a value is a valid positive number.
 */
export function isValidPositiveNumber(value: unknown): value is number {
  return validatePositiveNumber(value).isValid;
}

/**
 * Type guard to check if a value is a valid non-negative number.
 */
export function isValidNonNegativeNumber(value: unknown): value is number {
  return validateNonNegativeNumber(value).isValid;
}

/**
 * Type guard to check if a value is a valid percentage (0-100).
 */
export function isValidPercentage(value: unknown): value is number {
  const result = validatePercentage(value);
  return result.isValid && !result.hasWarning;
}

/**
 * Parses a string input to a number, returning NaN if invalid.
 * Useful for handling form inputs.
 */
export function parseNumericInput(input: string | number | undefined | null): number {
  if (input === undefined || input === null || input === '') {
    return NaN;
  }
  
  if (typeof input === 'number') {
    return input;
  }
  
  // Remove any whitespace and handle Arabic numerals if needed
  const cleaned = String(input).trim();
  return parseFloat(cleaned);
}

/**
 * Combines validation of required fields and numeric validation.
 * Returns a comprehensive validation result.
 */
export function validateCalculatorInputs<T extends Record<string, unknown>>(
  data: Partial<T>,
  fieldConfigs: Array<{
    field: keyof T;
    type: 'positive' | 'nonNegative' | 'percentage';
    required: boolean;
    displayName?: string;
  }>
): MultiFieldValidationResult {
  const errors: FieldValidationResult[] = [];
  const warnings: Array<{ field: string } & ValidationWarning> = [];

  for (const config of fieldConfigs) {
    const value = data[config.field];
    const fieldName = config.displayName || String(config.field);

    // Check required fields - Requirement 6.3
    if (config.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: String(config.field),
        isValid: false,
        error: `${fieldName} is required`,
        errorKey: 'validation.required',
      });
      continue;
    }

    // Skip validation for optional empty fields
    if (!config.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Validate numeric value
    let result: ValidationResult & Partial<ValidationWarning>;

    switch (config.type) {
      case 'positive':
        result = validatePositiveNumber(value, fieldName);
        break;
      case 'nonNegative':
        result = validateNonNegativeNumber(value, fieldName);
        break;
      case 'percentage':
        result = validatePercentage(value, fieldName);
        break;
    }

    if (!result.isValid) {
      errors.push({
        field: String(config.field),
        isValid: false,
        error: result.error,
        errorKey: result.errorKey,
      });
    }

    if ('hasWarning' in result && result.hasWarning) {
      warnings.push({
        field: String(config.field),
        hasWarning: true,
        warning: result.warning,
        warningKey: result.warningKey,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
