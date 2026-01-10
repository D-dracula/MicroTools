import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  createCustomAdSchema,
  adPlacementSchema,
} from "@/lib/validations/ads";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  rateLimitConfigs,
} from "@/lib/rate-limit";

/**
 * GET /api/ads
 * Fetch active custom ad for a specific placement
 * Query params: placement (required)
 * Requirements: 9.6, 15.3, 15.4, 15.6
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
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get("placement");

    // Validate placement parameter
    const placementResult = adPlacementSchema.safeParse(placement);
    if (!placementResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing placement parameter",
        },
        { status: 400 }
      );
    }

    // Check if database is configured
    if (!prisma) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const now = new Date();

    // Fetch active custom ad with highest priority for the placement
    // Respects scheduling (Requirement 15.6)
    const customAd = await prisma.customAd.findFirst({
      where: {
        placement: placementResult.data,
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: {
        priority: "desc", // Higher priority first (Requirement 15.4)
      },
    });

    return NextResponse.json({
      success: true,
      data: customAd,
    });
  } catch (error) {
    console.error("Error fetching ad:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch ad",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ads
 * Create a new custom ad (Admin only)
 * Requirements: 9.6, 15.1, 15.2, 15.5
 */
export async function POST(request: NextRequest) {
  // Rate limiting (Requirement 9.6) - stricter for write operations
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, rateLimitConfigs.write);
  
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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Check if database is configured
    if (!prisma) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createCustomAdSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create the custom ad
    const customAd = await prisma.customAd.create({
      data: {
        placement: data.placement,
        priority: data.priority,
        isActive: data.isActive,
        titleAr: data.titleAr,
        titleEn: data.titleEn,
        descriptionAr: data.descriptionAr,
        descriptionEn: data.descriptionEn,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: customAd,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating ad:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create ad",
      },
      { status: 500 }
    );
  }
}
