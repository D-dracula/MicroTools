/**
 * Retry logic with exponential backoff for Supabase operations
 * Handles network failures and transient errors gracefully
 * Requirements: 6.4, 8.4
 */

import {
  SupabaseError,
  SupabaseConnectionError,
  classifySupabaseError,
  shouldRetryError,
  getRetryDelay,
  ErrorContext,
} from './errors'
// import { logger } from './logger'
const logger = {
  debug: (msg: string, ctx?: any) => console.debug(msg, ctx),
  info: (msg: string, ctx?: any) => console.info(msg, ctx),
  warn: (msg: string, ctx?: any, err?: any) => console.warn(msg, ctx, err),
  error: (msg: string, ctx?: any, err?: any) => console.error(msg, ctx, err),
}

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number
  /** Base delay in milliseconds */
  baseDelay?: number
  /** Maximum delay in milliseconds */
  maxDelay?: number
  /** Custom retry condition function */
  shouldRetry?: (error: SupabaseError, attempt: number) => boolean
  /** Callback for retry attempts */
  onRetry?: (error: SupabaseError, attempt: number, delay: number) => void
  /** Operation context for logging */
  context?: Record<string, any>
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: SupabaseError
  attempts: number
  totalTime: number
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'context'>> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  shouldRetry: shouldRetryError,
}

/**
 * Retry wrapper for async operations with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  const startTime = Date.now()
  let lastError: SupabaseError | undefined

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      logger.debug('Executing operation', {
        attempt,
        maxAttempts: config.maxAttempts,
        context: config.context,
      })

      const result = await operation()
      
      if (attempt > 1) {
        logger.info('Operation succeeded after retry', {
          attempt,
          totalTime: Date.now() - startTime,
          context: config.context,
        })
      }

      return result
    } catch (error) {
      const supabaseError = classifySupabaseError(error, config.context)
      lastError = supabaseError

      logger.warn('Operation failed', {
        attempt,
        maxAttempts: config.maxAttempts,
        error: supabaseError.toLogObject(),
        context: config.context,
      })

      // Check if we should retry
      const shouldRetryThis = config.shouldRetry(supabaseError, attempt)
      const isLastAttempt = attempt === config.maxAttempts

      if (!shouldRetryThis || isLastAttempt) {
        if (isLastAttempt && shouldRetryThis) {
          logger.error('Operation failed after all retry attempts', {
            attempts: attempt,
            totalTime: Date.now() - startTime,
            error: supabaseError.toLogObject(),
            context: config.context,
          })
        }
        throw supabaseError
      }

      // Calculate delay for next attempt
      const delay = getRetryDelay(attempt, config.baseDelay, config.maxDelay)

      logger.info('Retrying operation', {
        attempt,
        nextAttempt: attempt + 1,
        delay,
        error: supabaseError.code,
        context: config.context,
      })

      // Call retry callback if provided
      if (config.onRetry) {
        try {
          config.onRetry(supabaseError, attempt, delay)
        } catch (callbackError) {
          logger.warn('Retry callback failed', { error: callbackError })
        }
      }

      // Wait before retrying
      await sleep(delay)
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new Error('Unexpected retry loop exit')
}

/**
 * Retry wrapper that returns a result object instead of throwing
 */
export async function tryWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now()
  let attempts = 0

  try {
    const result = await withRetry(async () => {
      attempts++
      return await operation()
    }, options)

    return {
      success: true,
      data: result,
      attempts,
      totalTime: Date.now() - startTime,
    }
  } catch (error) {
    const supabaseError = error instanceof SupabaseError 
      ? error 
      : classifySupabaseError(error, options.context)

    return {
      success: false,
      error: supabaseError,
      attempts,
      totalTime: Date.now() - startTime,
    }
  }
}

/**
 * Circuit breaker pattern for handling repeated failures
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeout = 60000, // 1 minute
    private readonly name = 'CircuitBreaker'
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open'
        logger.info('Circuit breaker transitioning to half-open', {
          name: this.name,
          failures: this.failures,
        })
      } else {
        const error = new SupabaseConnectionError(
          'Circuit breaker is open - service temporarily unavailable'
        )
        logger.warn('Circuit breaker rejected request', {
          name: this.name,
          state: this.state,
          failures: this.failures,
        })
        throw error
      }
    }

    try {
      const result = await operation()
      
      if (this.state === 'half-open') {
        this.reset()
        logger.info('Circuit breaker reset after successful operation', {
          name: this.name,
        })
      }
      
      return result
    } catch (error) {
      this.recordFailure()
      
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : classifySupabaseError(error)

      logger.error('Circuit breaker recorded failure', {
        name: this.name,
        state: this.state,
        failures: this.failures,
        error: supabaseError.toLogObject(),
      })

      throw supabaseError
    }
  }

  private recordFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.failureThreshold) {
      this.state = 'open'
      logger.error('Circuit breaker opened due to repeated failures', {
        name: this.name,
        failures: this.failures,
        threshold: this.failureThreshold,
      })
    }
  }

  private reset(): void {
    this.failures = 0
    this.state = 'closed'
    this.lastFailureTime = 0
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    }
  }
}

/**
 * Batch retry for multiple operations
 */
export async function batchWithRetry<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions & { 
    concurrency?: number
    failFast?: boolean 
  } = {}
): Promise<Array<RetryResult<T>>> {
  const { concurrency = 3, failFast = false, ...retryOptions } = options
  const results: Array<RetryResult<T>> = []
  
  // Process operations in batches
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency)
    
    const batchPromises = batch.map(async (operation, index) => {
      const context = {
        ...retryOptions.context,
        batchIndex: Math.floor(i / concurrency),
        operationIndex: i + index,
      }

      return tryWithRetry(operation, { ...retryOptions, context })
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Check for failures if failFast is enabled
    if (failFast && batchResults.some(result => !result.success)) {
      logger.error('Batch operation failed fast', {
        completedOperations: results.length,
        totalOperations: operations.length,
        failures: batchResults.filter(r => !r.success).length,
      })
      break
    }
  }

  return results
}

/**
 * Utility function to create a sleep promise
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry decorator for class methods
 */
export function retryable(options: RetryOptions = {}) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value!

    descriptor.value = async function (this: any, ...args: any[]) {
      const context = ErrorContext.create()
        .operation(`${target.constructor.name}.${propertyKey}`)
        .custom('args', args.length)
        .build()

      return withRetry(
        () => originalMethod.apply(this, args),
        { ...options, context: { ...context, ...options.context } }
      )
    } as T

    return descriptor
  }
}

/**
 * Health check utility for monitoring service availability
 */
export class HealthChecker {
  private lastCheck = 0
  private isHealthy = true
  private consecutiveFailures = 0

  constructor(
    private readonly checkInterval = 30000, // 30 seconds
    private readonly failureThreshold = 3,
    private readonly healthCheckFn: () => Promise<boolean>
  ) {}

  async isServiceHealthy(): Promise<boolean> {
    const now = Date.now()
    
    if (now - this.lastCheck < this.checkInterval) {
      return this.isHealthy
    }

    try {
      const healthy = await this.healthCheckFn()
      
      if (healthy) {
        this.isHealthy = true
        this.consecutiveFailures = 0
      } else {
        this.consecutiveFailures++
        if (this.consecutiveFailures >= this.failureThreshold) {
          this.isHealthy = false
        }
      }

      this.lastCheck = now
      return this.isHealthy
    } catch (error) {
      this.consecutiveFailures++
      if (this.consecutiveFailures >= this.failureThreshold) {
        this.isHealthy = false
      }
      
      logger.error('Health check failed', {
        error: classifySupabaseError(error).toLogObject(),
        consecutiveFailures: this.consecutiveFailures,
      })

      this.lastCheck = now
      return this.isHealthy
    }
  }

  getStatus(): {
    isHealthy: boolean
    lastCheck: number
    consecutiveFailures: number
  } {
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastCheck,
      consecutiveFailures: this.consecutiveFailures,
    }
  }
}