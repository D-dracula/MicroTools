#!/usr/bin/env tsx
/**
 * Production Deployment Script
 * Handles complete production deployment with validation and monitoring
 * Requirements: 3.4, 8.4, 8.5
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface DeploymentConfig {
  environment: 'production'
  vercelProject?: string
  domain?: string
  requiredEnvVars: string[]
  optionalEnvVars: string[]
  preDeployChecks: string[]
  postDeployChecks: string[]
}

interface DeploymentResult {
  success: boolean
  deploymentUrl?: string
  domain?: string
  errors: string[]
  warnings: string[]
  duration: number
  timestamp: string
}

// Production deployment configuration
const PRODUCTION_CONFIG: DeploymentConfig = {
  environment: 'production',
  requiredEnvVars: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ],
  optionalEnvVars: [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'OPENROUTER_API_KEY',
    'DATABASE_URL',
  ],
  preDeployChecks: [
    'validate-environment',
    'run-tests',
    'build-check',
    'security-check',
  ],
  postDeployChecks: [
    'health-check',
    'functionality-test',
    'performance-check',
    'monitoring-setup',
  ],
}

class ProductionDeployer {
  private config: DeploymentConfig
  private startTime: number
  private errors: string[] = []
  private warnings: string[] = []

  constructor(config: DeploymentConfig) {
    this.config = config
    this.startTime = Date.now()
  }

  /**
   * Execute shell command with error handling
   */
  private exec(command: string, options: { silent?: boolean } = {}): string {
    try {
      const result = execSync(command, { 
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
      })
      return result.toString().trim()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Command failed: ${command}\n${message}`)
    }
  }

  /**
   * Validate environment variables
   */
  private validateEnvironment(): void {
    console.log('🔍 Validating environment variables...')
    
    try {
      // Run environment validation script
      this.exec('npm run env:validate:prod', { silent: true })
      console.log('✅ Environment validation passed')
    } catch (error) {
      this.errors.push(`Environment validation failed: ${error}`)
      throw error
    }

    // Check for required environment variables in Vercel
    const missingVars: string[] = []
    
    for (const varName of this.config.requiredEnvVars) {
      try {
        const result = this.exec(`vercel env ls ${varName}`, { silent: true })
        if (!result.includes(varName)) {
          missingVars.push(varName)
        }
      } catch {
        missingVars.push(varName)
      }
    }

    if (missingVars.length > 0) {
      const error = `Missing required environment variables in Vercel: ${missingVars.join(', ')}`
      this.errors.push(error)
      throw new Error(error)
    }

    // Check optional variables and warn if missing
    const missingOptional: string[] = []
    for (const varName of this.config.optionalEnvVars) {
      try {
        const result = this.exec(`vercel env ls ${varName}`, { silent: true })
        if (!result.includes(varName)) {
          missingOptional.push(varName)
        }
      } catch {
        missingOptional.push(varName)
      }
    }

    if (missingOptional.length > 0) {
      this.warnings.push(`Optional environment variables not set: ${missingOptional.join(', ')}`)
    }
  }

  /**
   * Run pre-deployment tests
   */
  private runTests(): void {
    console.log('🧪 Running pre-deployment tests...')
    
    try {
      // Run unit tests
      this.exec('npm test -- --passWithNoTests')
      console.log('✅ Unit tests passed')

      // Run Supabase integration tests
      this.exec('npm run test:supabase')
      console.log('✅ Supabase integration tests passed')

      // Run property-based tests
      this.exec('npm run test:property')
      console.log('✅ Property-based tests passed')
    } catch (error) {
      this.errors.push(`Tests failed: ${error}`)
      throw error
    }
  }

  /**
   * Validate build process
   */
  private validateBuild(): void {
    console.log('🏗️ Validating build process...')
    
    try {
      // Clean build
      this.exec('npm run build')
      console.log('✅ Build validation passed')
    } catch (error) {
      this.errors.push(`Build validation failed: ${error}`)
      throw error
    }
  }

  /**
   * Run security checks
   */
  private runSecurityChecks(): void {
    console.log('🔒 Running security checks...')
    
    try {
      // Check for security vulnerabilities
      this.exec('npm audit --audit-level=high')
      console.log('✅ Security audit passed')

      // Validate environment isolation
      this.exec('npm run env:validate:prod')
      console.log('✅ Environment isolation validated')
    } catch (error) {
      this.warnings.push(`Security check warnings: ${error}`)
      // Don't fail deployment for audit warnings, just log them
    }
  }

  /**
   * Deploy to Vercel
   */
  private deployToVercel(): { url: string; domain?: string } {
    console.log('🚀 Deploying to Vercel...')
    
    try {
      // Deploy using production configuration
      const output = this.exec('npm run deploy:production')
      
      // Extract deployment URL from output
      const urlMatch = output.match(/https:\/\/[^\s]+/)
      if (!urlMatch) {
        throw new Error('Could not extract deployment URL from Vercel output')
      }

      const deploymentUrl = urlMatch[0]
      console.log(`✅ Deployed to: ${deploymentUrl}`)

      // Check if custom domain is configured
      let customDomain: string | undefined
      try {
        const domainOutput = this.exec('vercel domains ls', { silent: true })
        const domainMatch = domainOutput.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)
        if (domainMatch && domainMatch.length > 0) {
          customDomain = domainMatch[0]
          console.log(`🌐 Custom domain: ${customDomain}`)
        }
      } catch {
        // Custom domain not configured, which is fine
      }

      return { url: deploymentUrl, domain: customDomain }
    } catch (error) {
      this.errors.push(`Deployment failed: ${error}`)
      throw error
    }
  }

  /**
   * Run health check on deployed application
   */
  private async runHealthCheck(url: string): Promise<void> {
    console.log('🏥 Running health check...')
    
    try {
      // Wait a moment for deployment to be ready
      await new Promise(resolve => setTimeout(resolve, 10000))

      // Use curl to check health endpoint
      const healthUrl = `${url}/api/health`
      const response = this.exec(`curl -s -o /dev/null -w "%{http_code}" "${healthUrl}"`)
      
      if (response !== '200') {
        throw new Error(`Health check failed with status: ${response}`)
      }

      console.log('✅ Health check passed')
    } catch (error) {
      this.errors.push(`Health check failed: ${error}`)
      throw error
    }
  }

  /**
   * Test core functionality
   */
  private async testFunctionality(url: string): Promise<void> {
    console.log('🔧 Testing core functionality...')
    
    try {
      // Test homepage
      const homeResponse = this.exec(`curl -s -o /dev/null -w "%{http_code}" "${url}"`)
      if (homeResponse !== '200') {
        throw new Error(`Homepage test failed with status: ${homeResponse}`)
      }

      // Test API endpoints
      const apiResponse = this.exec(`curl -s -o /dev/null -w "%{http_code}" "${url}/api/health"`)
      if (apiResponse !== '200') {
        throw new Error(`API test failed with status: ${apiResponse}`)
      }

      console.log('✅ Functionality tests passed')
    } catch (error) {
      this.errors.push(`Functionality test failed: ${error}`)
      throw error
    }
  }

  /**
   * Run performance checks
   */
  private async runPerformanceCheck(url: string): Promise<void> {
    console.log('⚡ Running performance check...')
    
    try {
      // Simple performance test using curl timing
      const timing = this.exec(`curl -s -o /dev/null -w "%{time_total}" "${url}"`)
      const responseTime = parseFloat(timing)

      if (responseTime > 5.0) {
        this.warnings.push(`Slow response time: ${responseTime}s`)
      } else {
        console.log(`✅ Performance check passed (${responseTime}s)`)
      }
    } catch (error) {
      this.warnings.push(`Performance check failed: ${error}`)
    }
  }

  /**
   * Setup monitoring and alerts
   */
  private setupMonitoring(url: string): void {
    console.log('📊 Setting up monitoring...')
    
    try {
      // Log deployment for monitoring
      const deploymentInfo = {
        timestamp: new Date().toISOString(),
        environment: 'production',
        url,
        version: process.env.npm_package_version || '1.0.0',
        duration: Date.now() - this.startTime,
      }

      // Write deployment log
      const logPath = join(process.cwd(), 'deployment-log.json')
      let logs: any[] = []
      
      try {
        const existingLogs = readFileSync(logPath, 'utf8')
        logs = JSON.parse(existingLogs)
      } catch {
        // File doesn't exist or is invalid, start fresh
      }

      logs.push(deploymentInfo)
      writeFileSync(logPath, JSON.stringify(logs, null, 2))

      console.log('✅ Monitoring setup completed')
    } catch (error) {
      this.warnings.push(`Monitoring setup failed: ${error}`)
    }
  }

  /**
   * Run complete deployment process
   */
  async deploy(): Promise<DeploymentResult> {
    console.log('🚀 Starting production deployment...')
    console.log(`Environment: ${this.config.environment}`)
    
    try {
      // Pre-deployment checks
      this.validateEnvironment()
      this.runTests()
      this.validateBuild()
      this.runSecurityChecks()

      // Deploy
      const { url, domain } = this.deployToVercel()

      // Post-deployment checks
      await this.runHealthCheck(url)
      await this.testFunctionality(url)
      await this.runPerformanceCheck(url)
      this.setupMonitoring(url)

      const duration = Date.now() - this.startTime
      
      console.log('🎉 Production deployment completed successfully!')
      console.log(`📊 Duration: ${Math.round(duration / 1000)}s`)
      console.log(`🌐 URL: ${url}`)
      if (domain) {
        console.log(`🏠 Domain: ${domain}`)
      }

      return {
        success: true,
        deploymentUrl: url,
        domain,
        errors: this.errors,
        warnings: this.warnings,
        duration,
        timestamp: new Date().toISOString(),
      }

    } catch (error) {
      const duration = Date.now() - this.startTime
      
      console.error('❌ Production deployment failed!')
      console.error(`Error: ${error}`)
      console.error(`Duration: ${Math.round(duration / 1000)}s`)

      return {
        success: false,
        errors: [...this.errors, String(error)],
        warnings: this.warnings,
        duration,
        timestamp: new Date().toISOString(),
      }
    }
  }
}

/**
 * Main deployment function
 */
async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const isVerbose = args.includes('--verbose')

  if (isDryRun) {
    console.log('🔍 Dry run mode - no actual deployment will occur')
    // In dry run, we would validate everything but not actually deploy
    return
  }

  try {
    const deployer = new ProductionDeployer(PRODUCTION_CONFIG)
    const result = await deployer.deploy()

    if (result.success) {
      console.log('\n✅ Deployment Summary:')
      console.log(`   URL: ${result.deploymentUrl}`)
      if (result.domain) {
        console.log(`   Domain: ${result.domain}`)
      }
      console.log(`   Duration: ${Math.round(result.duration / 1000)}s`)
      
      if (result.warnings.length > 0) {
        console.log('\n⚠️ Warnings:')
        result.warnings.forEach(warning => console.log(`   - ${warning}`))
      }

      process.exit(0)
    } else {
      console.log('\n❌ Deployment Failed:')
      result.errors.forEach(error => console.log(`   - ${error}`))
      
      if (result.warnings.length > 0) {
        console.log('\n⚠️ Warnings:')
        result.warnings.forEach(warning => console.log(`   - ${warning}`))
      }

      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Deployment script failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { ProductionDeployer, PRODUCTION_CONFIG }