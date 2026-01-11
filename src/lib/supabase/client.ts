import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

// Server client for server-side operations (App Router) with environment awareness
export async function createServerSupabaseClient(options?: SupabaseClientOptions) {
  const config = validateSupabaseConfig()
  const cookieStore = await cookies()

  const defaultOptions: SupabaseClientOptions = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
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

  return createServerClient<Database>(config.url, config.anonKey, {
    ...mergedOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Admin client with service role key (server-side only) with environment awareness
export function createAdminClient(options?: SupabaseClientOptions) {
  const config = validateSupabaseConfig()
  
  if (!config.serviceRoleKey) {
    throw new Error(
      `Missing SUPABASE_SERVICE_ROLE_KEY environment variable for admin operations in ${config.environment} environment. ` +
      'Please add it to your environment configuration file. ' +
      'Get it from: Supabase Dashboard > Settings > API > service_role key'
    )
  }

  const defaultOptions: SupabaseClientOptions = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Environment': config.environment,
        'X-Admin-Client': 'true',
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

  return createServerClient<Database>(config.url, config.serviceRoleKey, {
    ...mergedOptions,
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // Admin client doesn't need cookies
      },
    },
  })
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
export type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>
export type SupabaseAdminClient = ReturnType<typeof createAdminClient>

// Re-export Database type for convenience
export type { Database } from './types'