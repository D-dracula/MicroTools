/**
 * API Keys Management Utilities
 * 
 * Provides utility functions for managing API keys including:
 * - Key masking for secure display
 * - Key validation and testing
 * - Environment variable management
 * 
 * Requirements: 10.1, 10.2, 10.5
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Key Validation Result
 * Requirements: 10.5
 */
export interface KeyValidationResult {
  isValid: boolean
  message: string
  details?: Record<string, unknown>
}

// ============================================================================
// Key Masking Functions
// ============================================================================

/**
 * Mask an API key value for display
 * Shows first 4 and last 4 characters, masks the middle
 * 
 * Requirements: 10.1
 * 
 * @param value - The API key value to mask
 * @returns Masked string or null if value is invalid
 * 
 * @example
 * maskApiKey('sk-1234567890abcdef') // 'sk-1**********cdef'
 * maskApiKey('short') // '****'
 * maskApiKey('') // null
 */
export function maskApiKey(value: string | undefined): string | null {
  if (!value || value.length < 12) {
    return value ? '****' : null
  }
  const first = value.substring(0, 4)
  const last = value.substring(value.length - 4)
  const maskLength = Math.min(value.length - 8, 20)
  return `${first}${'*'.repeat(maskLength)}${last}`
}

/**
 * Check if a masked value reveals the original key
 * Used to verify that masking doesn't expose sensitive data
 * 
 * Requirements: 10.1
 * 
 * @param original - Original key value
 * @param masked - Masked key value
 * @returns True if the masked value properly hides the original
 */
export function isMaskedProperly(original: string, masked: string | null): boolean {
  if (!masked) return true
  if (original.length < 12) return masked === '****'
  
  // Check that middle characters are masked
  const middleChars = original.substring(4, original.length - 4)
  return !masked.includes(middleChars)
}

// ============================================================================
// Key Validation Functions
// ============================================================================

/**
 * Test OpenRouter API key validity
 * 
 * Requirements: 10.5
 * 
 * @param apiKey - The OpenRouter API key to test
 * @returns Validation result with status and message
 */
export async function testOpenRouterKey(apiKey: string): Promise<KeyValidationResult> {
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
 * 
 * Requirements: 10.5
 * 
 * @param url - The Supabase URL to test
 * @returns Validation result with status and message
 */
export async function testSupabaseUrl(url: string): Promise<KeyValidationResult> {
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
 * 
 * Requirements: 10.5
 * 
 * @param url - The Supabase URL
 * @param anonKey - The Supabase anon key to test
 * @returns Validation result with status and message
 */
export async function testSupabaseAnonKey(url: string, anonKey: string): Promise<KeyValidationResult> {
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
 * 
 * Requirements: 10.5
 * 
 * @param apiKey - The Exa API key to test
 * @returns Validation result with status and message
 */
export async function testExaKey(apiKey: string): Promise<KeyValidationResult> {
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
 * Validate that a key validation result has the correct structure
 * 
 * @param result - The validation result to check
 * @returns True if the result has valid structure
 */
export function isValidValidationResult(result: KeyValidationResult): boolean {
  return (
    typeof result === 'object' &&
    result !== null &&
    typeof result.isValid === 'boolean' &&
    typeof result.message === 'string' &&
    result.message.length > 0
  )
}
