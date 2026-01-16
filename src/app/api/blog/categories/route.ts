import { NextRequest, NextResponse } from "next/server";
import { getCategories } from "@/lib/blog/article-service";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  rateLimitConfigs,
} from "@/lib/rate-limit";

/**
 * GET /api/blog/categories
 * Get all categories with article counts
 * 
 * Requirements: 4.1, 4.2
 */
export async function GET(request: NextRequest) {
  // Rate limiting
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
    // Get categories from service
    const categories = await getCategories();

    return NextResponse.json(
      { success: true, data: categories },
      { 
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}
