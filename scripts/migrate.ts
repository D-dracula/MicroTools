#!/usr/bin/env tsx

/**
 * Enhanced Migration CLI Script
 * 
 * Provides command-line interface for running migrations, rollbacks,
 * and checking migration status.
 * 
 * Usage:
 *   npm run migrate                    # Run pending migrations
 *   npm run migrate -- --status       # Show migration status
 *   npm run migrate -- --rollback 2   # Rollback last 2 migrations
 *   npm run migrate -- --rollback-to migration_name.sql
 *   npm run migrate -- --dry-run      # Show what would be executed
 */

import { createMigrationRunner, MigrationRunner } from '../src/lib/supabase/migration-runner';
import { resolve } from 'path';

interface CliOptions {
  command: 'migrate' | 'rollback' | 'status';
  dryRun: boolean;
  verbose: boolean;
  target?: string;
  count?: number;
  help: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  
  const options: CliOptions = {
    command: 'migrate',
    dryRun: false,
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
        
      case '--status':
        options.command = 'status';
        break;
        
      case '--rollback':
        options.command = 'rollback';
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith('--')) {
          const count = parseInt(nextArg);
          if (!isNaN(count)) {
            options.count = count;
            i++; // Skip next argument
          }
        }
        break;
        
      case '--rollback-to':
        options.command = 'rollback';
        const target = args[i + 1];
        if (target && !target.startsWith('--')) {
          options.target = target;
          i++; // Skip next argument
        }
        break;
        
      case '--dry-run':
        options.dryRun = true;
        break;
        
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
        
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
Enhanced Supabase Migration CLI

Usage: npm run migrate [options]

Commands:
  (default)              Run pending migrations
  --status               Show migration status
  --rollback <count>     Rollback last N migrations
  --rollback-to <name>   Rollback to specific migration (exclusive)

Options:
  --dry-run              Show what would be executed without running
  --verbose, -v          Show detailed output
  --help, -h             Show this help message

Examples:
  npm run migrate                           # Run all pending migrations
  npm run migrate -- --status              # Show migration status
  npm run migrate -- --dry-run --verbose   # Preview migrations with details
  npm run migrate -- --rollback 2          # Rollback last 2 migrations
  npm run migrate -- --rollback-to 20260111000002_row_level_security.sql

Environment Variables:
  SUPABASE_URL              Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Service role key for admin operations
`);
}

async function showStatus(runner: MigrationRunner): Promise<void> {
  console.log('📋 Migration Status\n');
  
  try {
    const status = await runner.getMigrationStatus();
    
    if (status.length === 0) {
      console.log('No migration files found.');
      return;
    }

    // Group by status
    const pending = status.filter(s => s.status === 'pending');
    const executed = status.filter(s => s.status === 'executed');
    const failed = status.filter(s => s.status === 'failed');

    console.log(`📊 Summary:`);
    console.log(`   Total migrations: ${status.length}`);
    console.log(`   Executed: ${executed.length}`);
    console.log(`   Pending: ${pending.length}`);
    console.log(`   Failed: ${failed.length}\n`);

    if (executed.length > 0) {
      console.log('✅ Executed Migrations:');
      executed.forEach(migration => {
        const date = migration.executed_at ? new Date(migration.executed_at).toLocaleString() : 'Unknown';
        const time = migration.execution_time_ms ? `${migration.execution_time_ms}ms` : 'Unknown';
        console.log(`   ${migration.name} (${date}, ${time})`);
      });
      console.log();
    }

    if (pending.length > 0) {
      console.log('⏳ Pending Migrations:');
      pending.forEach(migration => {
        console.log(`   ${migration.name}`);
      });
      console.log();
    }

    if (failed.length > 0) {
      console.log('❌ Failed Migrations:');
      failed.forEach(migration => {
        console.log(`   ${migration.name}: ${migration.error_message}`);
      });
      console.log();
    }

  } catch (error) {
    console.error('❌ Failed to get migration status:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function runMigrations(runner: MigrationRunner, options: CliOptions): Promise<void> {
  console.log('🚀 Running Migrations\n');
  
  try {
    const result = await runner.runMigrations({
      dryRun: options.dryRun,
      verbose: options.verbose,
      target: options.target
    });

    if (options.dryRun) {
      console.log('\n🔍 Dry Run Complete - No changes were made');
      return;
    }

    if (result.success) {
      console.log(`\n🎉 Migration batch completed successfully!`);
      console.log(`   Batch ID: ${result.batch_id}`);
      console.log(`   Executed: ${result.executed.length} migrations`);
      console.log(`   Total time: ${result.total_time_ms}ms`);
    } else {
      console.log(`\n⚠️  Migration batch completed with errors`);
      console.log(`   Batch ID: ${result.batch_id}`);
      console.log(`   Executed: ${result.executed.length} migrations`);
      console.log(`   Failed: ${result.failed.length} migrations`);
      
      if (result.failed.length > 0) {
        console.log(`   Failed migrations: ${result.failed.join(', ')}`);
      }
      
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function runRollback(runner: MigrationRunner, options: CliOptions): Promise<void> {
  console.log('🔄 Running Rollback\n');
  
  if (!options.count && !options.target) {
    console.error('❌ Rollback requires either --rollback <count> or --rollback-to <target>');
    process.exit(1);
  }

  try {
    const result = await runner.rollbackMigrations({
      count: options.count,
      target: options.target,
      verbose: options.verbose
    });

    if (result.success) {
      console.log(`\n🎉 Rollback completed successfully!`);
      console.log(`   Rolled back: ${result.rolled_back.length} migrations`);
      console.log(`   Total time: ${result.total_time_ms}ms`);
      
      if (result.rolled_back.length > 0) {
        console.log(`   Migrations rolled back: ${result.rolled_back.join(', ')}`);
      }
    } else {
      console.log(`\n⚠️  Rollback completed with errors`);
      console.log(`   Rolled back: ${result.rolled_back.length} migrations`);
      console.log(`   Failed: ${result.failed.length} migrations`);
      
      if (result.failed.length > 0) {
        console.log(`   Failed rollbacks: ${result.failed.join(', ')}`);
      }
      
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Rollback failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  // Validate environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease set these in your .env file or environment.');
    process.exit(1);
  }

  // Create migration runner
  const migrationsDir = resolve(process.cwd(), 'supabase/migrations');
  const runner = createMigrationRunner(migrationsDir);

  try {
    switch (options.command) {
      case 'status':
        await showStatus(runner);
        break;
        
      case 'migrate':
        await runMigrations(runner, options);
        break;
        
      case 'rollback':
        await runRollback(runner, options);
        break;
        
      default:
        console.error(`Unknown command: ${options.command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the CLI
main().catch(error => {
  console.error('❌ CLI failed:', error);
  process.exit(1);
});