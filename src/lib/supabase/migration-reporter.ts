/**
 * Migration Status Reporter
 * 
 * Provides utilities for generating migration reports and monitoring
 * migration health across environments.
 */

import { MigrationRunner, MigrationStatus, MigrationRecord } from './migration-runner';

export interface MigrationReport {
  environment: string;
  timestamp: string;
  summary: {
    total: number;
    executed: number;
    pending: number;
    failed: number;
  };
  migrations: MigrationStatus[];
  health: {
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
    recommendations: string[];
  };
  performance: {
    averageExecutionTime: number;
    slowestMigration?: {
      name: string;
      executionTime: number;
    };
    totalMigrationTime: number;
  };
}

export interface EnvironmentComparison {
  environments: string[];
  differences: {
    environment: string;
    missingMigrations: string[];
    extraMigrations: string[];
    checksumMismatches: Array<{
      name: string;
      expectedChecksum: string;
      actualChecksum: string;
    }>;
  }[];
  recommendations: string[];
}

export class MigrationReporter {
  private runner: MigrationRunner;
  private environment: string;

  constructor(runner: MigrationRunner, environment: string = 'unknown') {
    this.runner = runner;
    this.environment = environment;
  }

  /**
   * Generate comprehensive migration report
   */
  async generateReport(): Promise<MigrationReport> {
    const status = await this.runner.getMigrationStatus();
    const files = this.runner.getMigrationFiles();
    
    const summary = {
      total: status.length,
      executed: status.filter(m => m.status === 'executed').length,
      pending: status.filter(m => m.status === 'pending').length,
      failed: status.filter(m => m.status === 'failed').length
    };

    const health = this.analyzeHealth(status);
    const performance = this.analyzePerformance(status);

    return {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      summary,
      migrations: status,
      health,
      performance
    };
  }

  /**
   * Generate HTML report
   */
  async generateHtmlReport(): Promise<string> {
    const report = await this.generateReport();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Migration Report - ${report.environment}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #64748b; font-size: 0.9em; }
        .health-status { padding: 10px; border-radius: 6px; margin-bottom: 20px; }
        .health-healthy { background: #dcfce7; border: 1px solid #16a34a; color: #15803d; }
        .health-warning { background: #fef3c7; border: 1px solid #d97706; color: #92400e; }
        .health-error { background: #fee2e2; border: 1px solid #dc2626; color: #991b1b; }
        .migration-list { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
        .migration-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
        .migration-item:last-child { border-bottom: none; }
        .migration-name { font-family: monospace; font-size: 0.9em; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 500; }
        .status-executed { background: #dcfce7; color: #15803d; }
        .status-pending { background: #f1f5f9; color: #475569; }
        .status-failed { background: #fee2e2; color: #991b1b; }
        .performance-section { margin-top: 30px; }
        .performance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Migration Report</h1>
            <p>Environment: ${report.environment} | Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="content">
            <!-- Summary -->
            <div class="summary">
                <div class="stat-card">
                    <div class="stat-number">${report.summary.total}</div>
                    <div class="stat-label">Total Migrations</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #16a34a;">${report.summary.executed}</div>
                    <div class="stat-label">Executed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #2563eb;">${report.summary.pending}</div>
                    <div class="stat-label">Pending</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #dc2626;">${report.summary.failed}</div>
                    <div class="stat-label">Failed</div>
                </div>
            </div>

            <!-- Health Status -->
            <div class="health-status health-${report.health.status}">
                <h3>Health Status: ${report.health.status.toUpperCase()}</h3>
                ${report.health.issues.length > 0 ? `
                    <h4>Issues:</h4>
                    <ul>
                        ${report.health.issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                ` : ''}
                ${report.health.recommendations.length > 0 ? `
                    <h4>Recommendations:</h4>
                    <ul>
                        ${report.health.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>

            <!-- Performance -->
            <div class="performance-section">
                <h3>Performance Metrics</h3>
                <div class="performance-grid">
                    <div class="stat-card">
                        <div class="stat-number">${report.performance.averageExecutionTime.toFixed(0)}ms</div>
                        <div class="stat-label">Average Execution Time</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${(report.performance.totalMigrationTime / 1000).toFixed(1)}s</div>
                        <div class="stat-label">Total Migration Time</div>
                    </div>
                    ${report.performance.slowestMigration ? `
                        <div class="stat-card">
                            <div class="stat-number">${report.performance.slowestMigration.executionTime}ms</div>
                            <div class="stat-label">Slowest Migration</div>
                            <div style="font-size: 0.8em; margin-top: 5px;">${report.performance.slowestMigration.name}</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Migration List -->
            <h3>Migration Details</h3>
            <div class="migration-list">
                ${report.migrations.map((migration, index) => `
                    <div class="migration-item">
                        <div>
                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; margin-right: 10px;">${index + 1}</span>
                            <span class="migration-name">${migration.name}</span>
                        </div>
                        <div>
                            <span class="status-badge status-${migration.status}">${migration.status}</span>
                            ${migration.execution_time_ms ? `<span style="margin-left: 10px; font-size: 0.8em; color: #64748b;">${migration.execution_time_ms}ms</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate JSON report for API consumption
   */
  async generateJsonReport(): Promise<string> {
    const report = await this.generateReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Analyze migration health
   */
  private analyzeHealth(migrations: MigrationStatus[]): MigrationReport['health'] {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const failed = migrations.filter(m => m.status === 'failed');
    const pending = migrations.filter(m => m.status === 'pending');
    const checksumMismatches = migrations.filter(m => 
      m.status === 'failed' && m.error_message?.includes('checksum')
    );

    // Check for failed migrations
    if (failed.length > 0) {
      issues.push(`${failed.length} migration(s) have failed`);
      recommendations.push('Review failed migrations and fix any issues before proceeding');
    }

    // Check for checksum mismatches
    if (checksumMismatches.length > 0) {
      issues.push(`${checksumMismatches.length} migration(s) have checksum mismatches`);
      recommendations.push('Migration files may have been modified after execution');
    }

    // Check for large number of pending migrations
    if (pending.length > 5) {
      issues.push(`${pending.length} migrations are pending execution`);
      recommendations.push('Consider running migrations to keep database up to date');
    }

    // Determine overall health status
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    
    if (failed.length > 0 || checksumMismatches.length > 0) {
      status = 'error';
    } else if (pending.length > 5) {
      status = 'warning';
    }

    return { status, issues, recommendations };
  }

  /**
   * Analyze migration performance
   */
  private analyzePerformance(migrations: MigrationStatus[]): MigrationReport['performance'] {
    const executed = migrations.filter(m => m.status === 'executed' && m.execution_time_ms);
    
    if (executed.length === 0) {
      return {
        averageExecutionTime: 0,
        totalMigrationTime: 0
      };
    }

    const executionTimes = executed.map(m => m.execution_time_ms!);
    const totalTime = executionTimes.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / executionTimes.length;

    const slowest = executed.reduce((prev, current) => 
      (current.execution_time_ms! > (prev?.execution_time_ms || 0)) ? current : prev
    );

    return {
      averageExecutionTime: averageTime,
      totalMigrationTime: totalTime,
      slowestMigration: slowest ? {
        name: slowest.name,
        executionTime: slowest.execution_time_ms!
      } : undefined
    };
  }

  /**
   * Compare migrations across environments
   */
  static async compareEnvironments(
    environments: Array<{ name: string; runner: MigrationRunner }>
  ): Promise<EnvironmentComparison> {
    const envStatuses = await Promise.all(
      environments.map(async env => ({
        name: env.name,
        status: await env.runner.getMigrationStatus()
      }))
    );

    // Use first environment as baseline
    const baseline = envStatuses[0];
    const baselineMigrations = new Set(baseline.status.map(m => m.name));
    const baselineChecksums = new Map(
      baseline.status
        .filter(m => m.checksum)
        .map(m => [m.name, m.checksum!])
    );

    const differences = envStatuses.slice(1).map(env => {
      const envMigrations = new Set(env.status.map(m => m.name));
      const envChecksums = new Map(
        env.status
          .filter(m => m.checksum)
          .map(m => [m.name, m.checksum!])
      );

      const missingMigrations = Array.from(baselineMigrations)
        .filter(name => !envMigrations.has(name));

      const extraMigrations = Array.from(envMigrations)
        .filter(name => !baselineMigrations.has(name));

      const checksumMismatches = Array.from(baselineChecksums.entries())
        .filter(([name, checksum]) => {
          const envChecksum = envChecksums.get(name);
          return envChecksum && envChecksum !== checksum;
        })
        .map(([name, expectedChecksum]) => ({
          name,
          expectedChecksum,
          actualChecksum: envChecksums.get(name)!
        }));

      return {
        environment: env.name,
        missingMigrations,
        extraMigrations,
        checksumMismatches
      };
    });

    const recommendations: string[] = [];
    
    if (differences.some(d => d.missingMigrations.length > 0)) {
      recommendations.push('Some environments are missing migrations - run migrations to sync');
    }
    
    if (differences.some(d => d.extraMigrations.length > 0)) {
      recommendations.push('Some environments have extra migrations - check for inconsistencies');
    }
    
    if (differences.some(d => d.checksumMismatches.length > 0)) {
      recommendations.push('Checksum mismatches detected - migration files may have been modified');
    }

    return {
      environments: environments.map(e => e.name),
      differences,
      recommendations
    };
  }
}