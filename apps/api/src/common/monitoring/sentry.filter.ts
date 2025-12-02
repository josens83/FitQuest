import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SentryService, SentryLevel } from './sentry.service';
import { LoggerService } from '../logging';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

// Errors that should not be reported to Sentry (expected errors)
const IGNORED_ERRORS = [
  'UnauthorizedException',
  'ForbiddenException',
  'NotFoundException',
  'BadRequestException',
  'ConflictException',
  'ValidationError',
];

// Status codes that should not be reported
const IGNORED_STATUS_CODES = [400, 401, 403, 404, 409, 422];

@Injectable()
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new LoggerService();

  constructor(private readonly sentryService: SentryService) {
    this.logger.setContext('ExceptionFilter');
  }

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Determine status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get error message
    const message = this.getErrorMessage(exception);

    // Get error name
    const errorName = exception.name || 'UnknownError';

    // Build error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: (request as any).correlationId,
    };

    // Log the error
    this.logError(exception, request, status);

    // Report to Sentry if appropriate
    if (this.shouldReportToSentry(exception, status)) {
      this.reportToSentry(exception, request, status);
    }

    // Send response
    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exception: Error): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null) {
        return (response as any).message || exception.message;
      }
    }
    return exception.message || 'Internal server error';
  }

  private shouldReportToSentry(exception: Error, status: number): boolean {
    // Don't report expected errors
    if (IGNORED_ERRORS.includes(exception.name)) {
      return false;
    }

    // Don't report client errors (4xx)
    if (IGNORED_STATUS_CODES.includes(status)) {
      return false;
    }

    // Report all 5xx errors
    if (status >= 500) {
      return true;
    }

    // Report any unexpected errors
    return !(exception instanceof HttpException);
  }

  private logError(exception: Error, request: Request, status: number): void {
    const user = (request as any).user;

    const logContext = {
      statusCode: status,
      path: request.url,
      method: request.method,
      userId: user?.id,
      correlationId: (request as any).correlationId,
      stack: exception.stack,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${exception.message}`,
        exception.stack,
        logContext
      );
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} - ${exception.message}`, logContext);
    }
  }

  private reportToSentry(exception: Error, request: Request, status: number): void {
    const user = (request as any).user;

    this.sentryService.captureException(exception, {
      userId: user?.id,
      requestId: (request as any).correlationId,
      path: request.url,
      method: request.method,
      tags: {
        status_code: status.toString(),
        error_type: exception.name,
      },
      extra: {
        body: this.sanitizeBody(request.body),
        query: request.query,
        params: request.params,
        headers: this.sanitizeHeaders(request.headers),
      },
    });
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];

    return sanitized;
  }
}
