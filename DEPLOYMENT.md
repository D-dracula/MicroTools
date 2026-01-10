# 🚀 Deployment Guide - Micro-Tools

This guide will help you deploy the Micro-Tools application to Vercel with a PostgreSQL database.

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier available)
- PostgreSQL database (Vercel Postgres, Supabase, or other provider)

## 🔧 Step 1: Environment Variables

You'll need these environment variables for production:

### Required Variables
```bash
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
NEXTAUTH_SECRET="your-production-secret-key"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

### Optional Variables (for AI tools)
```bash
OPENROUTER_API_KEY="your-openrouter-api-key"
```

### Generate NextAuth Secret
```bash
# Generate a secure random secret
openssl rand -base64 32
```

## 🗄️ Step 2: Database Setup

### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel dashboard
2. Create a new Postgres database
3. Copy the connection string
4. Use it as your `DATABASE_URL`

### Option B: Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > Database
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your actual password

### Option C: External PostgreSQL
Use any PostgreSQL provider (AWS RDS, DigitalOcean, etc.)

## 🚀 Step 3: Deploy to Vercel

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
```bash
# If you haven't created a GitHub repo yet
gh repo create micro-tools --public --source=. --remote=origin --push
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**
- In Vercel dashboard, go to Project Settings > Environment Variables
- Add all required variables:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`  
  - `NEXTAUTH_URL`
  - `OPENROUTER_API_KEY` (optional)

4. **Deploy**
- Vercel will automatically deploy
- Your app will be available at `https://your-project.vercel.app`

### Method 2: Vercel CLI

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login and Deploy**
```bash
vercel login
vercel --prod
```

3. **Set Environment Variables**
```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

## 🗃️ Step 4: Database Migration

After deployment, run the database migration:

1. **Using Vercel CLI**
```bash
vercel env pull .env.local
npx prisma db push
```

2. **Or via Vercel Functions**
- Create a temporary API route to run migrations
- Call it once after deployment
- Remove the route after migration

## ✅ Step 5: Verification

1. **Check Deployment**
- Visit your Vercel URL
- Verify the homepage loads correctly
- Test a few tools to ensure functionality

2. **Test Database Connection**
- Try registering a new user
- Use a calculator tool and save results
- Check if data persists

3. **Test AI Tools (if configured)**
- Upload a CSV file to Smart Profit Audit
- Verify AI analysis works correctly

## 🔧 Step 6: Custom Domain (Optional)

1. **Add Domain in Vercel**
- Go to Project Settings > Domains
- Add your custom domain
- Follow DNS configuration instructions

2. **Update Environment Variables**
```bash
NEXTAUTH_URL="https://your-custom-domain.com"
```

## 📊 Step 7: Analytics & Monitoring

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance and usage

### Error Monitoring
- Consider adding Sentry for error tracking
- Monitor API endpoints and database queries

## 🔒 Security Checklist

- ✅ Strong `NEXTAUTH_SECRET` (32+ characters)
- ✅ Database credentials secured
- ✅ Environment variables not exposed in client
- ✅ HTTPS enabled (automatic with Vercel)
- ✅ Rate limiting configured for API routes

## 🚨 Troubleshooting

### Common Issues

1. **Build Errors**
```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm run build  # Test locally first
```

2. **Database Connection Issues**
```bash
# Verify connection string format
# Check database server accessibility
# Ensure SSL is configured if required
```

3. **Environment Variable Issues**
```bash
# Verify all required variables are set
# Check for typos in variable names
# Ensure no trailing spaces in values
```

4. **NextAuth Issues**
```bash
# Verify NEXTAUTH_URL matches your domain
# Check NEXTAUTH_SECRET is set correctly
# Ensure callback URLs are configured
```

## 📈 Performance Optimization

### Vercel Settings
- Enable Edge Functions for better performance
- Configure caching headers for static assets
- Use Vercel Image Optimization

### Database Optimization
- Add database indexes for frequently queried fields
- Use connection pooling for better performance
- Monitor query performance

## 🔄 Continuous Deployment

### Automatic Deployments
- Vercel automatically deploys on git push to main branch
- Preview deployments for pull requests
- Rollback capability for quick fixes

### Environment Management
- Use different environments (development, staging, production)
- Separate database instances for each environment
- Environment-specific configuration

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review database connection and migrations
3. Verify environment variables are correctly set
4. Test locally with production environment variables

## 🎉 Success!

Your Micro-Tools application should now be live and accessible to users worldwide. The platform includes:

- ✅ 50+ business utility tools
- ✅ AI-powered analysis tools
- ✅ Arabic/English internationalization
- ✅ User authentication and data persistence
- ✅ Mobile-responsive design
- ✅ SEO optimization
- ✅ Performance monitoring

Visit your deployed application and start helping businesses optimize their operations!