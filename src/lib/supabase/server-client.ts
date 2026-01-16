/**
 * Server-side Supabase Client
 * 
 * This file contains server-only Supabase client functions that use next/headers.
 * These functions should only be imported in server components and API routes.
 */

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'
import { getEnvironmentConfig, type AppEnvironment } from './environment-config'

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

// Types for Supabase configuration
interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
  environment: AppEnvironment
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
// IMPORTANT: Uses supabase-js directly (not SSR) to ensure service_role bypasses RLS
// See: https://github.com/orgs/supabase/discussions/30146
export function createAdminClient() {
  const config = validateSupabaseConfig()
  
  if (!config.serviceRoleKey) {
    throw new Error(
      `Missing SUPABASE_SERVICE_ROLE_KEY environment variable for admin operations in ${config.environment} environment. ` +
      'Please add it to your environment configuration file. ' +
      'Get it from: Supabase Dashboard > Settings > API > service_role key'
    )
  }

  // Use createClient from @supabase/supabase-js directly (NOT @supabase/ssr)
  // This ensures the service_role key is used in the Authorization header
  // and is not overridden by any user session from cookies
  return createClient<Database>(config.url, config.serviceRoleKey, {
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
  })
}

// Export types for use in other files with proper Database typing
export type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>
export type SupabaseAdminClient = ReturnType<typeof createAdminClient>

// Re-export Database type for convenience
export type { Database } from './types'
