import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/client";
import { createAdminDatabaseOperations } from "@/lib/supabase/database";
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
    
    // Environment debug
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
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

    // Use Admin client to create user with auto-confirmation
    // This bypasses email confirmation requirement for immediate login
    let supabaseAdmin;
    try {
      supabaseAdmin = createAdminClient();
      console.log('✅ Admin client created successfully');
    } catch (adminError) {
      console.error('❌ Failed to create admin client:', adminError);
      return NextResponse.json(
        { success: false, error: 'Server configuration error', details: adminError instanceof Error ? adminError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    // Register user with Supabase Auth Admin API (auto-confirms email)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for immediate login
      user_metadata: {
        name: name || '',
      },
    });

    if (error) {
      console.error('Registration error:', error);
      
      // Handle specific Supabase Auth errors
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
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
    
    console.log('✅ User created with auto-confirmed email:', data.user.email);

    // Always create user profile in database (Requirement 7.1)
    // Profile is created immediately, email confirmation status is tracked separately
    try {
      // Use Admin client for database operations (bypasses RLS)
      const db = createAdminDatabaseOperations();
      
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
        emailConfirmed: true, // Always confirmed with admin API
      },
      message: 'Registration successful. You can now login.',
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
