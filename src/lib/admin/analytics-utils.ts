/**
 * Analytics Utility Functions
 * 
 * Pure functions for analytics calculations that can be tested independently.
 * These functions are extracted from the API route for testability.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

/**
 * Chart Data Point Interface
 * Requirements: 7.2
 */
export interface ChartDataPoint {
  date: string;
  calculations: number;
}

/**
 * Top Tool Interface
 * Requirements: 7.3
 */
export interface TopTool {
  slug: string;
  name: string;
  usageCount: number;
}

/**
 * Recent Activity Interface
 * Requirements: 7.4
 */
export interface RecentActivity {
  id: string;
  type: 'calculation' | 'user_signup' | 'article_created' | 'error';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Dashboard Metrics Interface
 * Requirements: 7.1
 */
export interface DashboardMetrics {
  totalTools: number;
  totalCalculations: number;
  totalUsers: number;
  totalArticles: number;
  calculationsToday: number;
  newUsersThisMonth: number;
}

/**
 * Raw calculation record from database
 */
export interface CalculationRecord {
  id: string;
  tool_slug: string;
  created_at: string;
}

/**
 * Raw user record from database
 */
export interface UserRecord {
  id: string;
  name?: string;
  created_at: string;
}

/**
 * Raw article record from database
 */
export interface ArticleRecord {
  id: string;
  title: string;
  created_at: string;
}

/**
 * Calculate metrics from raw data
 * Requirements: 7.1
 * 
 * @param calculations - Array of calculation records
 * @param users - Array of user records
 * @param articles - Array of article records
 * @param totalTools - Total number of tools available
 * @param today - Today's date (for testing purposes)
 * @returns Dashboard metrics
 */
export function calculateMetricsFromData(
  calculations: CalculationRecord[],
  users: UserRecord[],
  articles: ArticleRecord[],
  totalTools: number,
  today: Date = new Date()
): DashboardMetrics {
  // Get start of today in UTC
  const todayStart = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
    0, 0, 0, 0
  ));

  // Get first day of current month in UTC
  const firstDayOfMonth = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    1, 0, 0, 0, 0
  ));

  // Calculate calculations today
  const calculationsToday = calculations.filter(calc => {
    const calcDate = new Date(calc.created_at);
    return calcDate >= todayStart;
  }).length;

  // Calculate new users this month
  const newUsersThisMonth = users.filter(user => {
    const userDate = new Date(user.created_at);
    return userDate >= firstDayOfMonth;
  }).length;

  return {
    totalTools,
    totalCalculations: calculations.length,
    totalUsers: users.length,
    totalArticles: articles.length,
    calculationsToday,
    newUsersThisMonth,
  };
}

/**
 * Aggregate calculations by day for chart data
 * Requirements: 7.2
 * 
 * @param calculations - Array of calculation records
 * @param startDate - Start date for the range
 * @param endDate - End date for the range
 * @returns Array of chart data points sorted by date ascending
 */
export function aggregateCalculationsByDay(
  calculations: CalculationRecord[],
  startDate: Date,
  endDate: Date
): ChartDataPoint[] {
  // Initialize all days in range with 0
  const dailyCounts: Record<string, number> = {};
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  const endDateNormalized = new Date(endDate);
  endDateNormalized.setHours(23, 59, 59, 999);

  while (currentDate <= endDateNormalized) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dailyCounts[dateKey] = 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Count calculations per day
  for (const calc of calculations) {
    const calcDate = new Date(calc.created_at);
    // Only count if within range
    if (calcDate >= startDate && calcDate <= endDateNormalized) {
      const dateKey = calcDate.toISOString().split('T')[0];
      if (dailyCounts[dateKey] !== undefined) {
        dailyCounts[dateKey]++;
      }
    }
  }

  // Convert to array format and sort by date ascending
  return Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, calculations: count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate top N tools by usage count
 * Requirements: 7.3
 * 
 * @param calculations - Array of calculation records
 * @param toolNameResolver - Function to resolve tool slug to name
 * @param limit - Maximum number of tools to return (default 5)
 * @returns Array of top tools sorted by usage count descending
 */
export function calculateTopTools(
  calculations: CalculationRecord[],
  toolNameResolver: (slug: string) => string,
  limit: number = 5
): TopTool[] {
  // Count usage per tool
  const toolCounts: Record<string, number> = {};

  for (const calc of calculations) {
    const slug = calc.tool_slug;
    toolCounts[slug] = (toolCounts[slug] || 0) + 1;
  }

  // Sort by count descending and take top N
  return Object.entries(toolCounts)
    .map(([slug, usageCount]) => ({
      slug,
      name: toolNameResolver(slug),
      usageCount,
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

/**
 * Sort and limit recent activities by timestamp
 * Requirements: 7.4
 * 
 * @param activities - Array of activity records
 * @param limit - Maximum number of activities to return (default 10)
 * @returns Array of activities sorted by timestamp descending
 */
export function sortRecentActivities(
  activities: RecentActivity[],
  limit: number = 10
): RecentActivity[] {
  return [...activities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Create activity records from raw data
 * Requirements: 7.4
 * 
 * @param calculations - Recent calculation records
 * @param users - Recent user records
 * @param articles - Recent article records
 * @param toolNameResolver - Function to resolve tool slug to name
 * @returns Combined array of activity records
 */
export function createActivityRecords(
  calculations: CalculationRecord[],
  users: UserRecord[],
  articles: ArticleRecord[],
  toolNameResolver: (slug: string) => string
): RecentActivity[] {
  const activities: RecentActivity[] = [];

  // Add calculation activities
  for (const calc of calculations) {
    activities.push({
      id: `calc_${calc.id}`,
      type: 'calculation',
      description: `Calculation performed: ${toolNameResolver(calc.tool_slug)}`,
      timestamp: calc.created_at,
      metadata: { toolSlug: calc.tool_slug },
    });
  }

  // Add user signup activities
  for (const user of users) {
    activities.push({
      id: `user_${user.id}`,
      type: 'user_signup',
      description: `New user registered: ${user.name || 'Anonymous'}`,
      timestamp: user.created_at,
      metadata: { userId: user.id },
    });
  }

  // Add article activities
  for (const article of articles) {
    activities.push({
      id: `article_${article.id}`,
      type: 'article_created',
      description: `Article created: ${article.title}`,
      timestamp: article.created_at,
      metadata: { articleId: article.id },
    });
  }

  return activities;
}

/**
 * Get date range based on range parameter
 * Requirements: 7.5
 * 
 * @param rangeParam - Range parameter ('1d', '7d', '30d', '90d')
 * @param now - Current date (for testing purposes)
 * @returns Object with start date, end date, and label
 */
export function getDateRange(
  rangeParam: string | null,
  now: Date = new Date()
): { start: Date; end: Date; label: string } {
  const end = new Date(now);
  let start: Date;
  let label: string;

  switch (rangeParam) {
    case '1d':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      label = '1 Day';
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = '7 Days';
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      label = '30 Days';
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      label = '90 Days';
      break;
    default:
      // Default to 7 days
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = '7 Days';
  }

  return { start, end, label };
}
