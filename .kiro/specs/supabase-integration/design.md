# Design Document: Supabase Integration

## Overview

This design outlines the integration of Supabase as the primary backend service for Micro-Tools, replacing the current Prisma setup. Supabase will provide PostgreSQL database, authentication, real-time features, and auto-generated APIs. The integration will maintain backward compatibility while adding new capabilities.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    A[Next.js App] --> B[Supabase Client]
    B --> C[Supabase Cloud]
    C --> D[PostgreSQL Database]
    C --> E[Auth Service]
    C --> F[Real-time Engine]
    C --> G[Auto-generated APIs]
    
    A --> H[NextAuth.js]
    H --> E
    
    I[Vercel Deployment] --> A
    J[Environment Variables] --> B
```

### Component Architecture

```mermaid
graph LR
    A[Components] --> B[Supabase Hooks]
    B --> C[Supabase Client]
    C --> D[Database Layer]
    C --> E[Auth Layer]
    C --> F[Real-time Layer]
    
    G[API Routes] --> C
    H[Middleware] --> E
```

## Components and Interfaces

### 1. Supabase Client Configuration

**Location:** `src/lib/supabase/client.ts`

```typescript
interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

interface DatabaseClient {
  from(table: string): QueryBuilder;
  auth: AuthClient;
  realtime: RealtimeClient;
}
```

**Features:**
- Browser and server-side client instances
- Environment-specific configuration
- Type-safe database operations
- Authentication state management

### 2. Database Layer

**Location:** `src/lib/supabase/database.ts`

```typescript
interface DatabaseOperations {
  // User operations
  createUser(userData: CreateUserData): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Calculation operations
  saveCalculation(calculation: CalculationData): Promise<Calculation>;
  getUserCalculations(userId: string): Promise<Calculation[]>;
  deleteCalculation(id: string): Promise<void>;
  
  // Tool usage tracking
  trackToolUsage(toolSlug: string, userType: string): Promise<void>;
  getToolAnalytics(toolSlug: string): Promise<ToolAnalytics>;
}
```

### 3. Authentication Integration

**Location:** `src/lib/auth/supabase-adapter.ts`

```typescript
interface AuthAdapter {
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signInWithOAuth(provider: OAuthProvider): Promise<AuthResult>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  onAuthStateChange(callback: AuthCallback): Subscription;
}
```

### 4. Migration System

**Location:** `src/lib/supabase/migrations/`

```typescript
interface MigrationRunner {
  runMigrations(): Promise<MigrationResult>;
  rollbackMigration(version: string): Promise<void>;
  getMigrationStatus(): Promise<MigrationStatus[]>;
}
```

## Data Models

### Supabase Schema (SQL)

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Public profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  image VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calculations table
CREATE TABLE public.calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug VARCHAR(100) NOT NULL,
  inputs JSONB NOT NULL,
  outputs JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tool usage tracking
CREATE TABLE public.tool_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_slug VARCHAR(100) NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom ads
CREATE TABLE public.custom_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placement VARCHAR(100) NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(500) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calculations_user_id ON public.calculations(user_id);
CREATE INDEX idx_calculations_tool_slug ON public.calculations(tool_slug);
CREATE INDEX idx_tool_usage_tool_slug ON public.tool_usage(tool_slug);
CREATE INDEX idx_tool_usage_created_at ON public.tool_usage(created_at);
CREATE INDEX idx_custom_ads_placement ON public.custom_ads(placement);
CREATE INDEX idx_custom_ads_is_active ON public.custom_ads(is_active);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_ads ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Calculations policies
CREATE POLICY "Users can view own calculations" ON public.calculations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations" ON public.calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calculations" ON public.calculations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations" ON public.calculations
  FOR DELETE USING (auth.uid() = user_id);

-- Custom ads policies (public read)
CREATE POLICY "Anyone can view active ads" ON public.custom_ads
  FOR SELECT USING (is_active = true);
```

## Environment Configuration

### Development Environment

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Database URL (for compatibility)
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

### Production Environment (Vercel)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth.js Configuration
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret

# Database URL
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

## Migration Strategy

### Phase 1: Setup and Configuration
1. Create Supabase project
2. Configure environment variables
3. Install Supabase dependencies
4. Set up client configuration

### Phase 2: Schema Migration
1. Export current Prisma schema
2. Create equivalent Supabase tables
3. Set up Row Level Security policies
4. Create database functions and triggers

### Phase 3: Code Migration
1. Replace Prisma client with Supabase client
2. Update database operations
3. Migrate authentication to Supabase Auth
4. Update API routes

### Phase 4: Testing and Deployment
1. Test all database operations
2. Verify authentication flows
3. Performance testing
4. Deploy to production

## Real-time Features Implementation

### Real-time Calculation Sharing

```typescript
interface RealtimeCalculation {
  subscribeToCalculation(calculationId: string): Subscription;
  broadcastCalculationUpdate(calculationId: string, data: any): void;
  unsubscribeFromCalculation(calculationId: string): void;
}
```

### Implementation Example

```typescript
// Subscribe to calculation updates
const subscription = supabase
  .channel(`calculation:${calculationId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'calculations',
    filter: `id=eq.${calculationId}`
  }, (payload) => {
    // Handle real-time updates
    updateCalculationUI(payload.new);
  })
  .subscribe();
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Schema Migration Completeness
*For any* Prisma model in the existing schema, migrating to Supabase should result in an equivalent table with the same structure, relationships, and constraints.
**Validates: Requirements 1.2, 4.1, 4.2, 4.3**

### Property 2: Database Operation Consistency
*For any* database operation (CRUD), the Supabase client should produce the same results as the equivalent Prisma operation would have produced.
**Validates: Requirements 1.3, 1.4**

### Property 3: Authentication Flow Integrity
*For any* valid user credentials, the authentication process should create a session and return appropriate tokens, and for any invalid credentials, it should reject the authentication attempt.
**Validates: Requirements 2.1, 2.2**

### Property 4: Session Management Reliability
*For any* user session, when the session expires, the system should automatically refresh the token, and when logout occurs, the session should be completely invalidated.
**Validates: Requirements 2.4, 2.5**

### Property 5: Environment Configuration Validation
*For any* set of environment variables, the system should validate Supabase credentials and either initialize successfully with valid credentials or provide clear error messages for invalid ones.
**Validates: Requirements 3.1, 3.5**

### Property 6: Data Type Mapping Accuracy
*For any* Prisma data type, the migration tool should map it to the correct PostgreSQL equivalent in Supabase without data loss or corruption.
**Validates: Requirements 4.5**

### Property 7: Real-time Update Propagation
*For any* subscribed user, when a shared calculation is updated, the real-time client should broadcast the update only to authorized subscribers.
**Validates: Requirements 5.1, 5.4**

### Property 8: Real-time Subscription Management
*For any* user joining or leaving a shared calculation, the real-time client should properly manage subscriptions (create on join, remove on leave).
**Validates: Requirements 5.2, 5.5**

### Property 9: Query Optimization Compliance
*For any* database query involving related records, the system should use joins and pagination to minimize API calls and handle large datasets efficiently.
**Validates: Requirements 6.2, 6.3**

### Property 10: Row Level Security Enforcement
*For any* authenticated user, the system should only allow access to their own data and reject attempts to access other users' data.
**Validates: Requirements 7.1**

### Property 11: API Authentication Consistency
*For any* API call to Supabase, the database client should include proper authentication headers and handle authentication failures gracefully.
**Validates: Requirements 7.2**

### Property 12: Test Environment Isolation
*For any* test execution, the database client should use isolated test data that doesn't interfere with other tests or development data.
**Validates: Requirements 8.2**

### Property 13: Migration Rollback Reliability
*For any* applied migration, the migration tool should be able to rollback to the previous state without data loss or corruption.
**Validates: Requirements 8.3**

### Property 14: Error Message Clarity
*For any* error condition (network failure, invalid credentials, missing environment variables), the system should provide clear, actionable error messages.
**Validates: Requirements 6.4, 8.4**

### Property 15: Multi-Environment Configuration
*For any* environment (development, staging, production), the system should use the appropriate Supabase configuration without cross-environment data leakage.
**Validates: Requirements 3.3, 8.5**

## Error Handling

### Database Connection Errors
- **Connection Timeout**: Retry with exponential backoff
- **Invalid Credentials**: Clear error message with configuration guidance
- **Network Failures**: Queue operations and retry when connection restored

### Authentication Errors
- **Invalid Login**: Clear error message without revealing user existence
- **Session Expiry**: Automatic token refresh with fallback to re-authentication
- **OAuth Failures**: Graceful fallback with error reporting

### Migration Errors
- **Schema Conflicts**: Detailed conflict report with resolution suggestions
- **Data Loss Prevention**: Automatic backup before destructive operations
- **Rollback Failures**: Manual intervention guidance with data recovery options

## Testing Strategy

### Unit Testing
- **Database Operations**: Test each CRUD operation with mock Supabase client
- **Authentication Flows**: Test login, logout, and session management
- **Migration Scripts**: Test schema generation and data type mapping
- **Error Handling**: Test all error conditions with appropriate responses

### Property-Based Testing
- **Schema Migration**: Generate random Prisma schemas and verify correct Supabase conversion
- **Authentication**: Test with various credential combinations and verify correct behavior
- **Real-time Features**: Test subscription management with random user join/leave patterns
- **Row Level Security**: Test data access with various user permission combinations
- **Environment Configuration**: Test with various environment variable combinations

### Integration Testing
- **End-to-End Authentication**: Test complete user registration and login flows
- **Database Migration**: Test full migration from Prisma to Supabase with real data
- **Real-time Collaboration**: Test multi-user calculation sharing scenarios
- **Performance Testing**: Test query optimization and caching under load

### Testing Configuration
- **Minimum 100 iterations** per property-based test
- **Test Database Isolation** using Supabase test projects
- **Automated Testing Pipeline** integrated with CI/CD
- **Property Test Tags**: Each test references its design document property

**Example Property Test Tag:**
```typescript
// Feature: supabase-integration, Property 1: Schema Migration Completeness
```

## Performance Considerations

### Database Optimization
- **Connection Pooling**: Use Supabase's built-in connection pooling
- **Query Optimization**: Leverage Supabase's query planner and indexes
- **Caching Strategy**: Implement client-side caching for frequently accessed data

### Real-time Performance
- **Channel Management**: Efficiently manage real-time subscriptions
- **Message Filtering**: Filter updates at the database level using RLS
- **Connection Limits**: Monitor and manage concurrent real-time connections

### Migration Performance
- **Batch Operations**: Process large datasets in batches during migration
- **Parallel Processing**: Run independent migrations concurrently
- **Progress Monitoring**: Provide detailed progress feedback during long operations

## Security Considerations

### Data Protection
- **Row Level Security**: Implement comprehensive RLS policies
- **API Key Management**: Secure storage and rotation of API keys
- **Data Encryption**: Leverage Supabase's built-in encryption features

### Authentication Security
- **Password Policies**: Implement strong password requirements
- **Session Security**: Secure session token storage and transmission
- **OAuth Security**: Proper OAuth flow implementation with PKCE

### Development Security
- **Environment Separation**: Strict separation between development and production
- **Secret Management**: Secure handling of environment variables and secrets
- **Audit Logging**: Comprehensive logging of security-relevant events