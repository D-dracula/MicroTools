# Supabase Database Schema

This directory contains the Supabase database schema migrations for the Micro-Tools application. These migrations convert the existing Prisma schema to Supabase-compatible SQL with Row Level Security (RLS) policies and performance optimizations.

## Migration Files

### 1. `20260111000001_initial_schema.sql`
- **Purpose**: Creates the core database schema
- **Contents**:
  - All table definitions with proper PostgreSQL types
  - Primary keys, foreign keys, and constraints
  - Basic indexes for performance
  - Triggers for automatic timestamp updates
  - User profile synchronization with auth.users

### 2. `20260111000002_row_level_security.sql`
- **Purpose**: Implements Row Level Security (RLS) policies
- **Contents**:
  - Enables RLS on all tables
  - User-specific access policies
  - Public access policies for ads and usage tracking
  - Security helper functions
  - Proper permission grants

### 3. `20260111000003_performance_optimization.sql`
- **Purpose**: Advanced performance optimizations
- **Contents**:
  - Specialized indexes for complex queries
  - Database functions for common operations
  - Views for analytics and reporting
  - Materialized views for heavy queries
  - Performance monitoring functions

## Database Schema Overview

### Core Tables

| Table | Purpose | RLS Enabled |
|-------|---------|-------------|
| `profiles` | User profile data (extends auth.users) | ✅ User-owned |
| `accounts` | OAuth/credential accounts | ✅ User-owned |
| `sessions` | User sessions | ✅ User-owned |
| `calculations` | Saved calculation results | ✅ User-owned |
| `tool_usage` | Usage analytics | ✅ Anonymous insert |
| `custom_ads` | Advertisement content | ✅ Public read |

### Key Features

- **UUID Primary Keys**: All tables use UUID for better scalability
- **Automatic Timestamps**: `created_at` and `updated_at` handled by triggers
- **JSONB Storage**: Flexible storage for calculation inputs/outputs
- **Bilingual Support**: Arabic and English content fields
- **Analytics Ready**: Built-in tracking and reporting capabilities

## Running Migrations

### Prerequisites

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Set up the required variables
3. **Dependencies**: Install Supabase client

```bash
npm install @supabase/supabase-js
```

### Environment Setup

Create or update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Migration Commands

```bash
# Run all pending migrations
node supabase/migrate.js

# Dry run (see what would be executed)
node supabase/migrate.js --dry-run

# Verbose output
node supabase/migrate.js --verbose

# Help
node supabase/migrate.js --help
```

### Manual Migration (Alternative)

If the migration script doesn't work, you can run the SQL files manually:

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste each migration file in order:
   - `20260111000001_initial_schema.sql`
   - `20260111000002_row_level_security.sql`
   - `20260111000003_performance_optimization.sql`
4. Execute each file

## Data Migration from Prisma

### Export Existing Data

```bash
# Export data from current Prisma database
npx prisma db pull
npx prisma generate
```

### Import to Supabase

1. **Users**: Will be handled by Supabase Auth
2. **Calculations**: Export as JSON and import via API
3. **Tool Usage**: Can be recreated or imported
4. **Custom Ads**: Export and import via admin interface

### Migration Script Example

```javascript
// Example data migration script
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrateCalculations() {
  const calculations = await prisma.calculation.findMany();
  
  for (const calc of calculations) {
    await supabase.from('calculations').insert({
      user_id: calc.userId,
      tool_slug: calc.toolSlug,
      inputs: calc.inputs,
      outputs: calc.outputs,
      created_at: calc.createdAt
    });
  }
}
```

## Row Level Security (RLS) Policies

### User Data Protection

- **Profiles**: Users can only access their own profile
- **Calculations**: Users can only see their own calculations
- **Accounts/Sessions**: User-specific access only

### Public Access

- **Tool Usage**: Anonymous usage tracking allowed
- **Custom Ads**: Public read access for active ads

### Admin Access

- **Service Role**: Full access to all data for admin operations
- **Analytics**: Aggregated data access for reporting

## Performance Optimizations

### Indexes

- **User Queries**: Optimized for user-specific data access
- **Analytics**: Specialized indexes for reporting queries
- **Time-based**: Efficient date range queries
- **Composite**: Multi-column indexes for complex queries

### Functions

- `get_user_calculation_count()`: User calculation statistics
- `get_tool_usage_stats()`: Tool popularity metrics
- `get_active_ads()`: Efficient ad retrieval
- `increment_ad_metric()`: Atomic counter updates

### Views

- `user_profile_stats`: User profiles with calculation stats
- `tool_popularity_stats`: Tool usage analytics
- `ad_performance_stats`: Advertisement metrics

## Security Considerations

### Authentication

- Uses Supabase Auth for user management
- JWT tokens for API authentication
- Automatic user profile creation

### Authorization

- Row Level Security enforces data access
- Service role for admin operations
- Anonymous access limited to specific operations

### Data Protection

- User data isolated by RLS policies
- Sensitive operations require authentication
- Audit logging for security events

## Monitoring and Maintenance

### Performance Monitoring

```sql
-- Check table sizes
SELECT * FROM public.get_table_sizes();

-- Monitor query performance
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### Maintenance Tasks

```sql
-- Clean up expired sessions
SELECT public.cleanup_expired_sessions();

-- Refresh materialized views
REFRESH MATERIALIZED VIEW public.daily_tool_usage_stats;

-- Update table statistics
ANALYZE;
```

### Backup Strategy

1. **Automatic Backups**: Enabled in Supabase dashboard
2. **Point-in-time Recovery**: Available for Pro plans
3. **Data Export**: Regular exports for critical data

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check RLS policies and user authentication
2. **Function Not Found**: Ensure all migration files were executed
3. **Index Conflicts**: Drop and recreate indexes if needed
4. **Migration Failures**: Check Supabase logs for detailed errors

### Debug Queries

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Verify indexes
SELECT * FROM pg_indexes WHERE schemaname = 'public';

-- Check table permissions
SELECT * FROM information_schema.table_privileges WHERE grantee IN ('authenticated', 'anon');
```

## Next Steps

After running the migrations:

1. **Update Application Code**: Replace Prisma client with Supabase client
2. **Test Authentication**: Verify user registration and login flows
3. **Migrate Data**: Transfer existing data from Prisma to Supabase
4. **Update API Routes**: Modify API endpoints to use Supabase
5. **Deploy**: Update environment variables and deploy to production

## Support

For issues with these migrations:

1. Check the Supabase dashboard logs
2. Review the migration execution output
3. Verify environment variables are correct
4. Consult the Supabase documentation
5. Check the project's GitHub issues