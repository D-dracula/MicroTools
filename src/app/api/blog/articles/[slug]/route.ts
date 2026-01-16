import { NextRequest, NextResponse } from "next/server";
import { getArticleBySlug } from "@/lib/blog/article-service";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  rateLimitConfigs,
} from "@/lib/rate-limit";

/**
 * GET /api/blog/articles/[slug]
 * Get a single article by its slug
 * 
 * Requirements: 1.3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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
    const { slug } = await params;

    // Validate slug
    if (!slug || !slug.trim()) {
      return NextResponse.json(
        { success: false, error: "Article slug is required" },
        { status: 400 }
      );
    }

    // Get article from service
    const article = await getArticleBySlug(slug);

    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: article },
      { 
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}
