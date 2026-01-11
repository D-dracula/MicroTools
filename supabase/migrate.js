#!/usr/bin/env node

/**
 * Supabase Migration Runner
 * 
 * This script helps run Supabase migrations in the correct order.
 * It can be used for both development and production deployments.
 * 
 * Usage:
 *   node supabase/migrate.js [options]
 * 
 * Options:
 *   --dry-run    Show what would be executed without running
 *   --verbose    Show detailed output
 *   --help       Show this help message
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATION_TABLE = '_migrations';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose') || isDryRun;
const showHelp = args.includes('--help');

if (showHelp) {
  console.log(`
Supabase Migration Runner

Usage: node supabase/migrate.js [options]

Options:
  --dry-run    Show what would be executed without running
  --verbose    Show detailed output
  --help       Show this help message

Environment Variables:
  SUPABASE_URL              Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Service role key for admin operations
`);
  process.exit(0);
}

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Get list of migration files in order
 */
function getMigrationFiles() {
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Files should be named with timestamps for proper ordering
    
    return files.map(file => ({
      name: file,
      path: path.join(MIGRATIONS_DIR, file),
      content: fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
    }));
  } catch (error) {
    console.error('❌ Error reading migrations directory:', error.message);
    process.exit(1);
  }
}

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.${MIGRATION_TABLE} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum TEXT,
        execution_time_ms INTEGER
      );
      
      CREATE INDEX IF NOT EXISTS idx_migrations_name ON public.${MIGRATION_TABLE}(name);
      CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON public.${MIGRATION_TABLE}(executed_at);
    `
  });

  if (error) {
    console.error('❌ Error creating migrations table:', error.message);
    process.exit(1);
  }
}

/**
 * Get list of already executed migrations
 */
async function getExecutedMigrations() {
  const { data, error } = await supabase
    .from(MIGRATION_TABLE)
    .select('name, executed_at, checksum')
    .order('executed_at');

  if (error) {
    console.error('❌ Error fetching executed migrations:', error.message);
    process.exit(1);
  }

  return data || [];
}

/**
 * Calculate checksum for migration content
 */
function calculateChecksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Execute a single migration
 */
async function executeMigration(migration) {
  const startTime = Date.now();
  
  if (isVerbose) {
    console.log(`\n📄 Executing migration: ${migration.name}`);
    console.log(`   File: ${migration.path}`);
    console.log(`   Size: ${migration.content.length} characters`);
  }

  if (isDryRun) {
    console.log(`\n🔍 DRY RUN - Would execute migration: ${migration.name}`);
    console.log('--- SQL Content ---');
    console.log(migration.content.substring(0, 500) + (migration.content.length > 500 ? '...' : ''));
    console.log('--- End SQL Content ---\n');
    return;
  }

  // Execute the migration SQL
  const { error: sqlError } = await supabase.rpc('exec_sql', {
    sql: migration.content
  });

  if (sqlError) {
    console.error(`❌ Error executing migration ${migration.name}:`, sqlError.message);
    process.exit(1);
  }

  const executionTime = Date.now() - startTime;
  const checksum = calculateChecksum(migration.content);

  // Record the migration as executed
  const { error: recordError } = await supabase
    .from(MIGRATION_TABLE)
    .insert({
      name: migration.name,
      checksum: checksum,
      execution_time_ms: executionTime
    });

  if (recordError) {
    console.error(`❌ Error recording migration ${migration.name}:`, recordError.message);
    process.exit(1);
  }

  if (isVerbose) {
    console.log(`✅ Migration completed in ${executionTime}ms`);
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('🚀 Starting Supabase migrations...\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Create migrations table if needed
    if (!isDryRun) {
      await createMigrationsTable();
    }

    // Get migration files and executed migrations
    const migrationFiles = getMigrationFiles();
    const executedMigrations = isDryRun ? [] : await getExecutedMigrations();
    const executedNames = new Set(executedMigrations.map(m => m.name));

    console.log(`📁 Found ${migrationFiles.length} migration files`);
    console.log(`✅ ${executedMigrations.length} migrations already executed`);

    // Filter out already executed migrations
    const pendingMigrations = migrationFiles.filter(migration => {
      const isExecuted = executedNames.has(migration.name);
      
      if (isExecuted && isVerbose) {
        console.log(`⏭️  Skipping already executed: ${migration.name}`);
      }
      
      return !isExecuted;
    });

    if (pendingMigrations.length === 0) {
      console.log('\n✨ All migrations are up to date!');
      return;
    }

    console.log(`\n🔄 Executing ${pendingMigrations.length} pending migrations...\n`);

    // Execute pending migrations in order
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
      console.log(`✅ ${migration.name}`);
    }

    console.log(`\n🎉 Successfully executed ${pendingMigrations.length} migrations!`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

/**
 * Create exec_sql function if it doesn't exist
 * This is needed to execute raw SQL from the client
 */
async function ensureExecSqlFunction() {
  if (isDryRun) return;

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  }).catch(() => {
    // Function might not exist yet, create it using a different approach
    return supabase.from('_dummy_table_that_does_not_exist').select('*').limit(1);
  });

  // If the function doesn't exist, we need to create it manually
  // This would typically be done through Supabase dashboard or CLI
  if (error && error.message.includes('function "exec_sql" does not exist')) {
    console.log('⚠️  exec_sql function not found. Please create it manually in Supabase dashboard:');
    console.log(`
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('\nThen run this migration script again.');
    process.exit(1);
  }
}

// Run the migrations
(async () => {
  try {
    await ensureExecSqlFunction();
    await runMigrations();
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
})();