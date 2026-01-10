/**
 * Rate Limiting Utility for API Routes
 * Requirements: 9.6 - THE API_Server SHALL implement rate limiting to prevent abuse
 * 
 * Uses an in-memory sliding window approach for rate limiting.
 * Note: In production with multiple instances, consider using Redis.
 */

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval to prevent memory leaks (runs every 60 seconds)
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
}

// Start cleanup on module load
startCleanup();

/**
 * Default rate limit configurations for different endpoint types
 */
export const rateLimitConfigs = {
  /** Standard API endpoints - 100 requests per minute */
  standard: { limit: 100, windowMs: 60 * 1000 },
  /** Auth endpoints - 10 requests per minute (stricter to prevent brute force) */
  auth: { limit: 10, windowMs: 60 * 1000 },
  /** Analytics tracking - 200 requests per minute (higher for tracking) */
  analytics: { limit: 200, windowMs: 60 * 1000 },
  /** Write operations - 30 requests per minute */
  write: { limit: 30, windowMs: 60 * 1000 },
} as const;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and limit info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = rateLimitConfigs.standard
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // If no entry exists or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime: entry.resetTime,
    };
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header (for proxies) or falls back to a default
 * @param request - NextRequest object
 * @returns Client identifier string
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (common in proxy setups)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  // Fallback for development or when no IP is available
  return "unknown-client";
}

/**
 * Create rate limit headers for response
 * @param result - Rate limit check result
 * @returns Headers object with rate limit information
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
  };
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 * @param handler - The API route handler function
 * @param config - Rate limit configuration (optional, defaults to standard)
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T extends Request>(
  handler: (request: T) => Promise<Response>,
  config: RateLimitConfig = rateLimitConfigs.standard
) {
  return async (request: T): Promise<Response> => {
    const identifier = getClientIdentifier(request);
    const result = checkRateLimit(identifier, config);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...createRateLimitHeaders(result),
            "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }
    
    // Call the original handler
    const response = await handler(request);
    
    // Add rate limit headers to successful responses
    const headers = new Headers(response.headers);
    const rateLimitHeaders = createRateLimitHeaders(result);
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      headers.set(key, value);
    }
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/**
 * Reset rate limit for a specific identifier (useful for testing)
 * @param identifier - The identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
