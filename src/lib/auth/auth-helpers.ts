import { createClient } from '../supabase/client'
import { createDatabaseOperations } from '../supabase/database'
import type { AuthError, User, Session } from '@supabase/supabase-js'

/**
 * Authentication helper functions for Supabase Auth
 * 
 * These functions provide a clean interface for authentication operations
 * and integrate with the database operations for user profile management.
 */

export interface AuthResult {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface SignUpData {
  email: string
  password: string
  name?: string
  redirectTo?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface OAuthProvider {
  provider: 'google' | 'github' | 'facebook' | 'twitter'
  redirectTo?: string
}

/**
 * Sign up a new user with email and password
 */
export async function signUp({ email, password, name, redirectTo }: SignUpData): Promise<AuthResult> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          name: name || '',
        },
      },
    })

    if (error) {
      return { user: null, session: null, error }
    }

    // If user is created and confirmed, create profile
    if (data.user && data.user.email_confirmed_at) {
      try {
        const db = createDatabaseOperations()
        await db.createUser({
          id: data.user.id,
          name: name || null,
          image: null,
        })
      } catch (profileError) {
        console.error('Error creating user profile:', profileError)
        // Don't fail the sign up if profile creation fails
      }
    }

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Sign up error:', error)
    return { 
      user: null, 
      session: null, 
      error: error as AuthError 
    }
  }
}

/**
 * Sign in a user with email and password
 */
export async function signIn({ email, password }: SignInData): Promise<AuthResult> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, session: null, error }
    }

    // Ensure user profile exists
    if (data.user) {
      try {
        const db = createDatabaseOperations()
        let profile = await db.getUserById(data.user.id)
        
        if (!profile) {
          // Create profile if it doesn't exist
          await db.createUser({
            id: data.user.id,
            name: data.user.user_metadata?.name || null,
            image: data.user.user_metadata?.avatar_url || null,
          })
        }
      } catch (profileError) {
        console.error('Error ensuring user profile:', profileError)
        // Don't fail the sign in if profile operations fail
      }
    }

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('Sign in error:', error)
    return { 
      user: null, 
      session: null, 
      error: error as AuthError 
    }
  }
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth({ provider, redirectTo }: OAuthProvider): Promise<AuthResult> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      return { user: null, session: null, error }
    }

    // OAuth sign in redirects, so we don't have immediate user data
    return { user: null, session: null, error: null }
  } catch (error) {
    console.error('OAuth sign in error:', error)
    return { 
      user: null, 
      session: null, 
      error: error as AuthError 
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error: error as AuthError }
  }
}

/**
 * Get the current user session
 */
export async function getCurrentSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  try {
    const supabase = createClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return { session: null, error }
    }

    return { session, error: null }
  } catch (error) {
    console.error('Get session error:', error)
    return { session: null, error: error as AuthError }
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return { user: null, error }
    }

    return { user, error: null }
  } catch (error) {
    console.error('Get user error:', error)
    return { user: null, error: error as AuthError }
  }
}

/**
 * Reset password for a user
 */
export async function resetPassword(email: string, redirectTo?: string): Promise<{ error: AuthError | null }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/auth/reset-password`,
    })
    
    if (error) {
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('Reset password error:', error)
    return { error: error as AuthError }
  }
}

/**
 * Update user password
 */
export async function updatePassword(password: string): Promise<{ error: AuthError | null }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({
      password,
    })
    
    if (error) {
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('Update password error:', error)
    return { error: error as AuthError }
  }
}

/**
 * Update user profile
 */
export async function updateProfile(updates: { name?: string; image?: string }): Promise<{ error: AuthError | null }> {
  try {
    const supabase = createClient()
    
    // Update auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        name: updates.name,
        avatar_url: updates.image,
      },
    })
    
    if (authError) {
      return { error: authError }
    }

    // Update profile in database
    const { user } = await getCurrentUser()
    if (user) {
      try {
        const db = createDatabaseOperations()
        await db.updateUser(user.id, {
          name: updates.name || null,
          image: updates.image || null,
        })
      } catch (profileError) {
        console.error('Error updating user profile:', profileError)
        // Don't fail the update if profile update fails
      }
    }

    return { error: null }
  } catch (error) {
    console.error('Update profile error:', error)
    return { error: error as AuthError }
  }
}

/**
 * Listen to authentication state changes
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  const supabase = createClient()
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  
  return subscription
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      return { session: null, error }
    }

    return { session: data.session, error: null }
  } catch (error) {
    console.error('Refresh session error:', error)
    return { session: null, error: error as AuthError }
  }
}