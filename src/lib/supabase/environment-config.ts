/**
 * Environment Configuration Manager for Supabase Integration
 * Handles multi-environment setup with proper validation and isolation
 */

// Environment types
export type AppEnvironment = 'development' | 'staging' | 'production'

// Environment configuration interface
export interface EnvironmentConfig {
  name: AppEnvironment
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
  }
  database: {
    url: string
  }
  nextAuth: {
    secret: string
    url: string
  }
  features: {
    debugMode: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
  oauth?: {
    googleClientId?: string
    googleClientSecret?: string
  }
  ai?: {
    openRouterApiKey?: string
  }
}

// Environment validation errors
export class EnvironmentConfigError extends Error {
  constructor(
    message: string,
    public environment: AppEnvironment,
    public missingVars: string[] = []
  ) {
    super(message)
    this.name = 'EnvironmentConfigError'
  }
}

// Get current environment
export function getCurrentEnvironment(): AppEnvironment {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV as AppEnvironment
  const nodeEnv = process.env.NODE_ENV

  // Determine environment based on available variables
  if (appEnv && ['development', 'staging', 'production'].includes(appEnv)) {
    return appEnv
  }

  // Fallback to NODE_ENV
  if (nodeEnv === 'development') {
    return 'development'
  }

  // Default to production for safety
  return 'production'
}

// Validate required environment variables
function validateEnvironmentVariables(env: AppEnvironment): string[] {
  const missingVars: string[] = []

  // Required variables for all environments
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ]

  // Service role key is required for staging and production
  if (env !== 'development') {
    requiredVars.push('SUPABASE_SERVICE_ROLE_KEY')
  }

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  return missingVars
}

// Validate Supabase URL format
function validateSupabaseUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return (
      parsedUrl.protocol === 'https:' &&
      parsedUrl.hostname.endsWith('.supabase.co')
    )
  } catch {
    return false
  }
}

// Validate environment-specific constraints
function validateEnvironmentConstraints(config: EnvironmentConfig): string[] {
  const errors: string[] = []

  // Validate Supabase URL format
  if (!validateSupabaseUrl(config.supabase.url)) {
    errors.push(
      `Invalid Supabase URL format for ${config.name} environment. ` +
      'Expected format: https://project-id.supabase.co'
    )
  }

  // Validate NextAuth URL format
  try {
    new URL(config.nextAuth.url)
  } catch {
    errors.push(`Invalid NEXTAUTH_URL format for ${config.name} environment`)
  }

  // Environment-specific validations
  switch (config.name) {
    case 'development':
      // Development can be more lenient
      if (config.nextAuth.url !== 'http://localhost:3000') {
        console.warn(
          'Development NEXTAUTH_URL is not localhost:3000. ' +
          'This might cause authentication issues in local development.'
        )
      }
      break

    case 'staging':
      // Staging should use HTTPS
      if (!config.nextAuth.url.startsWith('https://')) {
        errors.push('Staging environment must use HTTPS for NEXTAUTH_URL')
      }
      // Staging should not use production-like domains
      if (config.nextAuth.url.includes('your-production-domain.com')) {
        errors.push('Staging environment should not use production domain')
      }
      break

    case 'production':
      // Production must use HTTPS
      if (!config.nextAuth.url.startsWith('https://')) {
        errors.push('Production environment must use HTTPS for NEXTAUTH_URL')
      }
      // Production should not have debug mode enabled
      if (config.features.debugMode) {
        errors.push('Production environment should not have debug mode enabled')
      }
      // Production should use error log level
      if (config.features.logLevel !== 'error') {
        console.warn(
          'Production environment should use "error" log level for better performance'
        )
      }
      break
  }

  return errors
}

// Load and validate environment configuration
export function loadEnvironmentConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment()
  
  // Validate required variables
  const missingVars = validateEnvironmentVariables(env)
  if (missingVars.length > 0) {
    throw new EnvironmentConfigError(
      `Missing required environment variables for ${env} environment: ${missingVars.join(', ')}`,
      env,
      missingVars
    )
  }

  // Build configuration object
  const config: EnvironmentConfig = {
    name: env,
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    database: {
      url: process.env.DATABASE_URL || '',
    },
    nextAuth: {
      secret: process.env.NEXTAUTH_SECRET!,
      url: process.env.NEXTAUTH_URL!,
    },
    features: {
      debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
      logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as any) || 'info',
    },
    oauth: {
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    ai: {
      openRouterApiKey: process.env.OPENROUTER_API_KEY,
    },
  }

  // Validate environment-specific constraints
  const constraintErrors = validateEnvironmentConstraints(config)
  if (constraintErrors.length > 0) {
    throw new EnvironmentConfigError(
      `Environment configuration validation failed for ${env}: ${constraintErrors.join('; ')}`,
      env
    )
  }

  return config
}

// Get environment-specific configuration with caching
let cachedConfig: EnvironmentConfig | null = null

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = loadEnvironmentConfig()
  }
  return cachedConfig
}

// Reset cached configuration (useful for testing)
export function resetEnvironmentConfig(): void {
  cachedConfig = null
}

// Check if environment is properly configured
export function isEnvironmentConfigured(): boolean {
  try {
    loadEnvironmentConfig()
    return true
  } catch {
    return false
  }
}

// Get environment configuration status for debugging
export function getEnvironmentStatus(): {
  environment: AppEnvironment
  isConfigured: boolean
  missingVariables: string[]
  errors: string[]
  warnings: string[]
} {
  const env = getCurrentEnvironment()
  const missingVars = validateEnvironmentVariables(env)
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const config = loadEnvironmentConfig()
    const constraintErrors = validateEnvironmentConstraints(config)
    errors.push(...constraintErrors)
  } catch (error) {
    if (error instanceof EnvironmentConfigError) {
      errors.push(error.message)
    } else {
      errors.push('Unknown configuration error')
    }
  }

  return {
    environment: env,
    isConfigured: missingVars.length === 0 && errors.length === 0,
    missingVariables: missingVars,
    errors,
    warnings,
  }
}

// Environment-specific feature flags
export function getFeatureFlags(): {
  enableDebugMode: boolean
  enableDetailedLogging: boolean
  enablePerformanceMonitoring: boolean
  enableErrorReporting: boolean
} {
  const config = getEnvironmentConfig()
  
  return {
    enableDebugMode: config.features.debugMode,
    enableDetailedLogging: config.features.logLevel === 'debug',
    enablePerformanceMonitoring: config.name !== 'development',
    enableErrorReporting: config.name === 'production',
  }
}

// Cross-environment isolation check
export function validateEnvironmentIsolation(): {
  isIsolated: boolean
  issues: string[]
} {
  const config = getEnvironmentConfig()
  const issues: string[] = []

  // Check for potential cross-environment contamination
  const url = config.supabase.url.toLowerCase()
  
  switch (config.name) {
    case 'development':
      if (url.includes('staging') || url.includes('prod')) {
        issues.push('Development environment is using staging/production Supabase URL')
      }
      break
      
    case 'staging':
      if (url.includes('prod') || url.includes('localhost')) {
        issues.push('Staging environment is using production/development Supabase URL')
      }
      break
      
    case 'production':
      if (url.includes('staging') || url.includes('dev') || url.includes('localhost')) {
        issues.push('Production environment is using staging/development Supabase URL')
      }
      break
  }

  // Check NextAuth URL isolation
  const authUrl = config.nextAuth.url.toLowerCase()
  if (config.name === 'production' && authUrl.includes('staging')) {
    issues.push('Production environment is using staging NextAuth URL')
  }

  return {
    isIsolated: issues.length === 0,
    issues,
  }
}