import type { CacheConfig, CacheEntry } from './types'

/**
 * Simple in-memory cache implementation for Supabase operations
 * This provides basic caching functionality with TTL support
 */
export class SupabaseCache {
  private cache = new Map<string, CacheEntry<any>>()
  private config: Required<CacheConfig>
  private hitCount = 0
  private missCount = 0

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl || 300, // 5 minutes default
      maxSize: config.maxSize || 1000,
      enabled: config.enabled !== false,
    }
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    if (!this.config.enabled) {
      return null
    }

    const entry = this.cache.get(key)
    if (!entry) {
      this.missCount++
      return null
    }

    // Check if entry has expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key)
      this.missCount++
      return null
    }

    this.hitCount++
    return entry.data
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    if (!this.config.enabled) {
      return
    }

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl,
    }

    this.cache.set(key, entry)
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear cache entries matching pattern
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; hitCount: number; missCount: number } {
    const totalRequests = this.hitCount + this.missCount
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0

    return {
      size: this.cache.size,
      hitRate,
      hitCount: this.hitCount,
      missCount: this.missCount,
    }
  }

  /**
   * Generate cache key for database operations
   */
  static generateKey(operation: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {} as Record<string, any>)

    return `${operation}:${JSON.stringify(sortedParams)}`
  }

  /**
   * Wrapper for caching async operations
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await fetcher()
    this.set(key, value, ttl)
    return value
  }
}

// Global cache instance
export const globalCache = new SupabaseCache({
  ttl: 300, // 5 minutes
  maxSize: 1000,
  enabled: true,
})

// Cache key generators for common operations
export const CacheKeys = {
  userProfile: (userId: string) => `user:profile:${userId}`,
  userCalculations: (userId: string, limit?: number) => 
    `user:calculations:${userId}:${limit || 'all'}`,
  calculation: (id: string) => `calculation:${id}`,
  calculationWithProfile: (id: string) => `calculation:profile:${id}`,
  toolAnalytics: (toolSlug: string, startDate?: string, endDate?: string) =>
    `tool:analytics:${toolSlug}:${startDate || ''}:${endDate || ''}`,
  activeAds: (placement?: string) => `ads:active:${placement || 'all'}`,
  toolUsage: (filters: Record<string, any>) => 
    SupabaseCache.generateKey('tool:usage', filters),
} as const