'use client'

import { useSession } from 'next-auth/react'
import { useMemo, useEffect, useState } from 'react'
import { isAdminEmail } from './admin-utils'

// Re-export server-compatible utilities for backward compatibility
export { isAdminEmail, verifyAdminEmail, getAdminEmails } from './admin-utils'

/**
 * Admin Authentication Hook
 * 
 * Provides admin authentication state by checking:
 * 1. User is authenticated via NextAuth session
 * 2. User has is_admin = true in database profiles table
 * 3. Fallback: User's email is in the ADMIN_EMAILS environment variable
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
 */
export function useAdminAuth(): UseAdminAuthReturn {
  const { data: session, status } = useSession()
  const [dbAdminCheck, setDbAdminCheck] = useState<boolean | null>(null)
  const [isCheckingDb, setIsCheckingDb] = useState(false)
  
  // Check database for admin status
  useEffect(() => {
    async function checkAdminInDb() {
      if (status !== 'authenticated' || !session?.user) return
      
      const userId = (session.user as any).id
      if (!userId) return
      
      setIsCheckingDb(true)
      try {
        const response = await fetch('/api/admin/check')
        if (response.ok) {
          const data = await response.json()
          setDbAdminCheck(data.isAdmin === true)
        } else {
          setDbAdminCheck(false)
        }
      } catch {
        setDbAdminCheck(false)
      } finally {
        setIsCheckingDb(false)
      }
    }
    
    checkAdminInDb()
  }, [session, status])
  
  const result = useMemo<UseAdminAuthReturn>(() => {
    // Still loading session or checking database
    if (status === 'loading' || (status === 'authenticated' && dbAdminCheck === null)) {
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
    
    // Check database first, then fallback to email list
    const isAdmin = dbAdminCheck === true || isAdminEmail(userEmail)
    
    if (!isAdmin) {
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
  }, [session, status, dbAdminCheck])
  
  return result
}
