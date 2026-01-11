import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from "next-auth/adapters"
import { createAdminClient } from "../supabase/client"
import type { Database } from "../supabase/types"

/**
 * Supabase Adapter for NextAuth.js
 * 
 * This adapter integrates Supabase with NextAuth.js to handle user accounts,
 * sessions, and verification tokens. It uses the admin client for database
 * operations that require elevated permissions.
 */
export function SupabaseAdapter(): Adapter {
  const supabase = createAdminClient()

  return {
    async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      try {
        // Create user in Supabase Auth first
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            avatar_url: user.image,
          },
        })

        if (authError || !authUser.user) {
          throw new Error(`Failed to create auth user: ${authError?.message}`)
        }

        // Create profile in public.profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            name: user.name,
            image: user.image,
          })
          .select()
          .single()

        if (profileError) {
          // If profile creation fails, clean up the auth user
          await supabase.auth.admin.deleteUser(authUser.user.id)
          throw new Error(`Failed to create user profile: ${profileError.message}`)
        }

        return {
          id: authUser.user.id,
          email: authUser.user.email!,
          name: profile.name,
          image: profile.image,
          emailVerified: authUser.user.email_confirmed_at ? new Date(authUser.user.email_confirmed_at) : null,
        }
      } catch (error) {
        console.error('Error creating user:', error)
        throw error
      }
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      try {
        // Get user from Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id)
        
        if (authError || !authUser.user) {
          return null
        }

        // Get profile from public.profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single()

        if (profileError) {
          // If profile doesn't exist, create it from auth user data
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: authUser.user.id,
              name: authUser.user.user_metadata?.name,
              image: authUser.user.user_metadata?.avatar_url,
            })
            .select()
            .single()

          return {
            id: authUser.user.id,
            email: authUser.user.email!,
            name: newProfile?.name || authUser.user.user_metadata?.name,
            image: newProfile?.image || authUser.user.user_metadata?.avatar_url,
            emailVerified: authUser.user.email_confirmed_at ? new Date(authUser.user.email_confirmed_at) : null,
          }
        }

        return {
          id: authUser.user.id,
          email: authUser.user.email!,
          name: profile.name,
          image: profile.image,
          emailVerified: authUser.user.email_confirmed_at ? new Date(authUser.user.email_confirmed_at) : null,
        }
      } catch (error) {
        console.error('Error getting user:', error)
        return null
      }
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      try {
        // Get user by email from Supabase Auth
        const { data: users, error } = await supabase.auth.admin.listUsers()
        
        if (error) {
          throw new Error(`Failed to list users: ${error.message}`)
        }

        const authUser = users.users.find((user: any) => user.email === email)
        if (!authUser) {
          return null
        }

        // Get profile from public.profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        return {
          id: authUser.id,
          email: authUser.email!,
          name: profile?.name || authUser.user_metadata?.name,
          image: profile?.image || authUser.user_metadata?.avatar_url,
          emailVerified: authUser.email_confirmed_at ? new Date(authUser.email_confirmed_at) : null,
        }
      } catch (error) {
        console.error('Error getting user by email:', error)
        return null
      }
    },

    async getUserByAccount({ providerAccountId, provider }): Promise<AdapterUser | null> {
      try {
        const { data: account, error } = await supabase
          .from('accounts')
          .select(`
            *,
            profiles (*)
          `)
          .eq('provider', provider)
          .eq('provider_account_id', providerAccountId)
          .single()

        if (error || !account) {
          return null
        }

        const profile = account.profiles as any
        if (!profile) {
          return null
        }

        // Get auth user for email verification status
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)

        return {
          id: profile.id,
          email: authUser?.user?.email || '',
          name: profile.name,
          image: profile.image,
          emailVerified: authUser?.user?.email_confirmed_at ? new Date(authUser.user.email_confirmed_at) : null,
        }
      } catch (error) {
        console.error('Error getting user by account:', error)
        return null
      }
    },

    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, "id">): Promise<AdapterUser> {
      try {
        // Update profile in public.profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .update({
            name: user.name,
            image: user.image,
          })
          .eq('id', user.id)
          .select()
          .single()

        if (profileError) {
          throw new Error(`Failed to update user profile: ${profileError.message}`)
        }

        // Update user metadata in Supabase Auth if needed
        if (user.name || user.image) {
          await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
              name: user.name,
              avatar_url: user.image,
            },
          })
        }

        // Get updated auth user for email verification status
        const { data: authUser } = await supabase.auth.admin.getUserById(user.id)

        return {
          id: user.id,
          email: user.email || authUser?.user?.email || '',
          name: profile.name,
          image: profile.image,
          emailVerified: authUser?.user?.email_confirmed_at ? new Date(authUser.user.email_confirmed_at) : null,
        }
      } catch (error) {
        console.error('Error updating user:', error)
        throw error
      }
    },

    async deleteUser(userId: string): Promise<void> {
      try {
        // Delete user from Supabase Auth (this will cascade to profiles due to RLS)
        const { error } = await supabase.auth.admin.deleteUser(userId)
        
        if (error) {
          throw new Error(`Failed to delete user: ${error.message}`)
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        throw error
      }
    },

    async linkAccount(account: AdapterAccount): Promise<AdapterAccount | null | undefined> {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .insert({
            user_id: account.userId,
            type: account.type,
            provider: account.provider,
            provider_account_id: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          })
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to link account: ${error.message}`)
        }

        return {
          userId: data.user_id,
          type: data.type as any,
          provider: data.provider,
          providerAccountId: data.provider_account_id,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state,
        }
      } catch (error) {
        console.error('Error linking account:', error)
        return null
      }
    },

    async unlinkAccount({ providerAccountId, provider }): Promise<AdapterAccount | undefined> {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .delete()
          .eq('provider', provider)
          .eq('provider_account_id', providerAccountId)
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to unlink account: ${error.message}`)
        }

        return {
          userId: data.user_id,
          type: data.type as any,
          provider: data.provider,
          providerAccountId: data.provider_account_id,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state,
        }
      } catch (error) {
        console.error('Error unlinking account:', error)
        return undefined
      }
    },

    async createSession({ sessionToken, userId, expires }): Promise<AdapterSession> {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .insert({
            session_token: sessionToken,
            user_id: userId,
            expires: expires.toISOString(),
          })
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to create session: ${error.message}`)
        }

        return {
          sessionToken: data.session_token,
          userId: data.user_id,
          expires: new Date(data.expires),
        }
      } catch (error) {
        console.error('Error creating session:', error)
        throw error
      }
    },

    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      try {
        const { data: session, error } = await supabase
          .from('sessions')
          .select(`
            *,
            profiles (*)
          `)
          .eq('session_token', sessionToken)
          .single()

        if (error || !session) {
          return null
        }

        const profile = session.profiles as any
        if (!profile) {
          return null
        }

        // Get auth user for email verification status
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)

        return {
          session: {
            sessionToken: session.session_token,
            userId: session.user_id,
            expires: new Date(session.expires),
          },
          user: {
            id: profile.id,
            email: authUser?.user?.email || '',
            name: profile.name,
            image: profile.image,
            emailVerified: authUser?.user?.email_confirmed_at ? new Date(authUser.user.email_confirmed_at) : null,
          },
        }
      } catch (error) {
        console.error('Error getting session and user:', error)
        return null
      }
    },

    async updateSession({ sessionToken, ...session }): Promise<AdapterSession | null | undefined> {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .update({
            expires: session.expires?.toISOString(),
          })
          .eq('session_token', sessionToken)
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to update session: ${error.message}`)
        }

        return {
          sessionToken: data.session_token,
          userId: data.user_id,
          expires: new Date(data.expires),
        }
      } catch (error) {
        console.error('Error updating session:', error)
        return null
      }
    },

    async deleteSession(sessionToken: string): Promise<void> {
      try {
        const { error } = await supabase
          .from('sessions')
          .delete()
          .eq('session_token', sessionToken)

        if (error) {
          throw new Error(`Failed to delete session: ${error.message}`)
        }
      } catch (error) {
        console.error('Error deleting session:', error)
        throw error
      }
    },

    async createVerificationToken({ identifier, expires, token }): Promise<VerificationToken> {
      try {
        const { data, error } = await supabase
          .from('verification_tokens')
          .insert({
            identifier,
            token,
            expires: expires.toISOString(),
          })
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to create verification token: ${error.message}`)
        }

        return {
          identifier: data.identifier,
          token: data.token,
          expires: new Date(data.expires),
        }
      } catch (error) {
        console.error('Error creating verification token:', error)
        throw error
      }
    },

    async useVerificationToken({ identifier, token }): Promise<VerificationToken | null> {
      try {
        const { data, error } = await supabase
          .from('verification_tokens')
          .delete()
          .eq('identifier', identifier)
          .eq('token', token)
          .select()
          .single()

        if (error || !data) {
          return null
        }

        return {
          identifier: data.identifier,
          token: data.token,
          expires: new Date(data.expires),
        }
      } catch (error) {
        console.error('Error using verification token:', error)
        return null
      }
    },
  }
}