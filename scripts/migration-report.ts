#!/usr/bin/env tsx

/**
 * Migration Report Generator CLI
 * 
 * Generates comprehensive migration reports in various formats
 * 
 * Usage:
 *   npm run migrate:report                    # Generate console report
 *   npm run migrate:report -- --html         # Generate HTML report
 *   npm run migrate:report -- --json         # Generate JSON report
 *   npm run migrate:report -- --output report.html
 */

import { createMigrationRunner } from '../src/lib/supabase/migration-runner';
import { MigrationReporter } from '../src/lib/supabase/migration-reporter';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

interface ReportOptions {
  format: 'console' | 'html' | 'json';
  output?: string;
  environment?: string;
  verbose: boolean;
  help: boolean;
}

function parseArgs(): ReportOptions {
  const args = process.argv.slice(2);
  
  const options: ReportOptions = {
    format: 'console',
    verbose: false,
    help: false,
    environment: process.env.NODE_ENV || 'development'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
        
      case '--html':
        options.format = 'html';
        break;
        
      case '--json':
        options.format = 'json';
        break;
        
      case '--output':
      case '-o':
        const outputFile = args[i + 1];
        if (outputFile && !outputFile.startsWith('--')) {
          options.output = outputFile;
          i++; // Skip next argument
        }
        break;
        
      case '--environment':
      case '--env':
        const env = args[i + 1];
        if (env && !env.startsWith('--')) {
          options.environment = env;
          i++; // Skip next argument
        }
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
Migration Report Generator

Usage: npm run migrate:report [options]

Options:
  --html                 Generate HTML report
  --json                 Generate JSON report
  --output, -o <file>    Output file path
  --environment <env>    Environment name (default: development)
  --verbose, -v          Show detailed output
  --help, -h             Show this help message

Examples:
  npm run migrate:report                           # Console report
  npm run migrate:report -- --html                # HTML to stdout
  npm run migrate:report -- --html -o report.html # HTML to file
  npm run migrate:report -- --json -o report.json # JSON to file
  npm run migrate:report -- --env production      # Production environment

Environment Variables:
  SUPABASE_URL              Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Service role key for admin operations
  NODE_ENV                  Environment name (default for --environment)
`);
}

async function generateConsoleReport(reporter: MigrationReporter, verbose: boolean): Promise<void> {
  const report = await reporter.generateReport();
  
  console.log(`\n📋 Migration Report - ${report.environment}`);
  console.log(`Generated: ${new Date(report.timestamp).toLocaleString()}\n`);

  // Summary
  console.log('📊 Summary:');
  console.log(`   Total migrations: ${report.summary.total}`);
  console.log(`   Executed: ${report.summary.executed}`);
  console.log(`   Pending: ${report.summary.pending}`);
  console.log(`   Failed: ${report.summary.failed}\n`);

  // Health Status
  const healthIcon = {
    healthy: '✅',
    warning: '⚠️',
    error: '❌'
  }[report.health.status];

  console.log(`${healthIcon} Health Status: ${report.health.status.toUpperCase()}`);
  
  if (report.health.issues.length > 0) {
    console.log('\n🚨 Issues:');
    report.health.issues.forEach(issue => console.log(`   • ${issue}`));
  }
  
  if (report.health.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.health.recommendations.forEach(rec => console.log(`   • ${rec}`));
  }

  // Performance
  console.log('\n⚡ Performance:');
  console.log(`   Average execution time: ${report.performance.averageExecutionTime.toFixed(0)}ms`);
  console.log(`   Total migration time: ${(report.performance.totalMigrationTime / 1000).toFixed(1)}s`);
  
  if (report.performance.slowestMigration) {
    console.log(`   Slowest migration: ${report.performance.slowestMigration.name} (${report.performance.slowestMigration.executionTime}ms)`);
  }

  // Migration Details (if verbose)
  if (verbose) {
    console.log('\n📄 Migration Details:');
    
    const executed = report.migrations.filter(m => m.status === 'executed');
    const pending = report.migrations.filter(m => m.status === 'pending');
    const failed = report.migrations.filter(m => m.status === 'failed');

    if (executed.length > 0) {
      console.log('\n✅ Executed Migrations:');
      executed.forEach((migration, index) => {
        const date = migration.executed_at ? new Date(migration.executed_at).toLocaleString() : 'Unknown';
        const time = migration.execution_time_ms ? `${migration.execution_time_ms}ms` : 'Unknown';
        console.log(`   ${index + 1}. ${migration.name}`);
        console.log(`      Executed: ${date} (${time})`);
        if (migration.batch_id) {
          console.log(`      Batch: ${migration.batch_id}`);
        }
      });
    }

    if (pending.length > 0) {
      console.log('\n⏳ Pending Migrations:');
      pending.forEach((migration, index) => {
        console.log(`   ${index + 1}. ${migration.name}`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed Migrations:');
      failed.forEach((migration, index) => {
        console.log(`   ${index + 1}. ${migration.name}`);
        if (migration.error_message) {
          console.log(`      Error: ${migration.error_message}`);
        }
      });
    }
  }

  console.log('');
}

async function generateFileReport(
  reporter: MigrationReporter, 
  format: 'html' | 'json', 
  outputPath?: string
): Promise<void> {
  let content: string;
  let defaultExtension: string;

  if (format === 'html') {
    content = await reporter.generateHtmlReport();
    defaultExtension = 'html';
  } else {
    content = await reporter.generateJsonReport();
    defaultExtension = 'json';
  }

  if (outputPath) {
    const fullPath = resolve(process.cwd(), outputPath);
    writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Report saved to: ${fullPath}`);
  } else {
    // Output to stdout
    console.log(content);
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

  try {
    // Create migration runner and reporter
    const migrationsDir = resolve(process.cwd(), 'supabase/migrations');
    const runner = createMigrationRunner(migrationsDir);
    const reporter = new MigrationReporter(runner, options.environment);

    if (options.verbose) {
      console.log(`🔍 Generating ${options.format} report for environment: ${options.environment}`);
    }

    switch (options.format) {
      case 'console':
        await generateConsoleReport(reporter, options.verbose);
        break;
        
      case 'html':
      case 'json':
        await generateFileReport(reporter, options.format, options.output);
        break;
        
      default:
        console.error(`Unknown format: ${options.format}`);
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Report generation failed:', error instanceof Error ? error.message : error);
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