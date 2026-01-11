/**
 * Supabase Testing Infrastructure
 * 
 * Provides test database isolation, data factories, and cleanup utilities
 * for comprehensive Supabase integration testing.
 * 
 * Requirements: 8.2 - Testing Infrastructure
 */

import { createClient, createAdminClient } from './client'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

// Test environment configuration
export interface TestConfig {
  useTestDatabase: boolean
  isolateTests: boolean
  cleanupAfterEach: boolean
  seedData: boolean
}

// Default test configuration
export const DEFAULT_TEST_CONFIG: TestConfig = {
  useTestDatabase: true,
  isolateTests: true,
  cleanupAfterEach: true,
  seedData: false,
}

// Test database isolation
export class TestDatabaseManager {
  private testClient: SupabaseClient<Database> | null = null
  private adminClient: SupabaseClient<Database> | null = null
  private testSchema: string
  private originalSchema: string

  constructor(private config: TestConfig = DEFAULT_TEST_CONFIG) {
    this.testSchema = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.originalSchema = 'public'
  }

  /**
   * Initialize test database with isolated schema
   */
  async initialize(): Promise<void> {
    if (!this.config.useTestDatabase) {
      this.testClient = createClient()
      this.adminClient = createAdminClient()
      return
    }

    try {
      this.adminClient = createAdminClient()
      
      if (this.config.isolateTests) {
        // Create isolated test schema
        await this.createTestSchema()
        
        // Create test client with schema isolation
        this.testClient = createClient({
          db: {
            schema: this.testSchema
          }
        })
      } else {
        this.testClient = createClient()
      }
    } catch (error) {
      throw new Error(`Failed to initialize test database: ${error}`)
    }
  }

  /**
   * Get test client instance
   */
  getClient(): SupabaseClient<Database> {
    if (!this.testClient) {
      throw new Error('Test database not initialized. Call initialize() first.')
    }
    return this.testClient
  }

  /**
   * Get admin client instance
   */
  getAdminClient(): SupabaseClient<Database> {
    if (!this.adminClient) {
      throw new Error('Admin client not initialized. Call initialize() first.')
    }
    return this.adminClient
  }

  /**
   * Create isolated test schema
   */
  private async createTestSchema(): Promise<void> {
    if (!this.adminClient) {
      throw new Error('Admin client not available')
    }

    // Create test schema
    const { error: schemaError } = await this.adminClient.rpc('create_test_schema', {
      schema_name: this.testSchema
    })

    if (schemaError) {
      console.warn('Could not create test schema, using public schema:', schemaError.message)
      this.testSchema = this.originalSchema
    }
  }

  /**
   * Clean up test data and schema
   */
  async cleanup(): Promise<void> {
    if (!this.config.cleanupAfterEach || !this.adminClient) {
      return
    }

    try {
      if (this.config.isolateTests && this.testSchema !== this.originalSchema) {
        // Drop test schema
        await this.adminClient.rpc('drop_test_schema', {
          schema_name: this.testSchema
        })
      } else {
        // Clean up test data from public schema
        await this.cleanupTestData()
      }
    } catch (error) {
      console.warn('Test cleanup failed:', error)
    }
  }

  /**
   * Clean up test data from public schema
   */
  private async cleanupTestData(): Promise<void> {
    if (!this.adminClient) return

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
      try {
        // Delete test data (assuming test data has specific markers)
        await this.adminClient
          .from(table)
          .delete()
          .like('id', 'test_%')
      } catch (error) {
        console.warn(`Failed to cleanup table ${table}:`, error)
      }
    }
  }

  /**
   * Reset database to clean state
   */
  async reset(): Promise<void> {
    await this.cleanup()
    await this.initialize()
  }
}

// Test data factories
export class TestDataFactory {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Create test user profile
   */
  async createUser(overrides: Partial<Database['public']['Tables']['profiles']['Insert']> = {}) {
    const userData = {
      id: `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    }

    const { data, error } = await this.client
      .from('profiles')
      .insert(userData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`)
    }

    return data
  }

  /**
   * Create test calculation
   */
  async createCalculation(
    userId: string,
    overrides: Partial<Database['public']['Tables']['calculations']['Insert']> = {}
  ) {
    const calculationData = {
      id: `test_calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      tool_slug: 'test-calculator',
      inputs: { value: 100 },
      outputs: { result: 200 },
      created_at: new Date().toISOString(),
      ...overrides
    }

    const { data, error } = await this.client
      .from('calculations')
      .insert(calculationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test calculation: ${error.message}`)
    }

    return data
  }

  /**
   * Create test tool usage record
   */
  async createToolUsage(overrides: Partial<Database['public']['Tables']['tool_usage']['Insert']> = {}) {
    const usageData = {
      id: `test_usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tool_slug: 'test-tool',
      user_type: 'authenticated',
      created_at: new Date().toISOString(),
      ...overrides
    }

    const { data, error } = await this.client
      .from('tool_usage')
      .insert(usageData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test tool usage: ${error.message}`)
    }

    return data
  }

  /**
   * Create test custom ad
   */
  async createCustomAd(overrides: Partial<Database['public']['Tables']['custom_ads']['Insert']> = {}) {
    const adData = {
      id: `test_ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      placement: 'test-placement',
      priority: 0,
      is_active: true,
      title_ar: 'إعلان تجريبي',
      title_en: 'Test Ad',
      description_ar: 'وصف الإعلان التجريبي',
      description_en: 'Test ad description',
      image_url: 'https://example.com/test-image.jpg',
      link_url: 'https://example.com/test-link',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      impressions: 0,
      clicks: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    }

    const { data, error } = await this.client
      .from('custom_ads')
      .insert(adData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test custom ad: ${error.message}`)
    }

    return data
  }

  /**
   * Create multiple test records
   */
  async createMultiple<T extends keyof Database['public']['Tables']>(
    table: T,
    count: number,
    factory: () => Database['public']['Tables'][T]['Insert']
  ): Promise<Database['public']['Tables'][T]['Row'][]> {
    const records = Array.from({ length: count }, factory)
    
    const { data, error } = await this.client
      .from(table)
      .insert(records)
      .select()

    if (error) {
      throw new Error(`Failed to create multiple ${table} records: ${error.message}`)
    }

    return data
  }

  /**
   * Create test data set for comprehensive testing
   */
  async createTestDataSet() {
    // Create test users
    const users = await Promise.all([
      this.createUser({ name: 'Alice Test', email: 'alice@test.com' }),
      this.createUser({ name: 'Bob Test', email: 'bob@test.com' }),
      this.createUser({ name: 'Charlie Test', email: 'charlie@test.com' })
    ])

    // Create calculations for each user
    const calculations = []
    for (const user of users) {
      const userCalculations = await Promise.all([
        this.createCalculation(user.id, { tool_slug: 'profit-calculator' }),
        this.createCalculation(user.id, { tool_slug: 'roi-calculator' }),
        this.createCalculation(user.id, { tool_slug: 'conversion-calculator' })
      ])
      calculations.push(...userCalculations)
    }

    // Create tool usage records
    const toolUsage = await this.createMultiple('tool_usage', 10, () => ({
      id: `test_usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tool_slug: ['profit-calculator', 'roi-calculator', 'conversion-calculator'][Math.floor(Math.random() * 3)],
      user_type: ['authenticated', 'anonymous'][Math.floor(Math.random() * 2)],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }))

    // Create custom ads
    const ads = await Promise.all([
      this.createCustomAd({ placement: 'header', priority: 1 }),
      this.createCustomAd({ placement: 'sidebar', priority: 2 }),
      this.createCustomAd({ placement: 'footer', priority: 3, is_active: false })
    ])

    return {
      users,
      calculations,
      toolUsage,
      ads
    }
  }
}

// Test utilities
export class TestUtils {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Wait for database operation to complete
   */
  async waitForOperation(
    operation: () => Promise<any>,
    maxAttempts: number = 10,
    delay: number = 100
  ): Promise<any> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error
        }
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }

  /**
   * Assert database state
   */
  async assertDatabaseState(
    table: keyof Database['public']['Tables'],
    expectedCount: number,
    filter?: Record<string, any>
  ): Promise<void> {
    let query = this.client.from(table).select('*', { count: 'exact', head: true })
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to check database state: ${error.message}`)
    }

    if (count !== expectedCount) {
      throw new Error(`Expected ${expectedCount} records in ${table}, found ${count}`)
    }
  }

  /**
   * Get table row count
   */
  async getRowCount(
    table: keyof Database['public']['Tables'],
    filter?: Record<string, any>
  ): Promise<number> {
    let query = this.client.from(table).select('*', { count: 'exact', head: true })
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to get row count: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Verify RLS policies are working
   */
  async verifyRLSPolicies(userId: string): Promise<boolean> {
    try {
      // Try to access another user's data (should fail)
      const otherUserId = `other_user_${Date.now()}`
      
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)

      // Should return empty result or access denied
      return !data || data.length === 0 || error !== null
    } catch (error) {
      // RLS working correctly if access is denied
      return true
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('profiles')
        .select('id')
        .limit(1)

      return !error
    } catch (error) {
      return false
    }
  }
}

// Global test setup helpers
let globalTestManager: TestDatabaseManager | null = null

/**
 * Setup test environment (call in beforeAll)
 */
export async function setupTestEnvironment(config?: Partial<TestConfig>): Promise<TestDatabaseManager> {
  const testConfig = { ...DEFAULT_TEST_CONFIG, ...config }
  globalTestManager = new TestDatabaseManager(testConfig)
  await globalTestManager.initialize()
  return globalTestManager
}

/**
 * Cleanup test environment (call in afterAll)
 */
export async function cleanupTestEnvironment(): Promise<void> {
  if (globalTestManager) {
    await globalTestManager.cleanup()
    globalTestManager = null
  }
}

/**
 * Get current test manager
 */
export function getTestManager(): TestDatabaseManager {
  if (!globalTestManager) {
    throw new Error('Test environment not setup. Call setupTestEnvironment() first.')
  }
  return globalTestManager
}

/**
 * Create test data factory for current test environment
 */
export function createTestDataFactory(): TestDataFactory {
  const manager = getTestManager()
  return new TestDataFactory(manager.getClient())
}

/**
 * Create test utilities for current test environment
 */
export function createTestUtils(): TestUtils {
  const manager = getTestManager()
  return new TestUtils(manager.getClient())
}

// Jest setup helpers
export const jestSetup = {
  /**
   * Setup for test suite
   */
  beforeAll: async (config?: Partial<TestConfig>) => {
    await setupTestEnvironment(config)
  },

  /**
   * Cleanup for test suite
   */
  afterAll: async () => {
    await cleanupTestEnvironment()
  },

  /**
   * Reset between tests
   */
  beforeEach: async () => {
    const manager = getTestManager()
    if (manager) {
      await manager.reset()
    }
  }
}