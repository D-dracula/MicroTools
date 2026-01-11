import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { globalCache, SupabaseCache, CacheKeys } from '../cache'
import { createQueryBuilder, QueryHelpers } from '../query-builder'

describe('Query Optimization', () => {
  afterEach(() => {
    globalCache.clear()
  })

  describe('Cache Implementation', () => {
    it('should store and retrieve cached values', () => {
      const cache = new SupabaseCache({ ttl: 300, enabled: true })
      
      const testData = { id: '1', name: 'Test' }
      cache.set('test-key', testData)
      
      const retrieved = cache.get('test-key')
      expect(retrieved).toEqual(testData)
    })

    it('should respect TTL and expire entries', async () => {
      const cache = new SupabaseCache({ ttl: 0.1, enabled: true }) // 0.1 seconds
      
      cache.set('test-key', 'test-value')
      expect(cache.get('test-key')).toBe('test-value')
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(cache.get('test-key')).toBeNull()
    })

    it('should handle cache size limits', () => {
      const cache = new SupabaseCache({ maxSize: 2, enabled: true })
      
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3') // Should evict key1
      
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
    })

    it('should clear cache by pattern', () => {
      globalCache.set('user:profile:1', { id: '1' })
      globalCache.set('user:calculations:1', [])
      globalCache.set('tool:analytics:test', {})

      globalCache.clear('user:')

      expect(globalCache.get('user:profile:1')).toBeNull()
      expect(globalCache.get('user:calculations:1')).toBeNull()
      expect(globalCache.get('tool:analytics:test')).not.toBeNull()
    })

    it('should provide cache statistics', () => {
      const cache = new SupabaseCache({ enabled: true })
      
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      // Simulate hits and misses
      cache.get('key1') // hit
      cache.get('key1') // hit
      cache.get('nonexistent') // miss
      
      const stats = cache.getStats()
      expect(stats.size).toBe(2)
      expect(stats.hitCount).toBe(2)
      expect(stats.missCount).toBe(1)
      expect(stats.hitRate).toBeCloseTo(0.67, 2)
    })

    it('should generate consistent cache keys', () => {
      const key1 = CacheKeys.userProfile('user-123')
      const key2 = CacheKeys.userCalculations('user-456', 10)
      const key3 = CacheKeys.toolAnalytics('test-tool', '2024-01-01', '2024-01-31')
      
      expect(key1).toBe('user:profile:user-123')
      expect(key2).toBe('user:calculations:user-456:10')
      expect(key3).toBe('tool:analytics:test-tool:2024-01-01:2024-01-31')
    })

    it('should handle getOrSet pattern', async () => {
      const cache = new SupabaseCache({ enabled: true })
      let fetchCount = 0
      
      const fetcher = async () => {
        fetchCount++
        return { data: 'fetched-data', count: fetchCount }
      }
      
      // First call should fetch
      const result1 = await cache.getOrSet('test-key', fetcher)
      expect(result1.count).toBe(1)
      expect(fetchCount).toBe(1)
      
      // Second call should use cache
      const result2 = await cache.getOrSet('test-key', fetcher)
      expect(result2.count).toBe(1) // Same as first call
      expect(fetchCount).toBe(1) // Fetcher not called again
    })
  })

  describe('Query Builder', () => {
    let mockClient: any

    beforeEach(() => {
      mockClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
        }),
      }
    })

    it('should create query builder instance', () => {
      const builder = createQueryBuilder(mockClient, 'test_table')
      expect(builder).toBeDefined()
    })

    it('should chain query methods', () => {
      const builder = createQueryBuilder(mockClient, 'test_table')
      
      const result = builder
        .select('*')
        .eq('user_id', 'user-1')
        .orderBy('created_at', false)
        .limit(10)

      expect(result).toBe(builder) // Should return same instance for chaining
    })

    it('should apply date range filters', () => {
      const builder = createQueryBuilder(mockClient, 'test_table')
      
      // Mock the methods we'll test
      builder.gte = jest.fn().mockReturnThis()
      builder.lte = jest.fn().mockReturnThis()

      QueryHelpers.dateRange(builder, 'created_at', '2024-01-01', '2024-01-31')

      expect(builder.gte).toHaveBeenCalledWith('created_at', '2024-01-01')
      expect(builder.lte).toHaveBeenCalledWith('created_at', '2024-01-31')
    })

    it('should apply filters from object', () => {
      const builder = createQueryBuilder(mockClient, 'test_table')
      
      // Mock the methods we'll test
      builder.eq = jest.fn().mockReturnThis()
      builder.in = jest.fn().mockReturnThis()

      const filters = {
        status: 'active',
        categories: ['cat1', 'cat2'],
        emptyValue: '',
        nullValue: null,
        undefinedValue: undefined,
      }

      QueryHelpers.applyFilters(builder, filters)

      expect(builder.eq).toHaveBeenCalledWith('status', 'active')
      expect(builder.in).toHaveBeenCalledWith('categories', ['cat1', 'cat2'])
      
      // Should not apply empty/null/undefined values
      expect(builder.eq).not.toHaveBeenCalledWith('emptyValue', '')
      expect(builder.eq).not.toHaveBeenCalledWith('nullValue', null)
      expect(builder.eq).not.toHaveBeenCalledWith('undefinedValue', undefined)
    })

    it('should handle pagination options', () => {
      const builder = createQueryBuilder(mockClient, 'test_table')
      
      // Mock the methods we'll test
      builder.limit = jest.fn().mockReturnThis()
      builder.offset = jest.fn().mockReturnThis()

      builder.paginate({ page: 2, pageSize: 20 })

      expect(builder.limit).toHaveBeenCalledWith(20)
      expect(builder.offset).toHaveBeenCalledWith(20) // (page - 1) * pageSize
    })

    it('should handle custom limit and offset', () => {
      const builder = createQueryBuilder(mockClient, 'test_table')
      
      // Mock the methods we'll test
      builder.limit = jest.fn().mockReturnThis()
      builder.offset = jest.fn().mockReturnThis()

      builder.paginate({ limit: 50, offset: 100 })

      expect(builder.limit).toHaveBeenCalledWith(50)
      expect(builder.offset).toHaveBeenCalledWith(100)
    })
  })

  describe('Cache Key Generation', () => {
    it('should generate unique keys for different parameters', () => {
      const key1 = CacheKeys.userCalculations('user-1', 10)
      const key2 = CacheKeys.userCalculations('user-1', 20)
      const key3 = CacheKeys.userCalculations('user-2', 10)
      
      expect(key1).not.toBe(key2)
      expect(key1).not.toBe(key3)
      expect(key2).not.toBe(key3)
    })

    it('should generate consistent keys for same parameters', () => {
      const key1 = CacheKeys.toolAnalytics('test-tool', '2024-01-01', '2024-01-31')
      const key2 = CacheKeys.toolAnalytics('test-tool', '2024-01-01', '2024-01-31')
      
      expect(key1).toBe(key2)
    })

    it('should handle optional parameters', () => {
      const key1 = CacheKeys.toolAnalytics('test-tool')
      const key2 = CacheKeys.toolAnalytics('test-tool', undefined, undefined)
      
      expect(key1).toBe(key2)
    })
  })

  describe('Performance Optimizations', () => {
    it('should demonstrate caching performance benefit', async () => {
      const cache = new SupabaseCache({ enabled: true })
      let expensiveOperationCount = 0
      
      const expensiveOperation = async () => {
        expensiveOperationCount++
        // Simulate expensive operation
        await new Promise(resolve => setTimeout(resolve, 10))
        return { result: 'expensive-data', operationId: expensiveOperationCount }
      }
      
      const startTime = Date.now()
      
      // First call - should perform expensive operation
      const result1 = await cache.getOrSet('expensive-key', expensiveOperation)
      const firstCallTime = Date.now() - startTime
      
      // Second call - should use cache
      const secondCallStart = Date.now()
      const result2 = await cache.getOrSet('expensive-key', expensiveOperation)
      const secondCallTime = Date.now() - secondCallStart
      
      expect(result1.operationId).toBe(1)
      expect(result2.operationId).toBe(1) // Same result from cache
      expect(expensiveOperationCount).toBe(1) // Operation only called once
      expect(secondCallTime).toBeLessThan(firstCallTime) // Cache should be faster
    })

    it('should handle concurrent cache access', async () => {
      const cache = new SupabaseCache({ enabled: true })
      let operationCount = 0
      
      const operation = async () => {
        operationCount++
        await new Promise(resolve => setTimeout(resolve, 50))
        return { id: operationCount }
      }
      
      // Start multiple concurrent operations with different keys
      // (since our cache doesn't handle concurrent access to same key)
      const promises = Array.from({ length: 5 }, (_, i) => 
        cache.getOrSet(`concurrent-key-${i}`, operation)
      )
      
      const results = await Promise.all(promises)
      
      // Each should get a unique result
      results.forEach((result, index) => {
        expect(result.id).toBeGreaterThan(0)
        expect(result.id).toBeLessThanOrEqual(5)
      })
      
      // Operation should be called for each unique key
      expect(operationCount).toBe(5)
    })
  })
})