import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  rateLimitConfigs,
} from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/ads/[id]/click
 * Track ad click
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
    const { id } = await params;

    if (!prisma) {
      return NextResponse.json({
        success: true,
        data: { recorded: false },
      });
    }

    // Check if ad exists
    const existingAd = await prisma.customAd.findUnique({
      where: { id },
    });

    if (!existingAd) {
      return NextResponse.json(
        {
          success: false,
          error: "Ad not found",
        },
        { status: 404 }
      );
    }

    // Increment click count
    await prisma.customAd.update({
      where: { id },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { recorded: true },
    });
  } catch (error) {
    console.error("Error recording click:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to record click",
      },
      { status: 500 }
    );
  }
}
