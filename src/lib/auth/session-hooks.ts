'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '../supabase/client'
import { getSessionManager, type SessionState, type SessionManagerConfig } from './session-manager'
import type { Session, AuthError } from '@supabase/supabase-js'

/**
 * Enhanced session management hooks for Supabase Auth
 * 
 * These hooks provide automatic token refresh, session expiry handling,
 * and comprehensive session state management.
 */

export interface UseSessionOptions {
  enableAutoRefresh?: boolean
  refreshThreshold?: number // Minutes before expiry to refresh
  onSessionExpired?: () => void
  onSessionRefreshed?: (session: Session) => void
  onRefreshError?: (error: AuthError) => void
}

export interface SessionHookResult {
  session: Session | null
  isLoading: boolean
  isExpired: boolean
  isRefreshing: boolean
  lastRefresh: Date | null
  error: AuthError | null
  refreshSession: () => Promise<Session | null>
  clearSession: () => void
}

/**
 * Enhanced session hook with automatic refresh and expiry handling
 */
export function useSession(options: UseSessionOptions = {}): SessionHookResult {
  const {
    enableAutoRefresh = true,
    refreshThreshold = 5,
    onSessionExpired,
    onSessionRefreshed,
    onRefreshError,
  } = options

  const [state, setState] = useState<SessionState>({
    session: null,
    isExpired: false,
    isRefreshing: false,
    lastRefresh: null,
    error: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  
  const sessionManager = useRef(getSessionManager({
    enableAutoRefresh,
    refreshThreshold,
  }))
  const callbacksRef = useRef({ onSessionExpired, onSessionRefreshed, onRefreshError })
  
  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onSessionExpired, onSessionRefreshed, onRefreshError }
  }, [onSessionExpired, onSessionRefreshed, onRefreshError])

  // Initialize session and listen for changes
  useEffect(() => {
    const manager = sessionManager.current
    
    // Get initial state
    const initialState = manager.getState()
    setState(initialState)
    setIsLoading(false)

    // Listen for state changes
    const unsubscribe = manager.addListener((newState) => {
      setState(prevState => {
        // Call callbacks when state changes
        if (newState.isExpired && !prevState.isExpired && callbacksRef.current.onSessionExpired) {
          callbacksRef.current.onSessionExpired()
        }
        
        if (newState.session && newState.lastRefresh && 
            newState.lastRefresh !== prevState.lastRefresh && 
            callbacksRef.current.onSessionRefreshed) {
          callbacksRef.current.onSessionRefreshed(newState.session)
        }
        
        if (newState.error && newState.error !== prevState.error && 
            callbacksRef.current.onRefreshError) {
          callbacksRef.current.onRefreshError(newState.error)
        }

        return newState
      })
    })

    // Listen for auth state changes from Supabase
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        manager.updateSession(session)
        
        if (event === 'SIGNED_OUT') {
          manager.clearSession()
        }
      }
    )

    return () => {
      unsubscribe()
      subscription.unsubscribe()
    }
  }, [])

  const refreshSession = useCallback(async (): Promise<Session | null> => {
    return sessionManager.current.refreshSession()
  }, [])

  const clearSession = useCallback((): void => {
    sessionManager.current.clearSession()
  }, [])

  return {
    session: state.session,
    isLoading,
    isExpired: state.isExpired,
    isRefreshing: state.isRefreshing,
    lastRefresh: state.lastRefresh,
    error: state.error,
    refreshSession,
    clearSession,
  }
}

/**
 * Hook for session expiry detection and handling
 */
export function useSessionExpiry(options: {
  onExpired?: () => void
  onNearExpiry?: (minutesLeft: number) => void
  warningThreshold?: number // Minutes before expiry to show warning
} = {}) {
  const { onExpired, onNearExpiry, warningThreshold = 10 } = options
  const { session, isExpired } = useSession()
  const [minutesUntilExpiry, setMinutesUntilExpiry] = useState<number | null>(null)
  const [isNearExpiry, setIsNearExpiry] = useState(false)
  
  const callbacksRef = useRef({ onExpired, onNearExpiry })
  
  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = { onExpired, onNearExpiry }
  }, [onExpired, onNearExpiry])

  useEffect(() => {
    if (!session?.expires_at) {
      setMinutesUntilExpiry(null)
      setIsNearExpiry(false)
      return
    }

    const updateExpiryStatus = () => {
      const expiryTime = session.expires_at! * 1000
      const now = Date.now()
      const minutesLeft = Math.max(0, Math.floor((expiryTime - now) / (1000 * 60)))
      
      setMinutesUntilExpiry(minutesLeft)
      
      const nearExpiry = minutesLeft <= warningThreshold && minutesLeft > 0
      setIsNearExpiry(nearExpiry)
      
      if (nearExpiry && callbacksRef.current.onNearExpiry) {
        callbacksRef.current.onNearExpiry(minutesLeft)
      }
    }

    // Update immediately
    updateExpiryStatus()

    // Update every minute
    const interval = setInterval(updateExpiryStatus, 60000)

    return () => clearInterval(interval)
  }, [session?.expires_at, warningThreshold])

  // Handle expiry
  useEffect(() => {
    if (isExpired && callbacksRef.current.onExpired) {
      callbacksRef.current.onExpired()
    }
  }, [isExpired])

  return {
    minutesUntilExpiry,
    isNearExpiry,
    isExpired,
  }
}

/**
 * Hook for automatic logout on session expiry
 */
export function useAutoLogout(options: {
  enabled?: boolean
  redirectTo?: string
  showWarning?: boolean
  warningThreshold?: number
} = {}) {
  const {
    enabled = true,
    redirectTo = '/auth/login',
    showWarning = true,
    warningThreshold = 5,
  } = options

  const [showExpiryWarning, setShowExpiryWarning] = useState(false)

  const handleExpired = useCallback(() => {
    if (!enabled) return

    // Clear any stored session data
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('supabase.auth.session')
        localStorage.removeItem('supabase.auth.token')
        // Clear all supabase auth tokens
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.includes('-auth-token')) {
            localStorage.removeItem(key)
          }
        })
      } catch (error) {
        console.warn('Failed to clear localStorage:', error)
      }

      // Redirect to login
      window.location.href = redirectTo
    }
  }, [enabled, redirectTo])

  const handleNearExpiry = useCallback((minutesLeft: number) => {
    if (!enabled || !showWarning) return

    if (minutesLeft <= warningThreshold) {
      setShowExpiryWarning(true)
    }
  }, [enabled, showWarning, warningThreshold])

  useSessionExpiry({
    onExpired: handleExpired,
    onNearExpiry: handleNearExpiry,
    warningThreshold,
  })

  const dismissWarning = useCallback(() => {
    setShowExpiryWarning(false)
  }, [])

  return {
    showExpiryWarning,
    dismissWarning,
  }
}

/**
 * Hook for session refresh control
 */
export function useSessionRefresh() {
  const { refreshSession, isRefreshing, error } = useSession()
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<Date | null>(null)

  const handleRefresh = useCallback(async () => {
    setLastRefreshAttempt(new Date())
    return refreshSession()
  }, [refreshSession])

  return {
    refreshSession: handleRefresh,
    isRefreshing,
    error,
    lastRefreshAttempt,
  }
}

/**
 * Hook for session persistence control
 */
export function useSessionPersistence(options: {
  enablePersistence?: boolean
} = {}) {
  const { enablePersistence = true } = options
  const [isPersistent, setIsPersistent] = useState(enablePersistence)

  const togglePersistence = useCallback(() => {
    const newValue = !isPersistent
    setIsPersistent(newValue)
    
    if (!newValue && typeof window !== 'undefined') {
      // Clear stored session if persistence is disabled
      try {
        localStorage.removeItem('supabase.auth.session')
      } catch (error) {
        console.warn('Failed to clear stored session:', error)
      }
    }
  }, [isPersistent])

  return {
    isPersistent,
    togglePersistence,
  }
}