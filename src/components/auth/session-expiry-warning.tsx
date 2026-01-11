'use client'

import { useEffect, useState } from 'react'
import { useSessionExpiry, useSessionRefresh } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Session Expiry Warning Component
 * 
 * Displays a warning when the user's session is about to expire
 * and provides options to refresh the session or logout.
 */

export interface SessionExpiryWarningProps {
  warningThreshold?: number // Minutes before expiry to show warning
  autoRefresh?: boolean // Whether to show auto-refresh option
  onLogout?: () => void
  className?: string
}

export function SessionExpiryWarning({
  warningThreshold = 5,
  autoRefresh = true,
  onLogout,
  className = '',
}: SessionExpiryWarningProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  
  const { minutesUntilExpiry, isNearExpiry, isExpired } = useSessionExpiry({
    warningThreshold,
    onExpired: () => {
      setIsVisible(false)
      onLogout?.()
    },
    onNearExpiry: (minutes) => {
      if (!dismissed) {
        setIsVisible(true)
      }
    },
  })

  const { refreshSession, isRefreshing } = useSessionRefresh()

  // Reset dismissed state when session is refreshed or user signs in again
  useEffect(() => {
    if (!isNearExpiry && !isExpired) {
      setDismissed(false)
      setIsVisible(false)
    }
  }, [isNearExpiry, isExpired])

  const handleRefresh = async () => {
    try {
      await refreshSession()
      setIsVisible(false)
      setDismissed(false)
    } catch (error) {
      console.error('Failed to refresh session:', error)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    setIsVisible(false)
  }

  const handleLogout = () => {
    setIsVisible(false)
    onLogout?.()
  }

  if (!isVisible || isExpired) {
    return null
  }

  return (
    <Card className={`fixed top-4 right-4 z-50 p-4 bg-yellow-50 border-yellow-200 shadow-lg max-w-sm ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-yellow-800">
            Session Expiring Soon
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            Your session will expire in {minutesUntilExpiry} minute{minutesUntilExpiry !== 1 ? 's' : ''}.
            {autoRefresh && ' Would you like to extend your session?'}
          </p>
          
          <div className="mt-3 flex space-x-2">
            {autoRefresh && (
              <Button
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isRefreshing ? 'Refreshing...' : 'Extend Session'}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Logout
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-yellow-700 hover:bg-yellow-100"
            >
              Dismiss
            </Button>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none focus:text-yellow-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  )
}

/**
 * Auto Logout Component
 * 
 * Automatically handles logout when session expires and shows warnings.
 * This component should be placed at the root level of authenticated areas.
 */
export interface AutoLogoutProps {
  enabled?: boolean
  redirectTo?: string
  showWarning?: boolean
  warningThreshold?: number
  onBeforeLogout?: () => void
}

export function AutoLogout({
  enabled = true,
  redirectTo = '/auth/login',
  showWarning = true,
  warningThreshold = 5,
  onBeforeLogout,
}: AutoLogoutProps) {
  const [showExpiryWarning, setShowExpiryWarning] = useState(false)

  const handleLogout = () => {
    onBeforeLogout?.()
    
    if (typeof window !== 'undefined') {
      // Clear any stored session data
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
  }

  useSessionExpiry({
    warningThreshold,
    onExpired: handleLogout,
    onNearExpiry: (minutes) => {
      if (showWarning && minutes <= warningThreshold) {
        setShowExpiryWarning(true)
      }
    },
  })

  if (!enabled) {
    return null
  }

  return (
    <>
      {showWarning && showExpiryWarning && (
        <SessionExpiryWarning
          warningThreshold={warningThreshold}
          onLogout={handleLogout}
        />
      )}
    </>
  )
}