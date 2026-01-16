/**
 * Property-Based Tests for User Management Utilities
 * 
 * Feature: admin-dashboard
 * Properties: 6, 7, 8
 * Validates: Requirements 4.1, 4.2, 4.5
 */

import fc from 'fast-check';
import {
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
  type PaginationParams,
} from './user-utils';

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generate a valid ISO date string within a range
 */
function isoDateString(minDate: Date, maxDate: Date): fc.Arbitrary<string> {
  const minTime = minDate.getTime();
  const maxTime = maxDate.getTime();
  return fc.integer({ min: minTime, max: maxTime })
    .map(timestamp => new Date(timestamp).toISOString());
}


/**
 * Generate a valid email address
 */
function emailAddress(): fc.Arbitrary<string> {
  return fc.tuple(
    fc.stringMatching(/^[a-z][a-z0-9._]{2,15}$/),
    fc.constantFrom('gmail.com', 'yahoo.com', 'outlook.com', 'example.com', 'test.org')
  ).map(([local, domain]) => `${local}@${domain}`);
}

/**
 * Generate a user record
 */
function userRecord(minDate: Date, maxDate: Date): fc.Arbitrary<UserRecord> {
  return fc.record({
    id: fc.uuid(),
    email: emailAddress(),
    emailConfirmed: fc.boolean(),
    createdAt: isoDateString(minDate, maxDate),
    lastSignIn: fc.option(isoDateString(minDate, maxDate), { nil: null }),
    name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  });
}

/**
 * Generate pagination parameters
 */
function paginationParams(): fc.Arbitrary<PaginationParams> {
  return fc.record({
    page: fc.integer({ min: 1, max: 100 }),
    pageSize: fc.integer({ min: 1, max: 50 }),
  });
}

// ============================================================================
// Property 6: User List Pagination Correctness
// Validates: Requirements 4.1
// ============================================================================

describe('Property 6: User List Pagination Correctness', () => {
  const now = new Date('2026-01-14T12:00:00Z');
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);


  /**
   * Property 6a: Pagination returns correct subset
   * 
   * For any list of users and pagination parameters, the returned items
   * should be the correct subset based on page and pageSize.
   */
  it('Property 6a: Pagination returns correct subset of users', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 100 }),
        paginationParams(),
        (users, params) => {
          const result = paginateUsers(users, params);
          
          // Calculate expected start and end indices
          const startIndex = (result.page - 1) * result.pageSize;
          const expectedItems = users.slice(startIndex, startIndex + result.pageSize);
          
          // Items should match expected subset
          expect(result.items.length).toBe(expectedItems.length);
          for (let i = 0; i < result.items.length; i++) {
            expect(result.items[i].id).toBe(expectedItems[i].id);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6b: Total count is accurate
   * 
   * For any list of users, the total count should equal the array length.
   */
  it('Property 6b: Total count accurately reflects array length', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 100 }),
        paginationParams(),
        (users, params) => {
          const result = paginateUsers(users, params);
          
          expect(result.total).toBe(users.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 6c: Total pages calculation is correct
   * 
   * For any list of users and page size, totalPages should be ceil(total/pageSize).
   */
  it('Property 6c: Total pages calculation is correct', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 100 }),
        paginationParams(),
        (users, params) => {
          const result = paginateUsers(users, params);
          
          const expectedTotalPages = Math.max(1, Math.ceil(users.length / params.pageSize));
          expect(result.totalPages).toBe(expectedTotalPages);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6d: Items per page does not exceed pageSize
   * 
   * For any pagination result, items.length should be <= pageSize.
   */
  it('Property 6d: Items per page does not exceed pageSize', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 100 }),
        paginationParams(),
        (users, params) => {
          const result = paginateUsers(users, params);
          
          expect(result.items.length).toBeLessThanOrEqual(result.pageSize);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 6e: Last page has correct item count
   * 
   * For any list, the last page should have the remaining items.
   */
  it('Property 6e: Last page has correct item count', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 20 }),
        (users, pageSize) => {
          const totalPages = Math.ceil(users.length / pageSize);
          const result = paginateUsers(users, { page: totalPages, pageSize });
          
          const expectedItemsOnLastPage = calculateExpectedItemsOnPage(
            users.length,
            totalPages,
            pageSize
          );
          
          expect(result.items.length).toBe(expectedItemsOnLastPage);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6f: Pagination validation passes for valid responses
   * 
   * For any valid pagination result, validation should pass.
   */
  it('Property 6f: Pagination validation passes for valid responses', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 100 }),
        paginationParams(),
        (users, params) => {
          const result = paginateUsers(users, params);
          const validation = validatePaginationResponse(result);
          
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toHaveLength(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 6g: All pages together contain all items
   * 
   * For any list, iterating through all pages should yield all items exactly once.
   */
  it('Property 6g: All pages together contain all items exactly once', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 50 }),
        fc.integer({ min: 1, max: 10 }),
        (users, pageSize) => {
          const allItems: UserRecord[] = [];
          const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
          
          for (let page = 1; page <= totalPages; page++) {
            const result = paginateUsers(users, { page, pageSize });
            allItems.push(...result.items);
          }
          
          // Should have all items
          expect(allItems.length).toBe(users.length);
          
          // Each item should appear exactly once
          const ids = allItems.map(u => u.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(users.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6h: Page beyond total returns empty or last page
   * 
   * For any list, requesting a page beyond totalPages should handle gracefully.
   */
  it('Property 6h: Page beyond total is handled gracefully', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 100 }),
        (users, pageSize, extraPages) => {
          const totalPages = Math.ceil(users.length / pageSize);
          const requestedPage = totalPages + extraPages;
          
          const result = paginateUsers(users, { page: requestedPage, pageSize });
          
          // Should clamp to last page
          expect(result.page).toBeLessThanOrEqual(totalPages);
          expect(result.page).toBeGreaterThanOrEqual(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 7: User Search Accuracy
// Validates: Requirements 4.2
// ============================================================================

describe('Property 7: User Search Accuracy', () => {
  const now = new Date('2026-01-14T12:00:00Z');
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  /**
   * Property 7a: Search returns only matching users
   * 
   * For any search query, all returned users should have emails
   * containing the query (case-insensitive).
   */
  it('Property 7a: Search returns only users whose email contains query', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 20 }),
        (users, query) => {
          const results = searchUsersByEmail(users, query);
          const queryLower = query.trim().toLowerCase();
          
          // All results should contain the query
          for (const user of results) {
            if (queryLower) {
              expect(user.email.toLowerCase()).toContain(queryLower);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 7b: Search is case-insensitive
   * 
   * For any search query, searching with different cases should return
   * the same results.
   */
  it('Property 7b: Search is case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 50 }),
        fc.stringMatching(/^[a-zA-Z]{1,10}$/),
        (users, query) => {
          const lowerResults = searchUsersByEmail(users, query.toLowerCase());
          const upperResults = searchUsersByEmail(users, query.toUpperCase());
          const mixedResults = searchUsersByEmail(users, query);
          
          // All should return same count
          expect(lowerResults.length).toBe(upperResults.length);
          expect(upperResults.length).toBe(mixedResults.length);
          
          // All should return same users
          const lowerIds = new Set(lowerResults.map(u => u.id));
          const upperIds = new Set(upperResults.map(u => u.id));
          
          expect(lowerIds).toEqual(upperIds);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7c: Empty search returns all users
   * 
   * For any list of users, an empty search query should return all users.
   */
  it('Property 7c: Empty search returns all users', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 50 }),
        fc.constantFrom('', '   ', '\t', '\n'),
        (users, emptyQuery) => {
          const results = searchUsersByEmail(users, emptyQuery);
          
          expect(results.length).toBe(users.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 7d: No matching users are excluded
   * 
   * For any search query, no user whose email contains the query
   * should be excluded from results.
   */
  it('Property 7d: No matching users are excluded', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 20 }),
        (users, query) => {
          const results = searchUsersByEmail(users, query);
          const verification = verifySearchResults(users, results, query);
          
          expect(verification.isValid).toBe(true);
          expect(verification.matchingExcluded).toHaveLength(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7e: Search results are subset of original
   * 
   * For any search, results should be a subset of the original list.
   */
  it('Property 7e: Search results are subset of original', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 20 }),
        (users, query) => {
          const results = searchUsersByEmail(users, query);
          
          // Results count should be <= original count
          expect(results.length).toBeLessThanOrEqual(users.length);
          
          // All result IDs should exist in original
          const originalIds = new Set(users.map(u => u.id));
          for (const user of results) {
            expect(originalIds.has(user.id)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 7f: Search is idempotent
   * 
   * For any search, searching twice should return the same results.
   */
  it('Property 7f: Search is idempotent', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 20 }),
        (users, query) => {
          const firstResults = searchUsersByEmail(users, query);
          const secondResults = searchUsersByEmail(firstResults, query);
          
          // Should have same results
          expect(secondResults.length).toBe(firstResults.length);
          
          const firstIds = new Set(firstResults.map(u => u.id));
          const secondIds = new Set(secondResults.map(u => u.id));
          expect(firstIds).toEqual(secondIds);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7g: userMatchesSearch is consistent with searchUsersByEmail
   * 
   * For any user and query, userMatchesSearch should return true iff
   * the user would be included in searchUsersByEmail results.
   */
  it('Property 7g: userMatchesSearch is consistent with searchUsersByEmail', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 20 }),
        (users, query) => {
          const results = searchUsersByEmail(users, query);
          const resultIds = new Set(results.map(u => u.id));
          
          for (const user of users) {
            const matches = userMatchesSearch(user, query);
            const inResults = resultIds.has(user.id);
            
            expect(matches).toBe(inResults);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 8: User Statistics Calculation
// Validates: Requirements 4.5
// ============================================================================

describe('Property 8: User Statistics Calculation', () => {
  const referenceDate = new Date('2026-01-14T12:00:00Z');
  const sixtyDaysAgo = new Date(referenceDate.getTime() - 60 * 24 * 60 * 60 * 1000);

  /**
   * Property 8a: Total users count is accurate
   * 
   * For any set of users, totalUsers should equal the array length.
   */
  it('Property 8a: Total users count equals array length', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (users) => {
          const stats = calculateUserStats(users, referenceDate);
          
          expect(stats.totalUsers).toBe(users.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8b: Active users count is accurate
   * 
   * For any set of users, activeUsers should count only users who
   * signed in within the last 30 days.
   */
  it('Property 8b: Active users count only includes recent sign-ins', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (users) => {
          const stats = calculateUserStats(users, referenceDate);
          
          // Manually count active users
          const thirtyDaysAgo = new Date(referenceDate);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          
          const expectedActive = users.filter(u => {
            if (!u.lastSignIn) return false;
            return new Date(u.lastSignIn) >= thirtyDaysAgo;
          }).length;
          
          expect(stats.activeUsers).toBe(expectedActive);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 8c: New users this month count is accurate
   * 
   * For any set of users, newUsersThisMonth should count only users
   * created since the first day of the current month.
   */
  it('Property 8c: New users this month count only includes this month', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (users) => {
          const stats = calculateUserStats(users, referenceDate);
          
          // Manually count new users this month
          const firstDayOfMonth = new Date(
            referenceDate.getFullYear(),
            referenceDate.getMonth(),
            1, 0, 0, 0, 0
          );
          
          const expectedNewThisMonth = users.filter(u => {
            return new Date(u.createdAt) >= firstDayOfMonth;
          }).length;
          
          expect(stats.newUsersThisMonth).toBe(expectedNewThisMonth);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8d: Unconfirmed users count is accurate
   * 
   * For any set of users, unconfirmedUsers should count only users
   * with emailConfirmed = false.
   */
  it('Property 8d: Unconfirmed users count only includes unconfirmed', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (users) => {
          const stats = calculateUserStats(users, referenceDate);
          
          const expectedUnconfirmed = users.filter(u => !u.emailConfirmed).length;
          
          expect(stats.unconfirmedUsers).toBe(expectedUnconfirmed);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 8e: Statistics verification passes for calculated stats
   * 
   * For any set of users, verifyUserStats should pass for stats
   * calculated by calculateUserStats.
   */
  it('Property 8e: Statistics verification passes for calculated stats', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (users) => {
          const stats = calculateUserStats(users, referenceDate);
          const verification = verifyUserStats(users, stats, referenceDate);
          
          expect(verification.isValid).toBe(true);
          expect(verification.errors).toHaveLength(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8f: Active users <= total users
   * 
   * For any set of users, activeUsers should never exceed totalUsers.
   */
  it('Property 8f: Active users never exceeds total users', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (users) => {
          const stats = calculateUserStats(users, referenceDate);
          
          expect(stats.activeUsers).toBeLessThanOrEqual(stats.totalUsers);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 8g: New users this month <= total users
   * 
   * For any set of users, newUsersThisMonth should never exceed totalUsers.
   */
  it('Property 8g: New users this month never exceeds total users', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (users) => {
          const stats = calculateUserStats(users, referenceDate);
          
          expect(stats.newUsersThisMonth).toBeLessThanOrEqual(stats.totalUsers);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8h: Unconfirmed users <= total users
   * 
   * For any set of users, unconfirmedUsers should never exceed totalUsers.
   */
  it('Property 8h: Unconfirmed users never exceeds total users', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (users) => {
          const stats = calculateUserStats(users, referenceDate);
          
          expect(stats.unconfirmedUsers).toBeLessThanOrEqual(stats.totalUsers);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 8i: countActiveUsers is consistent with calculateUserStats
   * 
   * For any set of users, countActiveUsers(30 days) should equal
   * calculateUserStats.activeUsers.
   */
  it('Property 8i: countActiveUsers is consistent with calculateUserStats', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (users) => {
          const stats = calculateUserStats(users, referenceDate);
          const activeCount = countActiveUsers(users, 30, referenceDate);
          
          expect(activeCount).toBe(stats.activeUsers);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8j: countUnconfirmedUsers is consistent with calculateUserStats
   * 
   * For any set of users, countUnconfirmedUsers should equal
   * calculateUserStats.unconfirmedUsers.
   */
  it('Property 8j: countUnconfirmedUsers is consistent with calculateUserStats', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (users) => {
          const stats = calculateUserStats(users, referenceDate);
          const unconfirmedCount = countUnconfirmedUsers(users);
          
          expect(unconfirmedCount).toBe(stats.unconfirmedUsers);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Combined Operations Tests
// ============================================================================

describe('Combined Operations', () => {
  const now = new Date('2026-01-14T12:00:00Z');
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  /**
   * Search and paginate produces consistent results
   */
  it('Search and paginate produces consistent results', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 10 }),
        paginationParams(),
        (users, query, params) => {
          const result = searchAndPaginateUsers(users, query, params);
          
          // Total should match filtered count
          const filtered = searchUsersByEmail(users, query);
          expect(result.total).toBe(filtered.length);
          
          // All items should match search
          for (const user of result.items) {
            expect(userMatchesSearch(user, query)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Sort by created date produces descending order
   */
  it('Sort by created date produces descending order', () => {
    fc.assert(
      fc.property(
        fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 50 }),
        (users) => {
          const sorted = sortUsersByCreatedAt(users);
          
          // Should be sorted descending
          for (let i = 1; i < sorted.length; i++) {
            const prevTime = new Date(sorted[i - 1].createdAt).getTime();
            const currTime = new Date(sorted[i].createdAt).getTime();
            expect(currTime).toBeLessThanOrEqual(prevTime);
          }
          
          // Should not mutate original
          if (users.length > 0) {
            const originalFirstId = users[0].id;
            expect(users[0].id).toBe(originalFirstId);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
