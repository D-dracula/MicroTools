/**
 * Migration Management Utilities
 * 
 * Pure utility functions for migration statistics calculation that can be tested independently.
 * These functions implement the core logic for migration status tracking and statistics.
 * 
 * Requirements: 6.1, 6.2
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Migration status values
 */
export type MigrationStatusType = 'executed' | 'pending' | 'failed' | 'rolled_back';

/**
 * Migration record from database/file system
 */
export interface MigrationRecord {
  name: string;
  status: MigrationStatusType;
  executedAt?: string | null;
  executionTimeMs?: number | null;
  batchId?: string | null;
  errorMessage?: string | null;
  checksum?: string | null;
}

/**
 * Migration statistics
 * Requirements: 6.2
 */
export interface MigrationStats {
  total: number;
  executed: number;
  pending: number;
  failed: number;
  rolledBack: number;
}

/**
 * Migration list item for display
 */
export interface MigrationListItem {
  name: string;
  status: MigrationStatusType;
  executedAt?: string;
  executionTimeMs?: number;
  batchId?: string;
  errorMessage?: string;
  checksum?: string;
}

// ============================================================================
// Property 11: Migration Statistics Accuracy
// Requirements: 6.1, 6.2
// ============================================================================

/**
 * Calculate migration statistics from a list of migrations
 * 
 * For any set of migrations, calculates statistics (total, executed, pending, failed, rolledBack)
 * that accurately reflect the migration data.
 * 
 * @param migrations - Array of migration records
 * @returns Migration statistics
 */
export function calculateMigrationStats(migrations: MigrationRecord[]): MigrationStats {
  return {
    total: migrations.length,
    executed: migrations.filter(m => m.status === 'executed').length,
    pending: migrations.filter(m => m.status === 'pending').length,
    failed: migrations.filter(m => m.status === 'failed').length,
    rolledBack: migrations.filter(m => m.status === 'rolled_back').length,
  };
}

/**
 * Verify migration statistics
 * 
 * Manually calculates expected statistics and compares with provided stats.
 * 
 * @param migrations - List of migrations
 * @param stats - Statistics to verify
 * @returns Verification result with any errors
 */
export function verifyMigrationStats(
  migrations: MigrationRecord[],
  stats: MigrationStats
): { isValid: boolean; errors: string[]; expected: MigrationStats } {
  const expected = calculateMigrationStats(migrations);
  const errors: string[] = [];

  if (stats.total !== expected.total) {
    errors.push(`Total mismatch: expected ${expected.total}, got ${stats.total}`);
  }

  if (stats.executed !== expected.executed) {
    errors.push(`Executed mismatch: expected ${expected.executed}, got ${stats.executed}`);
  }

  if (stats.pending !== expected.pending) {
    errors.push(`Pending mismatch: expected ${expected.pending}, got ${stats.pending}`);
  }

  if (stats.failed !== expected.failed) {
    errors.push(`Failed mismatch: expected ${expected.failed}, got ${stats.failed}`);
  }

  if (stats.rolledBack !== expected.rolledBack) {
    errors.push(`Rolled back mismatch: expected ${expected.rolledBack}, got ${stats.rolledBack}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    expected,
  };
}

/**
 * Count migrations by status
 * 
 * @param migrations - List of migrations
 * @param status - Status to count
 * @returns Count of migrations with the specified status
 */
export function countMigrationsByStatus(
  migrations: MigrationRecord[],
  status: MigrationStatusType
): number {
  return migrations.filter(m => m.status === status).length;
}

/**
 * Check if statistics sum equals total
 * 
 * For any valid migration statistics, the sum of executed, pending, failed,
 * and rolledBack should equal total.
 * 
 * @param stats - Migration statistics to validate
 * @returns True if the sum equals total
 */
export function validateStatisticsSum(stats: MigrationStats): boolean {
  const sum = stats.executed + stats.pending + stats.failed + stats.rolledBack;
  return sum === stats.total;
}

/**
 * Get migrations by status
 * 
 * @param migrations - List of migrations
 * @param status - Status to filter by
 * @returns Filtered list of migrations
 */
export function getMigrationsByStatus(
  migrations: MigrationRecord[],
  status: MigrationStatusType
): MigrationRecord[] {
  return migrations.filter(m => m.status === status);
}

/**
 * Format migration list for display
 * 
 * Converts migration records to display format, handling optional fields.
 * 
 * @param migrations - List of migration records
 * @returns Formatted list for display
 */
export function formatMigrationList(migrations: MigrationRecord[]): MigrationListItem[] {
  return migrations.map(m => {
    const item: MigrationListItem = {
      name: m.name,
      status: m.status,
    };

    if (m.executedAt) {
      item.executedAt = m.executedAt;
    }

    if (m.executionTimeMs !== undefined && m.executionTimeMs !== null) {
      item.executionTimeMs = m.executionTimeMs;
    }

    if (m.batchId) {
      item.batchId = m.batchId;
    }

    if (m.errorMessage) {
      item.errorMessage = m.errorMessage;
    }

    if (m.checksum) {
      item.checksum = m.checksum;
    }

    return item;
  });
}

/**
 * Get the last batch ID from executed migrations
 * 
 * @param migrations - List of migrations
 * @returns The most recent batch ID or undefined
 */
export function getLastBatchId(migrations: MigrationRecord[]): string | undefined {
  const executedMigrations = migrations
    .filter(m => m.status === 'executed' && m.batchId)
    .sort((a, b) => {
      const dateA = a.executedAt ? new Date(a.executedAt).getTime() : 0;
      const dateB = b.executedAt ? new Date(b.executedAt).getTime() : 0;
      return dateB - dateA;
    });

  return executedMigrations[0]?.batchId ?? undefined;
}

/**
 * Sort migrations by execution date (most recent first)
 * 
 * @param migrations - List of migrations to sort
 * @returns Sorted list (does not mutate original)
 */
export function sortMigrationsByExecutionDate(
  migrations: MigrationRecord[]
): MigrationRecord[] {
  return [...migrations].sort((a, b) => {
    const dateA = a.executedAt ? new Date(a.executedAt).getTime() : 0;
    const dateB = b.executedAt ? new Date(b.executedAt).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Sort migrations by name (alphabetically)
 * 
 * @param migrations - List of migrations to sort
 * @returns Sorted list (does not mutate original)
 */
export function sortMigrationsByName(
  migrations: MigrationRecord[]
): MigrationRecord[] {
  return [...migrations].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Calculate total execution time for all executed migrations
 * 
 * @param migrations - List of migrations
 * @returns Total execution time in milliseconds
 */
export function calculateTotalExecutionTime(migrations: MigrationRecord[]): number {
  return migrations
    .filter(m => m.status === 'executed' && m.executionTimeMs !== undefined && m.executionTimeMs !== null)
    .reduce((sum, m) => sum + (m.executionTimeMs ?? 0), 0);
}

/**
 * Get migrations in a specific batch
 * 
 * @param migrations - List of migrations
 * @param batchId - Batch ID to filter by
 * @returns Migrations in the specified batch
 */
export function getMigrationsByBatch(
  migrations: MigrationRecord[],
  batchId: string
): MigrationRecord[] {
  return migrations.filter(m => m.batchId === batchId);
}

/**
 * Check if there are any pending migrations
 * 
 * @param migrations - List of migrations
 * @returns True if there are pending migrations
 */
export function hasPendingMigrations(migrations: MigrationRecord[]): boolean {
  return migrations.some(m => m.status === 'pending');
}

/**
 * Check if there are any failed migrations
 * 
 * @param migrations - List of migrations
 * @returns True if there are failed migrations
 */
export function hasFailedMigrations(migrations: MigrationRecord[]): boolean {
  return migrations.some(m => m.status === 'failed');
}

/**
 * Get unique batch IDs from migrations
 * 
 * @param migrations - List of migrations
 * @returns Array of unique batch IDs
 */
export function getUniqueBatchIds(migrations: MigrationRecord[]): string[] {
  const batchIds = migrations
    .filter(m => m.batchId)
    .map(m => m.batchId as string);
  
  return [...new Set(batchIds)];
}
