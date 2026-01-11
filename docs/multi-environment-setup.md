# Multi-Environment Configuration Guide

This guide explains how to set up and manage multiple environments (development, staging, production) for the Micro-Tools application with Supabase integration.

## Overview

The application supports three distinct environments:
- **Development**: Local development with relaxed security
- **Staging**: Pre-production testing with production-like settings
- **Production**: Live application with maximum security

Each environment uses separate Supabase projects to ensure complete isolation.

## Environment Configuration Files

### 1. Development Environment (`.env.development`)

Used for local development:

```env
# Environment identifier
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development

# Supabase Configuration - Development Project
NEXT_PUBLIC_SUPABASE_URL="https://dev-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-dev-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-dev-supabase-service-role-key"

# Database URL - Development
DATABASE_URL="postgresql://postgres:[password]@db.dev-project-id.supabase.co:5432/postgres"

# NextAuth.js - Development
NEXTAUTH_SECRET="dev-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Development-specific settings
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

### 2. Staging Environment (`.env.staging`)

Used for pre-production testing:

```env
# Environment identifier
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging

# Supabase Configuration - Staging Project
NEXT_PUBLIC_SUPABASE_URL="https://staging-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-staging-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-staging-supabase-service-role-key"

# Database URL - Staging
DATABASE_URL="postgresql://postgres:[password]@db.staging-project-id.supabase.co:5432/postgres"

# NextAuth.js - Staging
NEXTAUTH_SECRET="staging-nextauth-secret-key"
NEXTAUTH_URL="https://staging.your-domain.com"

# Staging-specific settings
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_LOG_LEVEL=info
```

### 3. Production Environment (`.env.production`)

Used for live production:

```env
# Environment identifier
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# Supabase Configuration - Production Project
NEXT_PUBLIC_SUPABASE_URL="https://prod-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-prod-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-prod-supabase-service-role-key"

# Database URL - Production
DATABASE_URL="postgresql://postgres:[password]@db.prod-project-id.supabase.co:5432/postgres"

# NextAuth.js - Production
NEXTAUTH_SECRET="production-nextauth-secret-key"
NEXTAUTH_URL="https://your-production-domain.com"

# Production-specific settings
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_LOG_LEVEL=error
```

## Supabase Project Setup

### 1. Create Separate Supabase Projects

Create three separate Supabase projects:

1. **Development Project**: `micro-tools-dev`
2. **Staging Project**: `micro-tools-staging`
3. **Production Project**: `micro-tools-prod`

### 2. Configure Each Project

For each Supabase project:

1. **Database Schema**: Apply the same schema to all projects
2. **Row Level Security**: Enable RLS with identical policies
3. **Authentication**: Configure OAuth providers (if used)
4. **Storage**: Set up buckets with appropriate permissions

### 3. Get Project Credentials

From each Supabase project dashboard:

1. Go to **Settings > API**
2. Copy the **Project URL**
3. Copy the **anon/public key**
4. Copy the **service_role key** (for staging/production)

## Vercel Deployment Configuration

### 1. Environment-Specific Vercel Configs

- `vercel.json` - Development configuration
- `vercel.staging.json` - Staging configuration
- `vercel.production.json` - Production configuration

### 2. Vercel Environment Variables

Configure environment variables in Vercel dashboard for each environment:

#### Staging Environment Variables:
```
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://staging-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.staging-project-id.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-staging-nextauth-secret
NEXTAUTH_URL=https://staging.your-domain.com
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_LOG_LEVEL=info
```

#### Production Environment Variables:
```
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.prod-project-id.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-production-nextauth-secret
NEXTAUTH_URL=https://your-production-domain.com
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_LOG_LEVEL=error
```

## Environment Validation

### 1. Validate Configuration

Run the environment validation script:

```bash
# Validate all environments
npm run env:validate

# Validate specific environment
npm run env:validate:dev
npm run env:validate:staging
npm run env:validate:prod
```

### 2. Health Check Endpoint

Check environment health via API:

```bash
# Development
curl http://localhost:3000/api/health

# Staging
curl https://staging.your-domain.com/api/health

# Production
curl https://your-production-domain.com/api/health
```

The health check returns:
- Environment configuration status
- Cross-environment isolation validation
- Database connectivity
- Service availability

## Deployment Process

### 1. Development Deployment

```bash
# Local development
npm run dev
```

### 2. Staging Deployment

```bash
# Deploy to staging
npm run deploy:staging
```

### 3. Production Deployment

```bash
# Deploy to production
npm run deploy:production
```

## Security Considerations

### 1. Environment Isolation

- **Separate Supabase Projects**: Each environment uses its own Supabase project
- **Unique Credentials**: No shared API keys or secrets between environments
- **Domain Isolation**: Different domains/subdomains for each environment

### 2. Security Levels by Environment

#### Development:
- Debug mode enabled
- Detailed logging
- Relaxed security for development ease

#### Staging:
- Production-like security
- HTTPS required
- Moderate logging
- Testing with production data structure

#### Production:
- Maximum security
- HTTPS required
- Minimal logging (errors only)
- No debug information exposed

### 3. Secret Management

- **Development**: Secrets in `.env.development` (not committed)
- **Staging**: Secrets in Vercel environment variables
- **Production**: Secrets in Vercel environment variables
- **Rotation**: Regular rotation of service role keys

## Monitoring and Maintenance

### 1. Environment Health Monitoring

- Health check endpoints for each environment
- Automated monitoring of configuration status
- Cross-environment isolation validation

### 2. Configuration Drift Detection

- Regular validation of environment configurations
- Automated alerts for configuration issues
- Documentation of environment-specific settings

### 3. Maintenance Tasks

- Regular secret rotation
- Environment configuration updates
- Database schema synchronization
- Performance monitoring per environment

## Troubleshooting

### Common Issues

1. **Environment Variable Missing**
   - Check Vercel environment variables
   - Verify local `.env` files
   - Run `npm run env:validate`

2. **Cross-Environment Contamination**
   - Verify Supabase URLs are environment-specific
   - Check NextAuth URLs match environment
   - Run isolation validation

3. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check Supabase project status
   - Test with health check endpoint

4. **Authentication Problems**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches deployment URL
   - Ensure OAuth providers are configured

### Debugging Commands

```bash
# Validate environment configuration
npm run env:validate

# Check Supabase connection
npm run supabase:verify

# Test database operations
npm run test:supabase

# Check migration status
npm run migrate:status
```

## Best Practices

1. **Never share credentials** between environments
2. **Use environment-specific domains** for staging and production
3. **Regularly validate** environment configurations
4. **Monitor health checks** for all environments
5. **Keep environment configurations** in sync (structure, not values)
6. **Test deployments** in staging before production
7. **Rotate secrets** regularly, especially for production
8. **Document environment-specific** configurations and procedures

## Migration Between Environments

When promoting changes from development to staging to production:

1. **Code Changes**: Deploy via Git/Vercel
2. **Database Schema**: Apply migrations to each environment
3. **Configuration**: Update environment variables as needed
4. **Validation**: Run health checks and validation scripts
5. **Testing**: Verify functionality in each environment

This ensures consistent and reliable deployments across all environments while maintaining proper isolation and security.