'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../supabase/client'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { 
  signUp, 
  signIn, 
  signInWithOAuth, 
  signOut, 
  getCurrentSession, 
  getCurrentUser,
  resetPassword,
  updatePassword,
  updateProfile,
  onAuthStateChange,
  refreshSession
} from './auth-helpers'
import type { SignUpData, SignInData, OAuthProvider } from './auth-helpers'

// Re-export enhanced session hooks
export {
  useSession as useEnhancedSession,
  useSessionExpiry,
  useAutoLogout,
  useSessionRefresh,
  useSessionPersistence,
  type UseSessionOptions,
  type SessionHookResult,
} from './session-hooks'

/**
 * React hooks for Supabase authentication
 * 
 * These hooks provide a React-friendly interface for authentication
 * operations and state management.
 */

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

/**
 * Main authentication hook
 * Provides current auth state and loading status
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session, error } = await getCurrentSession()
        
        if (mounted) {
          setState({
            user: session?.user || null,
            session,
            loading: false,
            error,
          })
        }
      } catch (error) {
        if (mounted) {
          setState({
            user: null,
            session: null,
            loading: false,
            error: error as AuthError,
          })
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const subscription = onAuthStateChange((event, session) => {
      if (mounted) {
        setState({
          user: session?.user || null,
          session,
          loading: false,
          error: null,
        })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}

/**
 * Hook for sign up functionality
 */
export function useSignUp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const handleSignUp = async (data: SignUpData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signUp(data)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true, user: result.user, session: result.session }
    } catch (error) {
      const authError = error as AuthError
      setError(authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  return {
    signUp: handleSignUp,
    loading,
    error,
    clearError: () => setError(null),
  }
}

/**
 * Hook for sign in functionality
 */
export function useSignIn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const handleSignIn = async (data: SignInData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signIn(data)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true, user: result.user, session: result.session }
    } catch (error) {
      const authError = error as AuthError
      setError(authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signInWithOAuth(provider)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      // OAuth redirects, so we don't get immediate feedback
      return { success: true }
    } catch (error) {
      const authError = error as AuthError
      setError(authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  return {
    signIn: handleSignIn,
    signInWithOAuth: handleOAuthSignIn,
    loading,
    error,
    clearError: () => setError(null),
  }
}

/**
 * Hook for sign out functionality
 */
export function useSignOut() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const handleSignOut = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await signOut()
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true }
    } catch (error) {
      const authError = error as AuthError
      setError(authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  return {
    signOut: handleSignOut,
    loading,
    error,
    clearError: () => setError(null),
  }
}

/**
 * Hook for password reset functionality
 */
export function usePasswordReset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const handleResetPassword = async (email: string, redirectTo?: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await resetPassword(email, redirectTo)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true }
    } catch (error) {
      const authError = error as AuthError
      setError(authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (password: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await updatePassword(password)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true }
    } catch (error) {
      const authError = error as AuthError
      setError(authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  return {
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
    loading,
    error,
    clearError: () => setError(null),
  }
}

/**
 * Hook for profile management
 */
export function useProfile() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const handleUpdateProfile = async (updates: { name?: string; image?: string }) => {
    setLoading(true)
    setError(null)

    try {
      const result = await updateProfile(updates)
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true }
    } catch (error) {
      const authError = error as AuthError
      setError(authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  return {
    updateProfile: handleUpdateProfile,
    loading,
    error,
    clearError: () => setError(null),
  }
}

/**
 * Hook for session management
 */
export function useSession() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const handleRefreshSession = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await refreshSession()
      
      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      return { success: true, session: result.session }
    } catch (error) {
      const authError = error as AuthError
      setError(authError)
      return { success: false, error: authError }
    } finally {
      setLoading(false)
    }
  }

  return {
    refreshSession: handleRefreshSession,
    loading,
    error,
    clearError: () => setError(null),
  }
}

/**
 * Utility hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth()
  return !loading && !!user
}

/**
 * Utility hook to get user profile data
 */
export function useUserProfile() {
  const { user } = useAuth()
  
  return {
    id: user?.id || null,
    email: user?.email || null,
    name: user?.user_metadata?.name || null,
    image: user?.user_metadata?.avatar_url || null,
    emailVerified: user?.email_confirmed_at ? new Date(user.email_confirmed_at) : null,
  }
}