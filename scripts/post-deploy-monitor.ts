#!/usr/bin/env tsx
/**
 * Post-Deployment Monitoring Script
 * Monitors application health and performance after production deployment
 * Requirements: 3.4, 6.4, 8.4
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

interface MonitoringConfig {
  url: string
  checkInterval: number // seconds
  maxChecks: number
  healthEndpoint: string
  performanceThresholds: {
    responseTime: number // seconds
    errorRate: number // percentage
    uptime: number // percentage
  }
}

interface HealthCheckResult {
  timestamp: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  httpStatus: number
  errors: string[]
}

interface MonitoringReport {
  startTime: string
  endTime: string
  totalChecks: number
  successfulChecks: number
  averageResponseTime: number
  uptime: number
  errorRate: number
  issues: string[]
  recommendations: string[]
}

class PostDeploymentMonitor {
  private config: MonitoringConfig
  private results: HealthCheckResult[] = []
  private startTime: Date

  constructor(config: MonitoringConfig) {
    this.config = config
    this.startTime = new Date()
  }

  /**
   * Execute curl command with timing
   */
  private async executeCurl(url: string): Promise<{ status: number; time: number; body?: string }> {
    try {
      const command = `curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" -o response.tmp "${url}"`
      const output = execSync(command, { encoding: 'utf8' })
      
      // Parse curl output
      const statusMatch = output.match(/HTTPSTATUS:(\d+)/)
      const timeMatch = output.match(/TIME:([\d.]+)/)
      
      const status = statusMatch ? parseInt(statusMatch[1]) : 0
      const time = timeMatch ? parseFloat(timeMatch[1]) : 0

      // Read response body if available
      let body: string | undefined
      try {
        body = readFileSync('response.tmp', 'utf8')
        execSync('rm -f response.tmp') // Clean up
      } catch {
        // Response file not created or readable
      }

      return { status, time, body }
    } catch (error) {
      throw new Error(`Curl command failed: ${error}`)
    }
  }

  /**
   * Perform single health check
   */
  private async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString()
    const errors: string[] = []

    try {
      const healthUrl = `${this.config.url}${this.config.healthEndpoint}`
      const { status, time, body } = await this.executeCurl(healthUrl)

      let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

      // Check HTTP status
      if (status !== 200) {
        errors.push(`HTTP status ${status}`)
        healthStatus = status >= 500 ? 'unhealthy' : 'degraded'
      }

      // Check response time
      if (time > this.config.performanceThresholds.responseTime) {
        errors.push(`Slow response: ${time}s`)
        if (healthStatus === 'healthy') {
          healthStatus = 'degraded'
        }
      }

      // Parse health check response if available
      if (body) {
        try {
          const healthData = JSON.parse(body)
          if (healthData.status === 'unhealthy') {
            errors.push('Application reports unhealthy status')
            healthStatus = 'unhealthy'
          } else if (healthData.status === 'degraded') {
            errors.push('Application reports degraded status')
            if (healthStatus === 'healthy') {
              healthStatus = 'degraded'
            }
          }

          // Check for specific errors in health response
          if (healthData.errors && healthData.errors.length > 0) {
            errors.push(...healthData.errors)
          }
        } catch {
          // Response is not valid JSON, which might be an issue
          errors.push('Health endpoint returned invalid JSON')
          if (healthStatus === 'healthy') {
            healthStatus = 'degraded'
          }
        }
      }

      return {
        timestamp,
        status: healthStatus,
        responseTime: time,
        httpStatus: status,
        errors,
      }

    } catch (error) {
      return {
        timestamp,
        status: 'unhealthy',
        responseTime: 0,
        httpStatus: 0,
        errors: [String(error)],
      }
    }
  }

  /**
   * Test core application functionality
   */
  private async testFunctionality(): Promise<string[]> {
    const issues: string[] = []

    try {
      // Test homepage
      console.log('  Testing homepage...')
      const { status: homeStatus } = await this.executeCurl(this.config.url)
      if (homeStatus !== 200) {
        issues.push(`Homepage returned status ${homeStatus}`)
      }

      // Test API endpoints
      console.log('  Testing API endpoints...')
      const apiEndpoints = [
        '/api/health',
        '/api/calculations',
        '/api/ads',
      ]

      for (const endpoint of apiEndpoints) {
        try {
          const { status } = await this.executeCurl(`${this.config.url}${endpoint}`)
          if (status >= 500) {
            issues.push(`API endpoint ${endpoint} returned status ${status}`)
          }
        } catch (error) {
          issues.push(`API endpoint ${endpoint} failed: ${error}`)
        }
      }

      // Test localized pages
      console.log('  Testing localized pages...')
      const locales = ['en', 'ar']
      for (const locale of locales) {
        try {
          const { status } = await this.executeCurl(`${this.config.url}/${locale}`)
          if (status !== 200) {
            issues.push(`Localized page /${locale} returned status ${status}`)
          }
        } catch (error) {
          issues.push(`Localized page /${locale} failed: ${error}`)
        }
      }

    } catch (error) {
      issues.push(`Functionality test failed: ${error}`)
    }

    return issues
  }

  /**
   * Run monitoring for specified duration
   */
  async monitor(): Promise<MonitoringReport> {
    console.log(`🔍 Starting post-deployment monitoring...`)
    console.log(`URL: ${this.config.url}`)
    console.log(`Duration: ${this.config.maxChecks} checks every ${this.config.checkInterval}s`)

    // Initial functionality test
    console.log('\n🧪 Running initial functionality tests...')
    const functionalityIssues = await this.testFunctionality()
    
    if (functionalityIssues.length > 0) {
      console.log('⚠️ Functionality issues detected:')
      functionalityIssues.forEach(issue => console.log(`   - ${issue}`))
    } else {
      console.log('✅ All functionality tests passed')
    }

    // Run health checks
    console.log('\n💓 Running health checks...')
    
    for (let i = 0; i < this.config.maxChecks; i++) {
      const checkNumber = i + 1
      console.log(`Check ${checkNumber}/${this.config.maxChecks}...`)

      const result = await this.performHealthCheck()
      this.results.push(result)

      // Log result
      const statusIcon = result.status === 'healthy' ? '✅' : 
                        result.status === 'degraded' ? '⚠️' : '❌'
      console.log(`  ${statusIcon} ${result.status} (${result.responseTime.toFixed(3)}s)`)

      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`    - ${error}`))
      }

      // Wait before next check (except for last check)
      if (i < this.config.maxChecks - 1) {
        await new Promise(resolve => setTimeout(resolve, this.config.checkInterval * 1000))
      }
    }

    // Generate report
    const report = this.generateReport(functionalityIssues)
    
    // Save report
    this.saveReport(report)
    
    return report
  }

  /**
   * Generate monitoring report
   */
  private generateReport(functionalityIssues: string[]): MonitoringReport {
    const endTime = new Date()
    const totalChecks = this.results.length
    const successfulChecks = this.results.filter(r => r.status === 'healthy').length
    const averageResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalChecks
    const uptime = (successfulChecks / totalChecks) * 100
    const errorRate = ((totalChecks - successfulChecks) / totalChecks) * 100

    // Collect all issues
    const issues: string[] = [...functionalityIssues]
    this.results.forEach(result => {
      if (result.errors.length > 0) {
        issues.push(...result.errors.map(error => `${result.timestamp}: ${error}`))
      }
    })

    // Generate recommendations
    const recommendations: string[] = []
    
    if (uptime < this.config.performanceThresholds.uptime) {
      recommendations.push('Investigate application stability - uptime below threshold')
    }
    
    if (averageResponseTime > this.config.performanceThresholds.responseTime) {
      recommendations.push('Optimize application performance - response time above threshold')
    }
    
    if (errorRate > this.config.performanceThresholds.errorRate) {
      recommendations.push('Address application errors - error rate above threshold')
    }

    if (issues.length === 0) {
      recommendations.push('Application is performing well - continue monitoring')
    }

    return {
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalChecks,
      successfulChecks,
      averageResponseTime,
      uptime,
      errorRate,
      issues: [...new Set(issues)], // Remove duplicates
      recommendations,
    }
  }

  /**
   * Save monitoring report
   */
  private saveReport(report: MonitoringReport): void {
    const reportPath = join(process.cwd(), 'monitoring-report.json')
    
    // Load existing reports
    let reports: MonitoringReport[] = []
    try {
      const existingReports = readFileSync(reportPath, 'utf8')
      reports = JSON.parse(existingReports)
    } catch {
      // File doesn't exist or is invalid
    }

    // Add new report
    reports.push(report)
    
    // Keep only last 10 reports
    if (reports.length > 10) {
      reports = reports.slice(-10)
    }

    // Save reports
    writeFileSync(reportPath, JSON.stringify(reports, null, 2))
    
    console.log(`\n📊 Report saved to: ${reportPath}`)
  }

  /**
   * Print report summary
   */
  printSummary(report: MonitoringReport): void {
    console.log('\n📊 Monitoring Summary:')
    console.log(`   Duration: ${new Date(report.startTime).toLocaleString()} - ${new Date(report.endTime).toLocaleString()}`)
    console.log(`   Total Checks: ${report.totalChecks}`)
    console.log(`   Successful: ${report.successfulChecks}`)
    console.log(`   Uptime: ${report.uptime.toFixed(1)}%`)
    console.log(`   Avg Response Time: ${report.averageResponseTime.toFixed(3)}s`)
    console.log(`   Error Rate: ${report.errorRate.toFixed(1)}%`)

    if (report.issues.length > 0) {
      console.log('\n⚠️ Issues Detected:')
      report.issues.forEach(issue => console.log(`   - ${issue}`))
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      report.recommendations.forEach(rec => console.log(`   - ${rec}`))
    }

    // Overall status
    const overallStatus = report.uptime >= 95 && report.errorRate <= 5 && report.averageResponseTime <= 2
    console.log(`\n${overallStatus ? '✅' : '⚠️'} Overall Status: ${overallStatus ? 'GOOD' : 'NEEDS ATTENTION'}`)
  }
}

/**
 * Main monitoring function
 */
async function main() {
  const args = process.argv.slice(2)
  
  // Parse arguments
  const url = args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 
             process.env.DEPLOYMENT_URL ||
             'https://micro-tools.vercel.app'
  
  const duration = parseInt(args.find(arg => arg.startsWith('--duration='))?.split('=')[1] || '300') // 5 minutes default
  const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1] || '30') // 30 seconds default

  const config: MonitoringConfig = {
    url: url.replace(/\/$/, ''), // Remove trailing slash
    checkInterval: interval,
    maxChecks: Math.ceil(duration / interval),
    healthEndpoint: '/api/health',
    performanceThresholds: {
      responseTime: 2.0, // 2 seconds
      errorRate: 5, // 5%
      uptime: 95, // 95%
    },
  }

  console.log('🚀 Post-Deployment Monitoring')
  console.log(`URL: ${config.url}`)
  console.log(`Checks: ${config.maxChecks} every ${config.checkInterval}s`)

  try {
    const monitor = new PostDeploymentMonitor(config)
    const report = await monitor.monitor()
    
    monitor.printSummary(report)

    // Exit with appropriate code
    const success = report.uptime >= config.performanceThresholds.uptime && 
                   report.errorRate <= config.performanceThresholds.errorRate
    
    process.exit(success ? 0 : 1)

  } catch (error) {
    console.error('❌ Monitoring failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { PostDeploymentMonitor }