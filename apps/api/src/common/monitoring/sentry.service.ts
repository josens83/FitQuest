import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Sentry types (will be installed as dependency)
interface SentryOptions {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  debug?: boolean;
}

interface SentryScope {
  setUser(user: { id: string; email?: string; username?: string } | null): void;
  setTag(key: string, value: string): void;
  setExtra(key: string, value: any): void;
  setContext(name: string, context: Record<string, any>): void;
}

interface SentryEvent {
  event_id: string;
}

// Mock Sentry implementation for when not configured
class MockSentry {
  static init(options: SentryOptions): void {
    console.log('[Sentry Mock] Initialized with DSN:', options.dsn ? 'configured' : 'not configured');
  }

  static captureException(error: Error, context?: any): string {
    console.error('[Sentry Mock] Exception captured:', error.message, context);
    return 'mock-event-id';
  }

  static captureMessage(message: string, level?: string): string {
    console.log(`[Sentry Mock] Message captured (${level}):`, message);
    return 'mock-event-id';
  }

  static configureScope(callback: (scope: SentryScope) => void): void {
    // No-op
  }

  static withScope(callback: (scope: SentryScope) => void): void {
    // No-op
  }

  static setUser(user: { id: string; email?: string } | null): void {
    // No-op
  }

  static setTag(key: string, value: string): void {
    // No-op
  }

  static setExtra(key: string, value: any): void {
    // No-op
  }

  static close(timeout?: number): Promise<boolean> {
    return Promise.resolve(true);
  }
}

// Use real Sentry if available, otherwise use mock
let Sentry: typeof MockSentry = MockSentry;

try {
  // Attempt to import real Sentry
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const realSentry = require('@sentry/node');
  if (realSentry) {
    Sentry = realSentry;
  }
} catch {
  // Sentry not installed, use mock
}

export enum SentryLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

@Injectable()
export class SentryService implements OnModuleInit, OnModuleDestroy {
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initialize();
  }

  async onModuleDestroy() {
    if (this.isInitialized) {
      await Sentry.close(2000);
    }
  }

  private initialize(): void {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    const release = this.configService.get<string>('APP_VERSION', '1.0.0');

    if (!dsn) {
      console.log('[Sentry] DSN not configured, error tracking disabled');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,
        release: `fitquest-api@${release}`,
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: 0.1,
        debug: environment !== 'production',
      });

      this.isInitialized = true;
      console.log(`[Sentry] Initialized for environment: ${environment}`);
    } catch (error) {
      console.error('[Sentry] Failed to initialize:', error);
    }
  }

  /**
   * Capture an exception with optional context
   */
  captureException(error: Error, context?: ErrorContext): string | null {
    if (!this.isInitialized) {
      console.error('[Error]', error.message, context);
      return null;
    }

    try {
      Sentry.withScope((scope: SentryScope) => {
        if (context?.userId) {
          scope.setUser({ id: context.userId });
        }

        if (context?.requestId) {
          scope.setTag('request_id', context.requestId);
        }

        if (context?.path) {
          scope.setTag('path', context.path);
        }

        if (context?.method) {
          scope.setTag('method', context.method);
        }

        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        if (context?.extra) {
          Object.entries(context.extra).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }

        Sentry.captureException(error);
      });

      return Sentry.captureException(error);
    } catch (e) {
      console.error('[Sentry] Failed to capture exception:', e);
      return null;
    }
  }

  /**
   * Capture a message with severity level
   */
  captureMessage(message: string, level: SentryLevel = SentryLevel.INFO): string | null {
    if (!this.isInitialized) {
      console.log(`[${level}]`, message);
      return null;
    }

    try {
      return Sentry.captureMessage(message, level);
    } catch (e) {
      console.error('[Sentry] Failed to capture message:', e);
      return null;
    }
  }

  /**
   * Set user context for all subsequent events
   */
  setUser(user: { id: string; email?: string; username?: string } | null): void {
    if (this.isInitialized) {
      Sentry.setUser(user);
    }
  }

  /**
   * Set a tag for all subsequent events
   */
  setTag(key: string, value: string): void {
    if (this.isInitialized) {
      Sentry.setTag(key, value);
    }
  }

  /**
   * Set extra data for all subsequent events
   */
  setExtra(key: string, value: any): void {
    if (this.isInitialized) {
      Sentry.setExtra(key, value);
    }
  }

  /**
   * Capture a breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: {
    category: string;
    message: string;
    level?: SentryLevel;
    data?: Record<string, any>;
  }): void {
    if (!this.isInitialized) return;

    try {
      // @ts-ignore
      Sentry.addBreadcrumb?.({
        category: breadcrumb.category,
        message: breadcrumb.message,
        level: breadcrumb.level || SentryLevel.INFO,
        data: breadcrumb.data,
        timestamp: Date.now() / 1000,
      });
    } catch {
      // Breadcrumbs not supported in mock
    }
  }

  /**
   * Check if Sentry is configured and ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
