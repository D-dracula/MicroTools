# 🚀 Production Deployment Guide - Micro-Tools

This guide provides comprehensive instructions for deploying the Micro-Tools application to production with Supabase integration.

## 📋 Prerequisites

- GitHub account with repository access
- Vercel account (free tier available)
- Supabase project configured
- Vercel CLI installed: `npm i -g vercel`

## 🔧 Step 1: Environment Variables Setup

### Required Production Variables

Set these environment variables in your Vercel project:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# NextAuth.js Configuration (Required)
NEXTAUTH_SECRET="your-production-secret-32-chars-minimum"
NEXTAUTH_URL="https://your-production-domain.com"

# Production Environment Settings
NEXT_PUBLIC_APP_ENV="production"
NEXT_PUBLIC_DEBUG_MODE="false"
NEXT_PUBLIC_LOG_LEVEL="error"
```

### Optional Variables

```bash
# Google OAuth (Optional - for social login)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenRouter API (Optional - for AI tools)
OPENROUTER_API_KEY="your-openrouter-api-key"

# Database URL (Optional - for direct database access)
DATABASE_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres"
```

### Generate Secure NextAuth Secret

```bash
# Generate a secure random secret (32+ characters)
openssl rand -base64 32
```

## 🗄️ Step 2: Supabase Production Setup

### 1. Create Production Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project for production
3. Choose a strong database password
4. Select appropriate region (closest to your users)

### 2. Configure Database Schema

```bash
# Run Supabase migrations
npm run supabase:migrate

# Validate schema
npm run supabase:validate
```

### 3. Set Up Row Level Security

Ensure RLS policies are properly configured:

```bash
# Test RLS policies
npm run test:supabase
```

### 4. Configure Authentication

1. In Supabase Dashboard → Authentication → Settings
2. Set Site URL to your production domain
3. Add redirect URLs for OAuth providers
4. Configure email templates if needed

## 🚀 Step 3: Deployment Process

### Method 1: Automated Deployment (Recommended)

```bash
# Validate production environment
npm run env:validate:production

# Run full deployment with monitoring
npm run deploy:prod:full
```

### Method 2: Manual Deployment

```bash
# 1. Validate environment
npm run env:validate:production

# 2. Run tests
npm test
npm run test:supabase

# 3. Build and deploy
npm run deploy:production

# 4. Monitor deployment
npm run monitor:post-deploy --url=https://your-domain.com
```

### Method 3: Dry Run (Testing)

```bash
# Test deployment process without actually deploying
npm run deploy:prod:dry-run
```

## ✅ Step 4: Post-Deployment Validation

### 1. Automated Health Check

The deployment script automatically runs health checks, but you can also run them manually:

```bash
# Monitor application for 10 minutes
npm run monitor:production

# Custom monitoring
npm run monitor:post-deploy --url=https://your-domain.com --duration=600
```

### 2. Manual Verification Checklist

- [ ] Homepage loads correctly
- [ ] User registration/login works
- [ ] Calculator tools function properly
- [ ] AI tools work (if API key configured)
- [ ] Arabic/English localization works
- [ ] Mobile responsiveness
- [ ] Performance is acceptable (< 2s load time)

### 3. Test Core Functionality

```bash
# Test API endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/api/calculations

# Test localized pages
curl https://your-domain.com/en
curl https://your-domain.com/ar
```

## 🔒 Step 5: Security Configuration

### 1. Verify Security Headers

The production Vercel configuration includes security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### 2. Validate Environment Isolation

```bash
# Ensure production environment is isolated
npm run env:validate:production
```

### 3. Security Checklist

- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Strong NextAuth secret (32+ characters)
- [ ] Debug mode disabled
- [ ] Error logging configured
- [ ] Supabase RLS policies active
- [ ] Environment variables secured

## 📊 Step 6: Monitoring and Performance

### 1. Enable Vercel Analytics

1. Go to Vercel Dashboard → Project → Analytics
2. Enable Web Analytics
3. Configure performance monitoring

### 2. Set Up Error Monitoring

The application includes built-in error monitoring:
- Health check endpoint: `/api/health`
- Error metrics collection
- Performance tracking

### 3. Monitor Key Metrics

- Response time (target: < 2s)
- Error rate (target: < 5%)
- Uptime (target: > 99%)
- Database performance

## 🌐 Step 7: Custom Domain (Optional)

### 1. Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### 2. Update Environment Variables

```bash
# Update NextAuth URL to use custom domain
NEXTAUTH_URL="https://your-custom-domain.com"
```

### 3. Update Supabase Settings

1. In Supabase Dashboard → Authentication → Settings
2. Update Site URL to custom domain
3. Update redirect URLs

## 🔄 Step 8: Continuous Deployment

### 1. Automatic Deployments

Vercel automatically deploys when you push to the main branch:

```bash
git push origin main
```

### 2. Environment-Specific Deployments

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### 3. Rollback Process

If issues occur after deployment:

1. In Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Errors

```bash
# Test build locally
npm run build

# Check build logs in Vercel dashboard
```

#### 2. Environment Variable Issues

```bash
# Validate all environment variables
npm run env:validate:production

# List Vercel environment variables
vercel env ls
```

#### 3. Database Connection Issues

```bash
# Test Supabase connection
npm run supabase:verify

# Check Supabase project status
```

#### 4. Authentication Issues

- Verify NEXTAUTH_URL matches deployment URL
- Check NEXTAUTH_SECRET is set correctly
- Ensure Supabase auth settings are correct

#### 5. Performance Issues

```bash
# Run performance monitoring
npm run monitor:production

# Check health endpoint
curl https://your-domain.com/api/health
```

### Debug Commands

```bash
# Comprehensive environment validation
npm run env:validate:production --verbose

# Detailed Supabase testing
npm run test:supabase:full

# Build with verbose output
npm run build --verbose
```

## 📈 Performance Optimization

### 1. Vercel Configuration

The production configuration includes:
- Optimized function timeouts
- Regional deployment (iad1)
- Security headers
- Health check routing

### 2. Database Optimization

- Connection pooling via Supabase
- Optimized queries with indexes
- RLS policies for security

### 3. Caching Strategy

- Static asset caching
- API response caching where appropriate
- CDN optimization via Vercel

## 📞 Support and Monitoring

### 1. Health Monitoring

- Health endpoint: `https://your-domain.com/api/health`
- Automated monitoring scripts
- Performance metrics collection

### 2. Error Tracking

- Built-in error monitoring
- Structured logging
- Performance tracking

### 3. Maintenance

- Regular dependency updates
- Security patch monitoring
- Performance optimization reviews

## 🎉 Success Checklist

After successful deployment, verify:

- [ ] Application loads at production URL
- [ ] All environment variables configured
- [ ] Database connection working
- [ ] Authentication functional
- [ ] Core tools operational
- [ ] AI tools working (if configured)
- [ ] Localization working
- [ ] Performance acceptable
- [ ] Security headers present
- [ ] Monitoring active
- [ ] Custom domain configured (if applicable)

## 📋 Deployment Commands Reference

```bash
# Environment Validation
npm run env:validate:production          # Validate production environment
npm run env:validate:production:quiet    # Quiet validation

# Deployment
npm run deploy:prod:full                 # Full automated deployment
npm run deploy:prod:dry-run             # Test deployment process
npm run deploy:production               # Manual Vercel deployment

# Monitoring
npm run monitor:post-deploy             # Post-deployment monitoring
npm run monitor:production              # Production monitoring

# Testing
npm run test:supabase:full              # Comprehensive Supabase tests
npm run supabase:validate              # Validate database schema
```

Your Micro-Tools application is now ready for production use with comprehensive monitoring and security measures in place!