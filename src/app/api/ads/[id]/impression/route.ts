import { NextRequest, NextResponse } from "next/server";
import { createServerDatabaseOperations } from "@/lib/supabase/database";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  rateLimitConfigs,
} from "@/lib/rate-limit";

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/ads/[id]/impression
 * Track ad impression
 * Requirements: 9.6, 15.7
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Rate limiting (Requirement 9.6) - higher limit for analytics tracking
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, rateLimitConfigs.analytics);
  
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
    const { id } = params;

    // Create database operations instance
    const db = await createServerDatabaseOperations();

    // Increment impression count using Supabase operations
    await db.incrementAdImpressions(id);

    return NextResponse.json({
      success: true,
      data: { recorded: true },
    });
  } catch (error) {
    console.error("Error recording impression:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to record impression",
      },
      { status: 500 }
    );
  }
}
