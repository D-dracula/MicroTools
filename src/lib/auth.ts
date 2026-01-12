import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createServerSupabaseClient } from "./supabase/client";
import { createAdminDatabaseOperations } from "./supabase/database";

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
              console.log('🔐 ========== LOGIN ATTEMPT ==========');
              console.log('🔐 Email:', credentials?.email);
              console.log('🔐 Has password:', !!credentials?.password);
              console.log('🔐 Database configured:', isDatabaseConfigured);
              
              if (!credentials?.email || !credentials?.password) {
                console.log('❌ Auth: Missing email or password');
                return null;
              }
              
              if (!isDatabaseConfigured) {
                console.log('❌ Auth: Database not configured');
                return null;
              }

              try {
                // Use Supabase Auth for authentication
                console.log('🔐 Creating Supabase client...');
                const supabase = await createServerSupabaseClient();
                console.log('🔐 Supabase client created');
                
                // Sign in with Supabase Auth
                console.log('🔐 Calling signInWithPassword...');
                const { data, error } = await supabase.auth.signInWithPassword({
                  email: credentials.email,
                  password: credentials.password,
                });

                console.log('🔐 SignIn response:', {
                  hasData: !!data,
                  hasUser: !!data?.user,
                  hasSession: !!data?.session,
                  error: error?.message || null,
                  errorCode: error?.code || null,
                });

                if (error) {
                  console.error('❌ Supabase auth error:', {
                    message: error.message,
                    code: error.code,
                    status: error.status,
                  });
                  return null;
                }

                if (!data.user) {
                  console.error('❌ No user returned from Supabase');
                  return null;
                }

                console.log('✅ Supabase auth successful:', {
                  userId: data.user.id,
                  email: data.user.email,
                  emailConfirmed: !!data.user.email_confirmed_at,
                  confirmedAt: data.user.email_confirmed_at,
                });

                // Get user profile from database
                console.log('🔐 Getting user profile from database...');
                const db = createAdminDatabaseOperations();
                let profile = await db.getUserById(data.user.id);
                console.log('🔐 Profile found:', !!profile);

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

                const result = {
                  id: data.user.id,
                  email: data.user.email,
                  name: profile?.name || data.user.user_metadata?.name,
                  image: profile?.image || data.user.user_metadata?.avatar_url,
                };
                
                console.log('✅ Returning user:', result);
                console.log('🔐 ========== LOGIN SUCCESS ==========');
                return result;
              } catch (error) {
                console.error("❌ Auth error:", error);
                console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack');
                console.log('🔐 ========== LOGIN FAILED ==========');
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
          const db = createAdminDatabaseOperations();
          
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
