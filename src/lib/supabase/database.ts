import { createClient, createServerSupabaseClient, createAdminClient } from './client'
import { globalCache, CacheKeys } from './cache'
import { createQueryBuilder, QueryHelpers } from './query-builder'
import { withRetry, retryable, ErrorContext } from './retry'
import { 
  classifySupabaseError, 
  SupabaseError,
  SupabaseValidationError,
  SupabaseNotFoundError 
} from './errors'
import { logger } from './logger'
import type {
  Database,
  Profile,
  Calculation,
  ToolUsage,
  CustomAd,
  InsertProfile,
  InsertCalculation,
  InsertToolUsage,
  InsertCustomAd,
  UpdateProfile,
  UpdateCalculation,
  UpdateToolUsage,
  UpdateCustomAd,
  DatabaseOperations,
  ToolAnalytics,
  CalculationFilters,
  ToolUsageFilters,
  SupabaseResponse,
  SupabaseListResponse,
  PaginatedResponse,
  PaginationOptions,
  CalculationWithProfile,
  ToolUsageWithDetails,
} from './types'

/**
 * Database operations implementation using Supabase client
 * This class provides a clean interface for all database operations
 */
export class SupabaseDatabaseOperations implements DatabaseOperations {
  private client: ReturnType<typeof createClient>

  constructor(client?: ReturnType<typeof createClient>) {
    this.client = client || createClient()
  }

  // User operations
  @retryable({ maxAttempts: 3 })
  async createUser(userData: InsertProfile): Promise<Profile> {
    const context = ErrorContext.create()
      .operation('createUser')
      .data(userData)
      .build()

    logger.debug('Creating user', context)

    try {
      // Validate input data
      if (!userData.id) {
        throw new SupabaseValidationError('User ID is required', context)
      }

      const { data, error } = await this.client
        .from('profiles')
        .insert(userData)
        .select()
        .single()

      if (error) {
        throw classifySupabaseError(error, context)
      }

      // Cache the new user
      globalCache.set(CacheKeys.userProfile(data.id), data)

      logger.info('User created successfully', { ...context, userId: data.id })
      return data
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : classifySupabaseError(error, context)
      
      logger.error('Failed to create user', context, supabaseError)
      throw supabaseError
    }
  }

  @retryable({ maxAttempts: 3 })
  async getUserById(id: string): Promise<Profile | null> {
    const context = ErrorContext.create()
      .operation('getUserById')
      .userId(id)
      .build()

    logger.debug('Getting user by ID', context)

    try {
      // Validate input
      if (!id) {
        throw new SupabaseValidationError('User ID is required', context)
      }

      // Try cache first
      const cacheKey = CacheKeys.userProfile(id)
      const cached = globalCache.get<Profile>(cacheKey)
      if (cached) {
        logger.debug('User found in cache', context)
        return cached
      }

      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.debug('User not found', context)
          return null // User not found
        }
        throw classifySupabaseError(error, context)
      }

      // Cache the result
      globalCache.set(cacheKey, data)
      logger.debug('User retrieved successfully', context)
      return data
    } catch (error) {
      if (error instanceof SupabaseNotFoundError) {
        return null
      }
      
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : classifySupabaseError(error, context)
      
      logger.error('Failed to get user', context, supabaseError)
      throw supabaseError
    }
  }

  async updateUser(id: string, updates: UpdateProfile): Promise<Profile> {
    const { data, error } = await this.client
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    // Update cache
    globalCache.set(CacheKeys.userProfile(id), data)
    // Clear related caches
    globalCache.clear(`user:calculations:${id}`)

    return data
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await this.client
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    // Clear all related caches
    globalCache.delete(CacheKeys.userProfile(id))
    globalCache.clear(`user:calculations:${id}`)
  }

  @retryable({ maxAttempts: 3 })
  async saveCalculation(calculation: InsertCalculation): Promise<Calculation> {
    const context = ErrorContext.create()
      .operation('saveCalculation')
      .userId(calculation.user_id)
      .data({ toolSlug: calculation.tool_slug })
      .build()

    logger.debug('Saving calculation', context)

    try {
      // Validate input data
      if (!calculation.user_id) {
        throw new SupabaseValidationError('User ID is required', context)
      }
      if (!calculation.tool_slug) {
        throw new SupabaseValidationError('Tool slug is required', context)
      }
      if (!calculation.inputs || !calculation.outputs) {
        throw new SupabaseValidationError('Inputs and outputs are required', context)
      }

      const { data, error } = await this.client
        .from('calculations')
        .insert(calculation)
        .select()
        .single()

      if (error) {
        throw classifySupabaseError(error, context)
      }

      // Clear user calculations cache
      globalCache.clear(`user:calculations:${calculation.user_id}`)

      logger.info('Calculation saved successfully', { 
        ...context, 
        calculationId: data.id 
      })
      return data
    } catch (error) {
      const supabaseError = error instanceof SupabaseError 
        ? error 
        : classifySupabaseError(error, context)
      
      logger.error('Failed to save calculation', context, supabaseError)
      throw supabaseError
    }
  }

  async getUserCalculations(userId: string, limit?: number): Promise<Calculation[]> {
    const cacheKey = CacheKeys.userCalculations(userId, limit)
    const cached = globalCache.get<Calculation[]>(cacheKey)
    if (cached) {
      return cached
    }

    let query = this.client
      .from('calculations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get user calculations: ${error.message}`)
    }

    const result = data || []
    globalCache.set(cacheKey, result)
    return result
  }

  async getUserCalculationsPaginated(
    userId: string, 
    options: PaginationOptions & CalculationFilters = {}
  ): Promise<PaginatedResponse<Calculation>> {
    const { 
      page = 1, 
      pageSize = 20, 
      toolSlug,
      startDate,
      endDate 
    } = options

    // Use query builder for complex query
    const builder = createQueryBuilder<Calculation>(this.client, 'calculations')
      .select('*')
      .eq('user_id', userId)
      .orderBy('created_at', false) // false = descending

    // Apply filters using helper
    const filters: Record<string, any> = {}
    if (toolSlug) filters.tool_slug = toolSlug
    
    QueryHelpers.applyFilters(builder, filters)
    QueryHelpers.dateRange(builder, 'created_at', startDate, endDate)

    const result = await builder.paginated({ page, pageSize })

    if (result.error) {
      throw new Error(`Failed to get paginated calculations: ${result.error.message}`)
    }

    return {
      data: result.data,
      pagination: result.pagination,
    }
  }

  async getCalculationById(id: string): Promise<Calculation | null> {
    const cacheKey = CacheKeys.calculation(id)
    const cached = globalCache.get<Calculation>(cacheKey)
    if (cached) {
      return cached
    }

    const { data, error } = await this.client
      .from('calculations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Calculation not found
      }
      throw new Error(`Failed to get calculation: ${error.message}`)
    }

    globalCache.set(cacheKey, data)
    return data
  }

  async getCalculationWithProfile(id: string): Promise<CalculationWithProfile | null> {
    const cacheKey = CacheKeys.calculationWithProfile(id)
    const cached = globalCache.get<CalculationWithProfile>(cacheKey)
    if (cached) {
      return cached
    }

    // Use join query to get calculation with profile data
    const { data, error } = await this.client
      .from('calculations')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Calculation not found
      }
      throw new Error(`Failed to get calculation with profile: ${error.message}`)
    }

    globalCache.set(cacheKey, data, 180) // Cache for 3 minutes (shorter TTL for joined data)
    return data
  }

  async updateCalculation(id: string, updates: UpdateCalculation): Promise<Calculation> {
    const { data, error } = await this.client
      .from('calculations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update calculation: ${error.message}`)
    }

    // Update caches
    globalCache.set(CacheKeys.calculation(id), data)
    globalCache.delete(CacheKeys.calculationWithProfile(id))
    if (data.user_id) {
      globalCache.clear(`user:calculations:${data.user_id}`)
    }

    return data
  }

  async deleteCalculation(id: string): Promise<void> {
    // Get calculation first to clear related caches
    const calculation = await this.getCalculationById(id)
    
    const { error } = await this.client
      .from('calculations')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete calculation: ${error.message}`)
    }

    // Clear caches
    globalCache.delete(CacheKeys.calculation(id))
    globalCache.delete(CacheKeys.calculationWithProfile(id))
    if (calculation?.user_id) {
      globalCache.clear(`user:calculations:${calculation.user_id}`)
    }
  }

  // Tool usage tracking
  async trackToolUsage(toolSlug: string, userType: string): Promise<ToolUsage> {
    const { data, error } = await this.client
      .from('tool_usage')
      .insert({
        tool_slug: toolSlug,
        user_type: userType,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to track tool usage: ${error.message}`)
    }

    // Clear analytics cache for this tool
    globalCache.clear(`tool:analytics:${toolSlug}`)

    return data
  }

  async getToolAnalytics(
    toolSlug: string,
    startDate?: string,
    endDate?: string
  ): Promise<ToolAnalytics> {
    const cacheKey = CacheKeys.toolAnalytics(toolSlug, startDate, endDate)
    const cached = globalCache.get<ToolAnalytics>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Try to use the optimized database function first
      const { data, error } = await this.client.rpc('get_tool_usage_stats', {
        tool_slug_param: toolSlug,
        start_date_param: startDate || null,
        end_date_param: endDate || null,
      })

      if (!error && data && data.length > 0) {
        const stats = data[0]
        const result: ToolAnalytics = {
          toolSlug,
          totalUsage: Number(stats.total_usage),
          uniqueUsers: Number(stats.unique_users),
          usageByUserType: stats.usage_by_user_type || {},
          usageByDate: stats.usage_by_date || [],
        }

        globalCache.set(cacheKey, result, 600) // Cache for 10 minutes
        return result
      }
    } catch (error) {
      console.warn('Failed to use optimized function, falling back to manual query:', error)
    }

    // Fallback to manual query if RPC function fails
    let query = this.client
      .from('tool_usage')
      .select('*')
      .eq('tool_slug', toolSlug)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get tool analytics: ${error.message}`)
    }

    // Process the data to create analytics
    const usageData = data || []
    const totalUsage = usageData.length
    const uniqueUsers = new Set(usageData.map(u => u.user_type)).size
    
    const usageByUserType: Record<string, number> = {}
    const usageByDate: Array<{ date: string; count: number }> = []

    // Group by user type
    usageData.forEach(usage => {
      usageByUserType[usage.user_type] = (usageByUserType[usage.user_type] || 0) + 1
    })

    // Group by date
    const dateGroups: Record<string, number> = {}
    usageData.forEach(usage => {
      const date = usage.created_at.split('T')[0] // Get date part only
      dateGroups[date] = (dateGroups[date] || 0) + 1
    })

    Object.entries(dateGroups).forEach(([date, count]) => {
      usageByDate.push({ date, count })
    })

    const result = {
      toolSlug,
      totalUsage,
      uniqueUsers,
      usageByUserType,
      usageByDate: usageByDate.sort((a, b) => a.date.localeCompare(b.date)),
    }

    globalCache.set(cacheKey, result, 600) // Cache for 10 minutes
    return result
  }

  async getToolUsagePaginated(
    filters: ToolUsageFilters & PaginationOptions = {}
  ): Promise<PaginatedResponse<ToolUsageWithDetails>> {
    const { 
      page = 1, 
      pageSize = 20, 
      userType,
      startDate,
      endDate 
    } = filters

    // Use query builder for complex query with aggregation
    const builder = createQueryBuilder<ToolUsageWithDetails>(this.client, 'tool_usage')
      .select(`
        *,
        calculations_count:calculations(count)
      `)
      .orderBy('created_at', false) // false = descending

    // Apply filters
    const filterObj: Record<string, any> = {}
    if (userType) filterObj.user_type = userType
    
    QueryHelpers.applyFilters(builder, filterObj)
    QueryHelpers.dateRange(builder, 'created_at', startDate, endDate)

    const result = await builder.paginated({ page, pageSize })

    if (result.error) {
      throw new Error(`Failed to get paginated tool usage: ${result.error.message}`)
    }

    // Process data to add additional details
    const processedData: ToolUsageWithDetails[] = result.data.map(usage => ({
      ...usage,
      calculationsCount: Array.isArray(usage.calculations_count) 
        ? usage.calculations_count.length 
        : 0,
      lastUsed: usage.created_at,
    }))

    return {
      data: processedData,
      pagination: result.pagination,
    }
  }

  // Custom ads operations
  async getActiveAds(placement?: string): Promise<CustomAd[]> {
    const cacheKey = CacheKeys.activeAds(placement)
    const cached = globalCache.get<CustomAd[]>(cacheKey)
    if (cached) {
      return cached
    }

    let query = this.client
      .from('custom_ads')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (placement) {
      query = query.eq('placement', placement)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get active ads: ${error.message}`)
    }

    const result = data || []
    globalCache.set(cacheKey, result, 180) // Cache for 3 minutes
    return result
  }

  async getActiveAdsPaginated(
    placement?: string, 
    options: PaginationOptions = {}
  ): Promise<PaginatedResponse<CustomAd>> {
    const { page = 1, pageSize = 10 } = options

    // Use query builder for cleaner code
    const builder = createQueryBuilder<CustomAd>(this.client, 'custom_ads')
      .select('*')
      .eq('is_active', true)
      .orderBy('priority', false) // false = descending

    if (placement) {
      builder.eq('placement', placement)
    }

    const result = await builder.paginated({ page, pageSize })

    if (result.error) {
      throw new Error(`Failed to get paginated active ads: ${result.error.message}`)
    }

    return {
      data: result.data,
      pagination: result.pagination,
    }
  }

  async createAd(adData: InsertCustomAd): Promise<CustomAd> {
    const { data, error } = await this.client
      .from('custom_ads')
      .insert(adData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create ad: ${error.message}`)
    }

    // Clear ads cache
    globalCache.clear('ads:active')

    return data
  }

  async updateAd(id: string, updates: UpdateCustomAd): Promise<CustomAd> {
    const { data, error } = await this.client
      .from('custom_ads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update ad: ${error.message}`)
    }

    // Clear ads cache
    globalCache.clear('ads:active')

    return data
  }

  async deleteAd(id: string): Promise<void> {
    const { error } = await this.client
      .from('custom_ads')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete ad: ${error.message}`)
    }

    // Clear ads cache
    globalCache.clear('ads:active')
  }

  async incrementAdImpressions(id: string): Promise<void> {
    // Use atomic increment with RPC function if available, otherwise manual increment
    try {
      // Try RPC function first (if it exists in the database)
      const { error } = await this.client.rpc('increment_ad_impressions', { ad_id: id })
      if (!error) {
        return
      }
    } catch {
      // RPC function doesn't exist, fall back to manual increment
    }

    // Manual increment as fallback
    const { data: ad } = await this.client
      .from('custom_ads')
      .select('impressions')
      .eq('id', id)
      .single()

    if (ad) {
      await this.client
        .from('custom_ads')
        .update({ impressions: ad.impressions + 1 })
        .eq('id', id)
    }
  }

  async incrementAdClicks(id: string): Promise<void> {
    // Use atomic increment with RPC function if available, otherwise manual increment
    try {
      // Try RPC function first (if it exists in the database)
      const { error } = await this.client.rpc('increment_ad_clicks', { ad_id: id })
      if (!error) {
        return
      }
    } catch {
      // RPC function doesn't exist, fall back to manual increment
    }

    // Manual increment as fallback
    const { data: ad } = await this.client
      .from('custom_ads')
      .select('clicks')
      .eq('id', id)
      .single()

    if (ad) {
      await this.client
        .from('custom_ads')
        .update({ clicks: ad.clicks + 1 })
        .eq('id', id)
    }
  }

  // Cache operations
  async clearCache(pattern?: string): Promise<void> {
    globalCache.clear(pattern)
  }

  async getCacheStats(): Promise<{ size: number; hitRate: number }> {
    const stats = globalCache.getStats()
    return {
      size: stats.size,
      hitRate: stats.hitRate,
    }
  }
}

// Factory functions for different client types
export function createDatabaseOperations(): SupabaseDatabaseOperations {
  return new SupabaseDatabaseOperations(createClient())
}

export async function createServerDatabaseOperations(): Promise<SupabaseDatabaseOperations> {
  const client = await createServerSupabaseClient()
  return new SupabaseDatabaseOperations(client)
}

export function createAdminDatabaseOperations(): SupabaseDatabaseOperations {
  return new SupabaseDatabaseOperations(createAdminClient())
}