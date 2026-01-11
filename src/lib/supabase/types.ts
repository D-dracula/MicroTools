// Database types for Supabase integration
// These will be generated from the actual Supabase schema later

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          type: string
          provider: string
          provider_account_id: string
          refresh_token: string | null
          access_token: string | null
          expires_at: number | null
          token_type: string | null
          scope: string | null
          id_token: string | null
          session_state: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          session_token: string
          user_id: string
          expires: string
          created_at: string
        }
        Insert: {
          id?: string
          session_token: string
          user_id: string
          expires: string
          created_at?: string
        }
        Update: {
          id?: string
          session_token?: string
          user_id?: string
          expires?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      verification_tokens: {
        Row: {
          identifier: string
          token: string
          expires: string
          created_at: string
        }
        Insert: {
          identifier: string
          token: string
          expires: string
          created_at?: string
        }
        Update: {
          identifier?: string
          token?: string
          expires?: string
          created_at?: string
        }
        Relationships: []
      }
      calculations: {
        Row: {
          id: string
          user_id: string
          tool_slug: string
          inputs: Record<string, any>
          outputs: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_slug: string
          inputs: Record<string, any>
          outputs: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tool_slug?: string
          inputs?: Record<string, any>
          outputs?: Record<string, any>
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calculations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tool_usage: {
        Row: {
          id: string
          tool_slug: string
          user_type: string
          created_at: string
        }
        Insert: {
          id?: string
          tool_slug: string
          user_type: string
          created_at?: string
        }
        Update: {
          id?: string
          tool_slug?: string
          user_type?: string
          created_at?: string
        }
        Relationships: []
      }
      custom_ads: {
        Row: {
          id: string
          placement: string
          priority: number
          is_active: boolean
          title_ar: string
          title_en: string
          description_ar: string | null
          description_en: string | null
          image_url: string
          link_url: string
          start_date: string | null
          end_date: string | null
          impressions: number
          clicks: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          placement: string
          priority?: number
          is_active?: boolean
          title_ar: string
          title_en: string
          description_ar?: string | null
          description_en?: string | null
          image_url: string
          link_url: string
          start_date?: string | null
          end_date?: string | null
          impressions?: number
          clicks?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          placement?: string
          priority?: number
          is_active?: boolean
          title_ar?: string
          title_en?: string
          description_ar?: string | null
          description_en?: string | null
          image_url?: string
          link_url?: string
          start_date?: string | null
          end_date?: string | null
          impressions?: number
          clicks?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Account = Database['public']['Tables']['accounts']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type VerificationToken = Database['public']['Tables']['verification_tokens']['Row']
export type Calculation = Database['public']['Tables']['calculations']['Row']
export type ToolUsage = Database['public']['Tables']['tool_usage']['Row']
export type CustomAd = Database['public']['Tables']['custom_ads']['Row']

export type InsertProfile = Database['public']['Tables']['profiles']['Insert']
export type InsertAccount = Database['public']['Tables']['accounts']['Insert']
export type InsertSession = Database['public']['Tables']['sessions']['Insert']
export type InsertVerificationToken = Database['public']['Tables']['verification_tokens']['Insert']
export type InsertCalculation = Database['public']['Tables']['calculations']['Insert']
export type InsertToolUsage = Database['public']['Tables']['tool_usage']['Insert']
export type InsertCustomAd = Database['public']['Tables']['custom_ads']['Insert']

export type UpdateProfile = Database['public']['Tables']['profiles']['Update']
export type UpdateAccount = Database['public']['Tables']['accounts']['Update']
export type UpdateSession = Database['public']['Tables']['sessions']['Update']
export type UpdateVerificationToken = Database['public']['Tables']['verification_tokens']['Update']
export type UpdateCalculation = Database['public']['Tables']['calculations']['Update']
export type UpdateToolUsage = Database['public']['Tables']['tool_usage']['Update']
export type UpdateCustomAd = Database['public']['Tables']['custom_ads']['Update']

// Database operation interfaces
export interface DatabaseOperations {
  // User operations
  createUser(userData: InsertProfile): Promise<Profile>
  getUserById(id: string): Promise<Profile | null>
  updateUser(id: string, updates: UpdateProfile): Promise<Profile>
  deleteUser(id: string): Promise<void>
  
  // Calculation operations
  saveCalculation(calculation: InsertCalculation): Promise<Calculation>
  getUserCalculations(userId: string, limit?: number): Promise<Calculation[]>
  getUserCalculationsPaginated(userId: string, options?: PaginationOptions & CalculationFilters): Promise<PaginatedResponse<Calculation>>
  getCalculationById(id: string): Promise<Calculation | null>
  getCalculationWithProfile(id: string): Promise<CalculationWithProfile | null>
  updateCalculation(id: string, updates: UpdateCalculation): Promise<Calculation>
  deleteCalculation(id: string): Promise<void>
  
  // Tool usage tracking
  trackToolUsage(toolSlug: string, userType: string): Promise<ToolUsage>
  getToolAnalytics(toolSlug: string, startDate?: string, endDate?: string): Promise<ToolAnalytics>
  getToolUsagePaginated(filters?: ToolUsageFilters & PaginationOptions): Promise<PaginatedResponse<ToolUsageWithDetails>>
  
  // Custom ads operations
  getActiveAds(placement?: string): Promise<CustomAd[]>
  getActiveAdsPaginated(placement?: string, options?: PaginationOptions): Promise<PaginatedResponse<CustomAd>>
  createAd(adData: InsertCustomAd): Promise<CustomAd>
  updateAd(id: string, updates: UpdateCustomAd): Promise<CustomAd>
  deleteAd(id: string): Promise<void>
  incrementAdImpressions(id: string): Promise<void>
  incrementAdClicks(id: string): Promise<void>
  
  // Cache operations
  clearCache(pattern?: string): Promise<void>
  getCacheStats(): Promise<{ size: number; hitRate: number }>
}

// Analytics and reporting types
export interface ToolAnalytics {
  toolSlug: string
  totalUsage: number
  uniqueUsers: number
  usageByUserType: Record<string, number>
  usageByDate: Array<{
    date: string
    count: number
  }>
}

export interface CalculationAnalytics {
  totalCalculations: number
  calculationsByTool: Record<string, number>
  calculationsByDate: Array<{
    date: string
    count: number
  }>
}

// Query options and filters
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface PaginationOptions {
  page?: number
  pageSize?: number
  limit?: number
  offset?: number
}

export interface CalculationFilters extends QueryOptions {
  toolSlug?: string
  startDate?: string
  endDate?: string
}

export interface ToolUsageFilters extends QueryOptions {
  userType?: string
  startDate?: string
  endDate?: string
}

// Pagination response type
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// Join query types
export interface CalculationWithProfile extends Calculation {
  profile?: Profile
}

export interface ToolUsageWithDetails extends ToolUsage {
  calculationsCount?: number
  lastUsed?: string
}

// Cache configuration
export interface CacheConfig {
  ttl?: number // Time to live in seconds
  maxSize?: number // Maximum cache size
  enabled?: boolean
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// Real-time subscription types
export interface RealtimeSubscription {
  channel: string
  event: 'INSERT' | 'UPDATE' | 'DELETE'
  table: keyof Database['public']['Tables']
  filter?: string
}

export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  errors: string[] | null
}

// Authentication types
export interface AuthUser {
  id: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
  email_confirmed_at?: string
  phone_confirmed_at?: string
  last_sign_in_at?: string
  role?: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: AuthUser
}

// Error types
export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

// Response types
export interface SupabaseResponse<T> {
  data: T | null
  error: SupabaseError | null
}

export interface SupabaseListResponse<T> {
  data: T[] | null
  error: SupabaseError | null
  count?: number
}