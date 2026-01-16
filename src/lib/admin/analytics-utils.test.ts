/**
 * Property-Based Tests for Analytics Utilities
 * 
 * Feature: admin-dashboard
 * Properties: 12, 13, 14
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

import fc from 'fast-check';
import {
  calculateMetricsFromData,
  aggregateCalculationsByDay,
  calculateTopTools,
  sortRecentActivities,
  createActivityRecords,
  getDateRange,
  type CalculationRecord,
  type UserRecord,
  type ArticleRecord,
  type RecentActivity,
  type ChartDataPoint,
  type TopTool,
} from './analytics-utils';

/**
 * Arbitrary generators for test data
 */

// Generate a valid ISO date string within a range using integer timestamps
function isoDateString(minDate: Date, maxDate: Date): fc.Arbitrary<string> {
  const minTime = minDate.getTime();
  const maxTime = maxDate.getTime();
  return fc.integer({ min: minTime, max: maxTime })
    .map(timestamp => new Date(timestamp).toISOString());
}

// Generate a calculation record
function calculationRecord(minDate: Date, maxDate: Date): fc.Arbitrary<CalculationRecord> {
  return fc.record({
    id: fc.uuid(),
    tool_slug: fc.constantFrom(
      'profit-margin-calculator',
      'roi-calculator',
      'vat-calculator',
      'shipping-calculator',
      'discount-calculator',
      'conversion-rate-calculator',
      'break-even-calculator',
      'markup-calculator'
    ),
    created_at: isoDateString(minDate, maxDate),
  });
}

// Generate a user record
function userRecord(minDate: Date, maxDate: Date): fc.Arbitrary<UserRecord> {
  return fc.record({
    id: fc.uuid(),
    name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    created_at: isoDateString(minDate, maxDate),
  });
}

// Generate an article record
function articleRecord(minDate: Date, maxDate: Date): fc.Arbitrary<ArticleRecord> {
  return fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    created_at: isoDateString(minDate, maxDate),
  });
}

// Generate a recent activity record with fixed date range
function recentActivity(): fc.Arbitrary<RecentActivity> {
  const minTime = new Date('2024-01-01T00:00:00Z').getTime();
  const maxTime = new Date('2026-12-31T23:59:59Z').getTime();
  return fc.record({
    id: fc.uuid(),
    type: fc.constantFrom('calculation', 'user_signup', 'article_created', 'error') as fc.Arbitrary<RecentActivity['type']>,
    description: fc.string({ minLength: 1, maxLength: 200 }),
    timestamp: fc.integer({ min: minTime, max: maxTime })
      .map(timestamp => new Date(timestamp).toISOString()),
    metadata: fc.option(fc.dictionary(fc.string(), fc.jsonValue()), { nil: undefined }),
  });
}

// Simple tool name resolver for testing
const testToolNameResolver = (slug: string): string => {
  const names: Record<string, string> = {
    'profit-margin-calculator': 'Profit Margin Calculator',
    'roi-calculator': 'ROI Calculator',
    'vat-calculator': 'VAT Calculator',
    'shipping-calculator': 'Shipping Calculator',
    'discount-calculator': 'Discount Calculator',
    'conversion-rate-calculator': 'Conversion Rate Calculator',
    'break-even-calculator': 'Break Even Calculator',
    'markup-calculator': 'Markup Calculator',
  };
  return names[slug] || slug;
};

describe('Analytics Utilities Property Tests', () => {
  /**
   * Property 12: Analytics Metrics Calculation
   * 
   * For any date range, the Analytics Overview SHALL calculate metrics that 
   * accurately reflect the data within that range, including correct aggregation 
   * by day for charts.
   * 
   * Validates: Requirements 7.1, 7.2, 7.5
   */
  describe('Property 12: Analytics Metrics Calculation', () => {
    /**
     * Property 12a: Total counts are accurate
     * 
     * For any set of records, the total counts should equal the array lengths.
     */
    it('Property 12a: Total counts accurately reflect array lengths', () => {
      const now = new Date('2026-01-14T12:00:00Z');
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      fc.assert(
        fc.property(
          fc.array(calculationRecord(thirtyDaysAgo, now), { minLength: 0, maxLength: 100 }),
          fc.array(userRecord(thirtyDaysAgo, now), { minLength: 0, maxLength: 50 }),
          fc.array(articleRecord(thirtyDaysAgo, now), { minLength: 0, maxLength: 20 }),
          fc.integer({ min: 1, max: 100 }),
          (calculations, users, articles, totalTools) => {
            const metrics = calculateMetricsFromData(
              calculations,
              users,
              articles,
              totalTools,
              now
            );

            // Total counts should match array lengths
            expect(metrics.totalCalculations).toBe(calculations.length);
            expect(metrics.totalUsers).toBe(users.length);
            expect(metrics.totalArticles).toBe(articles.length);
            expect(metrics.totalTools).toBe(totalTools);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 12b: Calculations today count is accurate
     * 
     * For any set of calculations, calculationsToday should only count
     * calculations from today.
     */
    it('Property 12b: Calculations today count only includes today\'s calculations', () => {
      // Use a fixed "now" time in the middle of the day to avoid edge cases
      const now = new Date('2026-01-14T12:00:00.000Z');
      const todayStart = new Date('2026-01-14T00:00:00.000Z');
      const thirtyDaysAgo = new Date('2025-12-15T00:00:00.000Z');

      fc.assert(
        fc.property(
          fc.array(calculationRecord(thirtyDaysAgo, now), { minLength: 0, maxLength: 100 }),
          (calculations) => {
            const metrics = calculateMetricsFromData(
              calculations,
              [],
              [],
              10,
              now
            );

            // Manually count calculations from today (using same logic as the function)
            const expectedTodayCount = calculations.filter(calc => {
              const calcDate = new Date(calc.created_at);
              return calcDate >= todayStart;
            }).length;

            expect(metrics.calculationsToday).toBe(expectedTodayCount);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 12c: New users this month count is accurate
     * 
     * For any set of users, newUsersThisMonth should only count
     * users registered this month.
     */
    it('Property 12c: New users this month count only includes this month\'s users', () => {
      // Use a fixed "now" time in the middle of the month
      const now = new Date('2026-01-14T12:00:00.000Z');
      const firstDayOfMonth = new Date('2026-01-01T00:00:00.000Z');
      const sixtyDaysAgo = new Date('2025-11-15T00:00:00.000Z');

      fc.assert(
        fc.property(
          fc.array(userRecord(sixtyDaysAgo, now), { minLength: 0, maxLength: 50 }),
          (users) => {
            const metrics = calculateMetricsFromData(
              [],
              users,
              [],
              10,
              now
            );

            // Manually count users from this month
            const expectedMonthCount = users.filter(user => {
              const userDate = new Date(user.created_at);
              return userDate >= firstDayOfMonth;
            }).length;

            expect(metrics.newUsersThisMonth).toBe(expectedMonthCount);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 12d: Chart data aggregation is correct
     * 
     * For any set of calculations, the sum of daily counts should equal
     * the total number of calculations within the date range.
     */
    it('Property 12d: Chart data aggregation sums to total calculations in range', () => {
      const endDate = new Date('2026-01-14T23:59:59Z');
      const startDate = new Date('2026-01-07T00:00:00Z');

      fc.assert(
        fc.property(
          fc.array(calculationRecord(startDate, endDate), { minLength: 0, maxLength: 100 }),
          (calculations) => {
            const chartData = aggregateCalculationsByDay(calculations, startDate, endDate);

            // Sum of all daily counts
            const totalFromChart = chartData.reduce((sum, point) => sum + point.calculations, 0);

            // Count calculations within range
            const calculationsInRange = calculations.filter(calc => {
              const calcDate = new Date(calc.created_at);
              return calcDate >= startDate && calcDate <= endDate;
            }).length;

            expect(totalFromChart).toBe(calculationsInRange);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 12e: Chart data is sorted by date ascending
     * 
     * For any date range, the chart data should be sorted by date in ascending order.
     */
    it('Property 12e: Chart data is sorted by date ascending', () => {
      const endDate = new Date('2026-01-14T23:59:59Z');
      const startDate = new Date('2026-01-01T00:00:00Z');

      fc.assert(
        fc.property(
          fc.array(calculationRecord(startDate, endDate), { minLength: 0, maxLength: 100 }),
          (calculations) => {
            const chartData = aggregateCalculationsByDay(calculations, startDate, endDate);

            // Verify sorted ascending
            for (let i = 1; i < chartData.length; i++) {
              expect(chartData[i].date >= chartData[i - 1].date).toBe(true);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 12f: Chart data covers all days in range
     * 
     * For any date range, the chart data should have an entry for each day.
     */
    it('Property 12f: Chart data covers all days in range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          (days) => {
            const endDate = new Date('2026-01-14T23:59:59Z');
            const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
            startDate.setHours(0, 0, 0, 0);

            const chartData = aggregateCalculationsByDay([], startDate, endDate);

            // Should have entry for each day (inclusive)
            expect(chartData.length).toBe(days + 1);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Top Tools Ranking
   * 
   * For any set of calculation records, the Analytics Overview SHALL return 
   * the top 5 tools sorted by usage count in descending order.
   * 
   * Validates: Requirements 7.3
   */
  describe('Property 13: Top Tools Ranking', () => {
    /**
     * Property 13a: Top tools are sorted by usage count descending
     * 
     * For any set of calculations, the top tools should be sorted by
     * usage count in descending order.
     */
    it('Property 13a: Top tools are sorted by usage count descending', () => {
      const now = new Date('2026-01-14T12:00:00Z');
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      fc.assert(
        fc.property(
          fc.array(calculationRecord(thirtyDaysAgo, now), { minLength: 1, maxLength: 200 }),
          (calculations) => {
            const topTools = calculateTopTools(calculations, testToolNameResolver, 5);

            // Verify sorted descending by usage count
            for (let i = 1; i < topTools.length; i++) {
              expect(topTools[i].usageCount).toBeLessThanOrEqual(topTools[i - 1].usageCount);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 13b: Top tools limited to specified count
     * 
     * For any set of calculations, the result should have at most N tools.
     */
    it('Property 13b: Top tools limited to specified count', () => {
      const now = new Date('2026-01-14T12:00:00Z');
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      fc.assert(
        fc.property(
          fc.array(calculationRecord(thirtyDaysAgo, now), { minLength: 0, maxLength: 200 }),
          fc.integer({ min: 1, max: 10 }),
          (calculations, limit) => {
            const topTools = calculateTopTools(calculations, testToolNameResolver, limit);

            // Should have at most 'limit' tools
            expect(topTools.length).toBeLessThanOrEqual(limit);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 13c: Usage counts are accurate
     * 
     * For any set of calculations, each tool's usage count should match
     * the actual count of calculations for that tool.
     */
    it('Property 13c: Usage counts accurately reflect calculation counts', () => {
      const now = new Date('2026-01-14T12:00:00Z');
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      fc.assert(
        fc.property(
          fc.array(calculationRecord(thirtyDaysAgo, now), { minLength: 1, maxLength: 200 }),
          (calculations) => {
            const topTools = calculateTopTools(calculations, testToolNameResolver, 10);

            // Verify each tool's count
            for (const tool of topTools) {
              const actualCount = calculations.filter(c => c.tool_slug === tool.slug).length;
              expect(tool.usageCount).toBe(actualCount);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 13d: All unique tools are represented (up to limit)
     * 
     * For any set of calculations, the number of top tools should equal
     * the number of unique tool slugs (up to the limit).
     */
    it('Property 13d: All unique tools represented up to limit', () => {
      const now = new Date('2026-01-14T12:00:00Z');
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      fc.assert(
        fc.property(
          fc.array(calculationRecord(thirtyDaysAgo, now), { minLength: 1, maxLength: 200 }),
          fc.integer({ min: 1, max: 10 }),
          (calculations, limit) => {
            const topTools = calculateTopTools(calculations, testToolNameResolver, limit);
            const uniqueSlugs = new Set(calculations.map(c => c.tool_slug));

            // Should have min(uniqueSlugs, limit) tools
            expect(topTools.length).toBe(Math.min(uniqueSlugs.size, limit));

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 13e: Tool names are resolved correctly
     * 
     * For any set of calculations, each tool should have a non-empty name.
     */
    it('Property 13e: Tool names are resolved correctly', () => {
      const now = new Date('2026-01-14T12:00:00Z');
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      fc.assert(
        fc.property(
          fc.array(calculationRecord(thirtyDaysAgo, now), { minLength: 1, maxLength: 100 }),
          (calculations) => {
            const topTools = calculateTopTools(calculations, testToolNameResolver, 5);

            // Each tool should have a non-empty name
            for (const tool of topTools) {
              expect(tool.name).toBeDefined();
              expect(tool.name.length).toBeGreaterThan(0);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Recent Activity Ordering
   * 
   * For any set of activities, the Analytics Overview SHALL return the 10 
   * most recent activities sorted by timestamp in descending order.
   * 
   * Validates: Requirements 7.4
   */
  describe('Property 14: Recent Activity Ordering', () => {
    /**
     * Property 14a: Activities are sorted by timestamp descending
     * 
     * For any set of activities, the result should be sorted by timestamp
     * in descending order (most recent first).
     */
    it('Property 14a: Activities are sorted by timestamp descending', () => {
      fc.assert(
        fc.property(
          fc.array(recentActivity(), { minLength: 1, maxLength: 50 }),
          (activities) => {
            const sorted = sortRecentActivities(activities, 50);

            // Verify sorted descending by timestamp
            for (let i = 1; i < sorted.length; i++) {
              const prevTime = new Date(sorted[i - 1].timestamp).getTime();
              const currTime = new Date(sorted[i].timestamp).getTime();
              expect(currTime).toBeLessThanOrEqual(prevTime);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 14b: Activities limited to specified count
     * 
     * For any set of activities, the result should have at most N activities.
     */
    it('Property 14b: Activities limited to specified count', () => {
      fc.assert(
        fc.property(
          fc.array(recentActivity(), { minLength: 0, maxLength: 50 }),
          fc.integer({ min: 1, max: 20 }),
          (activities, limit) => {
            const sorted = sortRecentActivities(activities, limit);

            // Should have at most 'limit' activities
            expect(sorted.length).toBeLessThanOrEqual(limit);
            expect(sorted.length).toBe(Math.min(activities.length, limit));

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 14c: Most recent activities are selected
     * 
     * For any set of activities with limit < total, all returned activities
     * should have timestamps >= the oldest excluded activity.
     */
    it('Property 14c: Most recent activities are selected when limited', () => {
      fc.assert(
        fc.property(
          fc.array(recentActivity(), { minLength: 5, maxLength: 50 }),
          fc.integer({ min: 1, max: 4 }),
          (activities, limit) => {
            const sorted = sortRecentActivities(activities, limit);

            if (sorted.length < activities.length) {
              // Get the oldest timestamp in the result
              const oldestInResult = new Date(sorted[sorted.length - 1].timestamp).getTime();

              // All excluded activities should have timestamps <= oldestInResult
              const sortedAll = [...activities].sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
              const excluded = sortedAll.slice(limit);

              for (const activity of excluded) {
                const activityTime = new Date(activity.timestamp).getTime();
                expect(activityTime).toBeLessThanOrEqual(oldestInResult);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 14d: Original array is not mutated
     * 
     * For any set of activities, the original array should not be modified.
     */
    it('Property 14d: Original array is not mutated', () => {
      fc.assert(
        fc.property(
          fc.array(recentActivity(), { minLength: 1, maxLength: 20 }),
          (activities) => {
            const originalOrder = activities.map(a => a.id);
            sortRecentActivities(activities, 10);
            const afterOrder = activities.map(a => a.id);

            // Original array should be unchanged
            expect(afterOrder).toEqual(originalOrder);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 14e: Activity creation preserves all data
     * 
     * For any set of records, createActivityRecords should create activities
     * with correct types and preserve timestamps.
     */
    it('Property 14e: Activity creation preserves all data', () => {
      const now = new Date('2026-01-14T12:00:00Z');
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      fc.assert(
        fc.property(
          fc.array(calculationRecord(thirtyDaysAgo, now), { minLength: 0, maxLength: 10 }),
          fc.array(userRecord(thirtyDaysAgo, now), { minLength: 0, maxLength: 10 }),
          fc.array(articleRecord(thirtyDaysAgo, now), { minLength: 0, maxLength: 10 }),
          (calculations, users, articles) => {
            const activities = createActivityRecords(
              calculations,
              users,
              articles,
              testToolNameResolver
            );

            // Total activities should equal sum of all records
            expect(activities.length).toBe(calculations.length + users.length + articles.length);

            // Check calculation activities
            const calcActivities = activities.filter(a => a.type === 'calculation');
            expect(calcActivities.length).toBe(calculations.length);

            // Check user activities
            const userActivities = activities.filter(a => a.type === 'user_signup');
            expect(userActivities.length).toBe(users.length);

            // Check article activities
            const articleActivities = activities.filter(a => a.type === 'article_created');
            expect(articleActivities.length).toBe(articles.length);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional tests for date range functionality
   * Validates: Requirements 7.5
   */
  describe('Date Range Functionality', () => {
    /**
     * Date range returns correct duration
     */
    it('Date range returns correct duration for each parameter', () => {
      const now = new Date('2026-01-14T12:00:00Z');

      const ranges = [
        { param: '1d', expectedDays: 1 },
        { param: '7d', expectedDays: 7 },
        { param: '30d', expectedDays: 30 },
        { param: '90d', expectedDays: 90 },
      ];

      for (const { param, expectedDays } of ranges) {
        const { start, end, label } = getDateRange(param, now);
        const diffMs = end.getTime() - start.getTime();
        const diffDays = diffMs / (24 * 60 * 60 * 1000);

        expect(Math.round(diffDays)).toBe(expectedDays);
        expect(label).toContain(String(expectedDays));
      }
    });

    /**
     * Default date range is 7 days
     */
    it('Default date range is 7 days for null or invalid parameter', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.string().filter(s => !['1d', '7d', '30d', '90d'].includes(s))
          ),
          (param) => {
            const now = new Date('2026-01-14T12:00:00Z');
            const { start, end, label } = getDateRange(param, now);
            const diffMs = end.getTime() - start.getTime();
            const diffDays = diffMs / (24 * 60 * 60 * 1000);

            expect(Math.round(diffDays)).toBe(7);
            expect(label).toBe('7 Days');

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
