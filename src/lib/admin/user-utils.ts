/**
 * User Management Utilities
 * 
 * Pure utility functions for user management that can be tested independently.
 * These functions implement the core logic for user listing, pagination,
 * search, and statistics calculation.
 * 
 * Requirements: 4.1, 4.2, 4.5
 */

// ============================================================================
// Types
// ============================================================================

/**
 * User record from database/auth system
 */
export interface UserRecord {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
  lastSignIn: string | null;
  name?: string | null;
}

/**
 * User list item with calculation count
 */
export interface UserListItem extends UserRecord {
  calculationCount: number;
}

/**
 * User statistics
 * Requirements: 4.5
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  unconfirmedUsers: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// ============================================================================
// Property 6: User List Pagination Correctness
// Requirements: 4.1
// ============================================================================

/**
 * Paginate a list of users
 * 
 * For any page number and page size, returns the correct subset of users
 * and accurate pagination metadata.
 * 
 * @param users - Full list of users
 * @param params - Pagination parameters
 * @returns Paginated response with correct subset and metadata
 */
export function paginateUsers<T>(
  users: T[],
  params: PaginationParams
): PaginatedResponse<T> {
  const { page, pageSize } = params;
  
  // Ensure valid parameters
  const validPage = Math.max(1, page);
  const validPageSize = Math.max(1, pageSize);
  
  const total = users.length;
  const totalPages = Math.max(1, Math.ceil(total / validPageSize));
  
  // Clamp page to valid range
  const clampedPage = Math.min(validPage, totalPages);
  
  // Calculate slice indices
  const startIndex = (clampedPage - 1) * validPageSize;
  const endIndex = Math.min(startIndex + validPageSize, total);
  
  // Get the subset
  const items = users.slice(startIndex, endIndex);
  
  return {
    items,
    total,
    page: clampedPage,
    pageSize: validPageSize,
    totalPages,
  };
}

/**
 * Validate pagination response
 * 
 * Checks that pagination metadata is consistent with the data.
 * 
 * @param response - Paginated response to validate
 * @returns Validation result with any errors
 */
export function validatePaginationResponse<T>(
  response: PaginatedResponse<T>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check page bounds
  if (response.page < 1) {
    errors.push('Page number must be >= 1');
  }
  
  if (response.page > response.totalPages && response.total > 0) {
    errors.push('Page number exceeds total pages');
  }
  
  // Check pageSize
  if (response.pageSize < 1) {
    errors.push('Page size must be >= 1');
  }
  
  // Check totalPages calculation
  const expectedTotalPages = Math.max(1, Math.ceil(response.total / response.pageSize));
  if (response.totalPages !== expectedTotalPages) {
    errors.push(`Total pages mismatch: expected ${expectedTotalPages}, got ${response.totalPages}`);
  }
  
  // Check items count
  const maxItemsOnPage = response.pageSize;
  if (response.items.length > maxItemsOnPage) {
    errors.push(`Items count exceeds page size: ${response.items.length} > ${maxItemsOnPage}`);
  }
  
  // Check if last page has correct item count
  if (response.page === response.totalPages && response.total > 0) {
    const expectedItemsOnLastPage = response.total - (response.totalPages - 1) * response.pageSize;
    if (response.items.length !== expectedItemsOnLastPage && response.items.length !== 0) {
      // Allow for empty last page edge case
      if (!(response.items.length === 0 && expectedItemsOnLastPage <= 0)) {
        errors.push(`Last page items mismatch: expected ${expectedItemsOnLastPage}, got ${response.items.length}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate expected items for a specific page
 * 
 * @param total - Total number of items
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page
 * @returns Expected number of items on the page
 */
export function calculateExpectedItemsOnPage(
  total: number,
  page: number,
  pageSize: number
): number {
  if (total === 0) return 0;
  
  const totalPages = Math.ceil(total / pageSize);
  if (page > totalPages) return 0;
  
  if (page === totalPages) {
    // Last page may have fewer items
    const remainder = total % pageSize;
    return remainder === 0 ? pageSize : remainder;
  }
  
  return pageSize;
}

// ============================================================================
// Property 7: User Search Accuracy
// Requirements: 4.2
// ============================================================================

/**
 * Search users by email
 * 
 * Returns only users whose email contains the search query (case-insensitive).
 * 
 * @param users - List of users to search
 * @param query - Search query
 * @returns Filtered list of users matching the query
 */
export function searchUsersByEmail<T extends { email: string }>(
  users: T[],
  query: string
): T[] {
  const trimmedQuery = query.trim().toLowerCase();
  
  // Empty query returns all users
  if (!trimmedQuery) {
    return users;
  }
  
  return users.filter(user => 
    user.email.toLowerCase().includes(trimmedQuery)
  );
}

/**
 * Check if a user matches a search query
 * 
 * @param user - User to check
 * @param query - Search query
 * @returns True if user's email contains the query (case-insensitive)
 */
export function userMatchesSearch(
  user: { email: string },
  query: string
): boolean {
  const trimmedQuery = query.trim().toLowerCase();
  
  // Empty query matches all users
  if (!trimmedQuery) {
    return true;
  }
  
  return user.email.toLowerCase().includes(trimmedQuery);
}

/**
 * Verify search results
 * 
 * Checks that all returned users match the search query and no matching
 * users were excluded.
 * 
 * @param originalUsers - Original list of users
 * @param filteredUsers - Filtered search results
 * @param query - Search query used
 * @returns Verification result
 */
export function verifySearchResults<T extends { email: string }>(
  originalUsers: T[],
  filteredUsers: T[],
  query: string
): { 
  isValid: boolean; 
  errors: string[];
  nonMatchingIncluded: T[];
  matchingExcluded: T[];
} {
  const errors: string[] = [];
  const nonMatchingIncluded: T[] = [];
  const matchingExcluded: T[] = [];
  
  const filteredIds = new Set(filteredUsers.map(u => u.email));
  
  // Check all filtered users match the query
  for (const user of filteredUsers) {
    if (!userMatchesSearch(user, query)) {
      nonMatchingIncluded.push(user);
      errors.push(`User ${user.email} does not match query "${query}"`);
    }
  }
  
  // Check no matching users were excluded
  for (const user of originalUsers) {
    if (userMatchesSearch(user, query) && !filteredIds.has(user.email)) {
      matchingExcluded.push(user);
      errors.push(`User ${user.email} matches query but was excluded`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    nonMatchingIncluded,
    matchingExcluded,
  };
}

// ============================================================================
// Property 8: User Statistics Calculation
// Requirements: 4.5
// ============================================================================

/**
 * Calculate user statistics
 * 
 * Calculates total users, active users (signed in within last 30 days),
 * new users this month, and unconfirmed users.
 * 
 * @param users - List of users
 * @param referenceDate - Reference date for calculations (defaults to now)
 * @returns User statistics
 */
export function calculateUserStats(
  users: UserRecord[],
  referenceDate: Date = new Date()
): UserStats {
  // Calculate date boundaries
  const thirtyDaysAgo = new Date(referenceDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  
  const firstDayOfMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1,
    0, 0, 0, 0
  );
  
  let totalUsers = 0;
  let activeUsers = 0;
  let newUsersThisMonth = 0;
  let unconfirmedUsers = 0;
  
  for (const user of users) {
    totalUsers++;
    
    // Active users = signed in within last 30 days
    if (user.lastSignIn) {
      const lastSignInDate = new Date(user.lastSignIn);
      if (lastSignInDate >= thirtyDaysAgo) {
        activeUsers++;
      }
    }
    
    // New users this month
    const createdDate = new Date(user.createdAt);
    if (createdDate >= firstDayOfMonth) {
      newUsersThisMonth++;
    }
    
    // Unconfirmed users
    if (!user.emailConfirmed) {
      unconfirmedUsers++;
    }
  }
  
  return {
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    unconfirmedUsers,
  };
}

/**
 * Verify user statistics
 * 
 * Manually calculates expected statistics and compares with provided stats.
 * 
 * @param users - List of users
 * @param stats - Statistics to verify
 * @param referenceDate - Reference date for calculations
 * @returns Verification result
 */
export function verifyUserStats(
  users: UserRecord[],
  stats: UserStats,
  referenceDate: Date = new Date()
): { isValid: boolean; errors: string[]; expected: UserStats } {
  const expected = calculateUserStats(users, referenceDate);
  const errors: string[] = [];
  
  if (stats.totalUsers !== expected.totalUsers) {
    errors.push(`Total users mismatch: expected ${expected.totalUsers}, got ${stats.totalUsers}`);
  }
  
  if (stats.activeUsers !== expected.activeUsers) {
    errors.push(`Active users mismatch: expected ${expected.activeUsers}, got ${stats.activeUsers}`);
  }
  
  if (stats.newUsersThisMonth !== expected.newUsersThisMonth) {
    errors.push(`New users this month mismatch: expected ${expected.newUsersThisMonth}, got ${stats.newUsersThisMonth}`);
  }
  
  if (stats.unconfirmedUsers !== expected.unconfirmedUsers) {
    errors.push(`Unconfirmed users mismatch: expected ${expected.unconfirmedUsers}, got ${stats.unconfirmedUsers}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    expected,
  };
}

/**
 * Count active users (signed in within last N days)
 * 
 * @param users - List of users
 * @param days - Number of days to consider as "active"
 * @param referenceDate - Reference date for calculations
 * @returns Count of active users
 */
export function countActiveUsers(
  users: UserRecord[],
  days: number = 30,
  referenceDate: Date = new Date()
): number {
  const cutoffDate = new Date(referenceDate);
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0);
  
  return users.filter(user => {
    if (!user.lastSignIn) return false;
    return new Date(user.lastSignIn) >= cutoffDate;
  }).length;
}

/**
 * Count new users within a date range
 * 
 * @param users - List of users
 * @param startDate - Start of date range
 * @param endDate - End of date range (defaults to now)
 * @returns Count of new users in range
 */
export function countNewUsersInRange(
  users: UserRecord[],
  startDate: Date,
  endDate: Date = new Date()
): number {
  return users.filter(user => {
    const createdDate = new Date(user.createdAt);
    return createdDate >= startDate && createdDate <= endDate;
  }).length;
}

/**
 * Count unconfirmed users
 * 
 * @param users - List of users
 * @returns Count of users with unconfirmed emails
 */
export function countUnconfirmedUsers(users: UserRecord[]): number {
  return users.filter(user => !user.emailConfirmed).length;
}

// ============================================================================
// Combined Operations
// ============================================================================

/**
 * Search and paginate users
 * 
 * Combines search and pagination in the correct order.
 * 
 * @param users - Full list of users
 * @param searchQuery - Search query (optional)
 * @param pagination - Pagination parameters
 * @returns Paginated search results
 */
export function searchAndPaginateUsers<T extends { email: string }>(
  users: T[],
  searchQuery: string | undefined,
  pagination: PaginationParams
): PaginatedResponse<T> {
  // First filter by search
  const filtered = searchQuery 
    ? searchUsersByEmail(users, searchQuery)
    : users;
  
  // Then paginate
  return paginateUsers(filtered, pagination);
}

/**
 * Sort users by creation date (newest first)
 * 
 * @param users - List of users to sort
 * @returns Sorted list (does not mutate original)
 */
export function sortUsersByCreatedAt<T extends { createdAt: string }>(
  users: T[]
): T[] {
  return [...users].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
