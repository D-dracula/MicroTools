/**
 * Admin API Middleware
 * Provides security, logging, and rate limiting for admin API routes
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyAdminEmail } from './admin-utils'
import { 
  checkRateLimit, 
  getClientIdentifier, 
  createRateLimitHeaders,
  type RateLimitResult 
} from '@/lib/rate-limit'

// ============================================================================
// Types
// ============================================================================

/**
 * Admin action types for logging
 */
export type AdminActionType =
  | 'view_analytics'
  | 'view_users'
  | 'confirm_user_email'
  | 'view_errors'
  | 'acknowledge_error'
  | 'resolve_error'
  | 'view_migrations'
  | 'run_migrations'
  | 'rollback_migration'
  | 'view_health'
  | 'view_keys'
  | 'update_key'
  | 'test_key'
  | 'view_blog'
  | 'create_article'
  | 'update_article'
  | 'delete_article'
  | 'generate_article'
  | 'unknown'

/**
 * Admin action log entry
 * Requirements: 11.3
 */
export interface AdminActionLog {
  id: string
  userId: string
  userEmail: string
  action: AdminActionType
  endpoint: string
  method: string
  timestamp: string
  ipAddress: string
  userAgent: string
  requestId: string
  metadata?: Record<string, unknown>
  success: boolean
  errorMessage?: string
  duration?: number
}

/**
 * Admin middleware options
 */
export interface AdminMiddlewareOptions {
  /** API endpoint path for logging */
  endpoint: string
  /** Action type for logging */
  action?: AdminActionType
  /** Enable rate limiting (default: true) */
  rateLimit?: boolean
  /** Rate limit configuration */
  rateLimitConfig?: {
    /** Maximum requests per window */
    limit: number
    /** Time window in milliseconds */
    windowMs: number
  }
  /** Enable request logging (default: true) */
  logRequests?: boolean
  /** Additional metadata to include in logs */
  metadata?: Record<string, unknown>
}

/**
 * Admin context passed to handlers
 */
export interface AdminContext {
  userId: string
  userEmail: string
  requestId: string
  ipAddress: string
  startTime: number
}

/**
 * Admin API response format
 */
export interface AdminApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
  retryable?: boolean
  requestId?: string
  timestamp?: string
}

// ============================================================================
// In-Memory Action Log Store
// In production, this should be persisted to a database
// ============================================================================

const actionLogStore: AdminActionLog[] = []
const MAX_LOG_ENTRIES = 1000

/**
 * Store an admin action log entry
 * Requirements: 11.3
 */
function storeActionLog(log: AdminActionLog): void {
  actionLogStore.unshift(log)
  
  // Keep only the most recent entries
  if (actionLogStore.length > MAX_LOG_ENTRIES) {
    actionLogStore.pop()
  }
  
  // Also log to console for debugging
  console.info('[Admin Action]', {
    action: log.action,
    userId: log.userId,
    endpoint: log.endpoint,
    success: log.success,
    duration: log.duration,
  })
}

/**
 * Get recent admin action logs
 * @param limit - Maximum number of logs to return
 * @param filters - Optional filters
 */
export function getAdminActionLogs(
  limit: number = 100,
  filters?: {
    userId?: string
    action?: AdminActionType
    startDate?: Date
    endDate?: Date
  }
): AdminActionLog[] {
  let logs = [...actionLogStore]
  
  if (filters?.userId) {
    logs = logs.filter(log => log.userId === filters.userId)
  }
  
  if (filters?.action) {
    logs = logs.filter(log => log.action === filters.action)
  }
  
  if (filters?.startDate) {
    logs = logs.filter(log => new Date(log.timestamp) >= filters.startDate!)
  }
  
  if (filters?.endDate) {
    logs = logs.filter(log => new Date(log.timestamp) <= filters.endDate!)
  }
  
  return logs.slice(0, limit)
}

// ============================================================================
// Rate Limit Configurations
// ============================================================================

/**
 * Rate limit configurations for different admin operations
 * Requirements: 11.4
 */
export const adminRateLimits = {
  /** Standard read operations - 60 requests per minute */
  read: { limit: 60, windowMs: 60 * 1000 },
  /** Write operations - 30 requests per minute */
  write: { limit: 30, windowMs: 60 * 1000 },
  /** Sensitive operations (migrations, key updates) - 10 requests per minute */
  sensitive: { limit: 10, windowMs: 60 * 1000 },
  /** Very sensitive operations (delete, rollback) - 5 requests per minute */
  critical: { limit: 5, windowMs: 60 * 1000 },
} as const

/**
 * Get rate limit config based on action type
 */
function getRateLimitConfig(action: AdminActionType): { limit: number; windowMs: number } {
  const sensitiveActions: AdminActionType[] = [
    'run_migrations',
    'update_key',
    'confirm_user_email',
  ]
  
  const criticalActions: AdminActionType[] = [
    'rollback_migration',
    'delete_article',
  ]
  
  const writeActions: AdminActionType[] = [
    'acknowledge_error',
    'resolve_error',
    'create_article',
    'update_article',
    'generate_article',
    'test_key',
  ]
  
  if (criticalActions.includes(action)) {
    return adminRateLimits.critical
  }
  
  if (sensitiveActions.includes(action)) {
    return adminRateLimits.sensitive
  }
  
  if (writeActions.includes(action)) {
    return adminRateLimits.write
  }
  
  return adminRateLimits.read
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `admin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Extract IP address from request
 */
function extractIpAddress(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
}

/**
 * Create standardized error response
 * Requirements: 11.2
 */
export function createAdminErrorResponse(
  error: string,
  code: string,
  status: number,
  requestId?: string,
  retryable: boolean = false
): NextResponse {
  const response: AdminApiResponse = {
    success: false,
    error,
    code,
    retryable,
    requestId,
    timestamp: new Date().toISOString(),
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Create standardized success response
 */
export function createAdminSuccessResponse<T>(
  data: T,
  requestId?: string
): NextResponse {
  const response: AdminApiResponse<T> = {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
  }
  
  return NextResponse.json(response)
}

// ============================================================================
// Main Middleware Function
// ============================================================================

/**
 * Admin API middleware wrapper
 * Provides authentication, authorization, rate limiting, and logging
 * Requirements: 11.1, 11.2, 11.3, 11.4
 * 
 * @param handler - The API route handler function
 * @param options - Middleware configuration options
 * @returns Wrapped handler with admin security
 * 
 * @example
 * ```typescript
 * export const GET = withAdminMiddleware(
 *   async (request, context) => {
 *     // Handler logic here
 *     return NextResponse.json({ success: true, data: result })
 *   },
 *   {
 *     endpoint: '/api/admin/users',
 *     action: 'view_users',
 *   }
 * )
 * ```
 */
export function withAdminMiddleware(
  handler: (request: NextRequest, context: AdminContext) => Promise<NextResponse>,
  options: AdminMiddlewareOptions
): (request: NextRequest) => Promise<NextResponse> {
  const {
    endpoint,
    action = 'unknown',
    rateLimit = true,
    rateLimitConfig,
    logRequests = true,
    metadata,
  } = options

  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const requestId = generateRequestId()
    const ipAddress = extractIpAddress(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    let userId = ''
    let userEmail = ''
    let success = false
    let errorMessage: string | undefined

    try {
      // ========================================
      // Step 1: Authentication Check
      // Requirements: 11.1
      // ========================================
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id || !session?.user?.email) {
        errorMessage = 'Authentication required'
        
        if (logRequests) {
          storeActionLog({
            id: requestId,
            userId: 'anonymous',
            userEmail: 'anonymous',
            action,
            endpoint,
            method: request.method,
            timestamp: new Date().toISOString(),
            ipAddress,
            userAgent,
            requestId,
            metadata,
            success: false,
            errorMessage,
            duration: Date.now() - startTime,
          })
        }
        
        return createAdminErrorResponse(
          'Authentication required. Please log in.',
          'UNAUTHORIZED',
          401,
          requestId
        )
      }
      
      userId = session.user.id
      userEmail = session.user.email

      // ========================================
      // Step 2: Admin Authorization Check
      // Requirements: 11.1, 11.2
      // ========================================
      if (!verifyAdminEmail(userEmail)) {
        errorMessage = 'Admin access required'
        
        if (logRequests) {
          storeActionLog({
            id: requestId,
            userId,
            userEmail,
            action,
            endpoint,
            method: request.method,
            timestamp: new Date().toISOString(),
            ipAddress,
            userAgent,
            requestId,
            metadata,
            success: false,
            errorMessage,
            duration: Date.now() - startTime,
          })
        }
        
        // Log unauthorized access attempt
        console.warn('[Admin Security] Unauthorized access attempt', {
          userId,
          userEmail,
          endpoint,
          ipAddress,
        })
        
        return createAdminErrorResponse(
          'Unauthorized. Admin access required.',
          'FORBIDDEN',
          403,
          requestId
        )
      }

      // ========================================
      // Step 3: Rate Limiting
      // Requirements: 11.4
      // ========================================
      if (rateLimit) {
        const config = rateLimitConfig || getRateLimitConfig(action)
        const identifier = `admin_${userId}_${action}`
        const rateLimitResult: RateLimitResult = checkRateLimit(identifier, config)
        
        if (!rateLimitResult.success) {
          errorMessage = 'Rate limit exceeded'
          
          if (logRequests) {
            storeActionLog({
              id: requestId,
              userId,
              userEmail,
              action,
              endpoint,
              method: request.method,
              timestamp: new Date().toISOString(),
              ipAddress,
              userAgent,
              requestId,
              metadata: { ...metadata, rateLimited: true },
              success: false,
              errorMessage,
              duration: Date.now() - startTime,
            })
          }
          
          const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          
          return NextResponse.json(
            {
              success: false,
              error: 'Too many requests. Please try again later.',
              code: 'RATE_LIMIT_ERROR',
              retryable: true,
              retryAfter,
              requestId,
              timestamp: new Date().toISOString(),
            },
            {
              status: 429,
              headers: {
                ...createRateLimitHeaders(rateLimitResult),
                'Retry-After': retryAfter.toString(),
              },
            }
          )
        }
      }

      // ========================================
      // Step 4: Execute Handler
      // ========================================
      const context: AdminContext = {
        userId,
        userEmail,
        requestId,
        ipAddress,
        startTime,
      }
      
      const response = await handler(request, context)
      success = response.status >= 200 && response.status < 400
      
      // ========================================
      // Step 5: Log Action
      // Requirements: 11.3
      // ========================================
      if (logRequests) {
        storeActionLog({
          id: requestId,
          userId,
          userEmail,
          action,
          endpoint,
          method: request.method,
          timestamp: new Date().toISOString(),
          ipAddress,
          userAgent,
          requestId,
          metadata,
          success,
          duration: Date.now() - startTime,
        })
      }
      
      return response

    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Log error
      console.error('[Admin API Error]', {
        endpoint,
        action,
        userId,
        error: errorMessage,
        requestId,
      })
      
      // Log failed action
      if (logRequests) {
        storeActionLog({
          id: requestId,
          userId: userId || 'unknown',
          userEmail: userEmail || 'unknown',
          action,
          endpoint,
          method: request.method,
          timestamp: new Date().toISOString(),
          ipAddress,
          userAgent,
          requestId,
          metadata,
          success: false,
          errorMessage,
          duration: Date.now() - startTime,
        })
      }
      
      return createAdminErrorResponse(
        'An internal error occurred. Please try again.',
        'INTERNAL_ERROR',
        500,
        requestId,
        true
      )
    }
  }
}

// ============================================================================
// Convenience Wrappers
// ============================================================================

/**
 * Wrapper for read-only admin endpoints
 */
export function withAdminReadAccess(
  handler: (request: NextRequest, context: AdminContext) => Promise<NextResponse>,
  endpoint: string,
  action: AdminActionType
) {
  return withAdminMiddleware(handler, {
    endpoint,
    action,
    rateLimit: true,
    rateLimitConfig: adminRateLimits.read,
    logRequests: true,
  })
}

/**
 * Wrapper for write admin endpoints
 */
export function withAdminWriteAccess(
  handler: (request: NextRequest, context: AdminContext) => Promise<NextResponse>,
  endpoint: string,
  action: AdminActionType
) {
  return withAdminMiddleware(handler, {
    endpoint,
    action,
    rateLimit: true,
    rateLimitConfig: adminRateLimits.write,
    logRequests: true,
  })
}

/**
 * Wrapper for sensitive admin endpoints
 */
export function withAdminSensitiveAccess(
  handler: (request: NextRequest, context: AdminContext) => Promise<NextResponse>,
  endpoint: string,
  action: AdminActionType
) {
  return withAdminMiddleware(handler, {
    endpoint,
    action,
    rateLimit: true,
    rateLimitConfig: adminRateLimits.sensitive,
    logRequests: true,
  })
}

/**
 * Wrapper for critical admin endpoints
 */
export function withAdminCriticalAccess(
  handler: (request: NextRequest, context: AdminContext) => Promise<NextResponse>,
  endpoint: string,
  action: AdminActionType
) {
  return withAdminMiddleware(handler, {
    endpoint,
    action,
    rateLimit: true,
    rateLimitConfig: adminRateLimits.critical,
    logRequests: true,
  })
}
