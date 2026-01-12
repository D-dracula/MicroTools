import { createServerSupabaseClient } from '@/lib/supabase/client'
import { createAdminDatabaseOperations } from '@/lib/supabase/database'
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
  const token_hash = searchParams.get('token_hash')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('🔐 Auth callback received:', { 
    hasCode: !!code, 
    type, 
    next,
    hasTokenHash: !!token_hash,
    error: errorParam 
  })

  // Handle error from Supabase
  if (errorParam) {
    console.error('Auth callback error from Supabase:', errorParam, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorParam)}&message=${encodeURIComponent(errorDescription || 'Authentication failed')}`
    )
  }

  if (code) {
    try {
      const supabase = await createServerSupabaseClient()
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/auth/login?error=callback_error&message=${encodeURIComponent(error.message)}`)
      }

      console.log('✅ Session exchanged successfully for:', data.user?.email)

      if (data.user) {
        try {
          // Ensure user profile exists in database
          const db = createAdminDatabaseOperations()
          let profile = await db.getUserById(data.user.id)
          
          if (!profile) {
            // Create profile for new user
            await db.createUser({
              id: data.user.id,
              name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || null,
              image: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
            })
            console.log('✅ Created user profile for:', data.user.email)
          } else {
            // Update existing profile with latest data
            await db.updateUser(data.user.id, {
              name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || profile.name,
              image: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || profile.image,
            })
            console.log('✅ Updated user profile for:', data.user.email)
          }
        } catch (profileError) {
          console.error('Error managing user profile during auth callback:', profileError)
          // Don't fail the auth flow if profile operations fail
        }
      }

      // Detect if this is an email confirmation
      // Supabase may not always send type parameter, so we check multiple indicators
      const isEmailConfirmation = 
        type === 'email_confirmation' || 
        type === 'signup' ||
        type === 'email' ||
        // If user just confirmed email, email_confirmed_at will be recent
        (data.user?.email_confirmed_at && 
         new Date(data.user.email_confirmed_at).getTime() > Date.now() - 60000) // Within last minute

      if (isEmailConfirmation) {
        console.log('📧 Email confirmation detected, redirecting to login')
        return NextResponse.redirect(`${origin}/auth/login?confirmed=true`)
      }

      // Redirect to the intended destination
      console.log('🔄 Redirecting to:', next)
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      console.error('Unexpected auth callback error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
    }
  }

  // Handle token_hash for email confirmation (alternative flow)
  if (token_hash) {
    try {
      const supabase = await createServerSupabaseClient()
      
      // Verify the token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: (type as 'email' | 'signup' | 'recovery') || 'email',
      })

      if (error) {
        console.error('Token verification error:', error)
        return NextResponse.redirect(`${origin}/auth/login?error=verification_failed&message=${encodeURIComponent(error.message)}`)
      }

      if (data.user) {
        console.log('✅ Token verified for:', data.user.email)
        
        // Ensure profile exists
        try {
          const db = createAdminDatabaseOperations()
          const profile = await db.getUserById(data.user.id)
          
          if (!profile) {
            await db.createUser({
              id: data.user.id,
              name: data.user.user_metadata?.name || null,
              image: data.user.user_metadata?.avatar_url || null,
            })
          }
        } catch (profileError) {
          console.error('Error creating profile after token verification:', profileError)
        }
      }

      return NextResponse.redirect(`${origin}/auth/login?confirmed=true`)
    } catch (error) {
      console.error('Token verification error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
    }
  }

  // If no code or token_hash is provided, redirect to login with error
  console.warn('⚠️ Auth callback called without code or token_hash')
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
