import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createServerDatabaseOperations } from "@/lib/supabase/database";
import { authOptions } from "@/lib/auth";
import { updateCustomAdSchema } from "@/lib/validations/ads";
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
    const { id } = params;

    // Create database operations instance
    const db = await createServerDatabaseOperations();

    // Get all ads and find the one with matching ID
    const ads = await db.getActiveAds();
    const customAd = ads.find(ad => ad.id === id);

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
    const { id } = params;

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

    // Create database operations instance
    const db = await createServerDatabaseOperations();

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

    // Build update data with proper field names for Supabase
    const updateData: Record<string, unknown> = {};
    if (data.placement !== undefined) updateData.placement = data.placement;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.titleAr !== undefined) updateData.title_ar = data.titleAr;
    if (data.titleEn !== undefined) updateData.title_en = data.titleEn;
    if (data.descriptionAr !== undefined) updateData.description_ar = data.descriptionAr;
    if (data.descriptionEn !== undefined) updateData.description_en = data.descriptionEn;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.linkUrl !== undefined) updateData.link_url = data.linkUrl;
    if (data.startDate !== undefined) {
      updateData.start_date = data.startDate ? new Date(data.startDate).toISOString() : null;
    }
    if (data.endDate !== undefined) {
      updateData.end_date = data.endDate ? new Date(data.endDate).toISOString() : null;
    }

    // Update the ad using Supabase operations
    const updatedAd = await db.updateAd(id, updateData);

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
    const { id } = params;

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

    // Create database operations instance
    const db = await createServerDatabaseOperations();

    // Delete the ad using Supabase operations
    await db.deleteAd(id);

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