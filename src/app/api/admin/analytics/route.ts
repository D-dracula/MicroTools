/**
 * Admin Analytics API Endpoint
 * Provides analytics data for the admin dashboard
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { tools } from '@/lib/tools'
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
 * Dashboard Metrics Interface
 * Requirements: 7.1
 */
interface DashboardMetrics {
  totalTools: number
  totalCalculations: number
  totalUsers: number
  totalArticles: number
  calculationsToday: number
  newUsersThisMonth: number
}

/**
 * Chart Data Interface
 * Requirements: 7.2
 */
interface ChartDataPoint {
  date: string
  calculations: number
}

/**
 * Top Tool Interface
 * Requirements: 7.3
 */
interface TopTool {
  slug: string
  name: string
  usageCount: number
}

/**
 * Recent Activity Interface
 * Requirements: 7.4
 */
interface RecentActivity {
  id: string
  type: 'calculation' | 'user_signup' | 'article_created' | 'error'
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

/**
 * Analytics Response Interface
 */
interface AnalyticsResponse {
  success: boolean
  data: {
    metrics: DashboardMetrics
    chartData: ChartDataPoint[]
    topTools: TopTool[]
    recentActivity: RecentActivity[]
    dateRange: {
      start: string
      end: string
      label: string
    }
  }
}

/**
 * Get date range based on query parameter
 * Requirements: 7.5
 */
function getDateRange(rangeParam: string | null): { start: Date; end: Date; label: string } {
  const end = new Date()
  let start: Date
  let label: string

  switch (rangeParam) {
    case '1d':
      start = new Date(Date.now() - 24 * 60 * 60 * 1000)
      label = '1 Day'
      break
    case '7d':
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      label = '7 Days'
      break
    case '30d':
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      label = '30 Days'
      break
    case '90d':
      start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      label = '90 Days'
      break
    default:
      // Default to 7 days
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      label = '7 Days'
  }

  return { start, end, label }
}

/**
 * Get tool name by slug
 */
function getToolName(slug: string): string {
  const tool = tools.find(t => t.slug === slug)
  return tool?.titleKey.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || slug
}

/**
 * Calculate metrics from database
 * Requirements: 7.1
 */
async function calculateMetrics(
  supabase: ReturnType<typeof createAdminClient>,
  startDate: Date
): Promise<DashboardMetrics> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // Get total calculations
  const { count: totalCalculations } = await supabase
    .from('calculations')
    .select('*', { count: 'exact', head: true })

  // Get calculations today
  const { count: calculationsToday } = await supabase
    .from('calculations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // Get total users (profiles)
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get new users this month
  const { count: newUsersThisMonth } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', firstDayOfMonth.toISOString())

  // Get total articles
  const { count: totalArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })

  return {
    totalTools: tools.length,
    totalCalculations: totalCalculations || 0,
    totalUsers: totalUsers || 0,
    totalArticles: totalArticles || 0,
    calculationsToday: calculationsToday || 0,
    newUsersThisMonth: newUsersThisMonth || 0,
  }
}

/**
 * Get chart data aggregated by day
 * Requirements: 7.2
 */
async function getChartData(
  supabase: ReturnType<typeof createAdminClient>,
  startDate: Date,
  endDate: Date
): Promise<ChartDataPoint[]> {
  // Get calculations within date range
  const { data: calculations } = await supabase
    .from('calculations')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true })

  // Aggregate by day
  const dailyCounts: Record<string, number> = {}
  
  // Initialize all days in range with 0
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    dailyCounts[dateKey] = 0
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Count calculations per day
  if (calculations) {
    for (const calc of calculations) {
      const dateKey = new Date(calc.created_at).toISOString().split('T')[0]
      if (dailyCounts[dateKey] !== undefined) {
        dailyCounts[dateKey]++
      }
    }
  }

  // Convert to array format
  return Object.entries(dailyCounts)
    .map(([date, calculations]) => ({ date, calculations }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get top 5 most used tools
 * Requirements: 7.3
 */
async function getTopTools(
  supabase: ReturnType<typeof createAdminClient>,
  startDate: Date,
  endDate: Date
): Promise<TopTool[]> {
  // Get calculations within date range grouped by tool
  const { data: calculations } = await supabase
    .from('calculations')
    .select('tool_slug')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  // Count usage per tool
  const toolCounts: Record<string, number> = {}
  
  if (calculations) {
    for (const calc of calculations) {
      const slug = calc.tool_slug
      toolCounts[slug] = (toolCounts[slug] || 0) + 1
    }
  }

  // Sort by count and take top 5
  const sortedTools = Object.entries(toolCounts)
    .map(([slug, usageCount]) => ({
      slug,
      name: getToolName(slug),
      usageCount,
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5)

  return sortedTools
}

/**
 * Get recent activity feed
 * Requirements: 7.4
 */
async function getRecentActivity(
  supabase: ReturnType<typeof createAdminClient>,
  limit: number = 10
): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = []

  // Get recent calculations
  const { data: recentCalculations } = await supabase
    .from('calculations')
    .select('id, tool_slug, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (recentCalculations) {
    for (const calc of recentCalculations) {
      activities.push({
        id: `calc_${calc.id}`,
        type: 'calculation',
        description: `Calculation performed: ${getToolName(calc.tool_slug)}`,
        timestamp: calc.created_at,
        metadata: { toolSlug: calc.tool_slug },
      })
    }
  }

  // Get recent user signups
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  if (recentUsers) {
    for (const user of recentUsers) {
      activities.push({
        id: `user_${user.id}`,
        type: 'user_signup',
        description: `New user registered: ${user.name || 'Anonymous'}`,
        timestamp: user.created_at,
        metadata: { userId: user.id },
      })
    }
  }

  // Get recent articles
  const { data: recentArticles } = await supabase
    .from('articles')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(2)

  if (recentArticles) {
    for (const article of recentArticles) {
      activities.push({
        id: `article_${article.id}`,
        type: 'article_created',
        description: `Article created: ${article.title}`,
        timestamp: article.created_at,
        metadata: { articleId: article.id },
      })
    }
  }

  // Sort all activities by timestamp (descending) and limit
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

/**
 * GET /api/admin/analytics
 * Get analytics dashboard data
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
async function getAnalyticsHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
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
  const rangeParam = searchParams.get('range')
  const { start, end, label } = getDateRange(rangeParam)

  logger.info('Analytics data requested', {
    userId,
    dateRange: label,
    start: start.toISOString(),
    end: end.toISOString(),
  })

  try {
    const supabase = createAdminClient()

    // Fetch all analytics data in parallel
    const [metrics, chartData, topTools, recentActivity] = await Promise.all([
      calculateMetrics(supabase, start),
      getChartData(supabase, start, end),
      getTopTools(supabase, start, end),
      getRecentActivity(supabase, 10),
    ])

    const response: AnalyticsResponse = {
      success: true,
      data: {
        metrics,
        chartData,
        topTools,
        recentActivity,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
          label,
        },
      },
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Failed to get analytics data', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

// Export handler with admin middleware wrapper
// Requirements: 11.1, 11.2, 11.3, 11.4
export const GET = withAdminMiddleware(getAnalyticsHandler, {
  endpoint: '/api/admin/analytics',
  action: 'view_analytics',
  rateLimit: true,
  logRequests: true,
})
