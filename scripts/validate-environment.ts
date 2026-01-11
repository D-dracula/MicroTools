#!/usr/bin/env tsx

/**
 * Environment Configuration Validation Script
 * Validates multi-environment setup and cross-environment isolation
 * Requirements: 3.3, 8.5
 */

import { 
  getEnvironmentStatus, 
  validateEnvironmentIsolation,
  getCurrentEnvironment,
  type AppEnvironment 
} from '../src/lib/supabase/environment-config'
import { getSupabaseConfigStatus } from '../src/lib/supabase/client'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`
}

function printHeader(title: string): void {
  console.log('\n' + colorize('='.repeat(60), 'cyan'))
  console.log(colorize(`  ${title}`, 'cyan'))
  console.log(colorize('='.repeat(60), 'cyan'))
}

function printSection(title: string): void {
  console.log('\n' + colorize(`📋 ${title}`, 'blue'))
  console.log(colorize('-'.repeat(40), 'blue'))
}

function printSuccess(message: string): void {
  console.log(colorize(`✅ ${message}`, 'green'))
}

function printWarning(message: string): void {
  console.log(colorize(`⚠️  ${message}`, 'yellow'))
}

function printError(message: string): void {
  console.log(colorize(`❌ ${message}`, 'red'))
}

function printInfo(message: string): void {
  console.log(colorize(`ℹ️  ${message}`, 'white'))
}

async function validateEnvironment(env: AppEnvironment): Promise<{
  isValid: boolean
  errors: string[]
  warnings: string[]
}> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Set environment for testing
    process.env.NEXT_PUBLIC_APP_ENV = env

    // Get environment status
    const envStatus = getEnvironmentStatus()
    const isolationCheck = validateEnvironmentIsolation()
    const supabaseStatus = getSupabaseConfigStatus()

    // Check configuration
    if (!envStatus.isConfigured) {
      errors.push(`Environment ${env} is not properly configured`)
      errors.push(...envStatus.errors)
    }

    // Check missing variables
    if (envStatus.missingVariables.length > 0) {
      errors.push(`Missing variables: ${envStatus.missingVariables.join(', ')}`)
    }

    // Check isolation
    if (!isolationCheck.isIsolated) {
      errors.push(`Environment ${env} isolation issues detected`)
      errors.push(...isolationCheck.issues)
    }

    // Check Supabase configuration
    if (!supabaseStatus.isConfigured) {
      errors.push(`Supabase configuration issues in ${env}`)
      errors.push(...supabaseStatus.errors)
    }

    // Environment-specific validations
    switch (env) {
      case 'development':
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost') && 
            !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dev')) {
          warnings.push('Development environment should use localhost or dev Supabase URL')
        }
        break

      case 'staging':
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('staging')) {
          warnings.push('Staging environment should use staging Supabase URL')
        }
        if (!process.env.NEXTAUTH_URL?.startsWith('https://')) {
          errors.push('Staging environment must use HTTPS for NextAuth URL')
        }
        break

      case 'production':
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('prod')) {
          warnings.push('Production environment should use production Supabase URL')
        }
        if (!process.env.NEXTAUTH_URL?.startsWith('https://')) {
          errors.push('Production environment must use HTTPS for NextAuth URL')
        }
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
          errors.push('Production environment should not have debug mode enabled')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }

  } catch (error) {
    errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      isValid: false,
      errors,
      warnings,
    }
  }
}

async function testEnvironmentIsolation(): Promise<{
  isIsolated: boolean
  issues: string[]
}> {
  const issues: string[] = []
  const environments: AppEnvironment[] = ['development', 'staging', 'production']
  const urlsUsed = new Set<string>()

  for (const env of environments) {
    try {
      // Temporarily set environment
      const originalEnv = process.env.NEXT_PUBLIC_APP_ENV
      process.env.NEXT_PUBLIC_APP_ENV = env

      const envStatus = getEnvironmentStatus()
      
      if (envStatus.isConfigured) {
        // Check for URL conflicts
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl) {
          if (urlsUsed.has(supabaseUrl)) {
            issues.push(`Supabase URL conflict: ${env} uses same URL as another environment`)
          } else {
            urlsUsed.add(supabaseUrl)
          }
        }
      }

      // Restore original environment
      if (originalEnv) {
        process.env.NEXT_PUBLIC_APP_ENV = originalEnv
      } else {
        delete process.env.NEXT_PUBLIC_APP_ENV
      }

    } catch (error) {
      issues.push(`Failed to test ${env}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    isIsolated: issues.length === 0,
    issues,
  }
}

async function main(): Promise<void> {
  printHeader('Multi-Environment Configuration Validator')

  const currentEnv = getCurrentEnvironment()
  printInfo(`Current environment: ${currentEnv}`)

  let allValid = true
  const allErrors: string[] = []
  const allWarnings: string[] = []

  // Test each environment
  const environments: AppEnvironment[] = ['development', 'staging', 'production']
  
  for (const env of environments) {
    printSection(`Validating ${env.toUpperCase()} Environment`)

    const validation = await validateEnvironment(env)
    
    if (validation.isValid) {
      printSuccess(`${env} environment is properly configured`)
    } else {
      printError(`${env} environment has configuration issues`)
      allValid = false
    }

    // Print errors
    for (const error of validation.errors) {
      printError(error)
      allErrors.push(`[${env}] ${error}`)
    }

    // Print warnings
    for (const warning of validation.warnings) {
      printWarning(warning)
      allWarnings.push(`[${env}] ${warning}`)
    }
  }

  // Test cross-environment isolation
  printSection('Testing Cross-Environment Isolation')
  
  const isolationTest = await testEnvironmentIsolation()
  
  if (isolationTest.isIsolated) {
    printSuccess('Environments are properly isolated')
  } else {
    printError('Environment isolation issues detected')
    allValid = false
    
    for (const issue of isolationTest.issues) {
      printError(issue)
      allErrors.push(`[Isolation] ${issue}`)
    }
  }

  // Summary
  printSection('Validation Summary')
  
  if (allValid) {
    printSuccess('All environments are properly configured and isolated')
  } else {
    printError('Configuration issues detected')
  }

  if (allWarnings.length > 0) {
    printWarning(`${allWarnings.length} warnings found`)
  }

  if (allErrors.length > 0) {
    printError(`${allErrors.length} errors found`)
  }

  // Recommendations
  if (!allValid || allWarnings.length > 0) {
    printSection('Recommendations')
    
    if (allErrors.length > 0) {
      printInfo('Fix the following errors:')
      for (const error of allErrors) {
        console.log(`  • ${error}`)
      }
    }
    
    if (allWarnings.length > 0) {
      printInfo('Consider addressing these warnings:')
      for (const warning of allWarnings) {
        console.log(`  • ${warning}`)
      }
    }

    printInfo('\nNext steps:')
    console.log('  1. Update environment configuration files (.env.development, .env.staging, .env.production)')
    console.log('  2. Ensure each environment uses separate Supabase projects')
    console.log('  3. Configure Vercel environment variables for staging and production')
    console.log('  4. Test deployment in each environment')
  }

  // Exit with appropriate code
  process.exit(allValid ? 0 : 1)
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(colorize('Unhandled rejection:', 'red'), error)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error(colorize('Uncaught exception:', 'red'), error)
  process.exit(1)
})

// Run the validator
main().catch((error) => {
  console.error(colorize('Validation failed:', 'red'), error)
  process.exit(1)
})