/**
 * Simple logging system for Supabase operations
 * Provides structured logging with different levels and contexts
 * Requirements: 6.4, 8.4
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableStructured: boolean
  environment: 'development' | 'production' | 'test'
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enableStructured: process.env.NODE_ENV === 'production',
  environment: (process.env.NODE_ENV as any) || 'development',
}

/**
 * Log level hierarchy for filtering
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Simple logger class
 */
class Logger {
  private config: LoggerConfig

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Check if a log level should be processed
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level]
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    }

    if (context) {
      entry.context = context
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.config.environment === 'development' ? error.stack : undefined,
        code: (error as any).code,
      }
    }

    return entry
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return

    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`

    if (this.config.enableStructured) {
      // Structured logging for production
      console.log(JSON.stringify(entry))
    } else {
      // Human-readable logging for development
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
      const errorStr = entry.error ? ` Error: ${entry.error.message}` : ''

      const message = `${prefix} ${entry.message}${contextStr}${errorStr}`

      switch (entry.level) {
        case 'debug':
          console.debug(message)
          break
        case 'info':
          console.info(message)
          break
        case 'warn':
          console.warn(message)
          break
        case 'error':
          console.error(message)
          if (entry.error?.stack && this.config.environment === 'development') {
            console.error(entry.error.stack)
          }
          break
      }
    }
  }

  /**
   * Log a message
   */
  public log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, message, context, error)
    this.outputToConsole(entry)
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context)
  }

  /**
   * Info level logging
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context)
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('warn', message, context, error)
  }

  /**
   * Error level logging
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', message, context, error)
  }
}

/**
 * Global logger instance
 */
const logger = new Logger()

/**
 * Export the logger instance
 */
export { logger }
export default logger