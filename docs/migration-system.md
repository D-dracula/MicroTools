# Enhanced Migration System

This document describes the enhanced migration system for Supabase database schema management, including migration execution, rollback functionality, and status tracking.

## Overview

The enhanced migration system provides:

- **Migration Execution**: Run pending migrations with proper tracking
- **Rollback Functionality**: Rollback migrations to previous states
- **Status Tracking**: Monitor migration status and health
- **Batch Management**: Group migrations into batches for better tracking
- **Reporting**: Generate comprehensive migration reports
- **Web Dashboard**: Visual interface for migration management
- **CLI Tools**: Command-line interface for all operations

## Architecture

```
Migration System
├── Core Components
│   ├── MigrationRunner (src/lib/supabase/migration-runner.ts)
│   ├── MigrationReporter (src/lib/supabase/migration-reporter.ts)
│   └── Migration Dashboard (src/components/admin/migration-dashboard.tsx)
├── CLI Scripts
│   ├── migrate.ts (Enhanced migration CLI)
│   └── migration-report.ts (Report generator)
├── API Endpoints
│   └── /api/admin/migrations (Web API for dashboard)
└── Database Tables
    ├── _migrations (Migration tracking)
    └── _migration_rollbacks (Rollback history)
```

## Database Schema

### Migration Tracking Table

```sql
CREATE TABLE public._migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  rollback_sql TEXT,
  batch_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Rollback History Table

```sql
CREATE TABLE public._migration_rollbacks (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL,
  rolled_back_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rollback_sql TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  batch_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## CLI Usage

### Basic Migration Commands

```bash
# Run all pending migrations
npm run migrate

# Show migration status
npm run migrate:status

# Dry run (preview what would be executed)
npm run migrate:dry-run

# Run migrations with verbose output
npm run migrate -- --verbose
```

### Rollback Commands

```bash
# Rollback last migration
npm run migrate:rollback -- 1

# Rollback last 3 migrations
npm run migrate:rollback -- 3

# Rollback to specific migration (exclusive)
npm run migrate:rollback-to -- 20260111000002_row_level_security.sql
```

### Report Generation

```bash
# Generate console report
npm run migrate:report

# Generate HTML report
npm run migrate:report:html

# Generate JSON report
npm run migrate:report:json

# Save report to file
npm run migrate:report -- --html --output migration-report.html

# Generate report for specific environment
npm run migrate:report -- --environment production
```

## Programmatic Usage

### Basic Migration Operations

```typescript
import { createMigrationRunner } from '@/lib/supabase/migration-runner';

// Create runner
const runner = createMigrationRunner();

// Run migrations
const result = await runner.runMigrations({
  dryRun: false,
  verbose: true,
  target: 'specific-migration.sql' // Optional
});

// Check status
const status = await runner.getMigrationStatus();

// Rollback migrations
const rollbackResult = await runner.rollbackMigrations({
  count: 2, // Rollback last 2 migrations
  verbose: true
});
```

### Migration Reporting

```typescript
import { MigrationReporter } from '@/lib/supabase/migration-reporter';

// Create reporter
const reporter = new MigrationReporter(runner, 'production');

// Generate comprehensive report
const report = await reporter.generateReport();

// Generate HTML report
const htmlReport = await reporter.generateHtmlReport();

// Compare environments
const comparison = await MigrationReporter.compareEnvironments([
  { name: 'development', runner: devRunner },
  { name: 'production', runner: prodRunner }
]);
```

## Web Dashboard

The migration dashboard provides a visual interface for managing migrations:

### Features

- **Status Overview**: Visual summary of migration status
- **Migration List**: Detailed view of all migrations with status badges
- **Action Buttons**: Run migrations, perform rollbacks
- **Real-time Updates**: Live status updates during operations
- **Error Display**: Clear error messages and troubleshooting guidance

### Access

The dashboard is available at `/admin/migrations` (requires admin authentication).

```typescript
import { MigrationDashboard } from '@/components/admin/migration-dashboard';

// Use in admin page
<MigrationDashboard className="max-w-6xl mx-auto" />
```

## Migration File Structure

### File Naming Convention

```
YYYYMMDDHHMMSS_description.sql
```

Examples:
- `20260111000001_initial_schema.sql`
- `20260111000002_row_level_security.sql`
- `20260111000003_performance_optimization.sql`

### Migration File Content

```sql
-- Migration: Add user preferences table
-- Description: Adds table for storing user preferences and settings

CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

## Rollback Generation

The system automatically generates rollback SQL for common operations:

### Supported Operations

- **CREATE TABLE** → `DROP TABLE IF EXISTS`
- **CREATE INDEX** → `DROP INDEX IF EXISTS`
- **CREATE FUNCTION** → `DROP FUNCTION IF EXISTS`
- **CREATE VIEW** → `DROP VIEW IF EXISTS`
- **ALTER TABLE ADD COLUMN** → `ALTER TABLE DROP COLUMN`

### Custom Rollback SQL

For complex migrations, you can provide custom rollback SQL:

```sql
-- Migration SQL
CREATE TABLE complex_table (...);
INSERT INTO complex_table VALUES (...);

-- Custom rollback (in comments)
-- ROLLBACK: DROP TABLE IF EXISTS complex_table CASCADE;
```

## Best Practices

### Migration Development

1. **Test Locally First**: Always test migrations in development
2. **Use Dry Run**: Preview changes with `--dry-run` flag
3. **Small Increments**: Keep migrations small and focused
4. **Backup Before Production**: Always backup before production migrations
5. **Monitor Performance**: Check execution times and optimize slow migrations

### Rollback Strategy

1. **Test Rollbacks**: Test rollback procedures in development
2. **Data Safety**: Ensure rollbacks don't cause data loss
3. **Dependencies**: Consider dependencies when rolling back
4. **Communication**: Coordinate rollbacks with team members

### Environment Management

1. **Separate Projects**: Use different Supabase projects per environment
2. **Environment Variables**: Properly configure environment-specific settings
3. **Sync Regularly**: Keep environments in sync with regular migrations
4. **Monitor Differences**: Use comparison reports to detect drift

## Monitoring and Alerting

### Health Checks

The system provides health status indicators:

- **Healthy**: All migrations executed successfully
- **Warning**: Pending migrations or performance issues
- **Error**: Failed migrations or checksum mismatches

### Performance Monitoring

Track migration performance metrics:

- **Execution Time**: Individual and average migration times
- **Total Time**: Cumulative migration execution time
- **Slowest Migrations**: Identify performance bottlenecks

### Automated Reports

Set up automated reporting for production environments:

```bash
# Daily migration report
0 9 * * * cd /app && npm run migrate:report -- --env production --html --output /reports/daily-$(date +%Y%m%d).html

# Weekly comparison report
0 9 * * 1 cd /app && npm run migrate:compare -- --environments dev,staging,prod --output /reports/weekly-comparison.html
```

## Troubleshooting

### Common Issues

#### Migration Fails to Execute

1. Check Supabase connection and credentials
2. Verify SQL syntax and dependencies
3. Check for conflicting schema changes
4. Review Supabase logs for detailed errors

#### Checksum Mismatch

1. Migration file was modified after execution
2. Restore original file or create new migration
3. Never modify executed migration files

#### Rollback Fails

1. Check rollback SQL syntax
2. Verify dependencies and constraints
3. Manual intervention may be required

#### Performance Issues

1. Review slow migrations in reports
2. Add appropriate indexes
3. Break large migrations into smaller chunks
4. Consider maintenance windows for heavy operations

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Verbose migration execution
npm run migrate -- --verbose

# Detailed status information
npm run migrate:status -- --verbose

# Comprehensive report
npm run migrate:report -- --verbose
```

## Security Considerations

### Access Control

- **Admin Only**: Migration operations require admin privileges
- **Service Role**: Use service role key for database operations
- **Environment Isolation**: Separate credentials per environment

### Audit Trail

- **Migration History**: Complete record of all migrations
- **Rollback History**: Track all rollback operations
- **Batch Tracking**: Group related operations

### Data Protection

- **Backup Strategy**: Regular backups before migrations
- **Rollback Testing**: Verify rollback procedures
- **Change Review**: Review all migration changes

## Integration with CI/CD

### Automated Migrations

```yaml
# GitHub Actions example
- name: Run Database Migrations
  run: |
    npm run migrate:status
    npm run migrate -- --verbose
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Deployment Pipeline

1. **Development**: Test migrations locally
2. **Staging**: Deploy and test in staging environment
3. **Production**: Deploy with monitoring and rollback plan
4. **Verification**: Verify successful deployment

## Future Enhancements

### Planned Features

- **Migration Dependencies**: Explicit dependency management
- **Parallel Execution**: Run independent migrations in parallel
- **Schema Validation**: Validate schema against expected state
- **Automated Testing**: Test migrations against sample data
- **Blue-Green Deployments**: Support for zero-downtime deployments

### Integration Opportunities

- **Monitoring Tools**: Integration with monitoring platforms
- **Slack Notifications**: Migration status notifications
- **Database Diff Tools**: Visual schema comparison
- **Performance Analytics**: Advanced performance tracking

## Support and Resources

### Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Migration Best Practices](https://supabase.com/docs/guides/database/migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Community

- [Supabase Discord](https://discord.supabase.com/)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

### Internal Resources

- Migration System Source Code: `src/lib/supabase/migration-*`
- CLI Scripts: `scripts/migrate*.ts`
- Dashboard Component: `src/components/admin/migration-dashboard.tsx`
- API Endpoints: `src/app/api/admin/migrations/`