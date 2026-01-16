/**
 * Admin API Keys Management Endpoint
 * Provides secure management of API keys and environment variables
 * Requirements: 10.1, 10.2, 10.3, 10.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  withAdminMiddleware, 
  type AdminContext 
} from '@/lib/admin/admin-middleware'

// Logger
const logger = {
  debug: (msg: string, ctx?: unknown) => console.debug(msg, ctx),
  info: (msg: string, ctx?: unknown) => console.info(msg, ctx),
  warn: (msg: string, ctx?: unknown, err?: unknown) => console.warn(msg, ctx, err),
  error: (msg: string, ctx?: unknown, err?: unknown) => console.error(msg, ctx, err),
}

// ============================================================================
// Types
// ============================================================================

/**
 * API Key Configuration
 * Requirements: 10.1, 10.4
 */
export interface ApiKeyConfig {
  id: string
  name: string
  description: string
  category: 'ai' | 'database' | 'auth' | 'other'
  envVar: string
  isSet: boolean
  maskedValue: string | null
  isValid: boolean | null
  lastUpdated: string | null
  testable: boolean
  required: boolean
}

/**
 * Key Validation Result
 * Requirements: 10.5
 */
export interface KeyValidationResult {
  isValid: boolean
  message: string
  details?: Record<string, unknown>
}

/**
 * API Keys Response
 */
interface KeysResponse {
  success: boolean
  data: {
    keys: ApiKeyConfig[]
    summary: {
      total: number
      configured: number
      missing: number
      invalid: number
    }
  }
}

// ============================================================================
// API Key Definitions
// ============================================================================

/**
 * Supported API Keys Configuration
 * Requirements: 10.4
 */
const API_KEY_DEFINITIONS: Array<{
  id: string
  name: string
  description: string
  category: 'ai' | 'database' | 'auth' | 'other'
  envVar: string
  testable: boolean
  required: boolean
}> = [
  {
    id: 'openrouter',
    name: 'OpenRouter API Key',
    description: 'API key for OpenRouter AI services (used for AI-powered tools)',
    category: 'ai',
    envVar: 'OPENROUTER_API_KEY',
    testable: true,
    required: false,
  },
  {
    id: 'exa',
    name: 'Exa API Key',
    description: 'API key for Exa AI search services (used for web search and content fetching)',
    category: 'ai',
    envVar: 'EXA_API_KEY',
    testable: true,
    required: false,
  },
  {
    id: 'supabase_url',
    name: 'Supabase URL',
    description: 'Supabase project URL for database and auth services',
    category: 'database',
    envVar: 'NEXT_PUBLIC_SUPABASE_URL',
    testable: true,
    required: true,
  },
  {
    id: 'supabase_anon',
    name: 'Supabase Anon Key',
    description: 'Supabase anonymous/public key for client-side operations',
    category: 'database',
    envVar: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    testable: true,
    required: true,
  },
  {
    id: 'supabase_service',
    name: 'Supabase Service Role Key',
    description: 'Supabase service role key for server-side admin operations (keep secret)',
    category: 'database',
    envVar: 'SUPABASE_SERVICE_ROLE_KEY',
    testable: false,
    required: true,
  },
  {
    id: 'nextauth_secret',
    name: 'NextAuth Secret',
    description: 'Secret key for NextAuth.js session encryption',
    category: 'auth',
    envVar: 'NEXTAUTH_SECRET',
    testable: false,
    required: true,
  },
  {
    id: 'nextauth_url',
    name: 'NextAuth URL',
    description: 'Base URL for NextAuth.js callbacks',
    category: 'auth',
    envVar: 'NEXTAUTH_URL',
    testable: false,
    required: true,
  },
  {
    id: 'admin_emails',
    name: 'Admin Emails',
    description: 'Comma-separated list of admin email addresses',
    category: 'auth',
    envVar: 'NEXT_PUBLIC_ADMIN_EMAILS',
    testable: false,
    required: true,
  },
  {
    id: 'google_client_id',
    name: 'Google Client ID',
    description: 'Google OAuth client ID for social login',
    category: 'auth',
    envVar: 'GOOGLE_CLIENT_ID',
    testable: false,
    required: false,
  },
  {
    id: 'google_client_secret',
    name: 'Google Client Secret',
    description: 'Google OAuth client secret for social login',
    category: 'auth',
    envVar: 'GOOGLE_CLIENT_SECRET',
    testable: false,
    required: false,
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Mask an API key value for display
 * Shows first 4 and last 4 characters
 * Requirements: 10.1
 */
function maskApiKey(value: string | undefined): string | null {
  if (!value || value.length < 12) {
    return value ? '****' : null
  }
  const first = value.substring(0, 4)
  const last = value.substring(value.length - 4)
  return `${first}${'*'.repeat(Math.min(value.length - 8, 20))}${last}`
}

/**
 * Check if an environment variable is set
 */
function isEnvVarSet(envVar: string): boolean {
  const value = process.env[envVar]
  return !!value && value.trim().length > 0
}

/**
 * Get the value of an environment variable
 */
function getEnvVarValue(envVar: string): string | undefined {
  return process.env[envVar]
}

/**
 * Test OpenRouter API key validity
 * Requirements: 10.5
 */
async function testOpenRouterKey(apiKey: string): Promise<KeyValidationResult> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (response.ok) {
      const data = await response.json()
      return {
        isValid: true,
        message: 'API key is valid',
        details: {
          modelsAvailable: data.data?.length || 0,
        },
      }
    }

    if (response.status === 401) {
      return {
        isValid: false,
        message: 'Invalid API key - authentication failed',
      }
    }

    return {
      isValid: false,
      message: `API returned status ${response.status}`,
    }
  } catch (error) {
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

/**
 * Test Supabase URL validity
 * Requirements: 10.5
 */
async function testSupabaseUrl(url: string): Promise<KeyValidationResult> {
  try {
    // Test if the URL is reachable
    const healthUrl = `${url}/rest/v1/`
    const response = await fetch(healthUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    })

    // Supabase returns 400 without proper auth, but that means URL is valid
    if (response.ok || response.status === 400 || response.status === 401) {
      return {
        isValid: true,
        message: 'Supabase URL is reachable',
      }
    }

    return {
      isValid: false,
      message: `Supabase returned status ${response.status}`,
    }
  } catch (error) {
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

/**
 * Test Supabase Anon Key validity
 * Requirements: 10.5
 */
async function testSupabaseAnonKey(url: string, anonKey: string): Promise<KeyValidationResult> {
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      signal: AbortSignal.timeout(10000),
    })

    // 200 or 404 means the key is valid (404 = no tables accessible, which is fine)
    if (response.ok || response.status === 404) {
      return {
        isValid: true,
        message: 'Supabase anon key is valid',
      }
    }

    if (response.status === 401) {
      return {
        isValid: false,
        message: 'Invalid anon key - authentication failed',
      }
    }

    return {
      isValid: false,
      message: `Supabase returned status ${response.status}`,
    }
  } catch (error) {
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

/**
 * Test Exa API key validity
 * Requirements: 10.5
 */
async function testExaKey(apiKey: string): Promise<KeyValidationResult> {
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'test',
        numResults: 1,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (response.ok) {
      return {
        isValid: true,
        message: 'Exa API key is valid',
      }
    }

    if (response.status === 401 || response.status === 403) {
      return {
        isValid: false,
        message: 'Invalid API key - authentication failed',
      }
    }

    return {
      isValid: false,
      message: `Exa API returned status ${response.status}`,
    }
  } catch (error) {
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

/**
 * Get all API keys with their status
 * Requirements: 10.1
 */
function getAllApiKeys(): ApiKeyConfig[] {
  return API_KEY_DEFINITIONS.map((def) => {
    const value = getEnvVarValue(def.envVar)
    const isSet = isEnvVarSet(def.envVar)

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      category: def.category,
      envVar: def.envVar,
      isSet,
      maskedValue: maskApiKey(value),
      isValid: null, // Will be set after testing
      lastUpdated: null, // Environment variables don't have timestamps
      testable: def.testable,
      required: def.required,
    }
  })
}

// ============================================================================
// GET Handler - List all API keys
// ============================================================================

/**
 * GET /api/admin/keys
 * Get list of all API keys with masked values
 * Requirements: 10.1
 */
async function getKeysHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, requestId } = context

  logger.info('API keys list requested', { userId })

  try {
    const keys = getAllApiKeys()

    // Calculate summary
    const summary = {
      total: keys.length,
      configured: keys.filter((k) => k.isSet).length,
      missing: keys.filter((k) => !k.isSet && k.required).length,
      invalid: 0, // Will be updated after testing
    }

    const response: KeysResponse = {
      success: true,
      data: {
        keys,
        summary,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Failed to get API keys', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

// ============================================================================
// POST Handler - Test API key validity
// ============================================================================

/**
 * POST /api/admin/keys
 * Test an API key's validity
 * Requirements: 10.5
 */
async function testKeyHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, requestId } = context

  try {
    const body = await request.json()
    const { keyId, action } = body

    if (!keyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Key ID is required',
          code: 'VALIDATION_ERROR',
          retryable: false,
          requestId,
        },
        { status: 400 }
      )
    }

    if (action !== 'test') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Supported actions: test',
          code: 'VALIDATION_ERROR',
          retryable: false,
          requestId,
        },
        { status: 400 }
      )
    }

    // Find the key definition
    const keyDef = API_KEY_DEFINITIONS.find((k) => k.id === keyId)
    if (!keyDef) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unknown key ID',
          code: 'NOT_FOUND',
          retryable: false,
          requestId,
        },
        { status: 404 }
      )
    }

    if (!keyDef.testable) {
      return NextResponse.json(
        {
          success: false,
          error: 'This key cannot be tested',
          code: 'VALIDATION_ERROR',
          retryable: false,
          requestId,
        },
        { status: 400 }
      )
    }

    const value = getEnvVarValue(keyDef.envVar)
    if (!value) {
      return NextResponse.json({
        success: true,
        data: {
          keyId,
          result: {
            isValid: false,
            message: 'Key is not configured',
          },
        },
        requestId,
      })
    }

    logger.info('Testing API key', { userId, keyId })

    let result: KeyValidationResult

    switch (keyId) {
      case 'openrouter':
        result = await testOpenRouterKey(value)
        break

      case 'exa':
        result = await testExaKey(value)
        break

      case 'supabase_url':
        result = await testSupabaseUrl(value)
        break

      case 'supabase_anon': {
        const supabaseUrl = getEnvVarValue('NEXT_PUBLIC_SUPABASE_URL')
        if (!supabaseUrl) {
          result = {
            isValid: false,
            message: 'Supabase URL is not configured',
          }
        } else {
          result = await testSupabaseAnonKey(supabaseUrl, value)
        }
        break
      }

      default:
        result = {
          isValid: false,
          message: 'Test not implemented for this key',
        }
    }

    logger.info('API key test completed', {
      userId,
      keyId,
      isValid: result.isValid,
    })

    return NextResponse.json({
      success: true,
      data: {
        keyId,
        result,
      },
      requestId,
    })
  } catch (error) {
    logger.error('Failed to test API key', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

// ============================================================================
// Export Handlers with Admin Middleware
// Requirements: 11.1, 11.2, 11.3, 11.4
// ============================================================================

export const GET = withAdminMiddleware(getKeysHandler, {
  endpoint: '/api/admin/keys',
  action: 'view_keys',
  rateLimit: true,
  logRequests: true,
})

export const POST = withAdminMiddleware(testKeyHandler, {
  endpoint: '/api/admin/keys',
  action: 'test_key',
  rateLimit: true,
  logRequests: true,
})
