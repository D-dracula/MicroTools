import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
 * GET /api/calculations/[id]
 * Get a specific calculation by ID
 * Requirements: 9.1, 9.3, 9.4, 9.5, 9.6, 9.7
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
    // Check authentication
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Calculation ID is required" },
        { status: 400 }
      );
    }

    // Find calculation - only return if it belongs to the user
    const calculation = await prisma.calculation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!calculation) {
      return NextResponse.json(
        { success: false, error: "Calculation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: calculation });
  } catch (error) {
    console.error("Error fetching calculation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}


/**
 * DELETE /api/calculations/[id]
 * Delete a specific calculation by ID
 * Requirements: 9.1, 9.3, 9.4, 9.5, 9.6, 9.7
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
    // Check authentication
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Calculation ID is required" },
        { status: 400 }
      );
    }

    // Find calculation first to ensure it belongs to the user
    const calculation = await prisma.calculation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!calculation) {
      return NextResponse.json(
        { success: false, error: "Calculation not found" },
        { status: 404 }
      );
    }

    // Delete the calculation
    await prisma.calculation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting calculation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
