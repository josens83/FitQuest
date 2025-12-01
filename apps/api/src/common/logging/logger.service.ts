import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  service: string;
  environment: string;
  version: string;
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private readonly serviceName = 'fitquest-api';
  private readonly environment = process.env.NODE_ENV || 'development';
  private readonly version = process.env.APP_VERSION || '1.0.0';
  private readonly logLevel = this.getLogLevel();

  setContext(context: string): void {
    this.context = context;
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'VERBOSE': return LogLevel.VERBOSE;
      default: return this.environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLog(
    level: string,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      environment: this.environment,
      version: this.version,
    };

    if (context) {
      entry.context = {
        ...context,
        module: this.context,
      };
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    // In production, output JSON for log aggregation
    if (this.environment === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      // In development, output human-readable format
      const color = this.getColor(entry.level);
      const reset = '\x1b[0m';
      const timestamp = entry.timestamp.split('T')[1].replace('Z', '');
      const ctx = this.context ? `[${this.context}]` : '';

      let output = `${color}${entry.level.padEnd(5)}${reset} ${timestamp} ${ctx} ${entry.message}`;

      if (entry.context && Object.keys(entry.context).length > 1) {
        const { module, ...rest } = entry.context;
        if (Object.keys(rest).length > 0) {
          output += ` ${JSON.stringify(rest)}`;
        }
      }

      if (entry.error) {
        output += `\n${entry.error.stack || entry.error.message}`;
      }

      console.log(output);
    }
  }

  private getColor(level: string): string {
    switch (level) {
      case 'ERROR': return '\x1b[31m'; // Red
      case 'WARN': return '\x1b[33m';  // Yellow
      case 'INFO': return '\x1b[32m';  // Green
      case 'DEBUG': return '\x1b[36m'; // Cyan
      case 'VERBOSE': return '\x1b[35m'; // Magenta
      default: return '\x1b[0m';
    }
  }

  log(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatLog('INFO', message, context));
    }
  }

  error(message: string, trace?: string | Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const error = trace instanceof Error ? trace : trace ? new Error(trace) : undefined;
      this.output(this.formatLog('ERROR', message, context, error));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatLog('WARN', message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatLog('DEBUG', message, context));
    }
  }

  verbose(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      this.output(this.formatLog('VERBOSE', message, context));
    }
  }

  // HTTP request logging
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: Partial<LogContext>
  ): void {
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    const message = `${method} ${path} ${statusCode} ${duration}ms`;

    this.output(this.formatLog(level, message, {
      method,
      path,
      statusCode,
      duration,
      ...context,
    }));
  }

  // Database query logging
  logQuery(query: string, duration: number, context?: Partial<LogContext>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const message = `Query executed in ${duration}ms`;
      this.output(this.formatLog('DEBUG', message, {
        query: query.substring(0, 200),
        duration,
        ...context,
      }));
    }
  }

  // External service call logging
  logExternalCall(
    service: string,
    method: string,
    duration: number,
    success: boolean,
    context?: Partial<LogContext>
  ): void {
    const level = success ? 'INFO' : 'ERROR';
    const message = `External call to ${service} ${success ? 'succeeded' : 'failed'} in ${duration}ms`;

    this.output(this.formatLog(level, message, {
      externalService: service,
      method,
      duration,
      success,
      ...context,
    }));
  }
}

// Create a default logger instance
export const logger = new LoggerService();
