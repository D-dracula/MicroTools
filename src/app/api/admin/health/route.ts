/**
 * Admin Health Check API Endpoint
 * Provides comprehensive system health monitoring for administrators
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { getHealthStatus, getErrorMetrics } from '@/lib/supabase/error-monitoring'
import { 
  getEnvironmentStatus, 
  validateEnvironmentIsolation,
  getCurrentEnvironment 
} from '@/lib/supabase/environment-config'
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

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'down'
  responseTimeMs: number
  lastChecked: string
  message?: string
}

interface ResourceUsage {
  used: number
  total: number
  percentage: number
}

interface HealthCheckResult {
  database: ServiceStatus
  supabase: ServiceStatus
  api: ServiceStatus
  auth: ServiceStatus
  storage: ServiceStatus
  cache: ServiceStatus
}

interface SystemMetrics {
  uptime: number
  memory?: ResourceUsage
  cpu?: ResourceUsage
  errorRate: number
  averageResponseTime: number
  totalErrors: number
  activeAlerts: number
}

interface AdminHealthResponse {
  success: boolean
  data: {
    overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    version: string
    environment: {
      current: string
      configured: boolean
      isolated: boolean
      missingVariables: string[]
    }
    services: HealthCheckResult
    metrics: SystemMetrics
    alerts: Array<{
      type: 'error' | 'warning' | 'info'
      message: string
      service?: string
    }>
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check database connection and measure response time
 */
async function checkDatabase(): Promise<ServiceStatus> {
  const startTime = Date.now()
  
  try {
    const client = createClient()
    const { error } = await client.from('profiles').select('count').limit(1)
    const responseTimeMs = Date.now() - startTime
    
    if (error) {
      return {
        status: 'down',
        responseTimeMs,
        lastChecked: new Date().toISOString(),
        message: error.message,
      }
    }
    
    // Consider degraded if response time > 1000ms
    const status = responseTimeMs > 1000 ? 'degraded' : 'healthy'
    
    return {
      status,
      responseTimeMs,
      lastChecked: new Date().toISOString(),
      message: status === 'degraded' ? 'Slow response time' : undefined,
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

/**
 * Check Supabase connection - Requirement 8.4
 */
async function checkSupabase(): Promise<ServiceStatus> {
  const startTime = Date.now()
  
  try {
    const client = createClient()
    // Test basic Supabase connectivity
    const { error } = await client.auth.getSession()
    const responseTimeMs = Date.now() - startTime
    
    if (error) {
      return {
        status: 'down',
        responseTimeMs,
        lastChecked: new Date().toISOString(),
        message: error.message,
      }
    }
    
    const status = responseTimeMs > 1000 ? 'degraded' : 'healthy'
    
    return {
      status,
      responseTimeMs,
      lastChecked: new Date().toISOString(),
      message: status === 'degraded' ? 'Slow response time' : undefined,
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

/**
 * Check Auth service
 */
async function checkAuth(): Promise<ServiceStatus> {
  const startTime = Date.now()
  
  try {
    const client = createClient()
    const { error } = await client.auth.getSession()
    const responseTimeMs = Date.now() - startTime
    
    if (error) {
      return {
        status: 'down',
        responseTimeMs,
        lastChecked: new Date().toISOString(),
        message: error.message,
      }
    }
    
    const status = responseTimeMs > 500 ? 'degraded' : 'healthy'
    
    return {
      status,
      responseTimeMs,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Auth service unavailable',
    }
  }
}

/**
 * Check Storage service
 */
async function checkStorage(): Promise<ServiceStatus> {
  const startTime = Date.now()
  
  try {
    const client = createClient()
    const { error } = await client.storage.listBuckets()
    const responseTimeMs = Date.now() - startTime
    
    if (error) {
      return {
        status: 'down',
        responseTimeMs,
        lastChecked: new Date().toISOString(),
        message: error.message,
      }
    }
    
    const status = responseTimeMs > 500 ? 'degraded' : 'healthy'
    
    return {
      status,
      responseTimeMs,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Storage service unavailable',
    }
  }
}

/**
 * Check API response times - Requirement 8.2
 */
async function checkApi(): Promise<ServiceStatus> {
  const startTime = Date.now()
  
  try {
    // Test internal API health endpoint
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    })
    
    const responseTimeMs = Date.now() - startTime
    
    if (!response.ok) {
      return {
        status: 'degraded',
        responseTimeMs,
        lastChecked: new Date().toISOString(),
        message: `HTTP ${response.status}`,
      }
    }
    
    const status = responseTimeMs > 500 ? 'degraded' : 'healthy'
    
    return {
      status,
      responseTimeMs,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'API unavailable',
    }
  }
}

/**
 * Check cache service (placeholder for future implementation)
 */
async function checkCache(): Promise<ServiceStatus> {
  const startTime = Date.now()
  
  // Currently no dedicated cache service, return healthy
  return {
    status: 'healthy',
    responseTimeMs: Date.now() - startTime,
    lastChecked: new Date().toISOString(),
    message: 'No dedicated cache configured',
  }
}

/**
 * Get system resource usage - Requirement 8.3
 */
function getResourceUsage(): { memory?: ResourceUsage; cpu?: ResourceUsage } {
  try {
    // Memory usage from Node.js process
    const memUsage = process.memoryUsage()
    const totalMemory = memUsage.heapTotal
    const usedMemory = memUsage.heapUsed
    
    const memory: ResourceUsage = {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round((usedMemory / totalMemory) * 100),
    }
    
    // CPU usage is not directly available in Node.js without additional libraries
    // Return undefined for CPU
    return { memory }
  } catch {
    return {}
  }
}

/**
 * Generate alerts based on health check results - Requirement 8.5
 */
function generateAlerts(
  services: HealthCheckResult,
  metrics: SystemMetrics,
  envStatus: { configured: boolean; missingVariables: string[] }
): Array<{ type: 'error' | 'warning' | 'info'; message: string; service?: string }> {
  const alerts: Array<{ type: 'error' | 'warning' | 'info'; message: string; service?: string }> = []
  
  // Check each service
  Object.entries(services).forEach(([serviceName, status]) => {
    if (status.status === 'down') {
      alerts.push({
        type: 'error',
        message: `${serviceName} service is down: ${status.message || 'Unknown error'}`,
        service: serviceName,
      })
    } else if (status.status === 'degraded') {
      alerts.push({
        type: 'warning',
        message: `${serviceName} service is degraded: ${status.message || 'Slow response'}`,
        service: serviceName,
      })
    }
  })
  
  // Check error rate
  if (metrics.errorRate > 10) {
    alerts.push({
      type: 'error',
      message: `High error rate: ${metrics.errorRate.toFixed(2)} errors/min`,
    })
  } else if (metrics.errorRate > 5) {
    alerts.push({
      type: 'warning',
      message: `Elevated error rate: ${metrics.errorRate.toFixed(2)} errors/min`,
    })
  }
  
  // Check active alerts
  if (metrics.activeAlerts > 10) {
    alerts.push({
      type: 'error',
      message: `${metrics.activeAlerts} active alerts require attention`,
    })
  } else if (metrics.activeAlerts > 5) {
    alerts.push({
      type: 'warning',
      message: `${metrics.activeAlerts} active alerts`,
    })
  }
  
  // Check memory usage
  if (metrics.memory && metrics.memory.percentage > 90) {
    alerts.push({
      type: 'error',
      message: `Critical memory usage: ${metrics.memory.percentage}%`,
    })
  } else if (metrics.memory && metrics.memory.percentage > 75) {
    alerts.push({
      type: 'warning',
      message: `High memory usage: ${metrics.memory.percentage}%`,
    })
  }
  
  // Check environment configuration
  if (!envStatus.configured) {
    alerts.push({
      type: 'error',
      message: 'Environment not properly configured',
    })
  }
  
  if (envStatus.missingVariables.length > 0) {
    alerts.push({
      type: 'warning',
      message: `Missing environment variables: ${envStatus.missingVariables.join(', ')}`,
    })
  }
  
  return alerts
}

/**
 * Determine overall system status
 */
function determineOverallStatus(
  services: HealthCheckResult,
  alerts: Array<{ type: 'error' | 'warning' | 'info'; message: string }>
): 'healthy' | 'degraded' | 'unhealthy' {
  const hasDownService = Object.values(services).some(s => s.status === 'down')
  const hasDegradedService = Object.values(services).some(s => s.status === 'degraded')
  const hasErrorAlert = alerts.some(a => a.type === 'error')
  const hasWarningAlert = alerts.some(a => a.type === 'warning')
  
  if (hasDownService || hasErrorAlert) {
    return 'unhealthy'
  }
  
  if (hasDegradedService || hasWarningAlert) {
    return 'degraded'
  }
  
  return 'healthy'
}

// ============================================================================
// GET Handler - Fetch system health data
// ============================================================================

/**
 * GET /api/admin/health
 * Get comprehensive system health status for admin dashboard
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
async function getHealthHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, requestId } = context

  logger.info('Admin health check requested', { userId })

  try {
    // Run all health checks in parallel
    const [database, supabase, api, auth, storage, cache] = await Promise.all([
      checkDatabase(),
      checkSupabase(),
      checkApi(),
      checkAuth(),
      checkStorage(),
      checkCache(),
    ])

    const services: HealthCheckResult = {
      database,
      supabase,
      api,
      auth,
      storage,
      cache,
    }

    // Get environment status
    const envStatus = getEnvironmentStatus()
    const isolationCheck = validateEnvironmentIsolation()
    const currentEnv = getCurrentEnvironment()

    // Get error monitoring metrics
    const monitoringStatus = getHealthStatus()
    const errorMetrics = getErrorMetrics(
      new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      new Date()
    )

    // Get resource usage
    const resourceUsage = getResourceUsage()

    // Build metrics
    const metrics: SystemMetrics = {
      uptime: process.uptime() * 1000, // Convert to milliseconds
      memory: resourceUsage.memory,
      cpu: resourceUsage.cpu,
      errorRate: errorMetrics.errorRate,
      averageResponseTime: errorMetrics.averageResponseTime,
      totalErrors: errorMetrics.totalErrors,
      activeAlerts: monitoringStatus.activeAlerts,
    }

    // Generate alerts
    const alerts = generateAlerts(services, metrics, {
      configured: envStatus.isConfigured,
      missingVariables: envStatus.missingVariables,
    })

    // Determine overall status
    const overallStatus = determineOverallStatus(services, alerts)

    const response: AdminHealthResponse = {
      success: true,
      data: {
        overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: {
          current: currentEnv,
          configured: envStatus.isConfigured,
          isolated: isolationCheck.isIsolated,
          missingVariables: envStatus.missingVariables,
        },
        services,
        metrics,
        alerts,
      },
    }

    logger.info('Admin health check completed', {
      userId,
      overallStatus,
      alertCount: alerts.length,
    })

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Admin health check failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

// ============================================================================
// POST Handler - Trigger health check refresh
// ============================================================================

/**
 * POST /api/admin/health
 * Force refresh health check data
 */
async function refreshHealthHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId } = context

  logger.info('Admin health refresh requested', { userId })

  // Simply call the GET handler logic
  return getHealthHandler(request, context)
}

// ============================================================================
// Export Handlers with Admin Middleware
// Requirements: 11.1, 11.2, 11.3, 11.4
// ============================================================================

export const GET = withAdminMiddleware(getHealthHandler, {
  endpoint: '/api/admin/health',
  action: 'view_health',
  rateLimit: true,
  logRequests: true,
})

export const POST = withAdminMiddleware(refreshHealthHandler, {
  endpoint: '/api/admin/health',
  action: 'view_health',
  rateLimit: true,
  logRequests: true,
})
