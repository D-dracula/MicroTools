/**
 * Property-Based Tests for Error Monitoring Utilities
 * 
 * Feature: admin-dashboard
 * Properties: 9, 10
 * Validates: Requirements 5.1, 5.4
 */

import fc from 'fast-check';
import {
  calculateErrorMetrics,
  countBySeverity,
  countCriticalErrors,
  countResolvedInRange,
  calculateErrorRate,
  verifyErrorMetrics,
  filterBySeverity,
  filterByStatus,
  filterByTimeRange,
  filterBySearch,
  filterErrors,
  errorMatchesCriteria,
  verifyFilterResults,
  findExcludedMatches,
  getTimeRange,
  sortByTimestamp,
  sortBySeverity,
  type ErrorRecord,
  type Severity,
  type SeverityFilter,
  type AlertStatus,
  type ErrorFilterCriteria,
} from './error-utils';

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generate a valid severity value
 */
function severity(): fc.Arbitrary<Severity> {
  return fc.constantFrom('critical', 'high', 'medium', 'low', 'error', 'warning');
}

/**
 * Generate a valid severity filter value
 */
function severityFilter(): fc.Arbitrary<SeverityFilter> {
  return fc.constantFrom('all', 'critical', 'error', 'warning');
}

/**
 * Generate a valid alert status filter value
 */
function alertStatus(): fc.Arbitrary<AlertStatus> {
  return fc.constantFrom('all', 'resolved', 'unresolved', 'unacknowledged');
}


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
 * Generate an error record
 */
function errorRecord(minDate: Date, maxDate: Date): fc.Arbitrary<ErrorRecord> {
  return fc.record({
    id: fc.uuid(),
    severity: severity(),
    message: fc.string({ minLength: 1, maxLength: 200 }),
    timestamp: isoDateString(minDate, maxDate),
    acknowledged: fc.boolean(),
    resolved: fc.boolean(),
    resolvedAt: fc.option(isoDateString(minDate, maxDate), { nil: undefined }),
    affectedUsers: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
    endpoints: fc.option(
      fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
      { nil: undefined }
    ),
  }).map(record => {
    // Ensure resolvedAt is only set when resolved is true
    if (!record.resolved) {
      return { ...record, resolvedAt: undefined };
    }
    // Ensure resolvedAt is set when resolved is true
    if (record.resolved && !record.resolvedAt) {
      return { ...record, resolvedAt: record.timestamp };
    }
    return record;
  });
}

/**
 * Generate filter criteria
 */
function filterCriteria(minDate: Date, maxDate: Date): fc.Arbitrary<ErrorFilterCriteria> {
  return fc.record({
    severity: fc.option(severityFilter(), { nil: undefined }),
    status: fc.option(alertStatus(), { nil: undefined }),
    timeRange: fc.option(
      fc.tuple(isoDateString(minDate, maxDate), isoDateString(minDate, maxDate))
        .map(([d1, d2]) => {
          const date1 = new Date(d1);
          const date2 = new Date(d2);
          return date1 < date2 
            ? { start: date1, end: date2 }
            : { start: date2, end: date1 };
        }),
      { nil: undefined }
    ),
    search: fc.option(fc.string({ minLength: 0, maxLength: 30 }), { nil: undefined }),
  });
}


// ============================================================================
// Property 9: Error Metrics Accuracy
// Validates: Requirements 5.1
// ============================================================================

describe('Property 9: Error Metrics Accuracy', () => {
  const referenceDate = new Date('2026-01-14T12:00:00Z');
  const thirtyDaysAgo = new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  /**
   * Property 9a: Total errors count equals array length
   * 
   * For any set of errors, totalErrors should equal the array length.
   */
  it('Property 9a: Total errors count equals array length', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (errors) => {
          const metrics = calculateErrorMetrics(errors, referenceDate);
          
          expect(metrics.totalErrors).toBe(errors.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9b: Critical errors count is accurate
   * 
   * For any set of errors, criticalErrors should count only errors with severity 'critical'.
   */
  it('Property 9b: Critical errors count only includes critical severity', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (errors) => {
          const metrics = calculateErrorMetrics(errors, referenceDate);
          const expectedCritical = errors.filter(e => e.severity === 'critical').length;
          
          expect(metrics.criticalErrors).toBe(expectedCritical);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9c: High errors count is accurate
   * 
   * For any set of errors, highErrors should count errors with severity 'high' or 'error'.
   */
  it('Property 9c: High errors count includes high and error severities', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (errors) => {
          const metrics = calculateErrorMetrics(errors, referenceDate);
          const expectedHigh = errors.filter(e => 
            e.severity === 'high' || e.severity === 'error'
          ).length;
          
          expect(metrics.highErrors).toBe(expectedHigh);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 9d: Medium errors count is accurate
   * 
   * For any set of errors, mediumErrors should count errors with severity 'medium' or 'warning'.
   */
  it('Property 9d: Medium errors count includes medium and warning severities', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (errors) => {
          const metrics = calculateErrorMetrics(errors, referenceDate);
          const expectedMedium = errors.filter(e => 
            e.severity === 'medium' || e.severity === 'warning'
          ).length;
          
          expect(metrics.mediumErrors).toBe(expectedMedium);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9e: Low errors count is accurate
   * 
   * For any set of errors, lowErrors should count only errors with severity 'low'.
   */
  it('Property 9e: Low errors count only includes low severity', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (errors) => {
          const metrics = calculateErrorMetrics(errors, referenceDate);
          const expectedLow = errors.filter(e => e.severity === 'low').length;
          
          expect(metrics.lowErrors).toBe(expectedLow);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9f: Severity counts sum to total
   * 
   * For any set of errors, the sum of all severity counts should equal totalErrors.
   */
  it('Property 9f: Severity counts sum to total errors', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (errors) => {
          const metrics = calculateErrorMetrics(errors, referenceDate);
          const severitySum = metrics.criticalErrors + metrics.highErrors + 
                             metrics.mediumErrors + metrics.lowErrors;
          
          expect(severitySum).toBe(metrics.totalErrors);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 9g: Resolved today count is accurate
   * 
   * For any set of errors, resolvedToday should count only errors resolved today.
   */
  it('Property 9g: Resolved today count only includes errors resolved today', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (errors) => {
          const metrics = calculateErrorMetrics(errors, referenceDate);
          
          const todayStart = new Date(referenceDate);
          todayStart.setHours(0, 0, 0, 0);
          
          const expectedResolvedToday = errors.filter(e => {
            if (!e.resolved || !e.resolvedAt) return false;
            const resolvedDate = new Date(e.resolvedAt);
            return resolvedDate >= todayStart && resolvedDate <= referenceDate;
          }).length;
          
          expect(metrics.resolvedToday).toBe(expectedResolvedToday);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9h: Error rate calculation is correct
   * 
   * For any error count and time range, error rate should be count/minutes.
   */
  it('Property 9h: Error rate calculation is correct', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 1, max: 43200 }),
        (errorCount, minutes) => {
          const rate = calculateErrorRate(errorCount, minutes);
          const expectedRate = Math.round((errorCount / minutes) * 100) / 100;
          
          expect(rate).toBe(expectedRate);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9i: Error rate is zero for zero time range
   * 
   * For any error count with zero or negative time range, error rate should be 0.
   */
  it('Property 9i: Error rate is zero for zero or negative time range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: -1000, max: 0 }),
        (errorCount, minutes) => {
          const rate = calculateErrorRate(errorCount, minutes);
          
          expect(rate).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 9j: Metrics verification passes for calculated metrics
   * 
   * For any set of errors, verifyErrorMetrics should pass for metrics
   * calculated by calculateErrorMetrics.
   */
  it('Property 9j: Metrics verification passes for calculated metrics', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (errors) => {
          const metrics = calculateErrorMetrics(errors, referenceDate);
          const verification = verifyErrorMetrics(errors, metrics, referenceDate);
          
          expect(verification.isValid).toBe(true);
          expect(verification.errors).toHaveLength(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9k: countBySeverity is consistent with metrics
   * 
   * For any set of errors, countBySeverity should match the corresponding metric.
   */
  it('Property 9k: countBySeverity is consistent with metrics', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (errors) => {
          const metrics = calculateErrorMetrics(errors, referenceDate);
          
          expect(countBySeverity(errors, 'critical')).toBe(metrics.criticalErrors);
          expect(countBySeverity(errors, 'low')).toBe(metrics.lowErrors);
          expect(countCriticalErrors(errors)).toBe(metrics.criticalErrors);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9l: countResolvedInRange is consistent with metrics
   * 
   * For any set of errors, countResolvedInRange for today should match resolvedToday.
   */
  it('Property 9l: countResolvedInRange is consistent with resolvedToday', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 100 }),
        (errors) => {
          const metrics = calculateErrorMetrics(errors, referenceDate);
          
          const todayStart = new Date(referenceDate);
          todayStart.setHours(0, 0, 0, 0);
          
          const resolvedInRange = countResolvedInRange(errors, todayStart, referenceDate);
          
          expect(resolvedInRange).toBe(metrics.resolvedToday);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 10: Error Filtering Correctness
// Validates: Requirements 5.4
// ============================================================================

describe('Property 10: Error Filtering Correctness', () => {
  const referenceDate = new Date('2026-01-14T12:00:00Z');
  const thirtyDaysAgo = new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  /**
   * Property 10a: Severity filter returns only matching errors
   * 
   * For any set of errors and severity filter, all returned errors
   * should have a matching severity.
   */
  it('Property 10a: Severity filter returns only matching errors', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        severityFilter(),
        (errors, severityValue) => {
          const filtered = filterBySeverity(errors, severityValue);

          if (severityValue === 'all') {
            expect(filtered.length).toBe(errors.length);
          } else {
            const severityMap: Record<SeverityFilter, Severity[]> = {
              all: ['critical', 'high', 'medium', 'low', 'error', 'warning'],
              critical: ['critical'],
              error: ['high', 'error', 'critical'],
              warning: ['medium', 'low', 'warning'],
            };
            const allowedSeverities = severityMap[severityValue];
            
            for (const error of filtered) {
              expect(allowedSeverities).toContain(error.severity);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10b: Status filter returns only matching errors
   * 
   * For any set of errors and status filter, all returned errors
   * should have the matching status.
   */
  it('Property 10b: Status filter returns only matching errors', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        alertStatus(),
        (errors, statusValue) => {
          const filtered = filterByStatus(errors, statusValue);

          switch (statusValue) {
            case 'all':
              expect(filtered.length).toBe(errors.length);
              break;
            case 'resolved':
              for (const error of filtered) {
                expect(error.resolved).toBe(true);
              }
              break;
            case 'unresolved':
              for (const error of filtered) {
                expect(error.resolved).toBe(false);
              }
              break;
            case 'unacknowledged':
              for (const error of filtered) {
                expect(error.acknowledged).toBe(false);
                expect(error.resolved).toBe(false);
              }
              break;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 10c: Time range filter returns only errors within range
   * 
   * For any set of errors and time range, all returned errors
   * should have timestamps within the range.
   */
  it('Property 10c: Time range filter returns only errors within range', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        fc.tuple(
          isoDateString(thirtyDaysAgo, referenceDate),
          isoDateString(thirtyDaysAgo, referenceDate)
        ).map(([d1, d2]) => {
          const date1 = new Date(d1);
          const date2 = new Date(d2);
          return date1 < date2 
            ? { start: date1, end: date2 }
            : { start: date2, end: date1 };
        }),
        (errors, timeRange) => {
          const filtered = filterByTimeRange(errors, timeRange.start, timeRange.end);

          for (const error of filtered) {
            const errorDate = new Date(error.timestamp);
            expect(errorDate.getTime()).toBeGreaterThanOrEqual(timeRange.start.getTime());
            expect(errorDate.getTime()).toBeLessThanOrEqual(timeRange.end.getTime());
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10d: Search filter returns only matching errors
   * 
   * For any set of errors and search query, all returned errors
   * should contain the query in message or id.
   */
  it('Property 10d: Search filter returns only matching errors', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 20 }),
        (errors, search) => {
          const filtered = filterBySearch(errors, search);
          const searchLower = search.trim().toLowerCase();

          if (!searchLower) {
            expect(filtered.length).toBe(errors.length);
          } else {
            for (const error of filtered) {
              const messageMatch = error.message.toLowerCase().includes(searchLower);
              const idMatch = error.id.toLowerCase().includes(searchLower);
              expect(messageMatch || idMatch).toBe(true);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 10e: Combined filters return only errors matching ALL criteria
   * 
   * For any set of errors and filter criteria, all returned errors
   * should match ALL specified criteria.
   */
  it('Property 10e: Combined filters return only errors matching ALL criteria', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        filterCriteria(thirtyDaysAgo, referenceDate),
        (errors, criteria) => {
          const filtered = filterErrors(errors, criteria);

          // Verify all filtered errors match all criteria
          const verification = verifyFilterResults(filtered, criteria);
          expect(verification.allMatch).toBe(true);
          expect(verification.nonMatchingErrors).toHaveLength(0);

          // Also verify using errorMatchesCriteria
          for (const error of filtered) {
            expect(errorMatchesCriteria(error, criteria)).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10f: Filtering is idempotent
   * 
   * For any set of errors and filter criteria, filtering twice
   * should produce the same result as filtering once.
   */
  it('Property 10f: Filtering is idempotent', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        filterCriteria(thirtyDaysAgo, referenceDate),
        (errors, criteria) => {
          const filteredOnce = filterErrors(errors, criteria);
          const filteredTwice = filterErrors(filteredOnce, criteria);

          // Should have same length
          expect(filteredTwice.length).toBe(filteredOnce.length);

          // Should have same errors (by id)
          const idsOnce = new Set(filteredOnce.map(e => e.id));
          const idsTwice = new Set(filteredTwice.map(e => e.id));
          expect(idsTwice).toEqual(idsOnce);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 10g: Filtered results are subset of original
   * 
   * For any set of errors and filter criteria, the filtered results
   * should be a subset of the original errors.
   */
  it('Property 10g: Filtered results are subset of original', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        filterCriteria(thirtyDaysAgo, referenceDate),
        (errors, criteria) => {
          const filtered = filterErrors(errors, criteria);

          // Filtered count should be <= original count
          expect(filtered.length).toBeLessThanOrEqual(errors.length);

          // All filtered errors should exist in original
          const originalIds = new Set(errors.map(e => e.id));
          for (const error of filtered) {
            expect(originalIds.has(error.id)).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10h: No matching errors are excluded
   * 
   * For any set of errors and filter criteria, no error that matches
   * all criteria should be excluded from the results.
   */
  it('Property 10h: No matching errors are excluded', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        filterCriteria(thirtyDaysAgo, referenceDate),
        (errors, criteria) => {
          const filtered = filterErrors(errors, criteria);
          const excluded = findExcludedMatches(errors, filtered, criteria);

          expect(excluded).toHaveLength(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10i: Empty criteria returns all errors
   * 
   * For any set of errors, empty filter criteria should return all errors.
   */
  it('Property 10i: Empty criteria returns all errors', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        (errors) => {
          const emptyCriteria: ErrorFilterCriteria = {};
          const filtered = filterErrors(errors, emptyCriteria);

          expect(filtered.length).toBe(errors.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 10j: Filter order doesn't matter
   * 
   * For any set of errors and filter criteria, applying filters in
   * different orders should produce the same result.
   */
  it('Property 10j: Filter order does not affect results', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        severityFilter(),
        alertStatus(),
        fc.string({ minLength: 1, maxLength: 10 }),
        (errors, severityValue, statusValue, search) => {
          // Order 1: severity -> status -> search
          const order1 = filterBySearch(
            filterByStatus(
              filterBySeverity(errors, severityValue),
              statusValue
            ),
            search
          );

          // Order 2: search -> severity -> status
          const order2 = filterByStatus(
            filterBySeverity(
              filterBySearch(errors, search),
              severityValue
            ),
            statusValue
          );

          // Order 3: status -> search -> severity
          const order3 = filterBySeverity(
            filterBySearch(
              filterByStatus(errors, statusValue),
              search
            ),
            severityValue
          );

          // All orders should produce same result
          const ids1 = new Set(order1.map(e => e.id));
          const ids2 = new Set(order2.map(e => e.id));
          const ids3 = new Set(order3.map(e => e.id));

          expect(ids1).toEqual(ids2);
          expect(ids2).toEqual(ids3);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10k: Search is case-insensitive
   * 
   * For any error and search query, the search should be case-insensitive.
   */
  it('Property 10k: Search is case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 1, maxLength: 20 }),
        (errors) => {
          // Get a word from the first error's message
          const firstMessage = errors[0].message;
          if (firstMessage.length < 2) return true;

          const searchWord = firstMessage.substring(0, Math.min(5, firstMessage.length));
          
          // Search with different cases
          const lowerResult = filterBySearch(errors, searchWord.toLowerCase());
          const upperResult = filterBySearch(errors, searchWord.toUpperCase());
          const mixedResult = filterBySearch(errors, searchWord);

          // All should return same results
          const lowerIds = new Set(lowerResult.map(e => e.id));
          const upperIds = new Set(upperResult.map(e => e.id));
          const mixedIds = new Set(mixedResult.map(e => e.id));

          expect(lowerIds).toEqual(upperIds);
          expect(upperIds).toEqual(mixedIds);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Additional Utility Tests
// ============================================================================

describe('Time Range Utilities', () => {
  const referenceDate = new Date('2026-01-14T12:00:00Z');

  /**
   * Time range returns correct duration for each label
   */
  it('Time range returns correct duration for each label', () => {
    const ranges = [
      { label: '1h' as const, expectedMinutes: 60 },
      { label: '6h' as const, expectedMinutes: 360 },
      { label: '24h' as const, expectedMinutes: 1440 },
      { label: '7d' as const, expectedMinutes: 10080 },
      { label: '30d' as const, expectedMinutes: 43200 },
    ];

    for (const { label, expectedMinutes } of ranges) {
      const result = getTimeRange(label, referenceDate);
      expect(result.minutes).toBe(expectedMinutes);
    }
  });

  /**
   * Default time range is 24 hours for null or invalid parameter
   */
  it('Default time range is 24 hours for null or invalid parameter', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.string().filter(s => !['1h', '6h', '24h', '7d', '30d'].includes(s))
        ),
        (param) => {
          const result = getTimeRange(param as '1h' | null, referenceDate);
          
          expect(result.minutes).toBe(1440);
          expect(result.label).toBe('24 Hours');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Sorting Utilities', () => {
  const referenceDate = new Date('2026-01-14T12:00:00Z');
  const thirtyDaysAgo = new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  /**
   * Sort by timestamp produces descending order
   */
  it('Sort by timestamp produces descending order', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        (errors) => {
          const sorted = sortByTimestamp(errors);

          // Should be sorted descending
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
   * Sort by severity produces correct order (critical first)
   */
  it('Sort by severity produces correct order', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 0, maxLength: 50 }),
        (errors) => {
          const sorted = sortBySeverity(errors);

          const severityOrder: Record<Severity, number> = {
            critical: 0,
            high: 1,
            error: 1,
            medium: 2,
            warning: 2,
            low: 3,
          };

          // Should be sorted by severity
          for (let i = 1; i < sorted.length; i++) {
            const prevOrder = severityOrder[sorted[i - 1].severity] ?? 4;
            const currOrder = severityOrder[sorted[i].severity] ?? 4;
            expect(currOrder).toBeGreaterThanOrEqual(prevOrder);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Sorting does not mutate original array
   */
  it('Sorting does not mutate original array', () => {
    fc.assert(
      fc.property(
        fc.array(errorRecord(thirtyDaysAgo, referenceDate), { minLength: 1, maxLength: 20 }),
        (errors) => {
          const originalOrder = errors.map(e => e.id);
          
          sortByTimestamp(errors);
          sortBySeverity(errors);
          
          const afterOrder = errors.map(e => e.id);

          // Original array should be unchanged
          expect(afterOrder).toEqual(originalOrder);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
