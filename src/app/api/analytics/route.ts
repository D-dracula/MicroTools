import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  rateLimitConfigs,
} from "@/lib/rate-limit";

/**
 * Validation schema for tracking tool usage
 * Requirements: 11.1, 11.2
 */
const trackUsageSchema = z.object({
  toolSlug: z.string().min(1, "Tool slug is required"),
  userType: z.enum(["guest", "authenticated"]),
});

/**
 * POST /api/analytics/track
 * Track tool usage event
 * Requirements: 9.6, 11.1, 11.2, 11.3
 */
export async function POST(request: NextRequest) {
  // Rate limiting (Requirement 9.6) - higher limit for analytics
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
    // Check if database is configured
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = trackUsageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const { toolSlug, userType } = validationResult.data;

    // Create tool usage record (Requirement 11.3 - no PII for guests)
    await prisma.toolUsage.create({
      data: {
        toolSlug,
        userType,
      },
    });

    return NextResponse.json(
      { success: true, data: { tracked: true } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error tracking tool usage:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/stats
 * Get usage statistics (Admin only)
 * Requirements: 9.6, 11.4
 */
export async function GET(request: NextRequest) {
  // Rate limiting (Requirement 9.6)
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, rateLimitConfigs.standard);
  
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
    // Check authentication - admin only
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if database is configured
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      );
    }

    // Get aggregated stats by tool
    const stats = await prisma.toolUsage.groupBy({
      by: ["toolSlug", "userType"],
      _count: {
        id: true,
      },
    });

    // Transform into a more useful format
    const toolStats: Record<string, { totalUsage: number; guestUsage: number; authenticatedUsage: number }> = {};

    for (const stat of stats) {
      if (!toolStats[stat.toolSlug]) {
        toolStats[stat.toolSlug] = {
          totalUsage: 0,
          guestUsage: 0,
          authenticatedUsage: 0,
        };
      }

      toolStats[stat.toolSlug].totalUsage += stat._count.id;
      if (stat.userType === "guest") {
        toolStats[stat.toolSlug].guestUsage = stat._count.id;
      } else {
        toolStats[stat.toolSlug].authenticatedUsage = stat._count.id;
      }
    }

    // Convert to array format
    const result = Object.entries(toolStats).map(([toolSlug, data]) => ({
      toolSlug,
      ...data,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching analytics stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
