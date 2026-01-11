/**
 * API Error Handler Middleware
 * Provides consistent error handling across all API routes
 * Requirements: 6.4, 8.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  SupabaseError, 
  classifySupabaseError, 
  getErrorRecoveryActions 
} from './errors'
// import { logger } from './logger'
const logger = {
  debug: (msg: string, ctx?: any) => console.debug(msg, ctx),
  info: (msg: string, ctx?: any) => console.info(msg, ctx),
  warn: (msg: string, ctx?: any, err?: any) => console.warn(msg, ctx, err),
  error: (msg: string, ctx?: any, err?: any) => console.error(msg, ctx, err),
}

export interface ApiErrorContext {
  endpoint: string
  method: string
  userId?: string
  clientId?: string
  requestId?: string
  [key: string]: any
}

export interface ApiErrorResponse {
  success: false
  error: string
  code: string
  retryable: boolean
  recoveryActions?: string[]
  requestId?: string
  timestamp: string
}

/**
 * Standardized API error response format
 */
export function createErrorResponse(
  error: SupabaseError,
  context: ApiErrorContext
): { response: ApiErrorResponse; statusCode: number } {
  const statusCode = getHttpStatusCode(error)
  
  const response: ApiErrorResponse = {
    success: false,
    error: error.userMessage,
    code: error.code,
    retryable: error.retryable,
    recoveryActions: getErrorRecoveryActions(error),
    requestId: context.requestId,
    timestamp: new Date().toISOString(),
  }

  return { response, statusCode }
}

/**
 * Map SupabaseError to appropriate HTTP status code
 */
function getHttpStatusCode(error: SupabaseError): number {
  switch (error.category) {
    case 'auth':
      return error.code === 'SESSION_EXPIRED' ? 401 : 401
    case 'permission':
      return 403
    case 'validation':
      return 400
    case 'database':
      if (error.code === 'NOT_FOUND') return 404
      if (error.code === 'DUPLICATE_ERROR') return 409
      return 500
    case 'network':
      if (error.code === 'RATE_LIMIT_ERROR') return 429
      if (error.code === 'TIMEOUT_ERROR') return 408
      return 503
    case 'configuration':
      return error.severity === 'critical' ? 503 : 500
    default:
      return 500
  }
}

/**
 * API route wrapper with comprehensive error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: {
    endpoint: string
    requireAuth?: boolean
    logRequests?: boolean
  } = { endpoint: 'unknown' }
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    const requestId = generateRequestId()
    const clientId = getClientIdentifier(request)
    
    const context: ApiErrorContext = {
      endpoint: options.endpoint,
      method: request.method,
      clientId,
      requestId,
    }

    try {
      // Log incoming request if enabled
      if (options.logRequests) {
        logger.info(`API Request: ${request.method} ${options.endpoint}`, {
          ...context,
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
        })
      }

      // Execute the handler
      const response = await handler(request, ...args)
      
      // Log successful response
      const duration = Date.now() - startTime
      logger.info(`API Response: ${request.method} ${options.endpoint}`, {
        ...context,
        status: response.status,
        duration,
      })

      return response
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Classify and handle the error
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : classifySupabaseError(error, context)

      // Log the error with full context
      logger.error(`API Error: ${request.method} ${options.endpoint}`, {
        ...context,
        duration,
        error: supabaseError.toLogObject(),
      })

      // Create standardized error response
      const { response: errorResponse, statusCode } = createErrorResponse(
        supabaseError, 
        context
      )

      return NextResponse.json(errorResponse, { status: statusCode })
    }
  }
}

/**
 * Async operation wrapper with error handling
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  context: Partial<ApiErrorContext> = {}
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const supabaseError = error instanceof SupabaseError 
      ? error 
      : classifySupabaseError(error, context)
    
    logger.error('Async operation failed', {
      ...context,
      error: supabaseError.toLogObject(),
    })
    
    throw supabaseError
  }
}

/**
 * Validation helper with error handling
 */
export function validateInput<T>(
  data: unknown,
  validator: (data: unknown) => T,
  context: Partial<ApiErrorContext> = {}
): T {
  try {
    return validator(data)
  } catch (error) {
    const validationError = classifySupabaseError(error, {
      ...context,
      operation: 'input_validation',
    })
    
    logger.warn('Input validation failed', {
      ...context,
      error: validationError.toLogObject(),
    })
    
    throw validationError
  }
}

/**
 * Rate limiting helper with error handling
 */
export function handleRateLimit(
  rateLimitResult: { success: boolean; resetTime: number },
  context: ApiErrorContext
): NextResponse | null {
  if (!rateLimitResult.success) {
    logger.warn('Rate limit exceeded', {
      ...context,
      resetTime: rateLimitResult.resetTime,
    })
    
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please try again later.",
        code: 'RATE_LIMIT_ERROR',
        retryable: true,
        retryAfter,
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      }
    )
  }
  
  return null
}

/**
 * Authentication helper with error handling
 */
export function validateAuthentication(
  session: any,
  context: ApiErrorContext
): { userId: string } {
  if (!session?.user?.id) {
    logger.warn('Unauthenticated request', context)
    
    throw classifySupabaseError(
      new Error('Authentication required'),
      { ...context, operation: 'authentication' }
    )
  }
  
  return { userId: session.user.id }
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Extract client identifier from request
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get client IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  // Combine with user agent for better identification
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const userAgentHash = hashString(userAgent).substring(0, 8)
  
  return `${ip}_${userAgentHash}`
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Error boundary for React Server Components
 */
export class ApiErrorBoundary {
  static async catch<T>(
    operation: () => Promise<T>,
    fallback: T,
    context: Partial<ApiErrorContext> = {}
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : classifySupabaseError(error, context)
      
      logger.error('Error boundary caught error', {
        ...context,
        error: supabaseError.toLogObject(),
        fallbackUsed: true,
      })
      
      // Return fallback value instead of throwing
      return fallback
    }
  }
}

/**
 * Batch operation error handler
 */
export async function handleBatchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options: {
    continueOnError?: boolean
    maxConcurrency?: number
    context?: Partial<ApiErrorContext>
  } = {}
): Promise<Array<{ success: boolean; data?: R; error?: SupabaseError }>> {
  const { continueOnError = true, maxConcurrency = 5, context = {} } = options
  const results: Array<{ success: boolean; data?: R; error?: SupabaseError }> = []
  
  // Process items in batches to control concurrency
  for (let i = 0; i < items.length; i += maxConcurrency) {
    const batch = items.slice(i, i + maxConcurrency)
    
    const batchPromises = batch.map(async (item, index) => {
      try {
        const data = await operation(item)
        return { success: true, data }
      } catch (error) {
        const supabaseError = error instanceof SupabaseError 
          ? error 
          : classifySupabaseError(error, {
              ...context,
              batchIndex: i + index,
              operation: 'batch_operation',
            })
        
        logger.error('Batch operation item failed', {
          ...context,
          batchIndex: i + index,
          error: supabaseError.toLogObject(),
        })
        
        if (!continueOnError) {
          throw supabaseError
        }
        
        return { success: false, error: supabaseError }
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }
  
  return results
}

/**
 * Health check error handler
 */
export async function handleHealthCheck(
  checks: Array<{ name: string; check: () => Promise<boolean> }>,
  context: Partial<ApiErrorContext> = {}
): Promise<{ healthy: boolean; checks: Record<string, boolean>; errors: string[] }> {
  const checkResults: Record<string, boolean> = {}
  const errors: string[] = []
  
  for (const { name, check } of checks) {
    try {
      checkResults[name] = await check()
      if (!checkResults[name]) {
        errors.push(`Health check failed: ${name}`)
      }
    } catch (error) {
      checkResults[name] = false
      const supabaseError = classifySupabaseError(error, {
        ...context,
        healthCheck: name,
      })
      
      errors.push(`Health check error: ${name} - ${supabaseError.userMessage}`)
      
      logger.error('Health check failed', {
        ...context,
        healthCheck: name,
        error: supabaseError.toLogObject(),
      })
    }
  }
  
  const healthy = Object.values(checkResults).every(result => result)
  
  return { healthy, checks: checkResults, errors }
}