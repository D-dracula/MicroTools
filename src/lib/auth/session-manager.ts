import { createClient } from '../supabase/client'
import type { Session, AuthError } from '@supabase/supabase-js'

/**
 * Session Manager for Supabase Auth
 * 
 * Handles automatic token refresh, session expiry detection,
 * and session state management with local storage integration.
 */

export interface SessionState {
  session: Session | null
  isExpired: boolean
  isRefreshing: boolean
  lastRefresh: Date | null
  error: AuthError | null
}

export interface SessionManagerConfig {
  refreshThreshold: number // Minutes before expiry to refresh
  maxRetries: number
  retryDelay: number // Milliseconds
  enableAutoRefresh: boolean
  enableLocalStorage: boolean
}

const DEFAULT_CONFIG: SessionManagerConfig = {
  refreshThreshold: 5, // Refresh 5 minutes before expiry
  maxRetries: 3,
  retryDelay: 1000,
  enableAutoRefresh: true,
  enableLocalStorage: true,
}

export class SessionManager {
  private config: SessionManagerConfig
  private refreshTimer: NodeJS.Timeout | null = null
  private refreshPromise: Promise<Session | null> | null = null
  private retryCount = 0
  private listeners: Set<(state: SessionState) => void> = new Set()
  private currentState: SessionState = {
    session: null,
    isExpired: false,
    isRefreshing: false,
    lastRefresh: null,
    error: null,
  }

  constructor(config: Partial<SessionManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    if (typeof window !== 'undefined') {
      this.initializeSession()
      this.setupVisibilityListener()
    }
  }

  /**
   * Initialize session from storage and start monitoring
   */
  private async initializeSession(): Promise<void> {
    try {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        this.updateState({ error })
        return
      }

      if (session) {
        this.updateState({ 
          session, 
          isExpired: this.isSessionExpired(session),
          error: null 
        })
        
        if (this.config.enableAutoRefresh) {
          this.scheduleRefresh(session)
        }
      } else {
        // Try to restore from local storage if enabled
        if (this.config.enableLocalStorage) {
          const storedSession = this.getStoredSession()
          if (storedSession && !this.isSessionExpired(storedSession)) {
            this.updateState({ session: storedSession, error: null })
            if (this.config.enableAutoRefresh) {
              this.scheduleRefresh(storedSession)
            }
          }
        }
      }
    } catch (error) {
      this.updateState({ error: error as AuthError })
    }
  }

  /**
   * Get current session state
   */
  getState(): SessionState {
    return { ...this.currentState }
  }

  /**
   * Get current session
   */
  getSession(): Session | null {
    return this.currentState.session
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(session: Session): boolean {
    if (!session.expires_at) return false
    return Date.now() >= session.expires_at * 1000
  }

  /**
   * Check if session needs refresh
   */
  needsRefresh(session: Session): boolean {
    if (!session.expires_at) return false
    const expiryTime = session.expires_at * 1000
    const refreshTime = expiryTime - (this.config.refreshThreshold * 60 * 1000)
    return Date.now() >= refreshTime
  }

  /**
   * Manually refresh the session
   */
  async refreshSession(): Promise<Session | null> {
    // Return existing refresh promise if already refreshing
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performRefresh()
    const result = await this.refreshPromise
    this.refreshPromise = null
    
    return result
  }

  /**
   * Perform the actual session refresh
   */
  private async performRefresh(): Promise<Session | null> {
    this.updateState({ isRefreshing: true, error: null })

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        // Check for specific errors that shouldn't be retried
        const noRetryErrors = [
          'refresh_token_not_found',
          'invalid_refresh_token',
          'token_expired',
          'session_not_found',
        ]
        
        const errorCode = (error as any).code || ''
        const errorMessage = error.message?.toLowerCase() || ''
        
        const shouldNotRetry = noRetryErrors.some(e => 
          errorCode.includes(e) || errorMessage.includes(e.replace(/_/g, ' '))
        )
        
        if (shouldNotRetry) {
          // Don't retry - clear session and let user re-login
          console.log('🔐 Session expired or invalid, clearing session')
          this.updateState({
            isRefreshing: false,
            isExpired: true,
            session: null,
            error,
          })
          this.clearStoredSession()
          return null
        }
        
        this.retryCount++
        
        if (this.retryCount < this.config.maxRetries) {
          // Exponential backoff for retries
          const delay = this.config.retryDelay * Math.pow(2, this.retryCount - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.performRefresh()
        } else {
          // Max retries reached, mark as expired
          this.updateState({
            isRefreshing: false,
            isExpired: true,
            error,
          })
          this.clearStoredSession()
          return null
        }
      }

      const { session } = data
      this.retryCount = 0 // Reset retry count on success

      if (session) {
        this.updateState({
          session,
          isRefreshing: false,
          isExpired: false,
          lastRefresh: new Date(),
          error: null,
        })

        if (this.config.enableLocalStorage) {
          this.storeSession(session)
        }

        if (this.config.enableAutoRefresh) {
          this.scheduleRefresh(session)
        }

        return session
      } else {
        this.updateState({
          session: null,
          isRefreshing: false,
          isExpired: true,
          error: null,
        })
        this.clearStoredSession()
        return null
      }
    } catch (error) {
      this.updateState({
        isRefreshing: false,
        error: error as AuthError,
      })
      return null
    }
  }

  /**
   * Schedule automatic session refresh
   */
  private scheduleRefresh(session: Session): void {
    this.clearRefreshTimer()

    if (!session.expires_at) return

    const expiryTime = session.expires_at * 1000
    const refreshTime = expiryTime - (this.config.refreshThreshold * 60 * 1000)
    const delay = Math.max(0, refreshTime - Date.now())

    this.refreshTimer = setTimeout(() => {
      if (this.currentState.session && this.needsRefresh(this.currentState.session)) {
        this.refreshSession()
      }
    }, delay)
  }

  /**
   * Clear the refresh timer
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  /**
   * Handle session update from auth state change
   */
  updateSession(session: Session | null): void {
    if (session) {
      this.updateState({
        session,
        isExpired: this.isSessionExpired(session),
        error: null,
      })

      if (this.config.enableLocalStorage) {
        this.storeSession(session)
      }

      if (this.config.enableAutoRefresh) {
        this.scheduleRefresh(session)
      }
    } else {
      this.clearSession()
    }
  }

  /**
   * Clear session and cleanup
   */
  clearSession(): void {
    this.clearRefreshTimer()
    this.clearStoredSession()
    
    this.updateState({
      session: null,
      isExpired: false,
      isRefreshing: false,
      lastRefresh: null,
      error: null,
    })
  }

  /**
   * Store session in local storage
   */
  private storeSession(session: Session): void {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return

    try {
      const sessionData = {
        session,
        timestamp: Date.now(),
      }
      
      // Use global localStorage if available, otherwise window.localStorage
      const storage = typeof localStorage !== 'undefined' ? localStorage : window.localStorage
      storage.setItem('supabase.auth.session', JSON.stringify(sessionData))
    } catch (error) {
      console.warn('Failed to store session in localStorage:', error)
    }
  }

  /**
   * Get session from local storage
   */
  private getStoredSession(): Session | null {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return null

    try {
      const storage = typeof localStorage !== 'undefined' ? localStorage : window.localStorage
      const stored = storage.getItem('supabase.auth.session')
      if (!stored) return null

      const { session, timestamp } = JSON.parse(stored)
      
      // Check if stored session is too old (older than 1 hour)
      if (Date.now() - timestamp > 60 * 60 * 1000) {
        this.clearStoredSession()
        return null
      }

      return session
    } catch (error) {
      console.warn('Failed to retrieve session from localStorage:', error)
      this.clearStoredSession()
      return null
    }
  }

  /**
   * Clear session from local storage
   */
  private clearStoredSession(): void {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return

    try {
      const storage = typeof localStorage !== 'undefined' ? localStorage : window.localStorage
      storage.removeItem('supabase.auth.session')
      // Also clear any other auth-related items
      storage.removeItem('supabase.auth.token')
      storage.removeItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token')
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error)
    }
  }

  /**
   * Setup page visibility listener for session validation
   */
  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.currentState.session) {
        // Page became visible, check if session needs refresh
        if (this.needsRefresh(this.currentState.session)) {
          this.refreshSession()
        }
      }
    })
  }

  /**
   * Add state change listener
   */
  addListener(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Update internal state and notify listeners
   */
  private updateState(updates: Partial<SessionState>): void {
    this.currentState = { ...this.currentState, ...updates }
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.getState())
      } catch (error) {
        console.error('Error in session state listener:', error)
      }
    })
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearRefreshTimer()
    this.listeners.clear()
    this.refreshPromise = null
  }
}

// Global session manager instance
let globalSessionManager: SessionManager | null = null

/**
 * Get or create the global session manager instance
 */
export function getSessionManager(config?: Partial<SessionManagerConfig>): SessionManager {
  if (!globalSessionManager) {
    globalSessionManager = new SessionManager(config)
  }
  return globalSessionManager
}

/**
 * Reset the global session manager (useful for testing)
 */
export function resetSessionManager(): void {
  if (globalSessionManager) {
    globalSessionManager.destroy()
    globalSessionManager = null
  }
}