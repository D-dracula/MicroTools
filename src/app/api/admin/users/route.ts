/**
 * Admin Users API Endpoint
 * Provides user management functionality for the admin dashboard
 * Requirements: 4.1, 4.2, 4.4, 4.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { 
  withAdminMiddleware, 
  type AdminContext 
} from '@/lib/admin/admin-middleware'

// Logger (simplified for now)
const logger = {
  debug: (msg: string, ctx?: unknown) => console.debug(msg, ctx),
  info: (msg: string, ctx?: unknown) => console.info(msg, ctx),
  warn: (msg: string, ctx?: unknown, err?: unknown) => console.warn(msg, ctx, err),
  error: (msg: string, ctx?: unknown, err?: unknown) => console.error(msg, ctx, err),
}

/**
 * User List Item Interface
 * Requirements: 4.1
 */
export interface UserListItem {
  id: string
  email: string
  emailConfirmed: boolean
  createdAt: string
  lastSignIn: string | null
  calculationCount: number
  name?: string | null
  image?: string | null
}

/**
 * User Statistics Interface
 * Requirements: 4.5
 */
export interface UserStats {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  unconfirmedUsers: number
}

/**
 * Paginated Response Interface
 */
interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Users API Response Interface
 */
interface UsersResponse {
  success: boolean
  data: {
    users: PaginatedResponse<UserListItem>
    stats: UserStats
  }
}

/**
 * Calculate user statistics
 * Requirements: 4.5
 */
async function calculateUserStats(
  supabase: ReturnType<typeof createAdminClient>
): Promise<UserStats> {
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Get all auth users to calculate stats
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    logger.error('Failed to list auth users', { error: authError.message })
    throw new Error(`Failed to list users: ${authError.message}`)
  }

  const users = authUsers.users || []
  
  // Calculate statistics
  const totalUsers = users.length
  
  // Active users = users who signed in within last 30 days
  const activeUsers = users.filter(user => {
    if (!user.last_sign_in_at) return false
    return new Date(user.last_sign_in_at) >= thirtyDaysAgo
  }).length

  // New users this month
  const newUsersThisMonth = users.filter(user => {
    return new Date(user.created_at) >= firstDayOfMonth
  }).length

  // Unconfirmed users
  const unconfirmedUsers = users.filter(user => {
    return !user.email_confirmed_at
  }).length

  return {
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    unconfirmedUsers,
  }
}

/**
 * Get paginated user list with search
 * Requirements: 4.1, 4.2
 */
async function getUserList(
  supabase: ReturnType<typeof createAdminClient>,
  options: {
    page: number
    pageSize: number
    search?: string
  }
): Promise<PaginatedResponse<UserListItem>> {
  const { page, pageSize, search } = options
  
  // Get all auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    logger.error('Failed to list auth users', { error: authError.message })
    throw new Error(`Failed to list users: ${authError.message}`)
  }

  let users = authUsers.users || []
  
  // Filter by search query (email)
  if (search && search.trim()) {
    const searchLower = search.toLowerCase().trim()
    users = users.filter(user => 
      user.email?.toLowerCase().includes(searchLower)
    )
  }

  // Sort by created_at descending (newest first)
  users.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const total = users.length
  const totalPages = Math.ceil(total / pageSize)
  
  // Paginate
  const startIndex = (page - 1) * pageSize
  const paginatedUsers = users.slice(startIndex, startIndex + pageSize)

  // Get calculation counts for paginated users
  const userIds = paginatedUsers.map(u => u.id)
  
  // Get profiles for additional info
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, image')
    .in('id', userIds)

  // Get calculation counts
  const { data: calculations } = await supabase
    .from('calculations')
    .select('user_id')
    .in('user_id', userIds)

  // Count calculations per user
  const calculationCounts: Record<string, number> = {}
  if (calculations) {
    for (const calc of calculations) {
      calculationCounts[calc.user_id] = (calculationCounts[calc.user_id] || 0) + 1
    }
  }

  // Map profiles by id
  const profilesMap: Record<string, { name: string | null; image: string | null }> = {}
  if (profiles) {
    for (const profile of profiles) {
      profilesMap[profile.id] = { name: profile.name, image: profile.image }
    }
  }

  // Transform to UserListItem
  const items: UserListItem[] = paginatedUsers.map(user => ({
    id: user.id,
    email: user.email || '',
    emailConfirmed: !!user.email_confirmed_at,
    createdAt: user.created_at,
    lastSignIn: user.last_sign_in_at || null,
    calculationCount: calculationCounts[user.id] || 0,
    name: profilesMap[user.id]?.name || null,
    image: profilesMap[user.id]?.image || null,
  }))

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * GET /api/admin/users
 * Get paginated user list with statistics
 * Requirements: 4.1, 4.2, 4.5
 */
async function getUsersHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, requestId } = context

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database not configured',
        code: 'CONFIGURATION_ERROR',
        retryable: false,
        requestId,
      },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)))
  const search = searchParams.get('search') || undefined

  logger.info('Users list requested', {
    userId,
    page,
    pageSize,
    search: search || 'none',
  })

  try {
    const supabase = createAdminClient()

    // Fetch users and stats in parallel
    const [users, stats] = await Promise.all([
      getUserList(supabase, { page, pageSize, search }),
      calculateUserStats(supabase),
    ])

    const response: UsersResponse = {
      success: true,
      data: {
        users,
        stats,
      },
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Failed to get users', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

/**
 * POST /api/admin/users/confirm
 * Confirm a user's email
 * Requirements: 4.4
 */
async function confirmUserHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userId, requestId } = context

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database not configured',
        code: 'CONFIGURATION_ERROR',
        retryable: false,
        requestId,
      },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { targetUserId, action } = body

    if (!targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
          code: 'VALIDATION_ERROR',
          retryable: false,
          requestId,
        },
        { status: 400 }
      )
    }

    if (action !== 'confirm_email') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Supported actions: confirm_email',
          code: 'VALIDATION_ERROR',
          retryable: false,
          requestId,
        },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    logger.info('Confirming user email', {
      adminUserId: userId,
      targetUserId,
    })

    // Update user to confirm email
    const { data, error } = await supabase.auth.admin.updateUserById(targetUserId, {
      email_confirm: true,
    })

    if (error) {
      logger.error('Failed to confirm user email', {
        adminUserId: userId,
        targetUserId,
        error: error.message,
      })

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'DATABASE_ERROR',
          retryable: false,
          requestId,
        },
        { status: 500 }
      )
    }

    logger.info('User email confirmed successfully', {
      adminUserId: userId,
      targetUserId,
      targetEmail: data.user.email,
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'User email confirmed successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: !!data.user.email_confirmed_at,
        },
      },
      requestId,
    })

  } catch (error) {
    logger.error('Failed to confirm user', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

// Export handlers with admin middleware wrapper
// Requirements: 11.1, 11.2, 11.3, 11.4
export const GET = withAdminMiddleware(getUsersHandler, {
  endpoint: '/api/admin/users',
  action: 'view_users',
  rateLimit: true,
  logRequests: true,
})

export const POST = withAdminMiddleware(confirmUserHandler, {
  endpoint: '/api/admin/users',
  action: 'confirm_user_email',
  rateLimit: true,
  logRequests: true,
})
