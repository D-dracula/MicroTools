#!/usr/bin/env tsx

/**
 * Supabase Testing Infrastructure Runner
 * 
 * Comprehensive test runner for Supabase integration testing including
 * database isolation, property-based testing, and performance validation.
 * 
 * Requirements: 8.2 - Testing Infrastructure
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface TestConfig {
  isolation: boolean
  propertyTests: boolean
  performanceTests: boolean
  coverage: boolean
  verbose: boolean
  parallel: boolean
  timeout: number
}

interface TestResults {
  passed: number
  failed: number
  skipped: number
  duration: number
  coverage?: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
}

class SupabaseTestRunner {
  private config: TestConfig
  private startTime: number = 0

  constructor(config: Partial<TestConfig> = {}) {
    this.config = {
      isolation: true,
      propertyTests: true,
      performanceTests: false,
      coverage: false,
      verbose: false,
      parallel: false,
      timeout: 30000,
      ...config
    }
  }

  /**
   * Run all Supabase integration tests
   */
  async runTests(): Promise<TestResults> {
    console.log('🧪 Starting Supabase Integration Tests...\n')
    this.startTime = Date.now()

    try {
      // Validate environment
      await this.validateEnvironment()

      // Setup test database
      if (this.config.isolation) {
        await this.setupTestDatabase()
      }

      // Run test suites
      const results = await this.executeTestSuites()

      // Generate reports
      await this.generateReports(results)

      // Cleanup
      if (this.config.isolation) {
        await this.cleanupTestDatabase()
      }

      return results
    } catch (error) {
      console.error('❌ Test execution failed:', error)
      throw error
    }
  }

  /**
   * Validate test environment setup
   */
  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating test environment...')

    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    const missing = requiredEnvVars.filter(env => !process.env[env])
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }

    // Check if fast-check is available
    try {
      require('fast-check')
      console.log('✅ fast-check library available')
    } catch (error) {
      throw new Error('fast-check library not found. Run: npm install fast-check')
    }

    // Check Supabase connection
    try {
      const { createClient } = require('../src/lib/supabase/client')
      const client = createClient()
      
      // Test basic connection
      const { error } = await client.from('profiles').select('id').limit(1)
      if (error && !error.message.includes('relation') && !error.message.includes('permission')) {
        throw new Error(`Supabase connection failed: ${error.message}`)
      }
      
      console.log('✅ Supabase connection validated')
    } catch (error) {
      console.warn('⚠️  Supabase connection validation failed:', error.message)
    }

    console.log('✅ Environment validation complete\n')
  }

  /**
   * Setup isolated test database
   */
  private async setupTestDatabase(): Promise<void> {
    console.log('🏗️  Setting up test database isolation...')

    try {
      // Import test utilities
      const { setupTestEnvironment } = require('../src/lib/supabase/test-utils')
      
      await setupTestEnvironment({
        useTestDatabase: true,
        isolateTests: true,
        cleanupAfterEach: true,
        seedData: false
      })

      console.log('✅ Test database isolation setup complete\n')
    } catch (error) {
      console.warn('⚠️  Test database isolation setup failed:', error.message)
      console.log('   Continuing with public schema...\n')
    }
  }

  /**
   * Execute all test suites
   */
  private async executeTestSuites(): Promise<TestResults> {
    console.log('🚀 Executing test suites...\n')

    const jestArgs = [
      '--testPathPattern=src/lib/supabase/__tests__',
      `--testTimeout=${this.config.timeout}`,
    ]

    if (this.config.coverage) {
      jestArgs.push('--coverage')
    }

    if (this.config.verbose) {
      jestArgs.push('--verbose')
    }

    if (!this.config.parallel) {
      jestArgs.push('--runInBand')
    }

    // Run specific test suites based on configuration
    const testSuites = []

    // Always run basic integration tests
    testSuites.push('client.test.ts')
    testSuites.push('error-handling.test.ts')

    // Add property-based tests if enabled
    if (this.config.propertyTests) {
      testSuites.push('property-based-tests.ts')
    }

    // Add performance tests if enabled
    if (this.config.performanceTests) {
      testSuites.push('query-optimization.test.ts')
    }

    let totalResults: TestResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    }

    for (const suite of testSuites) {
      console.log(`📋 Running ${suite}...`)
      
      try {
        const suiteArgs = [...jestArgs, `--testNamePattern=${suite}`]
        const output = execSync(`npx jest ${suiteArgs.join(' ')}`, {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: 'pipe'
        })

        const results = this.parseJestOutput(output)
        totalResults.passed += results.passed
        totalResults.failed += results.failed
        totalResults.skipped += results.skipped
        totalResults.duration += results.duration

        console.log(`✅ ${suite} completed: ${results.passed} passed, ${results.failed} failed\n`)
      } catch (error) {
        console.error(`❌ ${suite} failed:`, error.message)
        totalResults.failed += 1
      }
    }

    return totalResults
  }

  /**
   * Parse Jest output to extract test results
   */
  private parseJestOutput(output: string): TestResults {
    const results: TestResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    }

    // Parse Jest output for test counts
    const passedMatch = output.match(/(\d+) passed/)
    const failedMatch = output.match(/(\d+) failed/)
    const skippedMatch = output.match(/(\d+) skipped/)
    const timeMatch = output.match(/Time:\s+([\d.]+)\s*s/)

    if (passedMatch) results.passed = parseInt(passedMatch[1])
    if (failedMatch) results.failed = parseInt(failedMatch[1])
    if (skippedMatch) results.skipped = parseInt(skippedMatch[1])
    if (timeMatch) results.duration = parseFloat(timeMatch[1]) * 1000

    return results
  }

  /**
   * Generate test reports
   */
  private async generateReports(results: TestResults): Promise<void> {
    console.log('📊 Generating test reports...\n')

    const totalDuration = Date.now() - this.startTime
    const report = {
      timestamp: new Date().toISOString(),
      config: this.config,
      results: {
        ...results,
        totalDuration
      },
      summary: {
        total: results.passed + results.failed + results.skipped,
        successRate: results.passed / (results.passed + results.failed) * 100,
        avgTestTime: results.duration / (results.passed + results.failed + results.skipped)
      }
    }

    // Write JSON report
    const reportPath = join(process.cwd(), 'test-results', 'supabase-tests.json')
    try {
      writeFileSync(reportPath, JSON.stringify(report, null, 2))
      console.log(`📄 JSON report saved to: ${reportPath}`)
    } catch (error) {
      console.warn('⚠️  Failed to save JSON report:', error.message)
    }

    // Print summary
    console.log('\n📈 Test Summary:')
    console.log(`   Total Tests: ${report.summary.total}`)
    console.log(`   Passed: ${results.passed} ✅`)
    console.log(`   Failed: ${results.failed} ${results.failed > 0 ? '❌' : ''}`)
    console.log(`   Skipped: ${results.skipped} ${results.skipped > 0 ? '⏭️' : ''}`)
    console.log(`   Success Rate: ${report.summary.successRate.toFixed(1)}%`)
    console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
    console.log(`   Avg Test Time: ${report.summary.avgTestTime.toFixed(2)}ms`)

    if (this.config.coverage && results.coverage) {
      console.log('\n📊 Coverage Summary:')
      console.log(`   Lines: ${results.coverage.lines}%`)
      console.log(`   Functions: ${results.coverage.functions}%`)
      console.log(`   Branches: ${results.coverage.branches}%`)
      console.log(`   Statements: ${results.coverage.statements}%`)
    }

    console.log('')
  }

  /**
   * Cleanup test database
   */
  private async cleanupTestDatabase(): Promise<void> {
    console.log('🧹 Cleaning up test database...')

    try {
      const { cleanupTestEnvironment } = require('../src/lib/supabase/test-utils')
      await cleanupTestEnvironment()
      console.log('✅ Test database cleanup complete')
    } catch (error) {
      console.warn('⚠️  Test database cleanup failed:', error.message)
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  
  const config: Partial<TestConfig> = {
    isolation: !args.includes('--no-isolation'),
    propertyTests: !args.includes('--no-property-tests'),
    performanceTests: args.includes('--performance'),
    coverage: args.includes('--coverage'),
    verbose: args.includes('--verbose'),
    parallel: args.includes('--parallel'),
    timeout: args.includes('--timeout') ? 
      parseInt(args[args.indexOf('--timeout') + 1]) || 30000 : 30000
  }

  if (args.includes('--help')) {
    console.log(`
Supabase Testing Infrastructure Runner

Usage: tsx scripts/test-supabase.ts [options]

Options:
  --no-isolation        Disable test database isolation
  --no-property-tests   Skip property-based tests
  --performance         Include performance tests
  --coverage            Generate coverage report
  --verbose             Verbose output
  --parallel            Run tests in parallel
  --timeout <ms>        Test timeout in milliseconds (default: 30000)
  --help                Show this help message

Examples:
  tsx scripts/test-supabase.ts                    # Run all tests with isolation
  tsx scripts/test-supabase.ts --coverage        # Run with coverage report
  tsx scripts/test-supabase.ts --performance     # Include performance tests
  tsx scripts/test-supabase.ts --no-isolation    # Run without database isolation
`)
    process.exit(0)
  }

  try {
    const runner = new SupabaseTestRunner(config)
    const results = await runner.runTests()
    
    if (results.failed > 0) {
      console.log('❌ Some tests failed')
      process.exit(1)
    } else {
      console.log('✅ All tests passed!')
      process.exit(0)
    }
  } catch (error) {
    console.error('💥 Test runner failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { SupabaseTestRunner, TestConfig, TestResults }