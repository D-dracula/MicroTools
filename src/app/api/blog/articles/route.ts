import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/lib/blog/article-service";
import { isArticleCategory } from "@/lib/blog/types";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  rateLimitConfigs,
} from "@/lib/rate-limit";

/**
 * GET /api/blog/articles
 * List articles with pagination and filtering
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 12, max: 50)
 * - category: Filter by category (optional)
 * - tag: Filter by tag (optional)
 * - search: Search in title and content (optional)
 * 
 * Requirements: 1.2, 1.4, 1.5
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
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "12", 10);
    const category = searchParams.get("category") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const search = searchParams.get("search") || undefined;

    // Validate page and pageSize
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid page number" },
        { status: 400 }
      );
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > 50) {
      return NextResponse.json(
        { success: false, error: "Invalid page size (must be between 1 and 50)" },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category && !isArticleCategory(category)) {
      return NextResponse.json(
        { success: false, error: "Invalid category" },
        { status: 400 }
      );
    }

    // Get articles from service
    const result = await getArticles({
      page,
      pageSize,
      category: category as any,
      tag,
      search,
      publishedOnly: true,
    });

    return NextResponse.json(
      { success: true, data: result },
      { 
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}
