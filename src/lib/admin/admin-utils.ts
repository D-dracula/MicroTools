/**
 * Admin Utilities
 * 
 * Server-compatible utility functions for admin authentication
 * These functions can be used in both server and client contexts
 * 
 * Requirements: 1.1, 1.2
 */

/**
 * Get admin emails from environment variable (fallback)
 * ADMIN_EMAILS should be a comma-separated list of email addresses
 */
export function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || ''
  return adminEmailsEnv
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0)
}

/**
 * Check if an email is in the admin list (environment variable fallback)
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = getAdminEmails()
  return adminEmails.includes(email.toLowerCase())
}

/**
 * Server-side admin verification
 * Use this in API routes and server components
 */
export function verifyAdminEmail(email: string | null | undefined): boolean {
  return isAdminEmail(email)
}

/**
 * Check if user is admin from database
 * This is the preferred method - checks is_admin field in profiles table
 */
export async function isAdminFromDatabase(userId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    
    if (!response.ok) return false
    
    const data = await response.json()
    return data.isAdmin === true
  } catch {
    return false
  }
}
