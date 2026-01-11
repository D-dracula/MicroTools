#!/usr/bin/env tsx
/**
 * Production Environment Validation Script
 * Validates all production environment variables and configurations
 * Requirements: 3.1, 3.4, 3.5, 8.5
 */

import { getEnvironmentStatus, validateEnvironmentIsolation } from '../src/lib/supabase/environment-config'

interface ValidationResult {
  isValid: boolean
  environment: string
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

class ProductionValidator {
  private errors: string[] = []
  private warnings: string[] = []
  private recommendations: string[] = []

  /**
   * Validate Vercel environment variables
   */
  private async validateVercelEnvironment(): Promise<void> {
    console.log('🔍 Validating Vercel environment variables...')

    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ]

    const optionalVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'OPENROUTER_API_KEY',
      'DATABASE_URL',
    ]

    // Check if Vercel CLI is available
    try {
      const { execSync } = require('child_process')
      execSync('vercel --version', { stdio: 'pipe' })
    } catch {
      this.errors.push('Vercel CLI not installed. Run: npm i -g vercel')
      return
    }

    // Check required environment variables
    for (const varName of requiredVars) {
      try {
        const { execSync } = require('child_process')
        const result = execSync(`vercel env ls ${varName}`, { 
          encoding: 'utf8',
          stdio: 'pipe' 
        })
        
        if (!result.includes(varName)) {
          this.errors.push(`Missing required environment variable: ${varName}`)
        } else {
          console.log(`  ✅ ${varName}`)
        }
      } catch {
        this.errors.push(`Failed to check environment variable: ${varName}`)
      }
    }

    // Check optional environment variables
    const missingOptional: string[] = []
    for (const varName of optionalVars) {
      try {
        const { execSync } = require('child_process')
        const result = execSync(`vercel env ls ${varName}`, { 
          encoding: 'utf8',
          stdio: 'pipe' 
        })
        
        if (!result.includes(varName)) {
          missingOptional.push(varName)
        } else {
          console.log(`  ✅ ${varName}`)
        }
      } catch {
        missingOptional.push(varName)
      }
    }

    if (missingOptional.length > 0) {
      this.warnings.push(`Optional environment variables not set: ${missingOptional.join(', ')}`)
      
      if (missingOptional.includes('OPENROUTER_API_KEY')) {
        this.recommendations.push('Set OPENROUTER_API_KEY to enable AI-powered tools')
      }
      
      if (missingOptional.includes('GOOGLE_CLIENT_ID')) {
        this.recommendations.push('Set Google OAuth credentials to enable social login')
      }
    }
  }

  /**
   * Validate Supabase configuration
   */
  private validateSupabaseConfig(): void {
    console.log('🔍 Validating Supabase configuration...')

    const envStatus = getEnvironmentStatus()
    
    if (!envStatus.isConfigured) {
      this.errors.push('Supabase environment not properly configured')
      this.errors.push(...envStatus.errors)
    } else {
      console.log('  ✅ Supabase configuration valid')
    }

    // Check environment isolation
    const isolationCheck = validateEnvironmentIsolation()
    if (!isolationCheck.isIsolated) {
      this.errors.push('Environment isolation issues detected')
      this.errors.push(...isolationCheck.issues)
    } else {
      console.log('  ✅ Environment isolation validated')
    }

    // Add missing variables as errors
    if (envStatus.missingVariables.length > 0) {
      this.errors.push(`Missing environment variables: ${envStatus.missingVariables.join(', ')}`)
    }
  }

  /**
   * Validate NextAuth configuration
   */
  private validateNextAuthConfig(): void {
    console.log('🔍 Validating NextAuth configuration...')

    const nextAuthUrl = process.env.NEXTAUTH_URL
    const nextAuthSecret = process.env.NEXTAUTH_SECRET

    if (!nextAuthUrl) {
      this.errors.push('NEXTAUTH_URL not set')
    } else {
      // Validate URL format
      try {
        const url = new URL(nextAuthUrl)
        if (url.protocol !== 'https:') {
          this.errors.push('NEXTAUTH_URL must use HTTPS in production')
        } else {
          console.log('  ✅ NEXTAUTH_URL format valid')
        }
      } catch {
        this.errors.push('NEXTAUTH_URL has invalid format')
      }
    }

    if (!nextAuthSecret) {
      this.errors.push('NEXTAUTH_SECRET not set')
    } else {
      // Validate secret strength
      if (nextAuthSecret.length < 32) {
        this.warnings.push('NEXTAUTH_SECRET should be at least 32 characters long')
      } else {
        console.log('  ✅ NEXTAUTH_SECRET length adequate')
      }

      // Check if it's the default/example secret
      if (nextAuthSecret.includes('change-in-production') || 
          nextAuthSecret === 'your-nextauth-secret-key-change-in-production') {
        this.errors.push('NEXTAUTH_SECRET is using default/example value')
      }
    }
  }

  /**
   * Validate security configuration
   */
  private validateSecurityConfig(): void {
    console.log('🔍 Validating security configuration...')

    // Check debug mode
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE
    if (debugMode === 'true') {
      this.errors.push('Debug mode should be disabled in production')
    } else {
      console.log('  ✅ Debug mode disabled')
    }

    // Check log level
    const logLevel = process.env.NEXT_PUBLIC_LOG_LEVEL
    if (logLevel && logLevel !== 'error' && logLevel !== 'warn') {
      this.warnings.push('Consider using "error" log level in production for better performance')
    } else {
      console.log('  ✅ Log level appropriate for production')
    }

    // Security recommendations
    this.recommendations.push('Ensure Supabase RLS policies are properly configured')
    this.recommendations.push('Monitor error rates and performance metrics')
    this.recommendations.push('Set up automated backups for critical data')
  }

  /**
   * Validate build configuration
   */
  private async validateBuildConfig(): Promise<void> {
    console.log('🔍 Validating build configuration...')

    try {
      const { execSync } = require('child_process')
      
      // Test build process
      console.log('  Testing build process...')
      execSync('npm run build', { stdio: 'pipe' })
      console.log('  ✅ Build process successful')

      // Check for build warnings
      const buildOutput = execSync('npm run build 2>&1', { encoding: 'utf8' })
      if (buildOutput.includes('warning') || buildOutput.includes('Warning')) {
        this.warnings.push('Build process generated warnings - review build output')
      }

    } catch (error) {
      this.errors.push(`Build validation failed: ${error}`)
    }
  }

  /**
   * Run complete validation
   */
  async validate(): Promise<ValidationResult> {
    console.log('🚀 Starting production environment validation...')
    
    // Set environment to production for validation
    process.env.NEXT_PUBLIC_APP_ENV = 'production'
    ;(process.env as any).NODE_ENV = 'production'

    try {
      // Run all validations
      await this.validateVercelEnvironment()
      this.validateSupabaseConfig()
      this.validateNextAuthConfig()
      this.validateSecurityConfig()
      await this.validateBuildConfig()

      const isValid = this.errors.length === 0

      console.log('\n📊 Validation Summary:')
      console.log(`Environment: production`)
      console.log(`Status: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
      console.log(`Errors: ${this.errors.length}`)
      console.log(`Warnings: ${this.warnings.length}`)

      if (this.errors.length > 0) {
        console.log('\n❌ Errors:')
        this.errors.forEach(error => console.log(`   - ${error}`))
      }

      if (this.warnings.length > 0) {
        console.log('\n⚠️ Warnings:')
        this.warnings.forEach(warning => console.log(`   - ${warning}`))
      }

      if (this.recommendations.length > 0) {
        console.log('\n💡 Recommendations:')
        this.recommendations.forEach(rec => console.log(`   - ${rec}`))
      }

      return {
        isValid,
        environment: 'production',
        errors: this.errors,
        warnings: this.warnings,
        recommendations: this.recommendations,
      }

    } catch (error) {
      this.errors.push(`Validation process failed: ${error}`)
      
      return {
        isValid: false,
        environment: 'production',
        errors: this.errors,
        warnings: this.warnings,
        recommendations: this.recommendations,
      }
    }
  }
}

/**
 * Main validation function
 */
async function main() {
  const args = process.argv.slice(2)
  const isVerbose = args.includes('--verbose')
  const isQuiet = args.includes('--quiet')

  try {
    const validator = new ProductionValidator()
    const result = await validator.validate()

    if (!isQuiet) {
      if (result.isValid) {
        console.log('\n🎉 Production environment is ready for deployment!')
      } else {
        console.log('\n❌ Production environment validation failed!')
        console.log('Please fix the errors above before deploying to production.')
      }
    }

    // Exit with appropriate code
    process.exit(result.isValid ? 0 : 1)

  } catch (error) {
    console.error('❌ Validation script failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { ProductionValidator }