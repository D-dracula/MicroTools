# Supabase Project Setup Guide

This guide walks you through setting up a Supabase project for the Micro-Tools application.

## 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `micro-tools` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be provisioned (usually 2-3 minutes)

## 2. Get Project Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Project API Keys**:
     - `anon` `public` key (safe to use in browser)
     - `service_role` `secret` key (server-side only, keep secure)

## 3. Configure Environment Variables

Create a `.env.local` file in the `micro-tools` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Database URL (for Prisma compatibility during migration)
DATABASE_URL="postgresql://postgres:[your-db-password]@db.[project-id].supabase.co:5432/postgres"

# NextAuth.js Configuration
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 4. Database Connection String

To get the full database connection string:

1. Go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual database password

## 5. Verify Setup

Test your configuration by running:

```bash
cd micro-tools
npm run dev
```

The application should start without Supabase connection errors.

## 6. Next Steps

After completing this setup:

1. Run the database schema migration (Task 3)
2. Set up Row Level Security policies (Task 4)
3. Configure authentication (Task 6)

## Production Setup (Vercel)

For production deployment on Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the same environment variables as above
4. Use the production Supabase project URL and keys
5. Set `NEXTAUTH_URL` to your production domain

## Security Notes

- **Never commit** `.env.local` or `.env` files to version control
- The `anon` key is safe to expose in client-side code
- The `service_role` key should **only** be used server-side
- Use different Supabase projects for development and production
- Regularly rotate your API keys in production

## Troubleshooting

### Connection Issues
- Verify your project URL and API keys are correct
- Check that your IP is not blocked (Supabase allows all IPs by default)
- Ensure environment variables are loaded correctly

### Database Access Issues
- Verify your database password is correct
- Check that Row Level Security policies allow your operations
- Ensure you're using the correct user context for authenticated operations

### Environment Variable Issues
- Restart your development server after changing environment variables
- Verify variable names match exactly (case-sensitive)
- Check for extra spaces or quotes in variable values