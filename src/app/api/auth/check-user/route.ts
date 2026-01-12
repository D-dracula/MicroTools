import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/client";
import { createServerDatabaseOperations } from "@/lib/supabase/database";

/**
 * GET /api/auth/check-user?email=user@example.com
 * Debug endpoint to check user status in both Supabase Auth and profiles table
 * Only available in development mode
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    );
  }

  try {
    const adminClient = createAdminClient();
    
    // Get user from Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json(
        { error: 'Failed to fetch auth users', details: authError.message },
        { status: 500 }
      );
    }

    const authUser = authData.users.find(u => u.email === email);
    
    // Get profile from database
    let profile = null;
    if (authUser) {
      const db = await createServerDatabaseOperations();
      profile = await db.getUserById(authUser.id);
    }

    return NextResponse.json({
      email,
      authUser: authUser ? {
        id: authUser.id,
        email: authUser.email,
        email_confirmed_at: authUser.email_confirmed_at,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        user_metadata: authUser.user_metadata,
      } : null,
      profile: profile ? {
        id: profile.id,
        name: profile.name,
        created_at: profile.created_at,
      } : null,
      status: {
        existsInAuth: !!authUser,
        emailConfirmed: !!authUser?.email_confirmed_at,
        hasProfile: !!profile,
        canLogin: !!authUser && !!profile,
      },
      recommendations: getRecommendations(authUser, profile),
    });
  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getRecommendations(authUser: any, profile: any): string[] {
  const recommendations: string[] = [];
  
  if (!authUser) {
    recommendations.push('User does not exist in Supabase Auth. They need to register first.');
  } else {
    if (!authUser.email_confirmed_at) {
      recommendations.push('Email is not confirmed. Check Supabase Dashboard > Authentication > Users to manually confirm, or resend confirmation email.');
    }
    if (!profile) {
      recommendations.push('User profile does not exist in the profiles table. This should be created automatically on registration or first login.');
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('User is properly set up and should be able to login.');
  }
  
  return recommendations;
}
