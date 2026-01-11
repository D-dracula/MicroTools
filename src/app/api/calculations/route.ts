import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerDatabaseOperations } from "@/lib/supabase/database";
import {
  createCalculationSchema,
  listCalculationsQuerySchema,
} from "@/lib/validations/calculations";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  rateLimitConfigs,
} from "@/lib/rate-limit";

/**
 * GET /api/calculations
 * List calculations for the authenticated user
 * Requirements: 9.1, 9.3, 9.4, 9.5, 9.6, 9.7
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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create database operations instance
    const db = await createServerDatabaseOperations();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = listCalculationsQuerySchema.safeParse({
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 10,
      toolSlug: searchParams.get("toolSlug") || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: queryResult.error.issues[0]?.message || "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { page, pageSize, toolSlug } = queryResult.data;

    // Get calculations using Supabase operations
    const calculations = await db.getUserCalculations(session.user.id, pageSize);
    
    // Filter by toolSlug if provided (simple client-side filtering for now)
    const filteredCalculations = toolSlug 
      ? calculations.filter(calc => calc.tool_slug === toolSlug)
      : calculations;

    // Apply pagination (simple client-side pagination for now)
    const skip = (page - 1) * pageSize;
    const paginatedCalculations = filteredCalculations.slice(skip, skip + pageSize);
    const total = filteredCalculations.length;

    return NextResponse.json({
      success: true,
      data: {
        items: paginatedCalculations,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching calculations:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}


/**
 * POST /api/calculations
 * Create a new calculation for the authenticated user
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
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
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create database operations instance
    const db = await createServerDatabaseOperations();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createCalculationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const { toolSlug, inputs, outputs } = validationResult.data;

    // Create calculation using Supabase operations
    const calculation = await db.saveCalculation({
      user_id: session.user.id,
      tool_slug: toolSlug,
      inputs,
      outputs,
    });

    return NextResponse.json(
      { success: true, data: calculation },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating calculation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
