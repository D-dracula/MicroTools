/**
 * Migration Management API
 * 
 * Provides REST endpoints for migration operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMigrationRunner } from '@/lib/supabase/migration-runner';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Only allow admin users to access migration endpoints
async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return false;
  }

  // Add your admin email check here
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(session.user.email);
}

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    const runner = createMigrationRunner();

    switch (action) {
      case 'status':
        const status = await runner.getMigrationStatus();
        return NextResponse.json({ status });

      case 'files':
        const files = runner.getMigrationFiles();
        return NextResponse.json({ 
          files: files.map(f => ({
            name: f.name,
            timestamp: f.timestamp,
            checksum: f.checksum
          }))
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, options = {} } = body;

    const runner = createMigrationRunner();

    switch (action) {
      case 'migrate':
        const migrateResult = await runner.runMigrations({
          dryRun: options.dryRun || false,
          verbose: true,
          target: options.target
        });
        return NextResponse.json({ result: migrateResult });

      case 'rollback':
        if (!options.count && !options.target) {
          return NextResponse.json(
            { error: 'Rollback requires either count or target' },
            { status: 400 }
          );
        }

        const rollbackResult = await runner.rollbackMigrations({
          count: options.count,
          target: options.target,
          verbose: true
        });
        return NextResponse.json({ result: rollbackResult });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}