'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '../supabase/client'
import { getSessionManager } from './session-manager'
import type { User, Session, AuthError } from '@supabase/supabase-js'

/**
 * Authentication Context for Supabase Auth
 * 
 * Provides authentication state and methods throughout the React component tree.
 * This context wraps the Supabase auth state and provides a clean interface
 * for components to access authentication information with enhanced session management.
 */

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
  isSessionExpired: boolean
  isRefreshing: boolean
  lastRefresh: Date | null
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  clearSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * Authentication Provider Component
 * 
 * Wraps the application and provides authentication state to all child components.
 * Automatically handles session management, token refresh, and state updates.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const supabase = createClient()
  const sessionManager = getSessionManager({
    enableAutoRefresh: true,
    refreshThreshold: 5, // Refresh 5 minutes before expiry
    enableLocalStorage: true,
  })

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (mounted) {
          setSession(session)
          setUser(session?.user || null)
          setError(error)
          setLoading(false)
          
          // Initialize session manager with current session
          if (session) {
            sessionManager.updateSession(session)
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err as AuthError)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for session manager state changes
    const unsubscribeSessionManager = sessionManager.addListener((sessionState) => {
      if (mounted) {
        setSession(sessionState.session)
        setUser(sessionState.session?.user || null)
        setIsSessionExpired(sessionState.isExpired)
        setIsRefreshing(sessionState.isRefreshing)
        setLastRefresh(sessionState.lastRefresh)
        setError(sessionState.error)
        
        // If session expired, clear user state
        if (sessionState.isExpired) {
          setUser(null)
          setSession(null)
        }
      }
    })

    // Listen for auth changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setSession(session)
          setUser(session?.user || null)
          setError(null)
          setLoading(false)

          // Update session manager
          sessionManager.updateSession(session)

          // Handle specific auth events
          switch (event) {
            case 'SIGNED_IN':
              console.log('User signed in:', session?.user?.email)
              setIsSessionExpired(false)
              break
            case 'SIGNED_OUT':
              console.log('User signed out')
              sessionManager.clearSession()
              setIsSessionExpired(false)
              setIsRefreshing(false)
              setLastRefresh(null)
              break
            case 'TOKEN_REFRESHED':
              console.log('Token refreshed')
              setLastRefresh(new Date())
              setIsSessionExpired(false)
              break
            case 'USER_UPDATED':
              console.log('User updated')
              break
            case 'PASSWORD_RECOVERY':
              console.log('Password recovery initiated')
              break
          }
        }
      }
    )

    return () => {
      mounted = false
      unsubscribeSessionManager()
      subscription.unsubscribe()
    }
  }, [supabase.auth, sessionManager])

  // Sign out function with enhanced cleanup
  const signOut = async () => {
    try {
      setLoading(true)
      
      // Clear session manager first
      sessionManager.clearSession()
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setError(error)
        throw error
      }
      
      // Clear all local state
      setUser(null)
      setSession(null)
      setError(null)
      setIsSessionExpired(false)
      setIsRefreshing(false)
      setLastRefresh(null)
      
      // Clear local storage (Requirements 2.5)
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
        } catch (storageError) {
          console.warn('Failed to clear localStorage:', storageError)
        }
      }
    } catch (err) {
      setError(err as AuthError)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Refresh session function
  const refreshSession = async () => {
    try {
      setLoading(true)
      const refreshedSession = await sessionManager.refreshSession()
      
      if (refreshedSession) {
        setSession(refreshedSession)
        setUser(refreshedSession.user)
        setError(null)
        setIsSessionExpired(false)
        setLastRefresh(new Date())
      } else {
        // Refresh failed, clear session
        setSession(null)
        setUser(null)
        setIsSessionExpired(true)
      }
    } catch (err) {
      setError(err as AuthError)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Clear session function
  const clearSession = () => {
    sessionManager.clearSession()
    setUser(null)
    setSession(null)
    setError(null)
    setIsSessionExpired(false)
    setIsRefreshing(false)
    setLastRefresh(null)
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    isSessionExpired,
    isRefreshing,
    lastRefresh,
    signOut,
    refreshSession,
    clearSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use the authentication context
 * 
 * Must be used within an AuthProvider component.
 * Provides access to current authentication state and methods.
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Higher-order component for protecting routes
 * 
 * Wraps a component and ensures the user is authenticated before rendering.
 * Redirects to login page if user is not authenticated.
 */
export interface WithAuthProps {
  redirectTo?: string
  loadingComponent?: React.ComponentType
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthProps = {}
) {
  const { redirectTo = '/auth/login', loadingComponent: LoadingComponent } = options

  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuthContext()

    // Show loading component while checking authentication
    if (loading) {
      if (LoadingComponent) {
        return <LoadingComponent />
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    // Redirect to login if not authenticated
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo
      }
      return null
    }

    // Render the protected component
    return <Component {...props} />
  }
}

/**
 * Component for protecting routes declaratively
 * 
 * Wraps children and ensures the user is authenticated before rendering.
 * More flexible than the HOC approach.
 */
export interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  loadingComponent?: React.ComponentType
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  redirectTo = '/auth/login',
  loadingComponent: LoadingComponent,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()

  // Show loading component while checking authentication
  if (loading) {
    if (LoadingComponent) {
      return <LoadingComponent />
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show fallback or redirect if not authenticated
  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo
    }
    return null
  }

  // Render children if authenticated
  return <>{children}</>
}