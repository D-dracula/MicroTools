/**
 * Error Dashboard API Endpoint
 * Provides error monitoring and management for administrators
 * Requirements: 5.1, 5.4, 5.5, 5.6
 */

import { NextRequest, NextResponse } from 'next/server'
import { errorMonitor, type ErrorMetrics, type ErrorPattern, type Alert } from '@/lib/supabase/error-monitoring'
import { 
  withAdminMiddleware, 
  type AdminContext 
} from '@/lib/admin/admin-middleware'

const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => console.debug(msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => console.info(msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>, err?: unknown) => console.warn(msg, ctx, err),
  error: (msg: string, ctx?: Record<string, unknown>, err?: unknown) => console.error(msg, ctx, err),
}

// ============================================================================
// Types
// ============================================================================

type Severity = 'critical' | 'error' | 'warning' | 'all'
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'
type AlertStatus = 'all' | 'unresolved' | 'resolved' | 'unacknowledged'

interface ErrorFilters {
  severity?: Severity
  timeRange?: TimeRange
  status?: AlertStatus
  search?: string
  page?: number
  pageSize?: number
}

interface ErrorMetricsResponse {
  totalErrors: number
  criticalErrors: number
  highErrors: number
  mediumErrors: number
  lowErrors: number
  errorRate: number
  resolvedToday: number
  averageResponseTime: number
}

interface ErrorListItem {
  id: string
  severity: 'critical' | 'error' | 'warning' | 'low' | 'medium' | 'high'
  message: string
  stackTrace?: string
  timestamp: string
  acknowledged: boolean
  resolved: boolean
  resolvedAt?: string
  pattern?: string
  affectedUsers?: number
  endpoints?: string[]
}

interface PaginatedErrors {
  items: ErrorListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface ErrorDashboardResponse {
  success: boolean
  data: {
    timeRange: {
      start: string
      end: string
      label: string
    }
    healthStatus: {
      status: 'healthy' | 'degraded' | 'unhealthy'
      metrics: ErrorMetrics
      activeAlerts: number
      criticalPatterns: number
    }
    metrics: ErrorMetricsResponse
    errors: PaginatedErrors
    patterns: Array<{
      pattern: string
      count: number
      firstSeen: string
      lastSeen: string
      severity: string
      affectedUsers: number
      endpoints: string[]
    }>
    recommendations: string[]
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate time range from label
 */
function getTimeRange(timeRangeLabel: TimeRange): { start: Date; end: Date } {
  const end = new Date()
  let start: Date

  switch (timeRangeLabel) {
    case '1h':
      start = new Date(Date.now() - 60 * 60 * 1000)
      break
    case '6h':
      start = new Date(Date.now() - 6 * 60 * 60 * 1000)
      break
    case '24h':
      start = new Date(Date.now() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      start = new Date(Date.now() - 24 * 60 * 60 * 1000)
  }

  return { start, end }
}

/**
 * Filter alerts by severity
 */
function filterBySeverity(alerts: Alert[], severity: Severity): Alert[] {
  if (severity === 'all') return alerts
  
  // Map 'error' filter to 'high' severity (since alerts use low/medium/high/critical)
  const severityMap: Record<string, string[]> = {
    critical: ['critical'],
    error: ['high', 'critical'],
    warning: ['medium', 'low'],
  }
  
  const allowedSeverities = severityMap[severity] || [severity]
  return alerts.filter(alert => allowedSeverities.includes(alert.severity))
}

/**
 * Filter alerts by status
 */
function filterByStatus(alerts: Alert[], status: AlertStatus): Alert[] {
  switch (status) {
    case 'resolved':
      return alerts.filter(alert => alert.resolvedAt)
    case 'unresolved':
      return alerts.filter(alert => !alert.resolvedAt)
    case 'unacknowledged':
      return alerts.filter(alert => !alert.acknowledged && !alert.resolvedAt)
    default:
      return alerts
  }
}

/**
 * Convert alerts to error list items
 */
function alertsToErrorItems(alerts: Alert[], patterns: ErrorPattern[]): ErrorListItem[] {
  return alerts.map(alert => {
    // Find related pattern
    const relatedPattern = patterns.find(p => 
      alert.patterns.some(ap => ap.pattern === p.pattern)
    )

    return {
      id: alert.id,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp.toISOString(),
      acknowledged: alert.acknowledged,
      resolved: !!alert.resolvedAt,
      resolvedAt: alert.resolvedAt?.toISOString(),
      pattern: relatedPattern?.pattern,
      affectedUsers: relatedPattern?.affectedUsers.size || 0,
      endpoints: relatedPattern ? Array.from(relatedPattern.endpoints) : [],
    }
  })
}

/**
 * Calculate error metrics from raw data
 */
function calculateMetrics(
  rawMetrics: ErrorMetrics,
  alerts: Alert[]
): ErrorMetricsResponse {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const resolvedToday = alerts.filter(
    alert => alert.resolvedAt && alert.resolvedAt >= today
  ).length

  return {
    totalErrors: rawMetrics.totalErrors,
    criticalErrors: rawMetrics.errorsBySeverity.critical || 0,
    highErrors: rawMetrics.errorsBySeverity.high || 0,
    mediumErrors: rawMetrics.errorsBySeverity.medium || 0,
    lowErrors: rawMetrics.errorsBySeverity.low || 0,
    errorRate: Math.round(rawMetrics.errorRate * 100) / 100,
    resolvedToday,
    averageResponseTime: Math.round(rawMetrics.averageResponseTime),
  }
}

// ============================================================================
// GET Handler - Fetch error dashboard data
// ============================================================================

/**
 * GET /api/admin/errors
 * Get error monitoring dashboard data with filtering
 * 
 * Query Parameters:
 * - timeRange: '1h' | '6h' | '24h' | '7d' | '30d' (default: '24h')
 * - severity: 'critical' | 'error' | 'warning' | 'all' (default: 'all')
 * - status: 'all' | 'unresolved' | 'resolved' | 'unacknowledged' (default: 'all')
 * - search: string (optional)
 * - page: number (default: 1)
 * - pageSize: number (default: 20)
 */
async function getErrorsHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, requestId } = context

  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const filters: ErrorFilters = {
    timeRange: (searchParams.get('timeRange') as TimeRange) || '24h',
    severity: (searchParams.get('severity') as Severity) || 'all',
    status: (searchParams.get('status') as AlertStatus) || 'all',
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '20', 10),
  }

  logger.info('Error dashboard data requested', {
    userId,
    filters,
  })

  try {
    // Calculate time range
    const { start: startTime, end: endTime } = getTimeRange(filters.timeRange!)

    // Get raw data from error monitor
    const rawMetrics = errorMonitor.getMetrics(startTime, endTime)
    const patterns = errorMonitor.getPatterns()
    const allAlerts = errorMonitor.getAlerts(true) // Include resolved
    const healthStatus = errorMonitor.getHealthStatus()
    const report = errorMonitor.generateReport(startTime, endTime)

    // Filter alerts by time range
    let filteredAlerts = allAlerts.filter(
      alert => alert.timestamp >= startTime && alert.timestamp <= endTime
    )

    // Apply severity filter - Requirement 5.4
    filteredAlerts = filterBySeverity(filteredAlerts, filters.severity!)

    // Apply status filter - Requirement 5.4
    filteredAlerts = filterByStatus(filteredAlerts, filters.status!)

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredAlerts = filteredAlerts.filter(alert =>
        alert.message.toLowerCase().includes(searchLower) ||
        alert.id.toLowerCase().includes(searchLower)
      )
    }

    // Convert to error items
    const errorItems = alertsToErrorItems(filteredAlerts, patterns)

    // Paginate
    const total = errorItems.length
    const totalPages = Math.ceil(total / filters.pageSize!)
    const page = Math.min(Math.max(1, filters.page!), totalPages || 1)
    const startIndex = (page - 1) * filters.pageSize!
    const paginatedItems = errorItems.slice(startIndex, startIndex + filters.pageSize!)

    // Calculate metrics
    const metrics = calculateMetrics(rawMetrics, allAlerts)

    // Format patterns for response
    const formattedPatterns = patterns.slice(0, 20).map(p => ({
      pattern: p.pattern,
      count: p.count,
      firstSeen: p.firstSeen.toISOString(),
      lastSeen: p.lastSeen.toISOString(),
      severity: p.severity,
      affectedUsers: p.affectedUsers.size,
      endpoints: Array.from(p.endpoints),
    }))

    const response: ErrorDashboardResponse = {
      success: true,
      data: {
        timeRange: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          label: filters.timeRange!,
        },
        healthStatus,
        metrics,
        errors: {
          items: paginatedItems,
          total,
          page,
          pageSize: filters.pageSize!,
          totalPages,
        },
        patterns: formattedPatterns,
        recommendations: report.recommendations,
      },
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Failed to get error dashboard data', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

// ============================================================================
// POST Handler - Acknowledge/Resolve alerts
// ============================================================================

/**
 * POST /api/admin/errors?action=acknowledge
 * Acknowledge an alert - Requirement 5.5
 */
async function acknowledgeAlertHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, requestId } = context

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
          requestId,
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
          requestId,
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
      data: { 
        acknowledged: true,
        alertId,
        acknowledgedBy: userId,
        acknowledgedAt: new Date().toISOString(),
      },
      requestId,
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
 * POST /api/admin/errors?action=resolve
 * Resolve an alert - Requirement 5.6
 */
async function resolveAlertHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, requestId } = context

  try {
    const body = await request.json()
    const { alertId, resolution } = body

    if (!alertId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert ID is required',
          code: 'VALIDATION_ERROR',
          retryable: false,
          requestId,
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
          requestId,
        },
        { status: 404 }
      )
    }

    logger.info('Alert resolved via API', {
      alertId,
      userId,
      resolution,
    })

    return NextResponse.json({
      success: true,
      data: { 
        resolved: true,
        alertId,
        resolvedBy: userId,
        resolvedAt: new Date().toISOString(),
        resolution,
      },
      requestId,
    })

  } catch (error) {
    logger.error('Failed to resolve alert', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

/**
 * POST /api/admin/errors?action=bulk_acknowledge
 * Acknowledge multiple alerts at once
 */
async function bulkAcknowledgeHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, requestId } = context

  try {
    const body = await request.json()
    const { alertIds } = body

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert IDs array is required',
          code: 'VALIDATION_ERROR',
          retryable: false,
          requestId,
        },
        { status: 400 }
      )
    }

    const results = alertIds.map(alertId => ({
      alertId,
      success: errorMonitor.acknowledgeAlert(alertId, userId),
    }))

    const successCount = results.filter(r => r.success).length

    logger.info('Bulk acknowledge completed', {
      userId,
      total: alertIds.length,
      successCount,
    })

    return NextResponse.json({
      success: true,
      data: {
        total: alertIds.length,
        acknowledged: successCount,
        failed: alertIds.length - successCount,
        results,
      },
      requestId,
    })

  } catch (error) {
    logger.error('Failed to bulk acknowledge alerts', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

/**
 * POST /api/admin/errors?action=bulk_resolve
 * Resolve multiple alerts at once
 */
async function bulkResolveHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, requestId } = context

  try {
    const body = await request.json()
    const { alertIds, resolution } = body

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert IDs array is required',
          code: 'VALIDATION_ERROR',
          retryable: false,
          requestId,
        },
        { status: 400 }
      )
    }

    const results = alertIds.map(alertId => ({
      alertId,
      success: errorMonitor.resolveAlert(alertId, userId),
    }))

    const successCount = results.filter(r => r.success).length

    logger.info('Bulk resolve completed', {
      userId,
      total: alertIds.length,
      successCount,
      resolution,
    })

    return NextResponse.json({
      success: true,
      data: {
        total: alertIds.length,
        resolved: successCount,
        failed: alertIds.length - successCount,
        results,
      },
      requestId,
    })

  } catch (error) {
    logger.error('Failed to bulk resolve alerts', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

// ============================================================================
// Export Handlers with Admin Middleware
// Requirements: 11.1, 11.2, 11.3, 11.4
// ============================================================================

export const GET = withAdminMiddleware(getErrorsHandler, {
  endpoint: '/api/admin/errors',
  action: 'view_errors',
  rateLimit: true,
  logRequests: true,
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  switch (action) {
    case 'acknowledge':
      return withAdminMiddleware(acknowledgeAlertHandler, {
        endpoint: '/api/admin/errors/acknowledge',
        action: 'acknowledge_error',
        rateLimit: true,
        logRequests: true,
      })(request)

    case 'resolve':
      return withAdminMiddleware(resolveAlertHandler, {
        endpoint: '/api/admin/errors/resolve',
        action: 'resolve_error',
        rateLimit: true,
        logRequests: true,
      })(request)

    case 'bulk_acknowledge':
      return withAdminMiddleware(bulkAcknowledgeHandler, {
        endpoint: '/api/admin/errors/bulk_acknowledge',
        action: 'acknowledge_error',
        rateLimit: true,
        logRequests: true,
      })(request)

    case 'bulk_resolve':
      return withAdminMiddleware(bulkResolveHandler, {
        endpoint: '/api/admin/errors/bulk_resolve',
        action: 'resolve_error',
        rateLimit: true,
        logRequests: true,
      })(request)

    default:
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Supported actions: acknowledge, resolve, bulk_acknowledge, bulk_resolve',
          code: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
  }
}
