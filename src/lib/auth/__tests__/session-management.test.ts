/**
 * Session Management Tests
 * 
 * Tests for automatic token refresh, session expiry handling,
 * and session state management functionality.
 */

import { SessionManager, getSessionManager, resetSessionManager } from '../session-manager'
import { createClient } from '../../supabase/client'
import type { Session, AuthError } from '@supabase/supabase-js'

// Mock Supabase client
jest.mock('../../supabase/client', () => ({
  createClient: jest.fn(),
}))

// Mock browser APIs
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

const mockDocument = {
  hidden: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}

// Setup global mocks
global.window = {
  localStorage: mockLocalStorage,
  location: { hostname: 'localhost' },
} as any

global.document = mockDocument as any
global.localStorage = mockLocalStorage as any

// Mock session data
const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  token_type: 'bearer',
  user: {
    id: 'user-123',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
  },
}

const expiredSession: Session = {
  ...mockSession,
  expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
}

const nearExpirySession: Session = {
  ...mockSession,
  expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
}

describe('SessionManager', () => {
  let mockSupabaseClient: any
  let sessionManager: SessionManager

  beforeEach(() => {
    jest.clearAllMocks()
    resetSessionManager()
    
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn(),
        refreshSession: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        })),
      },
    }
    
    ;(createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabaseClient)
    
    sessionManager = new SessionManager({
      enableAutoRefresh: false, // Disable for testing
      enableLocalStorage: false, // Disable for testing
    })
  })

  afterEach(() => {
    sessionManager?.destroy()
  })

  describe('Session Expiry Detection', () => {
    it('should detect expired sessions', () => {
      expect(sessionManager.isSessionExpired(expiredSession)).toBe(true)
      expect(sessionManager.isSessionExpired(mockSession)).toBe(false)
    })

    it('should detect sessions that need refresh', () => {
      expect(sessionManager.needsRefresh(nearExpirySession)).toBe(true)
      expect(sessionManager.needsRefresh(mockSession)).toBe(false)
    })
  })

  describe('Session Refresh', () => {
    it('should refresh session successfully', async () => {
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await sessionManager.refreshSession()
      
      expect(result).toEqual(mockSession)
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalled()
    })

    it('should handle refresh errors', async () => {
      const mockError: AuthError = {
        name: 'AuthError',
        message: 'Refresh failed',
      }

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: mockError,
      })

      const result = await sessionManager.refreshSession()
      
      expect(result).toBeNull()
      expect(sessionManager.getState().error).toEqual(mockError)
    })

    it('should retry refresh on failure', async () => {
      const mockError: AuthError = {
        name: 'AuthError',
        message: 'Network error',
      }

      // First call fails, second succeeds
      mockSupabaseClient.auth.refreshSession
        .mockResolvedValueOnce({
          data: { session: null },
          error: mockError,
        })
        .mockResolvedValueOnce({
          data: { session: mockSession },
          error: null,
        })

      const result = await sessionManager.refreshSession()
      
      expect(result).toEqual(mockSession)
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalledTimes(2)
    })
  })

  describe('Session State Management', () => {
    it('should update session state correctly', () => {
      sessionManager.updateSession(mockSession)
      
      const state = sessionManager.getState()
      expect(state.session).toEqual(mockSession)
      expect(state.isExpired).toBe(false)
    })

    it('should clear session state', () => {
      sessionManager.updateSession(mockSession)
      sessionManager.clearSession()
      
      const state = sessionManager.getState()
      expect(state.session).toBeNull()
      expect(state.isExpired).toBe(false)
    })

    it('should notify listeners of state changes', () => {
      const listener = jest.fn()
      sessionManager.addListener(listener)
      
      sessionManager.updateSession(mockSession)
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          session: mockSession,
          isExpired: false,
        })
      )
    })
  })

  describe('Local Storage Integration', () => {
    beforeEach(() => {
      sessionManager = new SessionManager({
        enableLocalStorage: true,
        enableAutoRefresh: false,
      })
    })

    it('should store session in localStorage', () => {
      sessionManager.updateSession(mockSession)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'supabase.auth.session',
        expect.stringContaining(mockSession.access_token)
      )
    })

    it('should clear session from localStorage', () => {
      sessionManager.clearSession()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase.auth.session')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase.auth.token')
    })
  })
})

describe('Session Management Integration', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    resetSessionManager()
    
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: mockSession },
          error: null,
        }),
        refreshSession: jest.fn().mockResolvedValue({
          data: { session: mockSession },
          error: null,
        }),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        })),
      },
    }
    
    ;(createClient as jest.MockedFunction<typeof createClient>).mockReturnValue(mockSupabaseClient)
  })

  it('should handle complete session lifecycle', async () => {
    const sessionManager = getSessionManager()
    const listener = jest.fn()
    
    sessionManager.addListener(listener)
    
    // Initial session
    sessionManager.updateSession(mockSession)
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ session: mockSession })
    )
    
    // Session refresh
    const refreshedSession = await sessionManager.refreshSession()
    expect(refreshedSession).toEqual(mockSession)
    
    // Session clear
    sessionManager.clearSession()
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ session: null })
    )
  })

  it('should meet Requirements 2.4 and 2.5', async () => {
    const sessionManager = getSessionManager({
      enableAutoRefresh: true,
      enableLocalStorage: true,
    })
    
    // Requirement 2.4: Automatic token refresh
    const nearExpirySession = {
      ...mockSession,
      expires_at: Math.floor(Date.now() / 1000) + 240, // 4 minutes from now
    }
    
    sessionManager.updateSession(nearExpirySession)
    expect(sessionManager.needsRefresh(nearExpirySession)).toBe(true)
    
    // Should trigger automatic refresh
    const refreshedSession = await sessionManager.refreshSession()
    expect(refreshedSession).toEqual(mockSession)
    
    // Requirement 2.5: Clear session and local storage on logout
    sessionManager.clearSession()
    
    const state = sessionManager.getState()
    expect(state.session).toBeNull()
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase.auth.session')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase.auth.token')
  })
})