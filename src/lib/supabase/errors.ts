/**
 * Comprehensive error handling system for Supabase operations
 * Provides structured error types, user-friendly messages, and error recovery
 * Requirements: 6.4, 8.4
 */

import { PostgrestError } from '@supabase/supabase-js'

// Base error class for all Supabase-related errors
export abstract class SupabaseError extends Error {
  abstract readonly code: string
  abstract readonly category: 'network' | 'auth' | 'database' | 'validation' | 'permission' | 'configuration'
  abstract readonly severity: 'low' | 'medium' | 'high' | 'critical'
  abstract readonly retryable: boolean
  abstract readonly userMessage: string

  public readonly timestamp: Date
  public readonly context?: Record<string, any>
  public readonly originalError?: Error

  constructor(
    message: string,
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()
    this.context = context
    this.originalError = originalError

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Get a structured error object for logging
   */
  toLogObject(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      retryable: this.retryable,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : undefined,
    }
  }

  /**
   * Get user-friendly error response for API endpoints
   */
  toApiResponse(): { success: false; error: string; code: string; retryable: boolean } {
    return {
      success: false,
      error: this.userMessage,
      code: this.code,
      retryable: this.retryable,
    }
  }
}

// Network-related errors (connection, timeout, etc.)
export class SupabaseNetworkError extends SupabaseError {
  readonly code = 'NETWORK_ERROR'
  readonly category = 'network' as const
  readonly severity = 'medium' as const
  readonly retryable = true
  readonly userMessage = 'Network connection issue. Please check your internet connection and try again.'
}

export class SupabaseTimeoutError extends SupabaseError {
  readonly code = 'TIMEOUT_ERROR'
  readonly category = 'network' as const
  readonly severity = 'medium' as const
  readonly retryable = true
  readonly userMessage = 'Request timed out. Please try again.'
}

export class SupabaseConnectionError extends SupabaseError {
  readonly code = 'CONNECTION_ERROR'
  readonly category = 'network' as const
  readonly severity = 'high' as const
  readonly retryable = true
  readonly userMessage = 'Unable to connect to the database. Please try again in a moment.'
}

// Authentication and authorization errors
export class SupabaseAuthError extends SupabaseError {
  readonly code = 'AUTH_ERROR'
  readonly category = 'auth' as const
  readonly severity = 'high' as const
  readonly retryable = false
  readonly userMessage = 'Authentication failed. Please sign in again.'
}

export class SupabasePermissionError extends SupabaseError {
  readonly code = 'PERMISSION_ERROR'
  readonly category = 'permission' as const
  readonly severity = 'medium' as const
  readonly retryable = false
  readonly userMessage = 'You do not have permission to perform this action.'
}

export class SupabaseSessionExpiredError extends SupabaseError {
  readonly code = 'SESSION_EXPIRED'
  readonly category = 'auth' as const
  readonly severity = 'medium' as const
  readonly retryable = false
  readonly userMessage = 'Your session has expired. Please sign in again.'
}

// Database-related errors
export class SupabaseDatabaseError extends SupabaseError {
  readonly code = 'DATABASE_ERROR'
  readonly category = 'database' as const
  readonly severity = 'high' as const
  readonly retryable = false
  readonly userMessage = 'A database error occurred. Please try again or contact support if the problem persists.'
}

export class SupabaseConstraintError extends SupabaseError {
  readonly code = 'CONSTRAINT_ERROR'
  readonly category = 'database' as const
  readonly severity = 'low' as const
  readonly retryable = false
  readonly userMessage = 'The data violates database constraints. Please check your input and try again.'
}

export class SupabaseNotFoundError extends SupabaseError {
  readonly code = 'NOT_FOUND'
  readonly category = 'database' as const
  readonly severity = 'low' as const
  readonly retryable = false
  readonly userMessage = 'The requested resource was not found.'
}

export class SupabaseDuplicateError extends SupabaseError {
  readonly code = 'DUPLICATE_ERROR'
  readonly category = 'database' as const
  readonly severity = 'low' as const
  readonly retryable = false
  readonly userMessage = 'This record already exists. Please use different values.'
}

// Validation errors
export class SupabaseValidationError extends SupabaseError {
  readonly code = 'VALIDATION_ERROR'
  readonly category = 'validation' as const
  readonly severity = 'low' as const
  readonly retryable = false
  readonly userMessage = 'Invalid data provided. Please check your input and try again.'
}

// Configuration errors
export class SupabaseConfigurationError extends SupabaseError {
  readonly code = 'CONFIGURATION_ERROR'
  readonly category = 'configuration' as const
  readonly severity = 'critical' as const
  readonly retryable = false
  readonly userMessage = 'Service configuration error. Please contact support.'
}

export class SupabaseEnvironmentError extends SupabaseError {
  readonly code = 'ENVIRONMENT_ERROR'
  readonly category = 'configuration' as const
  readonly severity = 'critical' as const
  readonly retryable = false
  readonly userMessage = 'Service is temporarily unavailable. Please try again later.'
}

// Rate limiting errors
export class SupabaseRateLimitError extends SupabaseError {
  readonly code = 'RATE_LIMIT_ERROR'
  readonly category = 'network' as const
  readonly severity = 'medium' as const
  readonly retryable = true
  readonly userMessage = 'Too many requests. Please wait a moment and try again.'

  constructor(
    message: string,
    public readonly retryAfter?: number,
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message, context, originalError)
  }

  toApiResponse() {
    const response = super.toApiResponse()
    return {
      ...response,
      retryAfter: this.retryAfter,
    }
  }
}

/**
 * Error classification utility
 * Converts Supabase PostgrestError to appropriate SupabaseError
 */
export function classifySupabaseError(
  error: PostgrestError | Error | unknown,
  context?: Record<string, any>
): SupabaseError {
  // Handle PostgrestError (Supabase database errors)
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError

    switch (pgError.code) {
      case 'PGRST116': // Not found
        return new SupabaseNotFoundError(
          `Resource not found: ${pgError.message}`,
          context,
          pgError as Error
        )

      case 'PGRST301': // JWT expired
      case 'PGRST302': // JWT invalid
        return new SupabaseSessionExpiredError(
          `Session expired: ${pgError.message}`,
          context,
          pgError as Error
        )

      case 'PGRST103': // Insufficient privileges
        return new SupabasePermissionError(
          `Permission denied: ${pgError.message}`,
          context,
          pgError as Error
        )

      case '23505': // Unique constraint violation
        return new SupabaseDuplicateError(
          `Duplicate entry: ${pgError.message}`,
          context,
          pgError as Error
        )

      case '23503': // Foreign key constraint violation
      case '23502': // Not null constraint violation
      case '23514': // Check constraint violation
        return new SupabaseConstraintError(
          `Data constraint violation: ${pgError.message}`,
          context,
          pgError as Error
        )

      case '42P01': // Undefined table
      case '42703': // Undefined column
        return new SupabaseConfigurationError(
          `Database schema error: ${pgError.message}`,
          context,
          pgError as Error
        )

      default:
        return new SupabaseDatabaseError(
          `Database error (${pgError.code}): ${pgError.message}`,
          { ...context, pgErrorCode: pgError.code },
          pgError as Error
        )
    }
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    // Network-related errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      error.name === 'NetworkError'
    ) {
      return new SupabaseNetworkError(
        `Network error: ${error.message}`,
        context,
        error
      )
    }

    // Timeout errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('aborted') ||
      error.name === 'TimeoutError'
    ) {
      return new SupabaseTimeoutError(
        `Timeout error: ${error.message}`,
        context,
        error
      )
    }

    // Authentication errors
    if (
      errorMessage.includes('auth') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden')
    ) {
      return new SupabaseAuthError(
        `Authentication error: ${error.message}`,
        context,
        error
      )
    }

    // Configuration errors
    if (
      errorMessage.includes('environment') ||
      errorMessage.includes('config') ||
      errorMessage.includes('missing')
    ) {
      return new SupabaseEnvironmentError(
        `Configuration error: ${error.message}`,
        context,
        error
      )
    }

    // Generic database error
    return new SupabaseDatabaseError(
      `Unexpected error: ${error.message}`,
      context,
      error
    )
  }

  // Handle unknown errors
  return new SupabaseDatabaseError(
    `Unknown error: ${String(error)}`,
    { ...context, originalError: error }
  )
}

/**
 * Error recovery suggestions based on error type
 */
export function getErrorRecoveryActions(error: SupabaseError): string[] {
  const actions: string[] = []

  switch (error.category) {
    case 'network':
      actions.push('Check your internet connection')
      actions.push('Try refreshing the page')
      if (error.retryable) {
        actions.push('Wait a moment and try again')
      }
      break

    case 'auth':
      actions.push('Sign out and sign back in')
      actions.push('Clear your browser cache and cookies')
      actions.push('Try using a different browser or incognito mode')
      break

    case 'database':
      if (error instanceof SupabaseNotFoundError) {
        actions.push('Verify the resource exists')
        actions.push('Check if you have the correct permissions')
      } else if (error instanceof SupabaseDuplicateError) {
        actions.push('Use different values for unique fields')
        actions.push('Check if the record already exists')
      } else {
        actions.push('Try again in a few moments')
        actions.push('Contact support if the problem persists')
      }
      break

    case 'validation':
      actions.push('Check your input data')
      actions.push('Ensure all required fields are filled')
      actions.push('Verify data formats (dates, emails, etc.)')
      break

    case 'permission':
      actions.push('Contact an administrator for access')
      actions.push('Verify you are signed in to the correct account')
      break

    case 'configuration':
      actions.push('Contact support')
      actions.push('Try again later')
      break

    default:
      actions.push('Try again')
      actions.push('Contact support if the problem persists')
  }

  return actions
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetryError(error: SupabaseError): boolean {
  return error.retryable && error.category === 'network'
}

/**
 * Get retry delay based on attempt number (exponential backoff)
 */
export function getRetryDelay(attempt: number, baseDelay = 1000, maxDelay = 30000): number {
  const delay = baseDelay * Math.pow(2, attempt - 1)
  const jitter = Math.random() * 0.1 * delay // Add 10% jitter
  return Math.min(delay + jitter, maxDelay)
}

/**
 * Error context builder for better debugging
 */
export class ErrorContext {
  private context: Record<string, any> = {}

  static create(): ErrorContext {
    return new ErrorContext()
  }

  operation(operation: string): ErrorContext {
    this.context.operation = operation
    return this
  }

  table(table: string): ErrorContext {
    this.context.table = table
    return this
  }

  userId(userId: string): ErrorContext {
    this.context.userId = userId
    return this
  }

  data(data: any): ErrorContext {
    this.context.data = data
    return this
  }

  query(query: any): ErrorContext {
    this.context.query = query
    return this
  }

  custom(key: string, value: any): ErrorContext {
    this.context[key] = value
    return this
  }

  build(): Record<string, any> {
    return { ...this.context }
  }
}