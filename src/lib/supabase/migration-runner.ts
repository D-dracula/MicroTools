/**
 * Enhanced Supabase Migration Runner
 * 
 * Provides migration execution, rollback functionality, and status tracking
 * for Supabase database schema updates.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export interface MigrationFile {
  name: string;
  path: string;
  content: string;
  checksum: string;
  timestamp: string;
}

export interface MigrationRecord {
  id: number;
  name: string;
  executed_at: string;
  checksum: string;
  execution_time_ms: number;
  rollback_sql?: string;
  batch_id?: string;
}

export interface MigrationStatus {
  name: string;
  status: 'pending' | 'executed' | 'failed' | 'rolled_back';
  executed_at?: string;
  execution_time_ms?: number;
  error_message?: string;
  checksum?: string;
  batch_id?: string;
}

export interface MigrationResult {
  success: boolean;
  executed: string[];
  failed: string[];
  skipped: string[];
  total_time_ms: number;
  batch_id: string;
}

export interface RollbackResult {
  success: boolean;
  rolled_back: string[];
  failed: string[];
  total_time_ms: number;
}

export class MigrationRunner {
  private supabase: SupabaseClient;
  private migrationsDir: string;
  private migrationTable = '_migrations';
  private rollbackTable = '_migration_rollbacks';

  constructor(
    supabaseUrl: string,
    serviceRoleKey: string,
    migrationsDir: string = 'supabase/migrations'
  ) {
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    this.migrationsDir = migrationsDir;
  }

  /**
   * Initialize migration tracking tables
   */
  async initialize(): Promise<void> {
    await this.createMigrationTables();
  }

  /**
   * Get all migration files from the migrations directory
   */
  getMigrationFiles(): MigrationFile[] {
    if (!existsSync(this.migrationsDir)) {
      throw new Error(`Migrations directory not found: ${this.migrationsDir}`);
    }

    const files = readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(file => {
      const path = join(this.migrationsDir, file);
      const content = readFileSync(path, 'utf8');
      const checksum = this.calculateChecksum(content);
      const timestamp = this.extractTimestamp(file);

      return {
        name: file,
        path,
        content,
        checksum,
        timestamp
      };
    });
  }

  /**
   * Get migration status for all files
   */
  async getMigrationStatus(): Promise<MigrationStatus[]> {
    const files = this.getMigrationFiles();
    const executed = await this.getExecutedMigrations();
    const executedMap = new Map(executed.map(m => [m.name, m]));

    return files.map(file => {
      const record = executedMap.get(file.name);
      
      if (!record) {
        return {
          name: file.name,
          status: 'pending' as const
        };
      }

      // Check if checksum matches
      if (record.checksum !== file.checksum) {
        return {
          name: file.name,
          status: 'failed' as const,
          executed_at: record.executed_at,
          execution_time_ms: record.execution_time_ms,
          error_message: 'Checksum mismatch - file has been modified',
          checksum: record.checksum,
          batch_id: record.batch_id
        };
      }

      return {
        name: file.name,
        status: 'executed' as const,
        executed_at: record.executed_at,
        execution_time_ms: record.execution_time_ms,
        checksum: record.checksum,
        batch_id: record.batch_id
      };
    });
  }

  /**
   * Run pending migrations
   */
  async runMigrations(options: {
    dryRun?: boolean;
    verbose?: boolean;
    target?: string;
  } = {}): Promise<MigrationResult> {
    const { dryRun = false, verbose = false, target } = options;
    const startTime = Date.now();
    const batchId = this.generateBatchId();

    if (verbose) {
      console.log(`🚀 Starting migration batch: ${batchId}`);
    }

    const result: MigrationResult = {
      success: true,
      executed: [],
      failed: [],
      skipped: [],
      total_time_ms: 0,
      batch_id: batchId
    };

    try {
      if (!dryRun) {
        await this.initialize();
      }

      const files = this.getMigrationFiles();
      const executed = await this.getExecutedMigrations();
      const executedNames = new Set(executed.map(m => m.name));

      // Filter migrations to run
      let migrationsToRun = files.filter(file => !executedNames.has(file.name));

      // If target specified, only run up to that migration
      if (target) {
        const targetIndex = migrationsToRun.findIndex(m => m.name === target);
        if (targetIndex === -1) {
          throw new Error(`Target migration not found: ${target}`);
        }
        migrationsToRun = migrationsToRun.slice(0, targetIndex + 1);
      }

      if (migrationsToRun.length === 0) {
        if (verbose) {
          console.log('✨ All migrations are up to date!');
        }
        return result;
      }

      if (verbose) {
        console.log(`📋 Found ${migrationsToRun.length} pending migrations`);
      }

      // Execute migrations
      for (const migration of migrationsToRun) {
        try {
          if (dryRun) {
            if (verbose) {
              console.log(`🔍 DRY RUN: Would execute ${migration.name}`);
            }
            result.skipped.push(migration.name);
          } else {
            await this.executeMigration(migration, batchId, verbose);
            result.executed.push(migration.name);
            
            if (verbose) {
              console.log(`✅ Executed: ${migration.name}`);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.failed.push(migration.name);
          result.success = false;
          
          if (verbose) {
            console.error(`❌ Failed: ${migration.name} - ${errorMessage}`);
          }
          
          // Stop on first failure
          break;
        }
      }

      result.total_time_ms = Date.now() - startTime;
      
      if (verbose) {
        console.log(`\n📊 Migration Summary:`);
        console.log(`   Executed: ${result.executed.length}`);
        console.log(`   Failed: ${result.failed.length}`);
        console.log(`   Skipped: ${result.skipped.length}`);
        console.log(`   Total time: ${result.total_time_ms}ms`);
      }

      return result;

    } catch (error) {
      result.success = false;
      result.total_time_ms = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Rollback migrations to a specific point
   */
  async rollbackMigrations(options: {
    target?: string;
    count?: number;
    verbose?: boolean;
  } = {}): Promise<RollbackResult> {
    const { target, count, verbose = false } = options;
    const startTime = Date.now();

    const result: RollbackResult = {
      success: true,
      rolled_back: [],
      failed: [],
      total_time_ms: 0
    };

    try {
      const executed = await this.getExecutedMigrations();
      executed.sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime());

      let migrationsToRollback: MigrationRecord[] = [];

      if (target) {
        // Rollback to specific migration (exclusive)
        const targetIndex = executed.findIndex(m => m.name === target);
        if (targetIndex === -1) {
          throw new Error(`Target migration not found: ${target}`);
        }
        migrationsToRollback = executed.slice(0, targetIndex);
      } else if (count) {
        // Rollback specific number of migrations
        migrationsToRollback = executed.slice(0, count);
      } else {
        throw new Error('Must specify either target migration or count');
      }

      if (migrationsToRollback.length === 0) {
        if (verbose) {
          console.log('✨ No migrations to rollback!');
        }
        return result;
      }

      if (verbose) {
        console.log(`🔄 Rolling back ${migrationsToRollback.length} migrations`);
      }

      // Execute rollbacks in reverse order
      for (const migration of migrationsToRollback) {
        try {
          await this.rollbackMigration(migration, verbose);
          result.rolled_back.push(migration.name);
          
          if (verbose) {
            console.log(`✅ Rolled back: ${migration.name}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.failed.push(migration.name);
          result.success = false;
          
          if (verbose) {
            console.error(`❌ Rollback failed: ${migration.name} - ${errorMessage}`);
          }
          
          // Stop on first failure
          break;
        }
      }

      result.total_time_ms = Date.now() - startTime;
      
      if (verbose) {
        console.log(`\n📊 Rollback Summary:`);
        console.log(`   Rolled back: ${result.rolled_back.length}`);
        console.log(`   Failed: ${result.failed.length}`);
        console.log(`   Total time: ${result.total_time_ms}ms`);
      }

      return result;

    } catch (error) {
      result.success = false;
      result.total_time_ms = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Generate rollback SQL for a migration
   */
  generateRollbackSql(migrationContent: string): string {
    // This is a basic implementation - in practice, you'd want more sophisticated
    // rollback generation based on the actual SQL operations
    const lines = migrationContent.split('\n');
    const rollbackStatements: string[] = [];

    // Look for CREATE TABLE statements and generate DROP TABLE
    for (const line of lines) {
      const trimmed = line.trim().toUpperCase();
      
      if (trimmed.startsWith('CREATE TABLE')) {
        const match = line.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+\.\w+|\w+)/i);
        if (match) {
          rollbackStatements.push(`DROP TABLE IF EXISTS ${match[1]} CASCADE;`);
        }
      }
      
      if (trimmed.startsWith('CREATE INDEX')) {
        const match = line.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
        if (match) {
          rollbackStatements.push(`DROP INDEX IF EXISTS ${match[1]};`);
        }
      }
      
      if (trimmed.startsWith('CREATE FUNCTION')) {
        const match = line.match(/CREATE\s+(?:OR REPLACE\s+)?FUNCTION\s+(\w+\.\w+|\w+)/i);
        if (match) {
          rollbackStatements.push(`DROP FUNCTION IF EXISTS ${match[1]} CASCADE;`);
        }
      }
      
      if (trimmed.startsWith('CREATE VIEW')) {
        const match = line.match(/CREATE\s+(?:MATERIALIZED\s+)?VIEW\s+(\w+\.\w+|\w+)/i);
        if (match) {
          rollbackStatements.push(`DROP VIEW IF EXISTS ${match[1]} CASCADE;`);
        }
      }
    }

    return rollbackStatements.reverse().join('\n');
  }

  /**
   * Create migration tracking tables
   */
  private async createMigrationTables(): Promise<void> {
    const migrationTableSql = `
      CREATE TABLE IF NOT EXISTS public.${this.migrationTable} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum TEXT NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        rollback_sql TEXT,
        batch_id VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_migrations_name ON public.${this.migrationTable}(name);
      CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON public.${this.migrationTable}(executed_at);
      CREATE INDEX IF NOT EXISTS idx_migrations_batch_id ON public.${this.migrationTable}(batch_id);
    `;

    const rollbackTableSql = `
      CREATE TABLE IF NOT EXISTS public.${this.rollbackTable} (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        rolled_back_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        rollback_sql TEXT NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        batch_id VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_rollbacks_migration_name ON public.${this.rollbackTable}(migration_name);
      CREATE INDEX IF NOT EXISTS idx_rollbacks_rolled_back_at ON public.${this.rollbackTable}(rolled_back_at);
    `;

    await this.executeRawSql(migrationTableSql);
    await this.executeRawSql(rollbackTableSql);
  }

  /**
   * Get executed migrations from database
   */
  private async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const { data, error } = await this.supabase
      .from(this.migrationTable)
      .select('*')
      .order('executed_at');

    if (error) {
      throw new Error(`Failed to fetch executed migrations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(
    migration: MigrationFile,
    batchId: string,
    verbose: boolean = false
  ): Promise<void> {
    const startTime = Date.now();

    if (verbose) {
      console.log(`📄 Executing: ${migration.name}`);
    }

    // Generate rollback SQL
    const rollbackSql = this.generateRollbackSql(migration.content);

    // Execute the migration
    await this.executeRawSql(migration.content);

    const executionTime = Date.now() - startTime;

    // Record the migration
    const { error } = await this.supabase
      .from(this.migrationTable)
      .insert({
        name: migration.name,
        checksum: migration.checksum,
        execution_time_ms: executionTime,
        rollback_sql: rollbackSql,
        batch_id: batchId
      });

    if (error) {
      throw new Error(`Failed to record migration: ${error.message}`);
    }
  }

  /**
   * Rollback a single migration
   */
  private async rollbackMigration(
    migration: MigrationRecord,
    verbose: boolean = false
  ): Promise<void> {
    const startTime = Date.now();

    if (verbose) {
      console.log(`🔄 Rolling back: ${migration.name}`);
    }

    if (!migration.rollback_sql) {
      throw new Error(`No rollback SQL available for migration: ${migration.name}`);
    }

    // Execute rollback SQL
    await this.executeRawSql(migration.rollback_sql);

    const executionTime = Date.now() - startTime;

    // Record the rollback
    const { error: rollbackError } = await this.supabase
      .from(this.rollbackTable)
      .insert({
        migration_name: migration.name,
        rollback_sql: migration.rollback_sql,
        execution_time_ms: executionTime,
        batch_id: migration.batch_id
      });

    if (rollbackError) {
      throw new Error(`Failed to record rollback: ${rollbackError.message}`);
    }

    // Remove from migrations table
    const { error: deleteError } = await this.supabase
      .from(this.migrationTable)
      .delete()
      .eq('name', migration.name);

    if (deleteError) {
      throw new Error(`Failed to remove migration record: ${deleteError.message}`);
    }
  }

  /**
   * Execute raw SQL
   */
  private async executeRawSql(sql: string): Promise<void> {
    const { error } = await this.supabase.rpc('exec_sql', { sql });
    
    if (error) {
      throw new Error(`SQL execution failed: ${error.message}`);
    }
  }

  /**
   * Calculate checksum for content
   */
  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Extract timestamp from migration filename
   */
  private extractTimestamp(filename: string): string {
    const match = filename.match(/^(\d{14})/);
    return match ? match[1] : '';
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create migration runner instance from environment variables
 */
export function createMigrationRunner(migrationsDir?: string): MigrationRunner {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return new MigrationRunner(supabaseUrl, serviceRoleKey, migrationsDir);
}