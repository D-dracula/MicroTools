/**
 * Error Monitoring and Alerting System
 * Tracks error patterns, provides alerts, and generates reports
 * Requirements: 6.4, 8.4
 */

import { SupabaseError } from './errors'
// import { logger } from './logger'
const logger = {
  debug: (msg: string, ctx?: any) => console.debug(msg, ctx),
  info: (msg: string, ctx?: any) => console.info(msg, ctx),
  warn: (msg: string, ctx?: any, err?: any) => console.warn(msg, ctx, err),
  error: (msg: string, ctx?: any, err?: any) => console.error(msg, ctx, err),
}

export interface ErrorMetrics {
  totalErrors: number
  errorsByCategory: Record<string, number>
  errorsByCode: Record<string, number>
  errorsBySeverity: Record<string, number>
  errorRate: number
  averageResponseTime: number
  timeRange: {
    start: Date
    end: Date
  }
}

export interface ErrorPattern {
  pattern: string
  count: number
  firstSeen: Date
  lastSeen: Date
  affectedUsers: Set<string>
  endpoints: Set<string>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface AlertRule {
  id: string
  name: string
  condition: (metrics: ErrorMetrics, patterns: ErrorPattern[]) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number // minutes
  enabled: boolean
  lastTriggered?: Date
}

export interface Alert {
  id: string
  ruleId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  metrics: ErrorMetrics
  patterns: ErrorPattern[]
  acknowledged: boolean
  resolvedAt?: Date
}

/**
 * Error monitoring and alerting system
 */
export class ErrorMonitor {
  private errors: Array<{
    error: SupabaseError
    timestamp: Date
    context: Record<string, any>
  }> = []
  
  private patterns = new Map<string, ErrorPattern>()
  private alerts: Alert[] = []
  private alertRules: AlertRule[] = []
  private maxErrorHistory = 10000
  private patternDetectionWindow = 60 * 60 * 1000 // 1 hour

  constructor() {
    this.setupDefaultAlertRules()
    this.startPeriodicCleanup()
  }

  /**
   * Record an error for monitoring
   */
  recordError(
    error: SupabaseError, 
    context: Record<string, any> = {}
  ): void {
    const errorRecord = {
      error,
      timestamp: new Date(),
      context,
    }

    // Add to error history
    this.errors.push(errorRecord)
    
    // Maintain history size
    if (this.errors.length > this.maxErrorHistory) {
      this.errors = this.errors.slice(-this.maxErrorHistory)
    }

    // Update error patterns
    this.updatePatterns(errorRecord)

    // Check alert rules
    this.checkAlertRules()

    // Log the error
    if (typeof logger !== 'undefined' && logger.error) {
      logger.error('Error recorded for monitoring', {
        ...context,
        error: error.toLogObject(),
        patternCount: this.patterns.size,
        totalErrors: this.errors.length,
      })
    }
  }

  /**
   * Get error metrics for a time range
   */
  getMetrics(
    startTime: Date = new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    endTime: Date = new Date()
  ): ErrorMetrics {
    const filteredErrors = this.errors.filter(
      record => record.timestamp >= startTime && record.timestamp <= endTime
    )

    const totalErrors = filteredErrors.length
    const errorsByCategory: Record<string, number> = {}
    const errorsByCode: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}

    let totalResponseTime = 0
    let responseTimeCount = 0

    filteredErrors.forEach(record => {
      const { error, context } = record

      // Count by category
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1

      // Count by code
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1

      // Count by severity
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1

      // Aggregate response times
      if (context.duration) {
        totalResponseTime += context.duration
        responseTimeCount++
      }
    })

    const timeRangeMs = endTime.getTime() - startTime.getTime()
    const errorRate = totalErrors / (timeRangeMs / (60 * 1000)) // errors per minute

    return {
      totalErrors,
      errorsByCategory,
      errorsByCode,
      errorsBySeverity,
      errorRate,
      averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
      timeRange: { start: startTime, end: endTime },
    }
  }

  /**
   * Get detected error patterns
   */
  getPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.count - a.count)
  }

  /**
   * Get active alerts
   */
  getAlerts(includeResolved = false): Alert[] {
    return this.alerts.filter(alert => 
      includeResolved || !alert.resolvedAt
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true
      
      if (typeof logger !== 'undefined' && logger.info) {
        logger.info('Alert acknowledged', {
          alertId,
          userId,
          ruleId: alert.ruleId,
          severity: alert.severity,
        })
      }
      
      return true
    }
    return false
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, userId?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && !alert.resolvedAt) {
      alert.resolvedAt = new Date()
      
      if (typeof logger !== 'undefined' && logger.info) {
        logger.info('Alert resolved', {
          alertId,
          userId,
          ruleId: alert.ruleId,
          severity: alert.severity,
          duration: alert.resolvedAt.getTime() - alert.timestamp.getTime(),
        })
      }
      
      return true
    }
    return false
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const alertRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    }
    
    this.alertRules.push(alertRule)
    
    // Only log if logger is available (avoid circular dependency during initialization)
    if (typeof logger !== 'undefined' && logger.info) {
      logger.info('Alert rule added', {
        ruleId: alertRule.id,
        name: alertRule.name,
        severity: alertRule.severity,
      })
    }
    
    return alertRule.id
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const index = this.alertRules.findIndex(rule => rule.id === ruleId)
    if (index >= 0) {
      this.alertRules.splice(index, 1)
      
      // Only log if logger is available
      if (typeof logger !== 'undefined' && logger.info) {
        logger.info('Alert rule removed', { ruleId })
      }
      return true
    }
    return false
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: ErrorMetrics
    activeAlerts: number
    criticalPatterns: number
  } {
    const metrics = this.getMetrics()
    const activeAlerts = this.getAlerts().length
    const criticalPatterns = this.getPatterns().filter(p => p.severity === 'critical').length

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    // Determine status based on metrics
    if (criticalPatterns > 0 || metrics.errorRate > 10) {
      status = 'unhealthy'
    } else if (activeAlerts > 0 || metrics.errorRate > 1) {
      status = 'degraded'
    }

    return {
      status,
      metrics,
      activeAlerts,
      criticalPatterns,
    }
  }

  /**
   * Generate error report
   */
  generateReport(
    startTime: Date = new Date(Date.now() - 24 * 60 * 60 * 1000),
    endTime: Date = new Date()
  ): {
    summary: ErrorMetrics
    topErrors: Array<{ code: string; count: number; percentage: number }>
    patterns: ErrorPattern[]
    alerts: Alert[]
    recommendations: string[]
  } {
    const metrics = this.getMetrics(startTime, endTime)
    const patterns = this.getPatterns()
    const alerts = this.getAlerts(true).filter(
      alert => alert.timestamp >= startTime && alert.timestamp <= endTime
    )

    // Calculate top errors
    const topErrors = Object.entries(metrics.errorsByCode)
      .map(([code, count]) => ({
        code,
        count,
        percentage: (count / metrics.totalErrors) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, patterns)

    return {
      summary: metrics,
      topErrors,
      patterns,
      alerts,
      recommendations,
    }
  }

  /**
   * Update error patterns
   */
  private updatePatterns(errorRecord: {
    error: SupabaseError
    timestamp: Date
    context: Record<string, any>
  }): void {
    const { error, timestamp, context } = errorRecord
    
    // Create pattern key
    const patternKey = `${error.code}_${error.category}_${context.endpoint || 'unknown'}`
    
    let pattern = this.patterns.get(patternKey)
    
    if (!pattern) {
      pattern = {
        pattern: `${error.code} in ${error.category} (${context.endpoint || 'unknown'})`,
        count: 0,
        firstSeen: timestamp,
        lastSeen: timestamp,
        affectedUsers: new Set(),
        endpoints: new Set(),
        severity: error.severity,
      }
      this.patterns.set(patternKey, pattern)
    }

    // Update pattern
    pattern.count++
    pattern.lastSeen = timestamp
    
    if (context.userId) {
      pattern.affectedUsers.add(context.userId)
    }
    
    if (context.endpoint) {
      pattern.endpoints.add(context.endpoint)
    }

    // Update severity based on frequency and impact
    if (pattern.count > 100 || pattern.affectedUsers.size > 50) {
      pattern.severity = 'critical'
    } else if (pattern.count > 50 || pattern.affectedUsers.size > 20) {
      pattern.severity = 'high'
    } else if (pattern.count > 10 || pattern.affectedUsers.size > 5) {
      pattern.severity = 'medium'
    }
  }

  /**
   * Check alert rules and trigger alerts
   */
  private checkAlertRules(): void {
    const now = new Date()
    const metrics = this.getMetrics()
    const patterns = this.getPatterns()

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      // Check cooldown
      if (rule.lastTriggered) {
        const cooldownMs = rule.cooldown * 60 * 1000
        if (now.getTime() - rule.lastTriggered.getTime() < cooldownMs) {
          continue
        }
      }

      // Check condition
      try {
        if (rule.condition(metrics, patterns)) {
          this.triggerAlert(rule, metrics, patterns)
        }
      } catch (error) {
        if (typeof logger !== 'undefined' && logger.error) {
          logger.error('Alert rule condition failed', {
            ruleId: rule.id,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(
    rule: AlertRule,
    metrics: ErrorMetrics,
    patterns: ErrorPattern[]
  ): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: `Alert: ${rule.name}`,
      timestamp: new Date(),
      metrics,
      patterns: patterns.filter(p => p.severity === 'critical' || p.severity === 'high'),
      acknowledged: false,
    }

    this.alerts.push(alert)
    rule.lastTriggered = alert.timestamp

    if (typeof logger !== 'undefined' && logger.error) {
      logger.error('Alert triggered', {
        alertId: alert.id,
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        errorRate: metrics.errorRate,
        totalErrors: metrics.totalErrors,
      })
    }

    // Here you could integrate with external alerting systems
    // like Slack, email, PagerDuty, etc.
    this.sendAlert(alert)
  }

  /**
   * Send alert to external systems
   */
  private async sendAlert(alert: Alert): Promise<void> {
    // This is where you would integrate with external alerting systems
    // For now, we just log it
    
    if (typeof logger !== 'undefined' && logger.error) {
      logger.error('ALERT NOTIFICATION', {
        alertId: alert.id,
        severity: alert.severity,
        message: alert.message,
        errorRate: alert.metrics.errorRate,
        totalErrors: alert.metrics.totalErrors,
        criticalPatterns: alert.patterns.length,
      })
    }

    // Example integrations:
    // - Send to Slack webhook
    // - Send email notification
    // - Create PagerDuty incident
    // - Post to Discord webhook
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    // High error rate alert
    this.addAlertRule({
      name: 'High Error Rate',
      condition: (metrics) => metrics.errorRate > 5, // 5 errors per minute
      severity: 'high',
      cooldown: 15, // 15 minutes
      enabled: true,
    })

    // Critical error alert
    this.addAlertRule({
      name: 'Critical Errors Detected',
      condition: (metrics) => metrics.errorsBySeverity.critical > 0,
      severity: 'critical',
      cooldown: 5, // 5 minutes
      enabled: true,
    })

    // Database connection issues
    this.addAlertRule({
      name: 'Database Connection Issues',
      condition: (metrics) => 
        (metrics.errorsByCategory.network || 0) > 10 ||
        (metrics.errorsByCode.CONNECTION_ERROR || 0) > 5,
      severity: 'high',
      cooldown: 10, // 10 minutes
      enabled: true,
    })

    // Authentication failures spike
    this.addAlertRule({
      name: 'Authentication Failures Spike',
      condition: (metrics) => (metrics.errorsByCategory.auth || 0) > 20,
      severity: 'medium',
      cooldown: 20, // 20 minutes
      enabled: true,
    })

    // Slow response times
    this.addAlertRule({
      name: 'Slow Response Times',
      condition: (metrics) => metrics.averageResponseTime > 5000, // 5 seconds
      severity: 'medium',
      cooldown: 30, // 30 minutes
      enabled: true,
    })
  }

  /**
   * Generate recommendations based on metrics and patterns
   */
  private generateRecommendations(
    metrics: ErrorMetrics,
    patterns: ErrorPattern[]
  ): string[] {
    const recommendations: string[] = []

    // High error rate recommendations
    if (metrics.errorRate > 5) {
      recommendations.push('Consider implementing circuit breakers to prevent cascading failures')
      recommendations.push('Review recent deployments that might have introduced issues')
    }

    // Network error recommendations
    if ((metrics.errorsByCategory.network || 0) > metrics.totalErrors * 0.3) {
      recommendations.push('Check network connectivity and DNS resolution')
      recommendations.push('Consider increasing retry attempts and timeout values')
    }

    // Authentication error recommendations
    if ((metrics.errorsByCategory.auth || 0) > metrics.totalErrors * 0.2) {
      recommendations.push('Review authentication configuration and token expiration settings')
      recommendations.push('Check for potential security issues or brute force attacks')
    }

    // Database error recommendations
    if ((metrics.errorsByCategory.database || 0) > metrics.totalErrors * 0.4) {
      recommendations.push('Review database performance and connection pool settings')
      recommendations.push('Check for database schema issues or constraint violations')
    }

    // Pattern-based recommendations
    const criticalPatterns = patterns.filter(p => p.severity === 'critical')
    if (criticalPatterns.length > 0) {
      recommendations.push(`Address ${criticalPatterns.length} critical error patterns immediately`)
      
      criticalPatterns.forEach(pattern => {
        recommendations.push(`Fix critical pattern: ${pattern.pattern} (${pattern.count} occurrences)`)
      })
    }

    // Performance recommendations
    if (metrics.averageResponseTime > 3000) {
      recommendations.push('Optimize slow database queries and API endpoints')
      recommendations.push('Consider implementing caching for frequently accessed data')
    }

    return recommendations
  }

  /**
   * Start periodic cleanup of old data
   */
  private startPeriodicCleanup(): void {
    // Clean up old errors and patterns every hour
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      
      // Remove old errors
      this.errors = this.errors.filter(record => record.timestamp > cutoffTime)
      
      // Remove old patterns
      for (const [key, pattern] of this.patterns.entries()) {
        if (pattern.lastSeen < cutoffTime) {
          this.patterns.delete(key)
        }
      }
      
      // Remove old resolved alerts
      const alertCutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      this.alerts = this.alerts.filter(alert => 
        !alert.resolvedAt || alert.resolvedAt > alertCutoffTime
      )
      
      if (typeof logger !== 'undefined' && logger.debug) {
        logger.debug('Periodic cleanup completed', {
          errorsCount: this.errors.length,
          patternsCount: this.patterns.size,
          alertsCount: this.alerts.length,
        })
      }
    }, 60 * 60 * 1000) // 1 hour
  }
}

// Global error monitor instance
export const errorMonitor = new ErrorMonitor()

/**
 * Convenience function to record errors
 */
export function recordError(
  error: SupabaseError,
  context: Record<string, any> = {}
): void {
  errorMonitor.recordError(error, context)
}

/**
 * Convenience function to get error metrics
 */
export function getErrorMetrics(
  startTime?: Date,
  endTime?: Date
): ErrorMetrics {
  return errorMonitor.getMetrics(startTime, endTime)
}

/**
 * Convenience function to get health status
 */
export function getHealthStatus() {
  return errorMonitor.getHealthStatus()
}