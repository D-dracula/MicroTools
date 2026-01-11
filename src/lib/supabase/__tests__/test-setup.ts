/**
 * Test Setup and Configuration for Supabase Integration
 * 
 * Global test setup, mocks, and configuration for Supabase testing infrastructure.
 * This file is imported by Jest to set up the testing environment.
 * 
 * Requirements: 8.2 - Testing Infrastructure
 */

import { jest } from '@jest/globals'

// Mock environment variables for testing
const mockEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-service-role-key',
  NODE_ENV: 'test',
  NEXTAUTH_SECRET: 'test-secret',
  NEXTAUTH_URL: 'http://localhost:3000'
}

// Set up environment variables
Object.entries(mockEnvVars).forEach(([key, value]) => {
  process.env[key] = value
})

// Mock Next.js modules that aren't available in test environment
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    get: jest.fn(() => undefined),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
    entries: jest.fn(() => []),
  })),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  console.log = jest.fn()
  console.info = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole)
})

// Global test utilities
export const testConfig = {
  // Test database configuration
  database: {
    useTestDatabase: true,
    isolateTests: true,
    cleanupAfterEach: true,
    seedData: false,
  },
  
  // Property-based testing configuration
  propertyTesting: {
    numRuns: 100, // Default number of property test runs
    timeout: 30000, // 30 seconds timeout for property tests
    shrinkLimit: 1000, // Limit shrinking attempts
  },
  
  // Performance testing thresholds
  performance: {
    maxQueryTime: 1000, // 1 second max for queries
    maxCreationTime: 50, // 50ms per record creation
    maxBatchSize: 1000, // Maximum records in batch operations
  },
  
  // Error testing configuration
  errorTesting: {
    retryAttempts: 3,
    retryDelay: 100,
    expectedErrorPatterns: [
      /foreign key/i,
      /constraint/i,
      /not found/i,
      /unauthorized/i,
      /invalid/i,
    ],
  },
}

// Test data generators
export const testDataGenerators = {
  /**
   * Generate valid user data
   */
  validUser: () => ({
    name: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
  }),
  
  /**
   * Generate valid calculation data
   */
  validCalculation: (userId: string) => ({
    user_id: userId,
    tool_slug: 'test-calculator',
    inputs: { value: Math.random() * 1000 },
    outputs: { result: Math.random() * 2000 },
  }),
  
  /**
   * Generate valid tool usage data
   */
  validToolUsage: () => ({
    tool_slug: 'test-tool',
    user_type: Math.random() > 0.5 ? 'authenticated' : 'anonymous',
  }),
  
  /**
   * Generate valid custom ad data
   */
  validCustomAd: () => ({
    placement: 'test-placement',
    priority: Math.floor(Math.random() * 10),
    is_active: Math.random() > 0.5,
    title_ar: `إعلان تجريبي ${Date.now()}`,
    title_en: `Test Ad ${Date.now()}`,
    description_ar: 'وصف الإعلان التجريبي',
    description_en: 'Test ad description',
    image_url: 'https://example.com/test-image.jpg',
    link_url: 'https://example.com/test-link',
  }),
}

// Test assertion helpers
export const testAssertions = {
  /**
   * Assert that an operation completes within time limit
   */
  async assertPerformance<T>(
    operation: () => Promise<T>,
    maxTime: number = testConfig.performance.maxQueryTime
  ): Promise<T> {
    const startTime = Date.now()
    const result = await operation()
    const duration = Date.now() - startTime
    
    if (duration > maxTime) {
      throw new Error(`Operation took ${duration}ms, expected < ${maxTime}ms`)
    }
    
    return result
  },
  
  /**
   * Assert that an error matches expected patterns
   */
  assertExpectedError(error: Error, expectedPatterns: RegExp[] = testConfig.errorTesting.expectedErrorPatterns): void {
    const matchesPattern = expectedPatterns.some(pattern => pattern.test(error.message))
    if (!matchesPattern) {
      throw new Error(`Unexpected error: ${error.message}`)
    }
  },
  
  /**
   * Assert database state matches expectations
   */
  async assertDatabaseCount(
    client: any,
    table: string,
    expectedCount: number,
    filter?: Record<string, any>
  ): Promise<void> {
    let query = client.from(table).select('*', { count: 'exact', head: true })
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    const { count, error } = await query
    
    if (error) {
      throw new Error(`Failed to check database count: ${error.message}`)
    }
    
    if (count !== expectedCount) {
      throw new Error(`Expected ${expectedCount} records in ${table}, found ${count}`)
    }
  },
}

// Test cleanup utilities
export const testCleanup = {
  /**
   * Clean up test data by pattern
   */
  async cleanupByPattern(client: any, table: string, pattern: string): Promise<void> {
    try {
      await client
        .from(table)
        .delete()
        .like('id', pattern)
    } catch (error) {
      console.warn(`Failed to cleanup ${table}:`, error)
    }
  },
  
  /**
   * Clean up all test tables
   */
  async cleanupAllTestData(client: any): Promise<void> {
    const tables = [
      'custom_ads',
      'tool_usage',
      'calculations',
      'accounts',
      'sessions',
      'verification_tokens',
      'profiles'
    ]
    
    for (const table of tables) {
      await testCleanup.cleanupByPattern(client, table, 'test_%')
    }
  },
}

// Export test configuration for use in other test files
export default testConfig

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit the process in tests, just log the error
})

// Global error handler for uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  // Don't exit the process in tests, just log the error
})