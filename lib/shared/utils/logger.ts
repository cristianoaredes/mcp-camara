/**
 * Structured logging utility with configurable log levels
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: {
    tool?: string;
    endpoint?: string;
    duration?: number;
    error?: string;
    stackTrace?: string;
    requestContext?: Record<string, unknown>;
    httpMethod?: string;
    url?: string;
    statusCode?: number;
    cacheKey?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

export class Logger {
  constructor(private level: LogLevel = 'INFO') {}

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private log(entry: LogEntry): void {
    if (this.shouldLog(entry.level)) {
      console.error(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogEntry['context']): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      context,
    });
  }

  info(message: string, context?: LogEntry['context']): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      context,
    });
  }

  warn(message: string, context?: LogEntry['context']): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      context,
    });
  }

  error(message: string, context?: LogEntry['context']): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      context,
    });
  }

  logToolInvocation(tool: string, params: unknown, duration: number): void {
    this.info('Tool invoked', {
      tool,
      duration,
      requestContext: { params },
    });
  }

  logApiRequest(method: string, url: string, statusCode: number, duration: number): void {
    this.debug('API request', {
      httpMethod: method,
      url,
      statusCode,
      duration,
    });
  }

  logCacheHit(key: string): void {
    this.debug('Cache hit', { cacheKey: key });
  }

  logCacheMiss(key: string): void {
    this.debug('Cache miss', { cacheKey: key });
  }

  logError(message: string, error: Error, context?: Record<string, unknown>): void {
    this.error(message, {
      error: error.message,
      stackTrace: error.stack,
      requestContext: context,
    });
  }
}
