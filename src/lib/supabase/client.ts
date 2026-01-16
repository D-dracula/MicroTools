/**
 * Browser-side Supabase Client
 * 
 * This file contains browser-safe Supabase client functions.
 * For server-side functions, use './server-client.ts' instead.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'
import { getEnvironmentConfig, type AppEnvironment } from './environment-config'

// Types for Supabase configuration
export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
  environment: AppEnvironment
}

// Client options interface
export interface SupabaseClientOptions {
  auth?: {
    autoRefreshToken?: boolean
    persistSession?: boolean
    detectSessionInUrl?: boolean
  }
  global?: {
    headers?: Record<string, string>
  }
}

// Environment validation with multi-environment support
function validateSupabaseConfig(): SupabaseConfig {
  const envConfig = getEnvironmentConfig()

  return {
    url: envConfig.supabase.url,
    anonKey: envConfig.supabase.anonKey,
    serviceRoleKey: envConfig.supabase.serviceRoleKey,
    environment: envConfig.name,
  }
}

// Browser client for client-side operations with environment awareness
export function createClient(options?: SupabaseClientOptions) {
  const config = validateSupabaseConfig()
  
  const defaultOptions: SupabaseClientOptions = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Environment': config.environment,
      },
    },
  }

  const mergedOptions = { 
    ...defaultOptions, 
    ...options,
    global: {
      ...defaultOptions.global,
      ...options?.global,
    },
  }
  
  return createBrowserClient<Database>(config.url, config.anonKey, mergedOptions)
}

// Utility function to check if environment is properly configured
export function isSupabaseConfigured(): boolean {
  try {
    validateSupabaseConfig()
    return true
  } catch {
    return false
  }
}

// Utility function to get configuration status for debugging with environment info
export function getSupabaseConfigStatus(): {
  environment: AppEnvironment
  isConfigured: boolean
  hasUrl: boolean
  hasAnonKey: boolean
  hasServiceRoleKey: boolean
  errors: string[]
} {
  try {
    const config = validateSupabaseConfig()
    return {
      environment: config.environment,
      isConfigured: true,
      hasUrl: !!config.url,
      hasAnonKey: !!config.anonKey,
      hasServiceRoleKey: !!config.serviceRoleKey,
      errors: [],
    }
  } catch (error) {
    const envConfig = getEnvironmentConfig()
    return {
      environment: envConfig.name,
      isConfigured: false,
      hasUrl: !!envConfig.supabase.url,
      hasAnonKey: !!envConfig.supabase.anonKey,
      hasServiceRoleKey: !!envConfig.supabase.serviceRoleKey,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

// Export types for use in other files with proper Database typing
export type SupabaseClient = ReturnType<typeof createClient>

// Re-export Database type for convenience
export type { Database } from './types'

// Re-export server functions for backward compatibility
// Note: These should only be imported in server components/API routes
export { createServerSupabaseClient, createAdminClient } from './server-client'
export type { SupabaseServerClient, SupabaseAdminClient } from './server-client'
