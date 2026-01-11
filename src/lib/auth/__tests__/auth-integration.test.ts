/**
 * Authentication Integration Tests
 * 
 * Tests the integration between Supabase Auth and NextAuth.js
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
    refreshSession: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    admin: {
      createUser: jest.fn(),
      getUserById: jest.fn(),
      listUsers: jest.fn(),
      updateUserById: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })),
    select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn() })) })),
    update: jest.fn(() => ({ eq: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })) })),
    delete: jest.fn(() => ({ eq: jest.fn() })),
  })),
}

// Mock the Supabase client creation
jest.mock('../../supabase/client', () => ({
  createClient: () => mockSupabaseClient,
  createServerSupabaseClient: () => Promise.resolve(mockSupabaseClient),
  createAdminClient: () => mockSupabaseClient,
  isSupabaseConfigured: () => true,
}))

describe('Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Supabase Adapter', () => {
    it('should be importable without errors', async () => {
      const { SupabaseAdapter } = await import('../supabase-adapter')
      expect(SupabaseAdapter).toBeDefined()
      expect(typeof SupabaseAdapter).toBe('function')
    })

    it('should create adapter with required methods', async () => {
      const { SupabaseAdapter } = await import('../supabase-adapter')
      const adapter = SupabaseAdapter()
      
      expect(adapter).toHaveProperty('createUser')
      expect(adapter).toHaveProperty('getUser')
      expect(adapter).toHaveProperty('getUserByEmail')
      expect(adapter).toHaveProperty('getUserByAccount')
      expect(adapter).toHaveProperty('updateUser')
      expect(adapter).toHaveProperty('deleteUser')
      expect(adapter).toHaveProperty('linkAccount')
      expect(adapter).toHaveProperty('unlinkAccount')
      expect(adapter).toHaveProperty('createSession')
      expect(adapter).toHaveProperty('getSessionAndUser')
      expect(adapter).toHaveProperty('updateSession')
      expect(adapter).toHaveProperty('deleteSession')
      expect(adapter).toHaveProperty('createVerificationToken')
      expect(adapter).toHaveProperty('useVerificationToken')
    })
  })

  describe('Auth Helpers', () => {
    it('should be importable without errors', async () => {
      const authHelpers = await import('../auth-helpers')
      
      expect(authHelpers.signUp).toBeDefined()
      expect(authHelpers.signIn).toBeDefined()
      expect(authHelpers.signInWithOAuth).toBeDefined()
      expect(authHelpers.signOut).toBeDefined()
      expect(authHelpers.getCurrentSession).toBeDefined()
      expect(authHelpers.getCurrentUser).toBeDefined()
      expect(authHelpers.resetPassword).toBeDefined()
      expect(authHelpers.updatePassword).toBeDefined()
      expect(authHelpers.updateProfile).toBeDefined()
      expect(authHelpers.onAuthStateChange).toBeDefined()
      expect(authHelpers.refreshSession).toBeDefined()
    })

    it('should handle sign up correctly', async () => {
      const { signUp } = await import('../auth-helpers')
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString(),
          },
          session: null,
        },
        error: null,
      })

      const result = await signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      })

      expect(result.error).toBeNull()
      expect(result.user).toBeDefined()
      expect(result.user?.email).toBe('test@example.com')
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: undefined,
          data: {
            name: 'Test User',
          },
        },
      })
    })

    it('should handle sign in correctly', async () => {
      const { signIn } = await import('../auth-helpers')
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
          session: {
            access_token: 'test-token',
            refresh_token: 'test-refresh-token',
          },
        },
        error: null,
      })

      const result = await signIn({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.error).toBeNull()
      expect(result.user).toBeDefined()
      expect(result.session).toBeDefined()
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should handle sign out correctly', async () => {
      const { signOut } = await import('../auth-helpers')
      
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      })

      const result = await signOut()

      expect(result.error).toBeNull()
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('NextAuth Configuration', () => {
    it('should be importable without errors', async () => {
      const { authOptions } = await import('../../auth')
      expect(authOptions).toBeDefined()
      expect(authOptions.providers).toBeDefined()
      expect(authOptions.callbacks).toBeDefined()
    })

    it('should include Supabase adapter when configured', async () => {
      const { authOptions } = await import('../../auth')
      expect(authOptions.adapter).toBeDefined()
    })

    it('should include credentials provider when configured', async () => {
      const { authOptions } = await import('../../auth')
      expect(authOptions.providers).toHaveLength(1) // Only credentials provider in test
      expect(authOptions.providers[0]).toHaveProperty('name', 'Credentials')
    })
  })
})

describe('Type Exports', () => {
  it('should export all required types', async () => {
    const authModule = await import('../index')
    
    // Check that main exports exist
    expect(authModule.authOptions).toBeDefined()
    expect(authModule.SupabaseAdapter).toBeDefined()
    expect(authModule.signUp).toBeDefined()
    expect(authModule.signIn).toBeDefined()
    expect(authModule.signOut).toBeDefined()
    expect(authModule.useAuth).toBeDefined()
    expect(authModule.AuthProvider).toBeDefined()
  })
})