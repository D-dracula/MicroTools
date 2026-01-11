import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, QueryOptions, PaginationOptions } from './types'

/**
 * Query builder utility for Supabase operations
 * Provides a fluent interface for building complex queries with joins, filters, and pagination
 */
export class SupabaseQueryBuilder<T = any> {
  private client: SupabaseClient<Database>
  private tableName: string
  private selectClause = '*'
  private joinClauses: string[] = []
  private whereClauses: Array<{ column: string; operator: string; value: any }> = []
  private orderClauses: Array<{ column: string; ascending: boolean }> = []
  private limitValue?: number
  private offsetValue?: number
  private countOption?: 'exact' | 'planned' | 'estimated'

  constructor(client: SupabaseClient<Database>, tableName: string) {
    this.client = client
    this.tableName = tableName
  }

  /**
   * Set the select clause
   */
  select(columns: string): SupabaseQueryBuilder<T> {
    this.selectClause = columns
    return this
  }

  /**
   * Add a join clause
   */
  join(
    table: string,
    condition: string,
    type: 'INNER' | 'LEFT' | 'RIGHT' = 'LEFT'
  ): SupabaseQueryBuilder<T> {
    this.joinClauses.push(`${type} JOIN ${table} ON ${condition}`)
    return this
  }

  /**
   * Add a where condition
   */
  where(column: string, operator: string, value: any): SupabaseQueryBuilder<T> {
    this.whereClauses.push({ column, operator, value })
    return this
  }

  /**
   * Add an equals condition
   */
  eq(column: string, value: any): SupabaseQueryBuilder<T> {
    return this.where(column, 'eq', value)
  }

  /**
   * Add a not equals condition
   */
  neq(column: string, value: any): SupabaseQueryBuilder<T> {
    return this.where(column, 'neq', value)
  }

  /**
   * Add a greater than condition
   */
  gt(column: string, value: any): SupabaseQueryBuilder<T> {
    return this.where(column, 'gt', value)
  }

  /**
   * Add a greater than or equal condition
   */
  gte(column: string, value: any): SupabaseQueryBuilder<T> {
    return this.where(column, 'gte', value)
  }

  /**
   * Add a less than condition
   */
  lt(column: string, value: any): SupabaseQueryBuilder<T> {
    return this.where(column, 'lt', value)
  }

  /**
   * Add a less than or equal condition
   */
  lte(column: string, value: any): SupabaseQueryBuilder<T> {
    return this.where(column, 'lte', value)
  }

  /**
   * Add a like condition
   */
  like(column: string, pattern: string): SupabaseQueryBuilder<T> {
    return this.where(column, 'like', pattern)
  }

  /**
   * Add an in condition
   */
  in(column: string, values: any[]): SupabaseQueryBuilder<T> {
    return this.where(column, 'in', values)
  }

  /**
   * Add an order by clause
   */
  orderBy(column: string, ascending = true): SupabaseQueryBuilder<T> {
    this.orderClauses.push({ column, ascending })
    return this
  }

  /**
   * Set limit
   */
  limit(count: number): SupabaseQueryBuilder<T> {
    this.limitValue = count
    return this
  }

  /**
   * Set offset
   */
  offset(count: number): SupabaseQueryBuilder<T> {
    this.offsetValue = count
    return this
  }

  /**
   * Enable count
   */
  count(type: 'exact' | 'planned' | 'estimated' = 'exact'): SupabaseQueryBuilder<T> {
    this.countOption = type
    return this
  }

  /**
   * Apply pagination options
   */
  paginate(options: PaginationOptions): SupabaseQueryBuilder<T> {
    const { page = 1, pageSize = 20, limit, offset } = options

    if (limit !== undefined) {
      this.limit(limit)
    } else {
      this.limit(pageSize)
    }

    if (offset !== undefined) {
      this.offset(offset)
    } else {
      this.offset((page - 1) * pageSize)
    }

    return this
  }

  /**
   * Apply query options
   */
  applyOptions(options: QueryOptions): SupabaseQueryBuilder<T> {
    const { limit, offset, orderBy, orderDirection = 'desc' } = options

    if (limit) {
      this.limit(limit)
    }

    if (offset) {
      this.offset(offset)
    }

    if (orderBy) {
      this.orderBy(orderBy, orderDirection === 'asc')
    }

    return this
  }

  /**
   * Build and execute the query
   */
  async execute(): Promise<{ data: T[] | null; error: any; count?: number }> {
    let query = this.client.from(this.tableName)

    // Apply select with count if needed
    if (this.countOption) {
      query = query.select(this.selectClause, { count: this.countOption })
    } else {
      query = query.select(this.selectClause)
    }

    // Apply where conditions
    for (const condition of this.whereClauses) {
      const { column, operator, value } = condition
      switch (operator) {
        case 'eq':
          query = query.eq(column, value)
          break
        case 'neq':
          query = query.neq(column, value)
          break
        case 'gt':
          query = query.gt(column, value)
          break
        case 'gte':
          query = query.gte(column, value)
          break
        case 'lt':
          query = query.lt(column, value)
          break
        case 'lte':
          query = query.lte(column, value)
          break
        case 'like':
          query = query.like(column, value)
          break
        case 'in':
          query = query.in(column, value)
          break
      }
    }

    // Apply ordering
    for (const order of this.orderClauses) {
      query = query.order(order.column, { ascending: order.ascending })
    }

    // Apply pagination
    if (this.limitValue !== undefined && this.offsetValue !== undefined) {
      query = query.range(this.offsetValue, this.offsetValue + this.limitValue - 1)
    } else if (this.limitValue !== undefined) {
      query = query.limit(this.limitValue)
    }

    return await query
  }

  /**
   * Execute and return a single record
   */
  async single(): Promise<{ data: T | null; error: any }> {
    const result = await this.limit(1).execute()
    return {
      data: result.data?.[0] || null,
      error: result.error,
    }
  }

  /**
   * Execute and return paginated results
   */
  async paginated(options: PaginationOptions = {}): Promise<{
    data: T[]
    pagination: {
      page: number
      pageSize: number
      totalCount: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
    error: any
  }> {
    const { page = 1, pageSize = 20 } = options

    const result = await this.paginate(options).count().execute()

    if (result.error) {
      return {
        data: [],
        pagination: {
          page,
          pageSize,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        error: result.error,
      }
    }

    const totalCount = result.count || 0
    const totalPages = Math.ceil(totalCount / pageSize)

    return {
      data: result.data || [],
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      error: null,
    }
  }
}

/**
 * Factory function to create a query builder
 */
export function createQueryBuilder<T = any>(
  client: SupabaseClient<Database>,
  tableName: string
): SupabaseQueryBuilder<T> {
  return new SupabaseQueryBuilder<T>(client, tableName)
}

/**
 * Helper functions for common query patterns
 */
export const QueryHelpers = {
  /**
   * Build a date range filter
   */
  dateRange(
    builder: SupabaseQueryBuilder,
    column: string,
    startDate?: string,
    endDate?: string
  ): SupabaseQueryBuilder {
    if (startDate) {
      builder.gte(column, startDate)
    }
    if (endDate) {
      builder.lte(column, endDate)
    }
    return builder
  },

  /**
   * Build a search filter across multiple columns
   */
  search(
    builder: SupabaseQueryBuilder,
    searchTerm: string,
    columns: string[]
  ): SupabaseQueryBuilder {
    // Note: This is a simplified search. For full-text search, use Supabase's text search functions
    const searchPattern = `%${searchTerm}%`
    
    // For now, we'll search the first column. In a real implementation,
    // you'd want to use Supabase's full-text search or OR conditions
    if (columns.length > 0) {
      builder.like(columns[0], searchPattern)
    }
    
    return builder
  },

  /**
   * Build filters from a filter object
   */
  applyFilters(
    builder: SupabaseQueryBuilder,
    filters: Record<string, any>
  ): SupabaseQueryBuilder {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          builder.in(key, value)
        } else {
          builder.eq(key, value)
        }
      }
    })
    return builder
  },
}