import createMiddleware from "next-intl/middleware";
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from "./i18n/routing";

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url)
  
  // Handle Supabase auth callback code (email confirmation, password reset, etc.)
  // This can come from various paths, not just root
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  
  // If we have auth parameters and we're not already on the callback route
  if ((code || token_hash) && !pathname.includes('/api/auth/callback')) {
    console.log('🔄 Middleware: Redirecting auth callback', { 
      hasCode: !!code, 
      hasTokenHash: !!token_hash,
      type,
      pathname 
    })
    
    // Redirect to auth callback handler
    const callbackUrl = new URL('/api/auth/callback', request.url)
    if (code) callbackUrl.searchParams.set('code', code)
    if (token_hash) callbackUrl.searchParams.set('token_hash', token_hash)
    if (type) callbackUrl.searchParams.set('type', type)
    
    // Preserve other params like 'next'
    const next = searchParams.get('next')
    if (next) callbackUrl.searchParams.set('next', next)
    
    return NextResponse.redirect(callbackUrl)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Handle Supabase authentication
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  // Apply internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files (images, fonts, etc.)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
