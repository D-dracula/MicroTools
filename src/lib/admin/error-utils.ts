/**
 * Error Monitoring Utilities
 * 
 * Pure utility functions for error monitoring calculations and filtering.
 * These functions are designed to be testable with property-based testing.
 * 
 * Feature: admin-dashboard
 * Properties: 9, 10
 * Validates: Requirements 5.1, 5.4
 */

// ============================================================================
// Types
// ============================================================================

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'error' | 'warning';
export type SeverityFilter = 'critical' | 'error' | 'warning' | 'all';
export type AlertStatus = 'all' | 'unresolved' | 'resolved' | 'unacknowledged';

export interface ErrorRecord {
  id: string;
  severity: Severity;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: string;
  affectedUsers?: number;
  endpoints?: string[];
}

export interface ErrorMetrics {
  totalErrors: number;
  criticalErrors: number;
  highErrors: number;
  mediumErrors: number;
  lowErrors: number;
  errorRate: number;
  resolvedToday: number;
}

export interface ErrorFilterCriteria {
  severity?: SeverityFilter;
  status?: AlertStatus;
  timeRange?: { start: Date; end: Date };
  search?: string;
}

export interface MetricsVerification {
  isValid: boolean;
  errors: string[];
}

export interface FilterVerification {
  allMatch: boolean;
  nonMatchingErrors: ErrorRecord[];
}

// ============================================================================
// Error Metrics Calculation - Property 9
// Validates: Requirements 5.1
// ============================================================================

/**
 * Calculate error metrics from a list of error records.
 * 
 * @param errors - Array of error records
 * @param referenceDate - Reference date for "today" calculations (defaults to now)
 * @param timeRangeMinutes - Time range in minutes for error rate calculation
 * @returns Calculated error metrics
 */
export function calculateErrorMetrics(
  errors: ErrorRecord[],
  referenceDate: Date = new Date(),
  timeRangeMinutes: number = 60
): ErrorMetrics {
  // Count by severity
  const criticalErrors = errors.filter(e => e.severity === 'critical').length;
  const highErrors = errors.filter(e => e.severity === 'high' || e.severity === 'error').length;
  const mediumErrors = errors.filter(e => e.severity === 'medium' || e.severity === 'warning').length;
  const lowErrors = errors.filter(e => e.severity === 'low').length;

  // Calculate resolved today
  const todayStart = new Date(referenceDate);
  todayStart.setHours(0, 0, 0, 0);
  
  const resolvedToday = errors.filter(e => {
    if (!e.resolved || !e.resolvedAt) return false;
    const resolvedDate = new Date(e.resolvedAt);
    return resolvedDate >= todayStart && resolvedDate <= referenceDate;
  }).length;

  // Calculate error rate (errors per minute)
  const errorRate = timeRangeMinutes > 0 
    ? Math.round((errors.length / timeRangeMinutes) * 100) / 100
    : 0;

  return {
    totalErrors: errors.length,
    criticalErrors,
    highErrors,
    mediumErrors,
    lowErrors,
    errorRate,
    resolvedToday,
  };
}

/**
 * Count errors by severity.
 * 
 * @param errors - Array of error records
 * @param severity - Severity to count
 * @returns Count of errors with the specified severity
 */
export function countBySeverity(errors: ErrorRecord[], severity: Severity): number {
  return errors.filter(e => e.severity === severity).length;
}

/**
 * Count critical errors (severity = 'critical').
 * 
 * @param errors - Array of error records
 * @returns Count of critical errors
 */
export function countCriticalErrors(errors: ErrorRecord[]): number {
  return countBySeverity(errors, 'critical');
}

/**
 * Count resolved errors within a date range.
 * 
 * @param errors - Array of error records
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Count of resolved errors in the range
 */
export function countResolvedInRange(
  errors: ErrorRecord[],
  startDate: Date,
  endDate: Date
): number {
  return errors.filter(e => {
    if (!e.resolved || !e.resolvedAt) return false;
    const resolvedDate = new Date(e.resolvedAt);
    return resolvedDate >= startDate && resolvedDate <= endDate;
  }).length;
}

/**
 * Calculate error rate (errors per minute).
 * 
 * @param errorCount - Number of errors
 * @param timeRangeMinutes - Time range in minutes
 * @returns Error rate per minute
 */
export function calculateErrorRate(errorCount: number, timeRangeMinutes: number): number {
  if (timeRangeMinutes <= 0) return 0;
  return Math.round((errorCount / timeRangeMinutes) * 100) / 100;
}

/**
 * Verify that calculated metrics are accurate for the given errors.
 * 
 * @param errors - Array of error records
 * @param metrics - Calculated metrics to verify
 * @param referenceDate - Reference date for "today" calculations
 * @returns Verification result with any errors found
 */
export function verifyErrorMetrics(
  errors: ErrorRecord[],
  metrics: ErrorMetrics,
  referenceDate: Date = new Date()
): MetricsVerification {
  const validationErrors: string[] = [];

  // Verify total count
  if (metrics.totalErrors !== errors.length) {
    validationErrors.push(
      `Total errors mismatch: expected ${errors.length}, got ${metrics.totalErrors}`
    );
  }

  // Verify critical count
  const expectedCritical = countBySeverity(errors, 'critical');
  if (metrics.criticalErrors !== expectedCritical) {
    validationErrors.push(
      `Critical errors mismatch: expected ${expectedCritical}, got ${metrics.criticalErrors}`
    );
  }

  // Verify high count
  const expectedHigh = errors.filter(e => e.severity === 'high' || e.severity === 'error').length;
  if (metrics.highErrors !== expectedHigh) {
    validationErrors.push(
      `High errors mismatch: expected ${expectedHigh}, got ${metrics.highErrors}`
    );
  }

  // Verify medium count
  const expectedMedium = errors.filter(e => e.severity === 'medium' || e.severity === 'warning').length;
  if (metrics.mediumErrors !== expectedMedium) {
    validationErrors.push(
      `Medium errors mismatch: expected ${expectedMedium}, got ${metrics.mediumErrors}`
    );
  }

  // Verify low count
  const expectedLow = countBySeverity(errors, 'low');
  if (metrics.lowErrors !== expectedLow) {
    validationErrors.push(
      `Low errors mismatch: expected ${expectedLow}, got ${metrics.lowErrors}`
    );
  }

  // Verify resolved today
  const todayStart = new Date(referenceDate);
  todayStart.setHours(0, 0, 0, 0);
  const expectedResolvedToday = countResolvedInRange(errors, todayStart, referenceDate);
  if (metrics.resolvedToday !== expectedResolvedToday) {
    validationErrors.push(
      `Resolved today mismatch: expected ${expectedResolvedToday}, got ${metrics.resolvedToday}`
    );
  }

  // Verify severity counts sum (excluding overlaps)
  const severitySum = metrics.criticalErrors + metrics.highErrors + metrics.mediumErrors + metrics.lowErrors;
  if (severitySum !== metrics.totalErrors) {
    validationErrors.push(
      `Severity counts don't sum to total: ${severitySum} !== ${metrics.totalErrors}`
    );
  }

  return {
    isValid: validationErrors.length === 0,
    errors: validationErrors,
  };
}

// ============================================================================
// Error Filtering - Property 10
// Validates: Requirements 5.4
// ============================================================================

/**
 * Filter errors by severity.
 * 
 * @param errors - Array of error records
 * @param severity - Severity filter ('all', 'critical', 'error', 'warning')
 * @returns Filtered array of errors
 */
export function filterBySeverity(errors: ErrorRecord[], severity: SeverityFilter): ErrorRecord[] {
  if (severity === 'all') return [...errors];

  // Map filter values to actual severities
  const severityMap: Record<SeverityFilter, Severity[]> = {
    all: ['critical', 'high', 'medium', 'low', 'error', 'warning'],
    critical: ['critical'],
    error: ['high', 'error', 'critical'],
    warning: ['medium', 'low', 'warning'],
  };

  const allowedSeverities = severityMap[severity] || [];
  return errors.filter(e => allowedSeverities.includes(e.severity));
}

/**
 * Filter errors by status (resolved, unresolved, unacknowledged).
 * 
 * @param errors - Array of error records
 * @param status - Status filter
 * @returns Filtered array of errors
 */
export function filterByStatus(errors: ErrorRecord[], status: AlertStatus): ErrorRecord[] {
  switch (status) {
    case 'resolved':
      return errors.filter(e => e.resolved);
    case 'unresolved':
      return errors.filter(e => !e.resolved);
    case 'unacknowledged':
      return errors.filter(e => !e.acknowledged && !e.resolved);
    case 'all':
    default:
      return [...errors];
  }
}

/**
 * Filter errors by time range.
 * 
 * @param errors - Array of error records
 * @param startDate - Start of time range
 * @param endDate - End of time range
 * @returns Filtered array of errors within the time range
 */
export function filterByTimeRange(
  errors: ErrorRecord[],
  startDate: Date,
  endDate: Date
): ErrorRecord[] {
  return errors.filter(e => {
    const errorDate = new Date(e.timestamp);
    return errorDate >= startDate && errorDate <= endDate;
  });
}

/**
 * Filter errors by search query (searches in message).
 * 
 * @param errors - Array of error records
 * @param search - Search query (case-insensitive)
 * @returns Filtered array of errors matching the search
 */
export function filterBySearch(errors: ErrorRecord[], search: string): ErrorRecord[] {
  const searchLower = search.trim().toLowerCase();
  if (!searchLower) return [...errors];

  return errors.filter(e => 
    e.message.toLowerCase().includes(searchLower) ||
    e.id.toLowerCase().includes(searchLower)
  );
}

/**
 * Apply all filter criteria to errors.
 * 
 * @param errors - Array of error records
 * @param criteria - Filter criteria to apply
 * @returns Filtered array of errors matching ALL criteria
 */
export function filterErrors(
  errors: ErrorRecord[],
  criteria: ErrorFilterCriteria
): ErrorRecord[] {
  let filtered = [...errors];

  // Apply severity filter
  if (criteria.severity) {
    filtered = filterBySeverity(filtered, criteria.severity);
  }

  // Apply status filter
  if (criteria.status) {
    filtered = filterByStatus(filtered, criteria.status);
  }

  // Apply time range filter
  if (criteria.timeRange) {
    filtered = filterByTimeRange(filtered, criteria.timeRange.start, criteria.timeRange.end);
  }

  // Apply search filter
  if (criteria.search) {
    filtered = filterBySearch(filtered, criteria.search);
  }

  return filtered;
}

/**
 * Check if an error matches the given filter criteria.
 * 
 * @param error - Error record to check
 * @param criteria - Filter criteria
 * @returns True if the error matches all criteria
 */
export function errorMatchesCriteria(
  error: ErrorRecord,
  criteria: ErrorFilterCriteria
): boolean {
  // Check severity
  if (criteria.severity && criteria.severity !== 'all') {
    const severityMap: Record<SeverityFilter, Severity[]> = {
      all: ['critical', 'high', 'medium', 'low', 'error', 'warning'],
      critical: ['critical'],
      error: ['high', 'error', 'critical'],
      warning: ['medium', 'low', 'warning'],
    };
    const allowedSeverities = severityMap[criteria.severity] || [];
    if (!allowedSeverities.includes(error.severity)) {
      return false;
    }
  }

  // Check status
  if (criteria.status && criteria.status !== 'all') {
    switch (criteria.status) {
      case 'resolved':
        if (!error.resolved) return false;
        break;
      case 'unresolved':
        if (error.resolved) return false;
        break;
      case 'unacknowledged':
        if (error.acknowledged || error.resolved) return false;
        break;
    }
  }

  // Check time range
  if (criteria.timeRange) {
    const errorDate = new Date(error.timestamp);
    if (errorDate < criteria.timeRange.start || errorDate > criteria.timeRange.end) {
      return false;
    }
  }

  // Check search
  if (criteria.search) {
    const searchLower = criteria.search.trim().toLowerCase();
    if (searchLower) {
      const messageMatch = error.message.toLowerCase().includes(searchLower);
      const idMatch = error.id.toLowerCase().includes(searchLower);
      if (!messageMatch && !idMatch) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Verify that filtered results match the criteria.
 * 
 * @param filtered - Filtered error records
 * @param criteria - Filter criteria that was applied
 * @returns Verification result
 */
export function verifyFilterResults(
  filtered: ErrorRecord[],
  criteria: ErrorFilterCriteria
): FilterVerification {
  const nonMatching = filtered.filter(e => !errorMatchesCriteria(e, criteria));

  return {
    allMatch: nonMatching.length === 0,
    nonMatchingErrors: nonMatching,
  };
}

/**
 * Verify that no matching errors were excluded from results.
 * 
 * @param original - Original error records
 * @param filtered - Filtered error records
 * @param criteria - Filter criteria that was applied
 * @returns Array of errors that should have been included but weren't
 */
export function findExcludedMatches(
  original: ErrorRecord[],
  filtered: ErrorRecord[],
  criteria: ErrorFilterCriteria
): ErrorRecord[] {
  const filteredIds = new Set(filtered.map(e => e.id));
  
  return original.filter(e => 
    errorMatchesCriteria(e, criteria) && !filteredIds.has(e.id)
  );
}

// ============================================================================
// Time Range Utilities
// ============================================================================

export type TimeRangeLabel = '1h' | '6h' | '24h' | '7d' | '30d';

/**
 * Get time range from label.
 * 
 * @param label - Time range label
 * @param referenceDate - Reference date (defaults to now)
 * @returns Start and end dates for the time range
 */
export function getTimeRange(
  label: TimeRangeLabel | null | undefined,
  referenceDate: Date = new Date()
): { start: Date; end: Date; label: string; minutes: number } {
  const end = new Date(referenceDate);
  let start: Date;
  let minutes: number;
  let displayLabel: string;

  switch (label) {
    case '1h':
      start = new Date(end.getTime() - 60 * 60 * 1000);
      minutes = 60;
      displayLabel = '1 Hour';
      break;
    case '6h':
      start = new Date(end.getTime() - 6 * 60 * 60 * 1000);
      minutes = 360;
      displayLabel = '6 Hours';
      break;
    case '24h':
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      minutes = 1440;
      displayLabel = '24 Hours';
      break;
    case '7d':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      minutes = 10080;
      displayLabel = '7 Days';
      break;
    case '30d':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      minutes = 43200;
      displayLabel = '30 Days';
      break;
    default:
      // Default to 24 hours
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      minutes = 1440;
      displayLabel = '24 Hours';
  }

  return { start, end, label: displayLabel, minutes };
}

// ============================================================================
// Sorting Utilities
// ============================================================================

/**
 * Sort errors by timestamp (most recent first).
 * 
 * @param errors - Array of error records
 * @returns New sorted array (does not mutate original)
 */
export function sortByTimestamp(errors: ErrorRecord[]): ErrorRecord[] {
  return [...errors].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Sort errors by severity (critical first).
 * 
 * @param errors - Array of error records
 * @returns New sorted array (does not mutate original)
 */
export function sortBySeverity(errors: ErrorRecord[]): ErrorRecord[] {
  const severityOrder: Record<Severity, number> = {
    critical: 0,
    high: 1,
    error: 1,
    medium: 2,
    warning: 2,
    low: 3,
  };

  return [...errors].sort((a, b) => 
    (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
  );
}
