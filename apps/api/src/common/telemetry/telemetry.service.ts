import { Injectable, Logger } from '@nestjs/common';
import {
  trace,
  context,
  SpanStatusCode,
  SpanKind,
  Span,
  Attributes,
} from '@opentelemetry/api';
import { metrics, Counter, Histogram } from '@opentelemetry/api';

const tracer = trace.getTracer('fitquest-api');
const meter = metrics.getMeter('fitquest-api');

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  // Custom metrics
  private readonly requestCounter: Counter;
  private readonly requestDuration: Histogram;
  private readonly workoutSessionCounter: Counter;
  private readonly achievementCounter: Counter;
  private readonly errorCounter: Counter;

  constructor() {
    // Initialize custom metrics
    this.requestCounter = meter.createCounter('http_requests_total', {
      description: 'Total number of HTTP requests',
    });

    this.requestDuration = meter.createHistogram('http_request_duration_ms', {
      description: 'HTTP request duration in milliseconds',
      unit: 'ms',
    });

    this.workoutSessionCounter = meter.createCounter('workout_sessions_total', {
      description: 'Total number of workout sessions',
    });

    this.achievementCounter = meter.createCounter('achievements_unlocked_total', {
      description: 'Total number of achievements unlocked',
    });

    this.errorCounter = meter.createCounter('errors_total', {
      description: 'Total number of errors',
    });
  }

  /**
   * Create a new span for tracing
   */
  startSpan(name: string, attributes?: Attributes): Span {
    return tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      attributes,
    });
  }

  /**
   * Execute a function within a traced span
   */
  async traceAsync<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Attributes,
  ): Promise<T> {
    const span = this.startSpan(name, attributes);

    try {
      const result = await context.with(
        trace.setSpan(context.active(), span),
        () => fn(span),
      );
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Execute a synchronous function within a traced span
   */
  traceSync<T>(
    name: string,
    fn: (span: Span) => T,
    attributes?: Attributes,
  ): T {
    const span = this.startSpan(name, attributes);

    try {
      const result = context.with(
        trace.setSpan(context.active(), span),
        () => fn(span),
      );
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Add event to current span
   */
  addSpanEvent(name: string, attributes?: Attributes): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Set attributes on current span
   */
  setSpanAttributes(attributes: Attributes): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Record HTTP request metric
   */
  recordRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ): void {
    const attributes = {
      'http.method': method,
      'http.route': route,
      'http.status_code': statusCode,
    };

    this.requestCounter.add(1, attributes);
    this.requestDuration.record(durationMs, attributes);
  }

  /**
   * Record workout session metric
   */
  recordWorkoutSession(
    userId: string,
    workoutType: string,
    durationMinutes: number,
  ): void {
    this.workoutSessionCounter.add(1, {
      'user.id': userId,
      'workout.type': workoutType,
      'workout.duration_minutes': durationMinutes,
    });

    this.addSpanEvent('workout_session_completed', {
      'workout.type': workoutType,
      'workout.duration_minutes': durationMinutes,
    });
  }

  /**
   * Record achievement unlocked metric
   */
  recordAchievementUnlocked(userId: string, achievementId: string): void {
    this.achievementCounter.add(1, {
      'user.id': userId,
      'achievement.id': achievementId,
    });

    this.addSpanEvent('achievement_unlocked', {
      'achievement.id': achievementId,
    });
  }

  /**
   * Record error metric
   */
  recordError(errorType: string, errorMessage: string, route?: string): void {
    this.errorCounter.add(1, {
      'error.type': errorType,
      'error.message': errorMessage,
      'http.route': route || 'unknown',
    });
  }

  /**
   * Get current trace ID
   */
  getCurrentTraceId(): string | undefined {
    const span = trace.getActiveSpan();
    return span?.spanContext().traceId;
  }

  /**
   * Get current span ID
   */
  getCurrentSpanId(): string | undefined {
    const span = trace.getActiveSpan();
    return span?.spanContext().spanId;
  }
}
