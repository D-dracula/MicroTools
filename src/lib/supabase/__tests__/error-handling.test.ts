/**
 * Error Handling System Tests
 * Tests the comprehensive error handling, retry logic, and monitoring
 * Requirements: 6.4, 8.4
 */

// Mock the logger to avoid circular dependency issues
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    startPerformance: jest.fn(),
    endPerformance: jest.fn(() => 100),
    getLogs: jest.fn(() => []),
  }
}))

import { 
  SupabaseError,
  SupabaseNetworkError,
  SupabaseAuthError,
  SupabaseDatabaseError,
  classifySupabaseError,
  shouldRetryError,
  getRetryDelay,
  getErrorRecoveryActions,
  ErrorContext
} from '../errors'
import { withRetry, tryWithRetry, CircuitBreaker } from '../retry'
import { logger } from '../logger'

describe('Error Classification', () => {
  test('should classify network errors correctly', () => {
    const networkError = new Error('Network connection failed')
    const classified = classifySupabaseError(networkError)
    
    expect(classified).toBeInstanceOf(SupabaseNetworkError)
    expect(classified.category).toBe('network')
    expect(classified.retryable).toBe(true)
  })

  test('should classify authentication errors correctly', () => {
    const authError = new Error('Authentication failed')
    const classified = classifySupabaseError(authError)
    
    expect(classified).toBeInstanceOf(SupabaseAuthError)
    expect(classified.category).toBe('auth')
    expect(classified.retryable).toBe(false)
  })

  test('should classify PostgreSQL errors correctly', () => {
    const pgError = {
      code: 'PGRST116',
      message: 'Resource not found'
    }
    const classified = classifySupabaseError(pgError)
    
    expect(classified.code).toBe('NOT_FOUND')
    expect(classified.category).toBe('database')
    expect(classified.retryable).toBe(false)
  })

  test('should include context in error classification', () => {
    const context = ErrorContext.create()
      .operation('testOperation')
      .userId('user123')
      .table('profiles')
      .build()

    const error = new Error('Test error')
    const classified = classifySupabaseError(error, context)
    
    expect(classified.context).toEqual(context)
  })
})

describe('Retry Logic', () => {
  test('should retry retryable errors', async () => {
    let attempts = 0
    const operation = jest.fn().mockImplementation(() => {
      attempts++
      if (attempts < 3) {
        throw new SupabaseNetworkError('Network error')
      }
      return 'success'
    })

    const result = await withRetry(operation, { maxAttempts: 3 })
    
    expect(result).toBe('success')
    expect(attempts).toBe(3)
    expect(operation).toHaveBeenCalledTimes(3)
  })

  test('should not retry non-retryable errors', async () => {
    const operation = jest.fn().mockImplementation(() => {
      throw new SupabaseAuthError('Auth error')
    })

    await expect(withRetry(operation, { maxAttempts: 3 })).rejects.toThrow('Auth error')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  test('should calculate exponential backoff delay', () => {
    expect(getRetryDelay(1, 1000)).toBeGreaterThanOrEqual(1000)
    expect(getRetryDelay(2, 1000)).toBeGreaterThanOrEqual(2000)
    expect(getRetryDelay(3, 1000)).toBeGreaterThanOrEqual(4000)
    expect(getRetryDelay(10, 1000, 30000)).toBeLessThanOrEqual(30000)
  })

  test('should return result object with tryWithRetry', async () => {
    const operation = jest.fn().mockResolvedValue('success')
    
    const result = await tryWithRetry(operation)
    
    expect(result.success).toBe(true)
    expect(result.data).toBe('success')
    expect(result.attempts).toBe(1)
    expect(result.totalTime).toBeGreaterThan(0)
  })

  test('should return error result with tryWithRetry', async () => {
    const operation = jest.fn().mockRejectedValue(new SupabaseAuthError('Auth error'))
    
    const result = await tryWithRetry(operation)
    
    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(SupabaseAuthError)
    expect(result.attempts).toBe(1)
  })
})

describe('Circuit Breaker', () => {
  test('should open circuit after failure threshold', async () => {
    const circuitBreaker = new CircuitBreaker(2, 60000, 'test')
    const operation = jest.fn().mockRejectedValue(new Error('Service error'))

    // First two failures should go through
    await expect(circuitBreaker.execute(operation)).rejects.toThrow()
    await expect(circuitBreaker.execute(operation)).rejects.toThrow()
    
    // Third attempt should be rejected by circuit breaker
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is open')
    
    expect(operation).toHaveBeenCalledTimes(2)
    expect(circuitBreaker.getState().state).toBe('open')
  })

  test('should reset circuit after successful operation in half-open state', async () => {
    const circuitBreaker = new CircuitBreaker(1, 0, 'test') // 0 recovery timeout for testing
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('Service error'))
      .mockResolvedValueOnce('success')

    // Trigger circuit breaker
    await expect(circuitBreaker.execute(operation)).rejects.toThrow()
    expect(circuitBreaker.getState().state).toBe('open')

    // Wait for recovery timeout (0ms in test)
    await new Promise(resolve => setTimeout(resolve, 1))

    // Successful operation should reset circuit
    const result = await circuitBreaker.execute(operation)
    expect(result).toBe('success')
    expect(circuitBreaker.getState().state).toBe('closed')
  })
})

describe('Error Recovery Actions', () => {
  test('should provide network error recovery actions', () => {
    const error = new SupabaseNetworkError('Network error')
    const actions = getErrorRecoveryActions(error)
    
    expect(actions).toContain('Check your internet connection')
    expect(actions).toContain('Try refreshing the page')
  })

  test('should provide auth error recovery actions', () => {
    const error = new SupabaseAuthError('Auth error')
    const actions = getErrorRecoveryActions(error)
    
    expect(actions).toContain('Sign out and sign back in')
    expect(actions).toContain('Clear your browser cache and cookies')
  })

  test('should provide database error recovery actions', () => {
    const error = new SupabaseDatabaseError('Database error')
    const actions = getErrorRecoveryActions(error)
    
    expect(actions).toContain('Try again in a few moments')
    expect(actions).toContain('Contact support if the problem persists')
  })
})

describe('Error Monitoring', () => {
  // Import error monitoring after mocking logger
  let errorMonitor: any
  let recordError: any

  beforeAll(async () => {
    const errorMonitoringModule = await import('../error-monitoring')
    errorMonitor = errorMonitoringModule.errorMonitor
    recordError = errorMonitoringModule.recordError
  })

  beforeEach(() => {
    // Clear error monitor state if method exists
    if (errorMonitor.clearLogs) {
      errorMonitor.clearLogs()
    }
  })

  test('should record and track errors', () => {
    const error = new SupabaseNetworkError('Network error')
    const context = { endpoint: '/api/test', userId: 'user123' }
    
    recordError(error, context)
    
    const metrics = errorMonitor.getMetrics()
    expect(metrics.totalErrors).toBeGreaterThan(0)
    expect(metrics.errorsByCategory.network).toBeGreaterThan(0)
  })

  test('should detect error patterns', () => {
    const error = new SupabaseNetworkError('Network error')
    const context = { endpoint: '/api/test' }
    
    // Record multiple similar errors
    for (let i = 0; i < 5; i++) {
      recordError(error, context)
    }
    
    const patterns = errorMonitor.getPatterns()
    expect(patterns.length).toBeGreaterThan(0)
    
    const networkPattern = patterns.find(p => p.pattern.includes('NETWORK_ERROR'))
    expect(networkPattern).toBeDefined()
    expect(networkPattern?.count).toBeGreaterThanOrEqual(5)
  })

  test('should generate health status', () => {
    const status = errorMonitor.getHealthStatus()
    
    expect(status).toHaveProperty('status')
    expect(status).toHaveProperty('metrics')
    expect(status).toHaveProperty('activeAlerts')
    expect(status).toHaveProperty('criticalPatterns')
    expect(['healthy', 'degraded', 'unhealthy']).toContain(status.status)
  })

  test('should generate error report', () => {
    const error = new SupabaseNetworkError('Network error')
    recordError(error, { endpoint: '/api/test' })
    
    const report = errorMonitor.generateReport()
    
    expect(report).toHaveProperty('summary')
    expect(report).toHaveProperty('topErrors')
    expect(report).toHaveProperty('patterns')
    expect(report).toHaveProperty('alerts')
    expect(report).toHaveProperty('recommendations')
    expect(Array.isArray(report.recommendations)).toBe(true)
  })
})

describe('Logger Integration', () => {
  test('should log errors with proper context', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    const error = new SupabaseDatabaseError('Database error')
    const context = { operation: 'testOp', userId: 'user123' }
    
    logger.error('Test error message', context, error)
    
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  test('should track performance metrics', () => {
    const operationId = 'test-operation'
    
    logger.startPerformance(operationId, 'Test Operation')
    
    // Simulate some work
    setTimeout(() => {
      const duration = logger.endPerformance(operationId, 'Test completed')
      expect(duration).toBeGreaterThan(0)
    }, 10)
  })

  test('should sanitize sensitive data in logs', () => {
    const sensitiveContext = {
      password: 'secret123',
      token: 'jwt-token',
      apiKey: 'api-key-123',
      normalData: 'safe-data'
    }
    
    logger.info('Test message', sensitiveContext)
    
    const logs = logger.getLogs('info', 1)
    expect(logs[0].context?.password).toBe('[REDACTED]')
    expect(logs[0].context?.token).toBe('[REDACTED]')
    expect(logs[0].context?.apiKey).toBe('[REDACTED]')
    expect(logs[0].context?.normalData).toBe('safe-data')
  })
})

describe('Error Context Builder', () => {
  test('should build error context correctly', () => {
    const context = ErrorContext.create()
      .operation('testOperation')
      .table('users')
      .userId('user123')
      .data({ field: 'value' })
      .query({ where: 'condition' })
      .custom('customField', 'customValue')
      .build()
    
    expect(context).toEqual({
      operation: 'testOperation',
      table: 'users',
      userId: 'user123',
      data: { field: 'value' },
      query: { where: 'condition' },
      customField: 'customValue'
    })
  })

  test('should chain context methods', () => {
    const context = ErrorContext.create()
      .operation('chainTest')
      .userId('user456')
      .build()
    
    expect(context.operation).toBe('chainTest')
    expect(context.userId).toBe('user456')
  })
})