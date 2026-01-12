import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { createServerDatabaseOperations } from "@/lib/supabase/database";
import { registerSchema } from "@/lib/validations/auth";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  rateLimitConfigs,
} from "@/lib/rate-limit";

/**
 * POST /api/auth/register
 * Register a new user using Supabase Auth
 * Requirements: 2.1, 7.1, 7.4, 7.8, 9.6
 */
export async function POST(request: NextRequest) {
  // Rate limiting (Requirement 9.6) - strict for auth endpoints to prevent brute force
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, rateLimitConfigs.auth);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: {
          ...createRateLimitHeaders(rateLimitResult),
          "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const body = await request.json();
    
    // Debug logging
    console.log('📝 Registration attempt:', { 
      email: body.email, 
      hasPassword: !!body.password,
      passwordLength: body.password?.length,
      name: body.name 
    });

    // Validate input with Zod
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      const issues = validationResult.error.issues;
      console.log('❌ Validation failed:', issues);
      return NextResponse.json(
        {
          success: false,
          error: issues[0]?.message || "Validation error",
          details: issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;

    // Get the origin for redirect URL
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Register user with Supabase Auth (Requirement 2.1)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback`,
        data: {
          name: name || '',
        },
      },
    });

    if (error) {
      console.error('Registration error:', error);
      
      // Handle specific Supabase Auth errors
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { success: false, error: 'User already exists with this email' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Password')) {
        return NextResponse.json(
          { success: false, error: 'Password does not meet requirements' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Registration failed', details: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'Registration failed - no user created' },
        { status: 500 }
      );
    }

    // Always create user profile in database (Requirement 7.1)
    // Profile is created immediately, email confirmation status is tracked separately
    try {
      const db = await createServerDatabaseOperations();
      
      // Check if profile already exists (in case of re-registration attempt)
      const existingProfile = await db.getUserById(data.user.id);
      
      if (!existingProfile) {
        await db.createUser({
          id: data.user.id,
          name: name || null,
          image: null,
        });
        console.log('✅ Created user profile for:', data.user.email);
      } else {
        console.log('ℹ️ User profile already exists for:', data.user.email);
      }
    } catch (profileError) {
      console.error('Error creating user profile:', profileError);
      // Don't fail registration if profile creation fails
      // The profile will be created on first sign in
    }

    // Return success response
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name || null,
        emailConfirmed: !!data.user.email_confirmed_at,
      },
      message: data.user.email_confirmed_at 
        ? 'Registration successful' 
        : 'Registration successful. Please check your email to confirm your account.',
    });

  } catch (error) {
    console.error("Unexpected registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
