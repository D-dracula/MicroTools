import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerDatabaseOperations } from "@/lib/supabase/database";
import { 
  classifySupabaseError, 
  SupabaseError,
  getErrorRecoveryActions 
} from "@/lib/supabase/errors";
import { logger } from "@/lib/supabase/logger";
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
 * GET /api/calculations/[id]
 * Get a specific calculation by ID
 * Requirements: 9.1, 9.3, 9.4, 9.5, 9.6, 9.7
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);
  
  // Rate limiting (Requirement 9.6)
  const rateLimitResult = checkRateLimit(clientId, rateLimitConfigs.standard);
  
  if (!rateLimitResult.success) {
    logger.warn('Rate limit exceeded for calculation GET', {
      clientId,
      endpoint: '/api/calculations/[id]',
      method: 'GET'
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Too many requests. Please try again later.",
        retryable: true
      },
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
      logger.warn('Unauthenticated request to calculation endpoint', {
        clientId,
        endpoint: '/api/calculations/[id]'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Authentication required",
          retryable: false
        },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      logger.warn('Missing calculation ID in request', {
        userId: session.user.id,
        clientId
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Calculation ID is required",
          retryable: false
        },
        { status: 400 }
      );
    }

    // Create database operations instance
    const db = await createServerDatabaseOperations();

    logger.debug('Fetching calculation', {
      calculationId: id,
      userId: session.user.id,
      clientId
    });

    // Find calculation using Supabase operations
    const calculation = await db.getCalculationById(id);

    if (!calculation || calculation.user_id !== session.user.id) {
      logger.warn('Calculation not found or access denied', {
        calculationId: id,
        userId: session.user.id,
        found: !!calculation,
        ownerMatch: calculation?.user_id === session.user.id
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Calculation not found",
          retryable: false
        },
        { status: 404 }
      );
    }

    logger.info('Calculation retrieved successfully', {
      calculationId: id,
      userId: session.user.id,
      toolSlug: calculation.tool_slug,
      duration: Date.now() - startTime
    });

    return NextResponse.json({ 
      success: true, 
      data: calculation 
    });
    
  } catch (error) {
    const supabaseError = error instanceof SupabaseError 
      ? error 
      : classifySupabaseError(error, {
          operation: 'GET /api/calculations/[id]',
          calculationId: params.id,
          clientId
        });

    logger.error('Error fetching calculation', {
      calculationId: params.id,
      clientId,
      duration: Date.now() - startTime,
      error: supabaseError.toLogObject()
    });

    const response = supabaseError.toApiResponse();
    const statusCode = supabaseError.severity === 'critical' ? 503 : 500;

    return NextResponse.json(
      {
        ...response,
        recoveryActions: getErrorRecoveryActions(supabaseError)
      },
      { status: statusCode }
    );
  }
}


/**
 * DELETE /api/calculations/[id]
 * Delete a specific calculation by ID
 * Requirements: 9.1, 9.3, 9.4, 9.5, 9.6, 9.7
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  const clientId = getClientIdentifier(request);
  
  // Rate limiting (Requirement 9.6) - stricter for write operations
  const rateLimitResult = checkRateLimit(clientId, rateLimitConfigs.write);
  
  if (!rateLimitResult.success) {
    logger.warn('Rate limit exceeded for calculation DELETE', {
      clientId,
      endpoint: '/api/calculations/[id]',
      method: 'DELETE'
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Too many requests. Please try again later.",
        retryable: true
      },
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
      logger.warn('Unauthenticated DELETE request to calculation endpoint', {
        clientId,
        endpoint: '/api/calculations/[id]'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Authentication required",
          retryable: false
        },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      logger.warn('Missing calculation ID in DELETE request', {
        userId: session.user.id,
        clientId
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Calculation ID is required",
          retryable: false
        },
        { status: 400 }
      );
    }

    // Create database operations instance
    const db = await createServerDatabaseOperations();

    logger.debug('Deleting calculation', {
      calculationId: id,
      userId: session.user.id,
      clientId
    });

    // Find calculation first to ensure it belongs to the user
    const calculation = await db.getCalculationById(id);

    if (!calculation || calculation.user_id !== session.user.id) {
      logger.warn('Calculation not found or access denied for deletion', {
        calculationId: id,
        userId: session.user.id,
        found: !!calculation,
        ownerMatch: calculation?.user_id === session.user.id
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Calculation not found",
          retryable: false
        },
        { status: 404 }
      );
    }

    // Delete the calculation using Supabase operations
    await db.deleteCalculation(id);

    logger.info('Calculation deleted successfully', {
      calculationId: id,
      userId: session.user.id,
      toolSlug: calculation.tool_slug,
      duration: Date.now() - startTime
    });

    return NextResponse.json({ 
      success: true, 
      data: { deleted: true } 
    });
    
  } catch (error) {
    const supabaseError = error instanceof SupabaseError 
      ? error 
      : classifySupabaseError(error, {
          operation: 'DELETE /api/calculations/[id]',
          calculationId: params.id,
          clientId
        });

    logger.error('Error deleting calculation', {
      calculationId: params.id,
      clientId,
      duration: Date.now() - startTime,
      error: supabaseError.toLogObject()
    });

    const response = supabaseError.toApiResponse();
    const statusCode = supabaseError.severity === 'critical' ? 503 : 500;

    return NextResponse.json(
      {
        ...response,
        recoveryActions: getErrorRecoveryActions(supabaseError)
      },
      { status: statusCode }
    );
  }
}