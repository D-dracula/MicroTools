'use client';

/**
 * Migration Dashboard Component
 * 
 * Provides a web interface for viewing migration status,
 * running migrations, and performing rollbacks.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MigrationStatus, 
  MigrationResult, 
  RollbackResult,
  createMigrationRunner 
} from '@/lib/supabase/migration-runner';

interface MigrationDashboardProps {
  className?: string;
}

export function MigrationDashboard({ className }: MigrationDashboardProps) {
  const [migrations, setMigrations] = useState<MigrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<MigrationResult | RollbackResult | null>(null);

  // Load migration status
  const loadMigrationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const runner = createMigrationRunner();
      const status = await runner.getMigrationStatus();
      setMigrations(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load migration status');
    } finally {
      setLoading(false);
    }
  };

  // Run pending migrations
  const runMigrations = async (dryRun: boolean = false) => {
    try {
      setExecuting(true);
      setError(null);
      
      const runner = createMigrationRunner();
      const result = await runner.runMigrations({ dryRun, verbose: true });
      
      setLastResult(result);
      
      if (!dryRun) {
        // Reload status after successful migration
        await loadMigrationStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setExecuting(false);
    }
  };

  // Rollback migrations
  const rollbackMigrations = async (count: number) => {
    if (!confirm(`Are you sure you want to rollback the last ${count} migration(s)?`)) {
      return;
    }

    try {
      setExecuting(true);
      setError(null);
      
      const runner = createMigrationRunner();
      const result = await runner.rollbackMigrations({ count, verbose: true });
      
      setLastResult(result);
      
      // Reload status after rollback
      await loadMigrationStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed');
    } finally {
      setExecuting(false);
    }
  };

  // Load status on mount
  useEffect(() => {
    loadMigrationStatus();
  }, []);

  // Calculate summary stats
  const summary = {
    total: migrations.length,
    executed: migrations.filter(m => m.status === 'executed').length,
    pending: migrations.filter(m => m.status === 'pending').length,
    failed: migrations.filter(m => m.status === 'failed').length
  };

  const getStatusBadge = (status: MigrationStatus['status']) => {
    switch (status) {
      case 'executed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Executed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'rolled_back':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Rolled Back</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Migration Dashboard</h2>
            <p className="text-muted-foreground">
              Manage database schema migrations and rollbacks
            </p>
          </div>
          <Button 
            onClick={() => loadMigrationStatus()} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">❌</span>
              <span className="text-red-800 font-medium">Error:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </Card>
        )}

        {/* Last Result Display */}
        {lastResult && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Last Operation Result</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className={lastResult.success ? 'text-green-600' : 'text-red-600'}>
                  {lastResult.success ? '✅' : '❌'}
                </span>
                <span className="font-medium">
                  {lastResult.success ? 'Success' : 'Failed'}
                </span>
              </div>
              
              {'executed' in lastResult && (
                <>
                  <div>Executed: {lastResult.executed.length} migrations</div>
                  <div>Failed: {lastResult.failed.length} migrations</div>
                  <div>Skipped: {lastResult.skipped.length} migrations</div>
                  {lastResult.batch_id && <div>Batch ID: {lastResult.batch_id}</div>}
                </>
              )}
              
              {'rolled_back' in lastResult && (
                <>
                  <div>Rolled back: {lastResult.rolled_back.length} migrations</div>
                  <div>Failed: {lastResult.failed.length} rollbacks</div>
                </>
              )}
              
              <div>Total time: {formatDuration(lastResult.total_time_ms)}</div>
            </div>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-sm text-muted-foreground">Total Migrations</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{summary.executed}</div>
            <div className="text-sm text-muted-foreground">Executed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{summary.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => runMigrations(false)}
            disabled={executing || summary.pending === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {executing ? 'Running...' : `Run ${summary.pending} Pending Migration(s)`}
          </Button>
          
          <Button 
            onClick={() => runMigrations(true)}
            disabled={executing || summary.pending === 0}
            variant="outline"
          >
            Dry Run
          </Button>
          
          <Button 
            onClick={() => rollbackMigrations(1)}
            disabled={executing || summary.executed === 0}
            variant="destructive"
          >
            Rollback Last Migration
          </Button>
          
          <Button 
            onClick={() => rollbackMigrations(3)}
            disabled={executing || summary.executed < 3}
            variant="destructive"
          >
            Rollback Last 3
          </Button>
        </div>

        {/* Migration List */}
        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold">Migration Files</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading migrations...
            </div>
          ) : migrations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No migration files found
            </div>
          ) : (
            <div className="divide-y">
              {migrations.map((migration, index) => (
                <div key={migration.name} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        <span className="font-medium">{migration.name}</span>
                        {getStatusBadge(migration.status)}
                      </div>
                      
                      {migration.status === 'executed' && (
                        <div className="mt-2 text-sm text-muted-foreground space-y-1">
                          <div>Executed: {formatDate(migration.executed_at)}</div>
                          <div>Duration: {formatDuration(migration.execution_time_ms)}</div>
                          {migration.batch_id && (
                            <div>Batch: {migration.batch_id}</div>
                          )}
                        </div>
                      )}
                      
                      {migration.status === 'failed' && migration.error_message && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {migration.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Help Text */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Migration Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Always run a dry run first to preview changes</li>
            <li>• Migrations are executed in filename order</li>
            <li>• Rollbacks are performed in reverse order</li>
            <li>• Each migration generates automatic rollback SQL</li>
            <li>• Use the CLI for production deployments</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}