/**
 * Migration Management API
 * 
 * Provides REST endpoints for migration operations with:
 * - Statistics calculation
 * - Migration status listing
 * - Run migrations (with dry run support)
 * - Rollback migrations
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMigrationRunner, MigrationStatus } from '@/lib/supabase/migration-runner';
import { 
  withAdminMiddleware, 
  type AdminContext 
} from '@/lib/admin/admin-middleware';

// ============================================================================
// Types
// ============================================================================

interface MigrationStats {
  total: number;
  executed: number;
  pending: number;
  failed: number;
  rolledBack: number;
}

interface MigrationListItem {
  name: string;
  status: 'executed' | 'pending' | 'failed' | 'rolled_back';
  executedAt?: string;
  executionTimeMs?: number;
  batchId?: string;
  errorMessage?: string;
  checksum?: string;
}

interface MigrationApiResponse {
  success: boolean;
  data?: {
    stats: MigrationStats;
    migrations: MigrationListItem[];
    lastBatchId?: string;
  };
  result?: {
    success: boolean;
    executed?: string[];
    failed?: string[];
    skipped?: string[];
    rolledBack?: string[];
    totalTimeMs: number;
    batchId?: string;
    message: string;
  };
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateStats(migrations: MigrationStatus[]): MigrationStats {
  return {
    total: migrations.length,
    executed: migrations.filter(m => m.status === 'executed').length,
    pending: migrations.filter(m => m.status === 'pending').length,
    failed: migrations.filter(m => m.status === 'failed').length,
    rolledBack: migrations.filter(m => m.status === 'rolled_back').length,
  };
}

function formatMigrationList(migrations: MigrationStatus[]): MigrationListItem[] {
  return migrations.map(m => ({
    name: m.name,
    status: m.status,
    executedAt: m.executed_at,
    executionTimeMs: m.execution_time_ms,
    batchId: m.batch_id,
    errorMessage: m.error_message,
    checksum: m.checksum,
  }));
}

function getLastBatchId(migrations: MigrationStatus[]): string | undefined {
  const executedMigrations = migrations
    .filter(m => m.status === 'executed' && m.batch_id)
    .sort((a, b) => {
      const dateA = a.executed_at ? new Date(a.executed_at).getTime() : 0;
      const dateB = b.executed_at ? new Date(b.executed_at).getTime() : 0;
      return dateB - dateA;
    });
  
  return executedMigrations[0]?.batch_id;
}

// ============================================================================
// GET Handler - Fetch migration status and statistics
// ============================================================================

async function getMigrationsHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, requestId } = context;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    const runner = createMigrationRunner();

    switch (action) {
      case 'status': {
        // Get full migration status with statistics
        const migrations = await runner.getMigrationStatus();
        const stats = calculateStats(migrations);
        const migrationList = formatMigrationList(migrations);
        const lastBatchId = getLastBatchId(migrations);

        const response: MigrationApiResponse = {
          success: true,
          data: {
            stats,
            migrations: migrationList,
            lastBatchId,
          },
        };

        return NextResponse.json(response);
      }

      case 'files': {
        // Get migration files info
        const files = runner.getMigrationFiles();
        return NextResponse.json({
          success: true,
          data: {
            files: files.map(f => ({
              name: f.name,
              timestamp: f.timestamp,
              checksum: f.checksum,
            })),
          },
          requestId,
        });
      }

      case 'stats': {
        // Get only statistics
        const migrations = await runner.getMigrationStatus();
        const stats = calculateStats(migrations);

        return NextResponse.json({
          success: true,
          data: { stats },
          requestId,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Valid actions: status, files, stats', requestId },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Migration API GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST Handler - Execute migration operations
// ============================================================================

async function postMigrationsHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, userEmail, requestId } = context;

  try {
    const body = await request.json();
    const { action, options = {} } = body;

    const runner = createMigrationRunner();

    // Log admin action
    console.log(`[Admin Migration] Action: ${action}, User: ${userEmail}, Options:`, options);

    switch (action) {
      case 'migrate': {
        // Run pending migrations
        const dryRun = options.dryRun || false;
        const target = options.target;

        const result = await runner.runMigrations({
          dryRun,
          verbose: true,
          target,
        });

        const response: MigrationApiResponse = {
          success: true,
          result: {
            success: result.success,
            executed: result.executed,
            failed: result.failed,
            skipped: result.skipped,
            totalTimeMs: result.total_time_ms,
            batchId: result.batch_id,
            message: dryRun 
              ? `Dry run completed. ${result.skipped.length} migration(s) would be executed.`
              : result.success 
                ? `Successfully executed ${result.executed.length} migration(s).`
                : `Migration failed. ${result.executed.length} executed, ${result.failed.length} failed.`,
          },
        };

        return NextResponse.json(response);
      }

      case 'rollback': {
        // Rollback migrations
        const count = options.count;
        const target = options.target;

        if (!count && !target) {
          return NextResponse.json(
            { success: false, error: 'Rollback requires either count or target parameter', requestId },
            { status: 400 }
          );
        }

        const result = await runner.rollbackMigrations({
          count,
          target,
          verbose: true,
        });

        const response: MigrationApiResponse = {
          success: true,
          result: {
            success: result.success,
            rolledBack: result.rolled_back,
            failed: result.failed,
            totalTimeMs: result.total_time_ms,
            message: result.success 
              ? `Successfully rolled back ${result.rolled_back.length} migration(s).`
              : `Rollback failed. ${result.rolled_back.length} rolled back, ${result.failed.length} failed.`,
          },
        };

        return NextResponse.json(response);
      }

      case 'refresh': {
        // Force refresh migration status (re-scan files)
        const migrations = await runner.getMigrationStatus();
        const stats = calculateStats(migrations);
        const migrationList = formatMigrationList(migrations);

        return NextResponse.json({
          success: true,
          data: {
            stats,
            migrations: migrationList,
          },
          result: {
            success: true,
            totalTimeMs: 0,
            message: 'Migration status refreshed successfully.',
          },
          requestId,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Valid actions: migrate, rollback, refresh', requestId },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Migration API POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        requestId,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Export Handlers with Admin Middleware
// Requirements: 11.1, 11.2, 11.3, 11.4
// ============================================================================

export const GET = withAdminMiddleware(getMigrationsHandler, {
  endpoint: '/api/admin/migrations',
  action: 'view_migrations',
  rateLimit: true,
  logRequests: true,
});

export const POST = withAdminMiddleware(postMigrationsHandler, {
  endpoint: '/api/admin/migrations',
  action: 'run_migrations',
  rateLimit: true,
  logRequests: true,
});
