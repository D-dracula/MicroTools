'use client'

import { useEnhancedSession, useSessionExpiry } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Session Status Component
 * 
 * Displays current session status and provides session management controls.
 * Demonstrates the enhanced session management functionality.
 */

export function SessionStatus() {
  const {
    session,
    isLoading,
    isExpired,
    isRefreshing,
    lastRefresh,
    error,
    refreshSession,
    clearSession,
  } = useEnhancedSession({
    enableAutoRefresh: true,
    refreshThreshold: 5,
    onSessionExpired: () => {
      console.log('Session expired - user should be redirected to login')
    },
    onSessionRefreshed: (session) => {
      console.log('Session refreshed successfully:', session.user?.email)
    },
    onRefreshError: (error) => {
      console.error('Session refresh failed:', error.message)
    },
  })

  const { minutesUntilExpiry, isNearExpiry } = useSessionExpiry({
    warningThreshold: 10,
  })

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Loading session...</span>
        </div>
      </Card>
    )
  }

  if (!session) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <p className="text-muted-foreground">No active session</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Session Status</h3>
        <div className={`px-2 py-1 rounded text-sm ${
          isExpired 
            ? 'bg-red-100 text-red-800' 
            : isNearExpiry 
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {isExpired ? 'Expired' : isNearExpiry ? 'Expiring Soon' : 'Active'}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">User:</span>
          <span>{session.user?.email}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expires in:</span>
          <span>
            {minutesUntilExpiry !== null 
              ? `${minutesUntilExpiry} minutes`
              : 'Unknown'
            }
          </span>
        </div>

        {lastRefresh && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last refresh:</span>
            <span>{lastRefresh.toLocaleTimeString()}</span>
          </div>
        )}

        {error && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Error:</span>
            <span className="text-red-600">{error.message}</span>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <Button
          size="sm"
          onClick={refreshSession}
          disabled={isRefreshing}
          variant="outline"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
        </Button>
        
        <Button
          size="sm"
          onClick={clearSession}
          variant="outline"
        >
          Clear Session
        </Button>
      </div>

      {isNearExpiry && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ Your session will expire in {minutesUntilExpiry} minutes. 
            Consider refreshing your session to continue working.
          </p>
        </div>
      )}
    </Card>
  )
}