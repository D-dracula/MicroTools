/**
 * Admin Utilities
 * 
 * Server-compatible utility functions for admin authentication
 * These functions can be used in both server and client contexts
 * 
 * Requirements: 1.1, 1.2
 */

/**
 * Get admin emails from environment variable
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
 * Check if an email is in the admin list
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
