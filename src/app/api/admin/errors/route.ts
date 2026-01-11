/**
 * Error Dashboard API Endpoint
 * Provides error monitoring and management for administrators
 * Requirements: 6.4, 8.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withErrorHandling, validateAuthentication } from '@/lib/supabase/api-error-handler'
import { errorMonitor } from '@/lib/supabase/error-monitoring'
// import { logger } from '@/lib/supabase/logger'
const logger = {
  debug: (msg: string, ctx?: any) => console.debug(msg, ctx),
  info: (msg: string, ctx?: any) => console.info(msg, ctx),
  warn: (msg: string, ctx?: any, err?: any) => console.warn(msg, ctx, err),
  error: (msg: string, ctx?: any, err?: any) => console.error(msg, ctx, err),
}

/**
 * GET /api/admin/errors
 * Get error monitoring dashboard data
 */
async function getErrorsHandler(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions)
  
  // Validate authentication (admin only)
  const { userId } = validateAuthentication(session, {
    endpoint: '/api/admin/errors',
    method: 'GET',
  })

  // TODO: Add admin role check here
  // For now, any authenticated user can access this endpoint
  
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get('timeRange') || '24h'
  const includeResolved = searchParams.get('includeResolved') === 'true'

  // Calculate time range
  let startTime: Date
  const endTime = new Date()

  switch (timeRange) {
    case '1h':
      startTime = new Date(Date.now() - 60 * 60 * 1000)
      break
    case '6h':
      startTime = new Date(Date.now() - 6 * 60 * 60 * 1000)
      break
    case '24h':
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
  }

  logger.info('Error dashboard data requested', {
    userId,
    timeRange,
    includeResolved,
  })

  try {
    // Get comprehensive error data
    const metrics = errorMonitor.getMetrics(startTime, endTime)
    const patterns = errorMonitor.getPatterns()
    const alerts = errorMonitor.getAlerts(includeResolved)
    const healthStatus = errorMonitor.getHealthStatus()
    const report = errorMonitor.generateReport(startTime, endTime)

    const response = {
      success: true,
      data: {
        timeRange: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          label: timeRange,
        },
        healthStatus,
        metrics,
        patterns: patterns.slice(0, 50), // Limit to top 50 patterns
        alerts: alerts.slice(0, 100), // Limit to 100 most recent alerts
        report: {
          summary: report.summary,
          topErrors: report.topErrors,
          recommendations: report.recommendations,
        },
        stats: {
          totalPatterns: patterns.length,
          totalAlerts: alerts.length,
          criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
          unacknowledgedAlerts: alerts.filter(a => !a.acknowledged).length,
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Failed to get error dashboard data', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error // Let the error handler wrapper handle this
  }
}

/**
 * POST /api/admin/errors/acknowledge
 * Acknowledge an alert
 */
async function acknowledgeAlertHandler(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions)
  
  const { userId } = validateAuthentication(session, {
    endpoint: '/api/admin/errors/acknowledge',
    method: 'POST',
  })

  try {
    const body = await request.json()
    const { alertId } = body

    if (!alertId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert ID is required',
          code: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    const success = errorMonitor.acknowledgeAlert(alertId, userId)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert not found or already acknowledged',
          code: 'NOT_FOUND',
          retryable: false,
        },
        { status: 404 }
      )
    }

    logger.info('Alert acknowledged via API', {
      alertId,
      userId,
    })

    return NextResponse.json({
      success: true,
      data: { acknowledged: true }
    })

  } catch (error) {
    logger.error('Failed to acknowledge alert', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

/**
 * POST /api/admin/errors/resolve
 * Resolve an alert
 */
async function resolveAlertHandler(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions)
  
  const { userId } = validateAuthentication(session, {
    endpoint: '/api/admin/errors/resolve',
    method: 'POST',
  })

  try {
    const body = await request.json()
    const { alertId } = body

    if (!alertId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert ID is required',
          code: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    const success = errorMonitor.resolveAlert(alertId, userId)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert not found or already resolved',
          code: 'NOT_FOUND',
          retryable: false,
        },
        { status: 404 }
      )
    }

    logger.info('Alert resolved via API', {
      alertId,
      userId,
    })

    return NextResponse.json({
      success: true,
      data: { resolved: true }
    })

  } catch (error) {
    logger.error('Failed to resolve alert', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

// Export handlers with error handling wrapper
export const GET = withErrorHandling(getErrorsHandler, {
  endpoint: '/api/admin/errors',
  requireAuth: true,
  logRequests: true,
})

// Handle POST requests for alert management
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  switch (action) {
    case 'acknowledge':
      return withErrorHandling(acknowledgeAlertHandler, {
        endpoint: '/api/admin/errors/acknowledge',
        requireAuth: true,
        logRequests: true,
      })(request)

    case 'resolve':
      return withErrorHandling(resolveAlertHandler, {
        endpoint: '/api/admin/errors/resolve',
        requireAuth: true,
        logRequests: true,
      })(request)

    default:
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Supported actions: acknowledge, resolve',
          code: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
  }
}