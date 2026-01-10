import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

    // Check if database is configured
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      );
    }

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
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where = {
      userId: session.user.id,
      ...(toolSlug && { toolSlug }),
    };

    // Get calculations with pagination
    const [calculations, total] = await Promise.all([
      prisma.calculation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.calculation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: calculations,
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

    // Check if database is configured
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      );
    }

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

    // Create calculation
    const calculation = await prisma.calculation.create({
      data: {
        userId: session.user.id,
        toolSlug,
        inputs: inputs as Prisma.InputJsonValue,
        outputs: outputs as Prisma.InputJsonValue,
      },
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
