import { createServerSupabaseClient } from '@/lib/supabase/client'
import { createServerDatabaseOperations } from '@/lib/supabase/database'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auth callback handler for Supabase authentication
 * 
 * This handler processes:
 * - OAuth callbacks from providers like Google
 * - Email confirmation callbacks
 * - Password reset callbacks
 * 
 * Ensures user profiles are created in the database.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type') // email_confirmation, recovery, etc.

  if (code) {
    try {
      const supabase = await createServerSupabaseClient()
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/auth/login?error=callback_error&message=${encodeURIComponent(error.message)}`)
      }

      if (data.user) {
        try {
          // Ensure user profile exists in database
          const db = await createServerDatabaseOperations()
          let profile = await db.getUserById(data.user.id)
          
          if (!profile) {
            // Create profile for new user
            await db.createUser({
              id: data.user.id,
              name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || null,
              image: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
            })
            console.log('Created user profile for:', data.user.email)
          } else {
            // Update existing profile with latest data
            await db.updateUser(data.user.id, {
              name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || profile.name,
              image: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || profile.image,
            })
          }
        } catch (profileError) {
          console.error('Error managing user profile during auth callback:', profileError)
          // Don't fail the auth flow if profile operations fail
        }
      }

      // For email confirmation, redirect to login with success message
      if (type === 'email_confirmation' || type === 'signup') {
        return NextResponse.redirect(`${origin}/auth/login?confirmed=true`)
      }

      // Redirect to the intended destination
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      console.error('Unexpected auth callback error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
    }
  }

  // If no code is provided, redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}