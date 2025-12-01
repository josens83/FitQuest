import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const method = request.method;
    const path = this.normalizePath(request.route?.path || request.path);

    const endTimer = this.metricsService.startTimer('http_request_duration_ms', {
      method,
      path,
    });

    return next.handle().pipe(
      tap(() => {
        const status = response.statusCode.toString();
        const duration = endTimer();

        this.metricsService.incrementCounter('http_requests_total', {
          method,
          path,
          status,
        });

        // Update the histogram with status label
        this.metricsService.observeHistogram('http_request_duration_ms', duration, {
          method,
          path,
          status,
        });
      }),
      catchError((error) => {
        const status = error.status || 500;
        endTimer();

        this.metricsService.incrementCounter('http_requests_total', {
          method,
          path,
          status: status.toString(),
        });

        this.metricsService.incrementCounter('errors_total', {
          type: error.name || 'UnknownError',
          code: status.toString(),
        });

        throw error;
      }),
    );
  }

  private normalizePath(path: string): string {
    // Replace dynamic segments with placeholders for better aggregation
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-z0-9]{24}/gi, '/:id'); // MongoDB ObjectIds
  }
}
