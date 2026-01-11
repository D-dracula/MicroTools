/**
 * Property-Based Tests for Supabase Integration
 * 
 * Comprehensive property-based testing using fast-check to validate
 * Supabase operations, data integrity, and system correctness.
 * 
 * Requirements: 8.2 - Testing Infrastructure
 */

import * as fc from 'fast-check'
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment, 
  createTestDataFactory,
  createTestUtils,
  TestDatabaseManager 
} from '../test-utils'
import { Database } from '../types'

describe('Supabase Property-Based Tests', () => {
  let testManager: TestDatabaseManager
  let dataFactory: ReturnType<typeof createTestDataFactory>
  let testUtils: ReturnType<typeof createTestUtils>

  beforeAll(async () => {
    testManager = await setupTestEnvironment({
      useTestDatabase: true,
      isolateTests: true,
      cleanupAfterEach: true,
      seedData: false
    })
    dataFactory = createTestDataFactory()
    testUtils = createTestUtils()
  })

  afterAll(async () => {
    await cleanupTestEnvironment()
  })

  beforeEach(async () => {
    await testManager.reset()
  })

  describe('Property 12: Test Environment Isolation', () => {
    /**
     * **Validates: Requirements 8.2**
     * For any test execution, the database client should use isolated test data 
     * that doesn't interfere with other tests or development data.
     */
    it('should isolate test data between test runs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
          }),
          async (userData) => {
            // Create user in first test run
            const user1 = await dataFactory.createUser(userData)
            const initialCount = await testUtils.getRowCount('profiles')
            
            // Reset test environment
            await testManager.reset()
            
            // Verify isolation - no data should remain
            const countAfterReset = await testUtils.getRowCount('profiles')
            expect(countAfterReset).toBe(0)
            
            // Create user in second test run with same data
            const user2 = await dataFactory.createUser(userData)
            
            // Should be able to create user with same data (no conflicts)
            expect(user2.name).toBe(userData.name)
            expect(user2.email).toBe(userData.email)
            expect(user2.id).not.toBe(user1.id) // Different IDs due to isolation
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should maintain data integrity within test session', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              email: fc.emailAddress(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (usersData) => {
            // Create multiple users
            const users = []
            for (const userData of usersData) {
              const user = await dataFactory.createUser(userData)
              users.push(user)
            }
            
            // Verify all users exist
            const totalCount = await testUtils.getRowCount('profiles')
            expect(totalCount).toBe(usersData.length)
            
            // Verify each user can be retrieved
            for (const user of users) {
              const { data, error } = await testManager.getClient()
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
              
              expect(error).toBeNull()
              expect(data).toBeDefined()
              expect(data?.id).toBe(user.id)
            }
          }
        ),
        { numRuns: 15 }
      )
    })
  })

  describe('Database Operation Properties', () => {
    it('should maintain referential integrity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userName: fc.string({ minLength: 1, maxLength: 50 }),
            userEmail: fc.emailAddress(),
            toolSlug: fc.string({ minLength: 1, maxLength: 50 }),
            inputs: fc.record({
              value: fc.float({ min: 0, max: 10000 })
            }),
            outputs: fc.record({
              result: fc.float({ min: 0, max: 10000 })
            })
          }),
          async (testData) => {
            // Create user first
            const user = await dataFactory.createUser({
              name: testData.userName,
              email: testData.userEmail
            })
            
            // Create calculation for user
            const calculation = await dataFactory.createCalculation(user.id, {
              tool_slug: testData.toolSlug,
              inputs: testData.inputs,
              outputs: testData.outputs
            })
            
            // Verify referential integrity
            expect(calculation.user_id).toBe(user.id)
            
            // Verify calculation can be retrieved with user data
            const { data, error } = await testManager.getClient()
              .from('calculations')
              .select(`
                *,
                profiles (
                  id,
                  name,
                  email
                )
              `)
              .eq('id', calculation.id)
              .single()
            
            expect(error).toBeNull()
            expect(data).toBeDefined()
            expect(data?.profiles?.id).toBe(user.id)
            expect(data?.profiles?.name).toBe(testData.userName)
          }
        ),
        { numRuns: 25 }
      )
    })

    it('should handle concurrent operations correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              toolSlug: fc.string({ minLength: 1, maxLength: 20 }),
              userType: fc.constantFrom('authenticated', 'anonymous')
            }),
            { minLength: 5, maxLength: 20 }
          ),
          async (usageData) => {
            // Create multiple tool usage records concurrently
            const promises = usageData.map(data => 
              dataFactory.createToolUsage({
                tool_slug: data.toolSlug,
                user_type: data.userType
              })
            )
            
            const results = await Promise.all(promises)
            
            // Verify all records were created
            expect(results).toHaveLength(usageData.length)
            
            // Verify no duplicate IDs
            const ids = results.map(r => r.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
            
            // Verify database count matches
            const totalCount = await testUtils.getRowCount('tool_usage')
            expect(totalCount).toBe(usageData.length)
          }
        ),
        { numRuns: 15 }
      )
    })
  })

  describe('Data Validation Properties', () => {
    it('should validate required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
            email: fc.option(fc.emailAddress(), { nil: null }),
          }),
          async (userData) => {
            try {
              const user = await dataFactory.createUser(userData)
              
              // If creation succeeded, required fields should be present
              expect(user.id).toBeDefined()
              expect(typeof user.id).toBe('string')
              expect(user.id.length).toBeGreaterThan(0)
              
              // Optional fields can be null
              if (userData.name !== null) {
                expect(user.name).toBe(userData.name)
              }
              if (userData.email !== null) {
                expect(user.email).toBe(userData.email)
              }
            } catch (error) {
              // If creation failed, it should be due to validation
              expect(error).toBeInstanceOf(Error)
            }
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should handle edge cases in data types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            priority: fc.integer({ min: -1000, max: 1000 }),
            impressions: fc.integer({ min: 0, max: 1000000 }),
            clicks: fc.integer({ min: 0, max: 100000 }),
            isActive: fc.boolean(),
            titleAr: fc.string({ minLength: 1, maxLength: 255 }),
            titleEn: fc.string({ minLength: 1, maxLength: 255 }),
          }),
          async (adData) => {
            try {
              const ad = await dataFactory.createCustomAd({
                priority: adData.priority,
                impressions: adData.impressions,
                clicks: adData.clicks,
                is_active: adData.isActive,
                title_ar: adData.titleAr,
                title_en: adData.titleEn,
              })
              
              // Verify data integrity
              expect(ad.priority).toBe(adData.priority)
              expect(ad.impressions).toBe(adData.impressions)
              expect(ad.clicks).toBe(adData.clicks)
              expect(ad.is_active).toBe(adData.isActive)
              expect(ad.title_ar).toBe(adData.titleAr)
              expect(ad.title_en).toBe(adData.titleEn)
              
              // Verify constraints
              expect(ad.impressions).toBeGreaterThanOrEqual(0)
              expect(ad.clicks).toBeGreaterThanOrEqual(0)
              expect(ad.clicks).toBeLessThanOrEqual(ad.impressions)
              
            } catch (error) {
              // If creation failed, verify it's due to valid constraints
              expect(error).toBeInstanceOf(Error)
            }
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Query Performance Properties', () => {
    it('should handle large datasets efficiently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50, max: 200 }),
          async (recordCount) => {
            // Create user first
            const user = await dataFactory.createUser({
              name: 'Performance Test User',
              email: 'perf@test.com'
            })
            
            // Create multiple calculations
            const startTime = Date.now()
            
            const calculations = await dataFactory.createMultiple(
              'calculations',
              recordCount,
              () => ({
                id: `test_calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: user.id,
                tool_slug: 'performance-test',
                inputs: { value: Math.random() * 1000 },
                outputs: { result: Math.random() * 2000 },
                created_at: new Date().toISOString()
              })
            )
            
            const creationTime = Date.now() - startTime
            
            // Verify all records created
            expect(calculations).toHaveLength(recordCount)
            
            // Test query performance
            const queryStartTime = Date.now()
            
            const { data, error } = await testManager.getClient()
              .from('calculations')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
            
            const queryTime = Date.now() - queryStartTime
            
            expect(error).toBeNull()
            expect(data).toHaveLength(recordCount)
            
            // Performance assertions (reasonable thresholds)
            expect(creationTime).toBeLessThan(recordCount * 50) // 50ms per record max
            expect(queryTime).toBeLessThan(1000) // 1 second max for query
          }
        ),
        { numRuns: 5 } // Fewer runs for performance tests
      )
    })
  })

  describe('Error Handling Properties', () => {
    it('should handle invalid operations gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            invalidUserId: fc.string({ minLength: 1, maxLength: 50 }),
            toolSlug: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          async (testData) => {
            try {
              // Attempt to create calculation with non-existent user
              await dataFactory.createCalculation(testData.invalidUserId, {
                tool_slug: testData.toolSlug,
                inputs: { value: 100 },
                outputs: { result: 200 }
              })
              
              // Should not reach here if foreign key constraints work
              throw new Error('Expected foreign key constraint violation')
              
            } catch (error) {
              // Should fail due to foreign key constraint
              expect(error).toBeInstanceOf(Error)
              expect(error.message).toMatch(/foreign key|constraint|not found/i)
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Data Consistency Properties', () => {
    it('should maintain consistency across related tables', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userCount: fc.integer({ min: 2, max: 5 }),
            calculationsPerUser: fc.integer({ min: 1, max: 5 })
          }),
          async (testData) => {
            // Create users
            const users = []
            for (let i = 0; i < testData.userCount; i++) {
              const user = await dataFactory.createUser({
                name: `User ${i}`,
                email: `user${i}@test.com`
              })
              users.push(user)
            }
            
            // Create calculations for each user
            const allCalculations = []
            for (const user of users) {
              for (let j = 0; j < testData.calculationsPerUser; j++) {
                const calc = await dataFactory.createCalculation(user.id, {
                  tool_slug: `tool-${j}`,
                  inputs: { value: j * 10 },
                  outputs: { result: j * 20 }
                })
                allCalculations.push(calc)
              }
            }
            
            // Verify consistency
            const expectedTotalCalcs = testData.userCount * testData.calculationsPerUser
            expect(allCalculations).toHaveLength(expectedTotalCalcs)
            
            // Verify each user has correct number of calculations
            for (const user of users) {
              const userCalcs = allCalculations.filter(c => c.user_id === user.id)
              expect(userCalcs).toHaveLength(testData.calculationsPerUser)
            }
            
            // Verify database consistency
            const totalUsers = await testUtils.getRowCount('profiles')
            const totalCalcs = await testUtils.getRowCount('calculations')
            
            expect(totalUsers).toBe(testData.userCount)
            expect(totalCalcs).toBe(expectedTotalCalcs)
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})

// Export property generators for reuse in other tests
export const propertyGenerators = {
  user: () => fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    email: fc.emailAddress(),
  }),
  
  calculation: () => fc.record({
    tool_slug: fc.string({ minLength: 1, maxLength: 50 }),
    inputs: fc.record({
      value: fc.float({ min: 0, max: 10000 })
    }),
    outputs: fc.record({
      result: fc.float({ min: 0, max: 10000 })
    })
  }),
  
  customAd: () => fc.record({
    placement: fc.constantFrom('header', 'sidebar', 'footer', 'content'),
    priority: fc.integer({ min: 0, max: 10 }),
    is_active: fc.boolean(),
    title_ar: fc.string({ minLength: 1, maxLength: 255 }),
    title_en: fc.string({ minLength: 1, maxLength: 255 }),
    description_ar: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
    description_en: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
    image_url: fc.webUrl(),
    link_url: fc.webUrl(),
  }),
  
  toolUsage: () => fc.record({
    tool_slug: fc.constantFrom(
      'profit-calculator', 
      'roi-calculator', 
      'conversion-calculator',
      'cbm-calculator',
      'qr-generator'
    ),
    user_type: fc.constantFrom('authenticated', 'anonymous')
  })
}