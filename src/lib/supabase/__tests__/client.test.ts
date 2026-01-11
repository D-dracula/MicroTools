/**
 * @jest-environment node
 */

import { 
  createClient, 
  createServerSupabaseClient, 
  createAdminClient,
  isSupabaseConfigured,
  getSupabaseConfigStatus
} from '../client'

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
}

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: jest.fn(),
  }),
}))

describe('Supabase Client Configuration', () => {
  beforeEach(() => {
    // Set up environment variables
    Object.entries(mockEnv).forEach(([key, value]) => {
      process.env[key] = value
    })
  })

  afterEach(() => {
    // Clean up environment variables
    Object.keys(mockEnv).forEach(key => {
      delete process.env[key]
    })
  })

  describe('Environment Validation', () => {
    it('should create browser client with valid environment variables', () => {
      expect(() => createClient()).not.toThrow()
    })

    it('should throw detailed error when SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      expect(() => createClient()).toThrow('Please add it to your .env file')
    })

    it('should throw detailed error when SUPABASE_ANON_KEY is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
      expect(() => createClient()).toThrow('Get it from: Supabase Dashboard')
    })

    it('should throw detailed error when SERVICE_ROLE_KEY is missing for admin client', () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      expect(() => createAdminClient()).toThrow('Missing SUPABASE_SERVICE_ROLE_KEY environment variable for admin operations')
      expect(() => createAdminClient()).toThrow('service_role key')
    })

    it('should throw error for invalid URL format', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url'
      expect(() => createClient()).toThrow('Invalid NEXT_PUBLIC_SUPABASE_URL format')
    })
  })

  describe('Client Creation', () => {
    it('should create browser client successfully', () => {
      const client = createClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should create browser client with custom options', () => {
      const client = createClient({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      })
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should create server client successfully', async () => {
      const client = await createServerSupabaseClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should create server client with custom options', async () => {
      const client = await createServerSupabaseClient({
        global: {
          headers: { 'x-custom-header': 'test' }
        }
      })
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should create admin client successfully', () => {
      const client = createAdminClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should create admin client with custom options', () => {
      const client = createAdminClient({
        auth: {
          autoRefreshToken: false,
        }
      })
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })
  })

  describe('Configuration Utilities', () => {
    it('should return true when Supabase is properly configured', () => {
      expect(isSupabaseConfigured()).toBe(true)
    })

    it('should return false when Supabase is not configured', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      expect(isSupabaseConfigured()).toBe(false)
    })

    it('should return detailed configuration status', () => {
      const status = getSupabaseConfigStatus()
      expect(status).toEqual({
        isConfigured: true,
        hasUrl: true,
        hasAnonKey: true,
        hasServiceRoleKey: true,
        errors: [],
      })
    })

    it('should return configuration status with errors', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const status = getSupabaseConfigStatus()
      expect(status.isConfigured).toBe(false)
      expect(status.hasUrl).toBe(false)
      expect(status.hasAnonKey).toBe(false)
      expect(status.errors).toContain('Missing NEXT_PUBLIC_SUPABASE_URL')
      expect(status.errors).toContain('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
    })

    it('should detect invalid URL format in configuration status', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url'
      
      const status = getSupabaseConfigStatus()
      expect(status.isConfigured).toBe(false)
      expect(status.errors).toContain('Invalid NEXT_PUBLIC_SUPABASE_URL format')
    })
  })

  describe('Environment-Specific Configuration', () => {
    it('should handle development environment', () => {
      const originalEnv = process.env.NODE_ENV
      // @ts-ignore - Temporarily override for testing
      process.env.NODE_ENV = 'development'
      const client = createClient()
      expect(client).toBeDefined()
      process.env.NODE_ENV = originalEnv
    })

    it('should handle production environment', () => {
      const originalEnv = process.env.NODE_ENV
      // @ts-ignore - Temporarily override for testing
      process.env.NODE_ENV = 'production'
      const client = createClient()
      expect(client).toBeDefined()
      process.env.NODE_ENV = originalEnv
    })

    it('should handle test environment', () => {
      const originalEnv = process.env.NODE_ENV
      // @ts-ignore - Temporarily override for testing
      process.env.NODE_ENV = 'test'
      const client = createClient()
      expect(client).toBeDefined()
      process.env.NODE_ENV = originalEnv
    })
  })
})