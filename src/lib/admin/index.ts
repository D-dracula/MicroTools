/**
 * Admin Library Exports
 * 
 * Provides admin authentication, authorization, and middleware utilities
 * 
 * Note: This file exports client-safe utilities only.
 * For server-side middleware, import directly from './admin-middleware'
 */

// Client-safe exports (can be used in client components)
export {
  useAdminAuth,
  type AdminUser,
  type UseAdminAuthReturn,
} from './use-admin-auth'

// Re-export types only from admin-middleware (types are safe for client)
export type {
  AdminMiddlewareOptions,
  AdminContext,
  AdminActionType,
  AdminActionLog,
  AdminApiResponse,
} from './admin-middleware'

// Blog utilities (pure functions for filtering and validation)
export {
  validateArticleDisplayFields,
  validateArticleListCompleteness,
  filterByStatus,
  filterByCategory,
  filterBySearch,
  filterArticles,
  articleMatchesCriteria,
  verifyFilterResults,
  REQUIRED_ARTICLE_FIELDS,
  type AdminArticleListItem,
  type ArticleFilterCriteria,
  type RequiredArticleField,
} from './blog-utils'

// User utilities (pure functions for pagination, search, and statistics)
export {
  paginateUsers,
  validatePaginationResponse,
  calculateExpectedItemsOnPage,
  searchUsersByEmail,
  userMatchesSearch,
  verifySearchResults,
  calculateUserStats,
  verifyUserStats,
  countActiveUsers,
  countNewUsersInRange,
  countUnconfirmedUsers,
  searchAndPaginateUsers,
  sortUsersByCreatedAt,
  type UserRecord,
  type UserListItem,
  type UserStats,
  type PaginatedResponse,
  type PaginationParams,
} from './user-utils'

// Error utilities (pure functions for error metrics and filtering)
export {
  calculateErrorMetrics,
  verifyErrorMetrics,
  filterBySeverity,
  filterByStatus as filterErrorsByStatus,
  filterByTimeRange,
  filterBySearch as filterErrorsBySearch,
  filterErrors,
  errorMatchesCriteria,
  verifyFilterResults as verifyErrorFilterResults,
  countBySeverity,
  countCriticalErrors,
  countResolvedInRange,
  calculateErrorRate,
  findExcludedMatches,
  getTimeRange,
  sortByTimestamp,
  sortBySeverity,
  type ErrorRecord,
  type Severity,
  type SeverityFilter,
  type AlertStatus,
  type ErrorMetrics,
  type ErrorFilterCriteria,
  type MetricsVerification,
  type FilterVerification,
  type TimeRangeLabel,
} from './error-utils'

// Migration utilities (pure functions for migration statistics)
export {
  calculateMigrationStats,
  verifyMigrationStats,
  countMigrationsByStatus,
  validateStatisticsSum,
  getMigrationsByStatus,
  formatMigrationList,
  getLastBatchId,
  sortMigrationsByExecutionDate,
  sortMigrationsByName,
  calculateTotalExecutionTime,
  getMigrationsByBatch,
  hasPendingMigrations,
  hasFailedMigrations,
  getUniqueBatchIds,
  type MigrationRecord,
  type MigrationStatusType,
  type MigrationStats,
  type MigrationListItem,
} from './migration-utils'

// Analytics utilities (pure functions for analytics calculations)
export {
  calculateMetricsFromData,
  aggregateCalculationsByDay,
  calculateTopTools,
  sortRecentActivities,
  createActivityRecords,
  getDateRange,
  type ChartDataPoint,
  type TopTool,
  type RecentActivity,
  type DashboardMetrics,
  type CalculationRecord,
  type UserRecord as AnalyticsUserRecord,
  type ArticleRecord,
} from './analytics-utils'

// Admin utilities (general admin helper functions)
export {
  getAdminEmails,
  isAdminEmail,
  verifyAdminEmail,
} from './admin-utils'

// Keys utilities (pure functions for API key masking and validation)
export {
  maskApiKey,
  isMaskedProperly,
  testOpenRouterKey,
  testSupabaseUrl,
  testSupabaseAnonKey,
  testExaKey,
  isValidValidationResult,
  type KeyValidationResult,
} from './keys-utils'
