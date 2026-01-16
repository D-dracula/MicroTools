'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { isAdminEmail } from './admin-utils'

// Re-export server-compatible utilities for backward compatibility
export { isAdminEmail, verifyAdminEmail, getAdminEmails } from './admin-utils'

/**
 * Admin Authentication Hook
 * 
 * Provides admin authentication state by checking:
 * 1. User is authenticated via NextAuth session
 * 2. User's email is in the ADMIN_EMAILS environment variable
 * 
 * Requirements: 1.1, 1.2
 */

export interface AdminUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role: 'admin'
}

export interface UseAdminAuthReturn {
  isAdmin: boolean
  isLoading: boolean
  user: AdminUser | null
  error: string | null
}

/**
 * Hook to check admin authentication status
 * 
 * Usage:
 * ```tsx
 * const { isAdmin, isLoading, user, error } = useAdminAuth()
 * 
 * if (isLoading) return <Loading />
 * if (!isAdmin) return <Unauthorized />
 * return <AdminContent user={user} />
 * ```
 */
export function useAdminAuth(): UseAdminAuthReturn {
  const { data: session, status } = useSession()
  
  const result = useMemo<UseAdminAuthReturn>(() => {
    // Still loading session
    if (status === 'loading') {
      return {
        isAdmin: false,
        isLoading: true,
        user: null,
        error: null,
      }
    }
    
    // Not authenticated
    if (status === 'unauthenticated' || !session?.user) {
      return {
        isAdmin: false,
        isLoading: false,
        user: null,
        error: 'not_authenticated',
      }
    }
    
    const userEmail = session.user.email
    
    // Check if user email is in admin list
    if (!isAdminEmail(userEmail)) {
      return {
        isAdmin: false,
        isLoading: false,
        user: null,
        error: 'not_authorized',
      }
    }
    
    // User is admin
    const adminUser: AdminUser = {
      id: (session.user as any).id || '',
      email: userEmail!,
      name: session.user.name,
      image: session.user.image,
      role: 'admin',
    }
    
    return {
      isAdmin: true,
      isLoading: false,
      user: adminUser,
      error: null,
    }
  }, [session, status])
  
  return result
}
