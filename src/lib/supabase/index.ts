// Main Supabase integration exports
// This file provides a convenient way to import Supabase functionality

// Client exports
export {
  createClient,
  createServerSupabaseClient,
  createAdminClient,
  isSupabaseConfigured,
  getSupabaseConfigStatus,
  type SupabaseClient,
  type SupabaseServerClient,
  type SupabaseAdminClient,
  type Database,
} from './client'

// Database operations exports
export {
  SupabaseDatabaseOperations,
  createDatabaseOperations,
  createServerDatabaseOperations,
  createAdminDatabaseOperations,
} from './database'

// Type exports
export type {
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
  CalculationAnalytics,
  QueryOptions,
  CalculationFilters,
  ToolUsageFilters,
  RealtimeSubscription,
  RealtimePayload,
  AuthUser,
  AuthSession,
  SupabaseError,
  SupabaseResponse,
  SupabaseListResponse,
} from './types'