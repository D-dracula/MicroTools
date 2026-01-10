import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { updateCustomAdSchema } from "@/lib/validations/ads";
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
 * GET /api/ads/[id]
 * Fetch a specific custom ad by ID
 * Requirements: 9.6
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const { id } = await params;

    if (!prisma) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        { status: 503 }
      );
    }

    const customAd = await prisma.customAd.findUnique({
      where: { id },
    });

    if (!customAd) {
      return NextResponse.json(
        {
          success: false,
          error: "Ad not found",
        },
        { status: 404 }
      );
    }

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
 * PUT /api/ads/[id]
 * Update a custom ad (Admin only)
 * Requirements: 9.6, 15.5
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const { id } = await params;

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

    if (!prisma) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        { status: 503 }
      );
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateCustomAdSchema.safeParse(body);

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

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.placement !== undefined) updateData.placement = data.placement;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.titleAr !== undefined) updateData.titleAr = data.titleAr;
    if (data.titleEn !== undefined) updateData.titleEn = data.titleEn;
    if (data.descriptionAr !== undefined) updateData.descriptionAr = data.descriptionAr;
    if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    // Update the ad
    const updatedAd = await prisma.customAd.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedAd,
    });
  } catch (error) {
    console.error("Error updating ad:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update ad",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ads/[id]
 * Delete a custom ad (Admin only)
 * Requirements: 9.6, 15.5
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    const { id } = await params;

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

    if (!prisma) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        { status: 503 }
      );
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

    // Delete the ad
    await prisma.customAd.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error("Error deleting ad:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete ad",
      },
      { status: 500 }
    );
  }
}
