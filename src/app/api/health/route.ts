/**
 * Health Check API Endpoint
 * Provides comprehensive system health monitoring with multi-environment support
 * Requirements: 6.4, 8.4, 3.3, 8.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { withErrorHandling, handleHealthCheck } from '@/lib/supabase/api-error-handler'
import { getHealthStatus, getErrorMetrics } from '@/lib/supabase/error-monitoring'
import { logger } from '@/lib/supabase/logger'
import { 
  getEnvironmentStatus, 
  validateEnvironmentIsolation,
  getCurrentEnvironment 
} from '@/lib/supabase/environment-config'

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  environment: {
    current: string
    configured: boolean
    isolated: boolean
    missingVariables: string[]
    errors: string[]
  }
  checks: {
    database: boolean
    cache: boolean
    auth: boolean
    storage: boolean
    environmentConfig: boolean
    environmentIsolation: boolean
  }
  metrics: {
    errorRate: number
    averageResponseTime: number
    totalErrors: number
    activeAlerts: number
  }
  errors?: string[]
}

/**
 * GET /api/health
 * Comprehensive health check endpoint with environment validation
 */
async function healthHandler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  logger.info('Health check requested', {
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  })

  try {
    // Get environment status
    const envStatus = getEnvironmentStatus()
    const isolationCheck = validateEnvironmentIsolation()
    const currentEnv = getCurrentEnvironment()

    // Get error monitoring status
    const monitoringStatus = getHealthStatus()
    const errorMetrics = getErrorMetrics(
      new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      new Date()
    )

    // Define health checks
    const healthChecks = [
      {
        name: 'database',
        check: async () => {
          try {
            const client = createClient()
            const { error } = await client.from('profiles').select('count').limit(1)
            return !error
          } catch {
            return false
          }
        }
      },
      {
        name: 'cache',
        check: async () => {
          try {
            // Simple cache test - in production this would test actual cache
            return true
          } catch {
            return false
          }
        }
      },
      {
        name: 'auth',
        check: async () => {
          try {
            const client = createClient()
            // Test auth service availability
            const { error } = await client.auth.getSession()
            return !error
          } catch {
            return false
          }
        }
      },
      {
        name: 'storage',
        check: async () => {
          try {
            const client = createClient()
            // Test storage service availability
            const { error } = await client.storage.listBuckets()
            return !error
          } catch {
            return false
          }
        }
      },
      {
        name: 'environmentConfig',
        check: async () => {
          return envStatus.isConfigured
        }
      },
      {
        name: 'environmentIsolation',
        check: async () => {
          return isolationCheck.isIsolated
        }
      }
    ]

    // Run health checks
    const { healthy, checks, errors } = await handleHealthCheck(healthChecks, {
      operation: 'health_check',
      endpoint: '/api/health'
    })

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy'
    
    if (!healthy || monitoringStatus.status === 'unhealthy' || !envStatus.isConfigured || !isolationCheck.isIsolated) {
      status = 'unhealthy'
    } else if (monitoringStatus.status === 'degraded' || Object.values(checks).some(check => !check)) {
      status = 'degraded'
    } else {
      status = 'healthy'
    }

    // Calculate uptime (this would be more sophisticated in production)
    const uptime = process.uptime() * 1000 // Convert to milliseconds

    // Combine all errors
    const allErrors = [...errors, ...envStatus.errors, ...isolationCheck.issues]

    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime,
      environment: {
        current: currentEnv,
        configured: envStatus.isConfigured,
        isolated: isolationCheck.isIsolated,
        missingVariables: envStatus.missingVariables,
        errors: [...envStatus.errors, ...isolationCheck.issues],
      },
      checks: {
        database: checks.database || false,
        cache: checks.cache || false,
        auth: checks.auth || false,
        storage: checks.storage || false,
        environmentConfig: checks.environmentConfig || false,
        environmentIsolation: checks.environmentIsolation || false,
      },
      metrics: {
        errorRate: errorMetrics.errorRate,
        averageResponseTime: errorMetrics.averageResponseTime,
        totalErrors: errorMetrics.totalErrors,
        activeAlerts: monitoringStatus.activeAlerts,
      },
      ...(allErrors.length > 0 && { errors: allErrors })
    }

    const duration = Date.now() - startTime
    
    logger.info('Health check completed', {
      status,
      duration,
      checksCount: Object.keys(checks).length,
      errorsCount: errors.length,
    })

    // Return appropriate HTTP status code with environment header
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    return NextResponse.json(response, { 
      status: httpStatus,
      headers: {
        'X-Environment': currentEnv,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('Health check failed', {
      duration,
      error: error instanceof Error ? error.message : String(error),
    })

    const response: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime() * 1000,
      environment: {
        current: getCurrentEnvironment(),
        configured: false,
        isolated: false,
        missingVariables: [],
        errors: ['Health check system failure'],
      },
      checks: {
        database: false,
        cache: false,
        auth: false,
        storage: false,
        environmentConfig: false,
        environmentIsolation: false,
      },
      metrics: {
        errorRate: 0,
        averageResponseTime: 0,
        totalErrors: 0,
        activeAlerts: 0,
      },
      errors: ['Health check system failure']
    }

    return NextResponse.json(response, { status: 503 })
  }
}

// Export the handler with error handling wrapper
export const GET = withErrorHandling(healthHandler, {
  endpoint: '/api/health',
  logRequests: true,
})

/**
 * HEAD /api/health
 * Lightweight health check for load balancers
 */
async function headHandler(request: NextRequest): Promise<NextResponse> {
  try {
    // Quick database connectivity check
    const client = createClient()
    const { error } = await client.from('profiles').select('count').limit(1)
    
    if (error) {
      return new NextResponse(null, { status: 503 })
    }
    
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}

export const HEAD = withErrorHandling(headHandler, {
  endpoint: '/api/health',
  logRequests: false, // Don't log HEAD requests to reduce noise
})