import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createServerSupabaseClient } from "./supabase/client";
import { createServerDatabaseOperations } from "./supabase/database";

// Check if Supabase is configured
import { isSupabaseConfigured } from "./supabase/client";
const isDatabaseConfigured = isSupabaseConfigured();

export const authOptions: NextAuthOptions = {
  // Note: Supabase adapter has been removed for simplicity
  // adapter: isDatabaseConfigured ? SupabaseAdapter() : undefined,
  
  providers: [
    // Credentials Provider (Email/Password) - only if database is configured
    ...(isDatabaseConfigured
      ? [
          CredentialsProvider({
            name: "credentials",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password || !isDatabaseConfigured) {
                console.log('❌ Auth: Missing credentials or database not configured');
                return null;
              }

              try {
                // Use Supabase Auth for authentication
                const supabase = await createServerSupabaseClient();
                
                console.log('🔐 Attempting login for:', credentials.email);
                
                // Sign in with Supabase Auth
                const { data, error } = await supabase.auth.signInWithPassword({
                  email: credentials.email,
                  password: credentials.password,
                });

                if (error) {
                  console.error('❌ Supabase auth error:', error.message);
                  return null;
                }

                if (!data.user) {
                  console.error('❌ No user returned from Supabase');
                  return null;
                }

                // Check if email is confirmed
                if (!data.user.email_confirmed_at) {
                  console.log('⚠️ Email not confirmed for:', credentials.email);
                  // Still allow login but log the warning
                  // Supabase handles email confirmation requirement in its settings
                }

                console.log('✅ Supabase auth successful for:', data.user.email);

                // Get user profile from database
                const db = await createServerDatabaseOperations();
                let profile = await db.getUserById(data.user.id);

                // Create profile if it doesn't exist
                if (!profile) {
                  console.log('📝 Creating profile for user:', data.user.id);
                  try {
                    profile = await db.createUser({
                      id: data.user.id,
                      name: data.user.user_metadata?.name || null,
                      image: data.user.user_metadata?.avatar_url || null,
                    });
                    console.log('✅ Profile created successfully');
                  } catch (profileError) {
                    console.error('⚠️ Failed to create profile:', profileError);
                    // Continue without profile - user can still authenticate
                  }
                }

                return {
                  id: data.user.id,
                  email: data.user.email,
                  name: profile?.name || data.user.user_metadata?.name,
                  image: profile?.image || data.user.user_metadata?.avatar_url,
                };
              } catch (error) {
                console.error("❌ Auth error:", error);
                return null;
              }
            },
          }),
        ]
      : []),
    // Google OAuth Provider (optional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign in - ensure user profile exists
      if (account?.provider === "google" && user.email && isDatabaseConfigured) {
        try {
          const db = await createServerDatabaseOperations();
          
          // Check if profile exists
          let userProfile = await db.getUserById(user.id);
          
          if (!userProfile) {
            // Create new profile for OAuth user
            await db.createUser({
              id: user.id,
              name: user.name || profile?.name || null,
              image: user.image || null,
            });
          } else {
            // Update existing profile with latest OAuth data
            await db.updateUser(user.id, {
              name: user.name || profile?.name || userProfile.name,
              image: user.image || userProfile.image,
            });
          }
        } catch (error) {
          console.error("Error managing user profile:", error);
          // Don't fail the sign in if profile operations fail
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
