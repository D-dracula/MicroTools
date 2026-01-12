import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  rateLimitConfigs,
} from "@/lib/rate-limit";

/**
 * POST /api/auth/resend-confirmation
 * Resend email confirmation link
 */
export async function POST(request: NextRequest) {
  // Rate limiting - strict for auth endpoints
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const supabase = await createServerSupabaseClient();

    // Resend confirmation email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback`,
      },
    });

    if (error) {
      console.error('Resend confirmation error:', error);
      
      // Don't reveal if email exists or not for security
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please wait before trying again.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to resend confirmation email' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a confirmation link has been sent.',
    });

  } catch (error) {
    console.error("Resend confirmation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
