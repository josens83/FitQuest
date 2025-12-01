import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService, AuditAction, AuditSeverity, AuditContext } from './audit.service';

export const AUDIT_METADATA = 'auditMetadata';

export interface AuditOptions {
  action: AuditAction | string;
  description?: string;
  targetType?: string;
  targetIdParam?: string; // Parameter name to extract target ID from
  includeBody?: boolean;
  includeResponse?: boolean;
  severity?: AuditSeverity;
  sensitiveFields?: string[]; // Fields to redact from logs
}

/**
 * Decorator to enable auditing for a route
 */
export const Audited = (options: AuditOptions) =>
  applyDecorators(
    SetMetadata(AUDIT_METADATA, options),
    UseInterceptors(AuditInterceptor),
  );

/**
 * Pre-defined audit decorators for common operations
 */
export const AuditLogin = () =>
  Audited({
    action: AuditAction.LOGIN,
    description: 'User login attempt',
    sensitiveFields: ['password'],
  });

export const AuditLogout = () =>
  Audited({
    action: AuditAction.LOGOUT,
    description: 'User logged out',
  });

export const AuditCreate = (targetType: string) =>
  Audited({
    action: `${targetType}.create`,
    description: `Created ${targetType}`,
    targetType,
    includeBody: true,
    includeResponse: true,
  });

export const AuditUpdate = (targetType: string, targetIdParam: string = 'id') =>
  Audited({
    action: `${targetType}.update`,
    description: `Updated ${targetType}`,
    targetType,
    targetIdParam,
    includeBody: true,
  });

export const AuditDelete = (targetType: string, targetIdParam: string = 'id') =>
  Audited({
    action: `${targetType}.delete`,
    description: `Deleted ${targetType}`,
    targetType,
    targetIdParam,
    severity: AuditSeverity.WARN,
  });

export const AuditView = (targetType: string, targetIdParam: string = 'id') =>
  Audited({
    action: AuditAction.DATA_VIEW,
    description: `Viewed ${targetType}`,
    targetType,
    targetIdParam,
  });

export const AuditExport = (targetType: string) =>
  Audited({
    action: AuditAction.DATA_EXPORT,
    description: `Exported ${targetType} data`,
    targetType,
    severity: AuditSeverity.WARN,
  });

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<AuditOptions>(
      AUDIT_METADATA,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        await this.logAuditEvent(request, options, response, true, Date.now() - startTime);
      }),
      catchError(async (error) => {
        await this.logAuditEvent(request, options, undefined, false, Date.now() - startTime, error);
        throw error;
      }),
    );
  }

  private async logAuditEvent(
    request: Request,
    options: AuditOptions,
    response: any,
    success: boolean,
    duration: number,
    error?: Error,
  ): Promise<void> {
    const user = (request as any).user;
    const userId = user?.id;

    // Extract target ID from params if specified
    let targetId: string | undefined;
    if (options.targetIdParam) {
      targetId = request.params[options.targetIdParam];
    }

    // If we just created something, extract ID from response
    if (!targetId && options.includeResponse && response?.id) {
      targetId = response.id;
    }

    // Build context
    const auditContext: AuditContext = {
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      correlationId: (request as any).correlationId,
      method: request.method,
      path: request.originalUrl,
      duration,
    };

    // Include sanitized body if requested
    if (options.includeBody && request.body) {
      auditContext.requestBody = this.sanitizeData(
        request.body,
        options.sensitiveFields || [],
      );
    }

    // Include sanitized response if requested
    if (options.includeResponse && response && success) {
      auditContext.responseData = this.sanitizeData(
        response,
        options.sensitiveFields || [],
      );
    }

    // Include error if failed
    if (error) {
      auditContext.error = {
        name: error.name,
        message: error.message,
      };
    }

    const description = options.description || options.action;
    const finalDescription = success
      ? description
      : `${description} (failed)`;

    await this.auditService.log(options.action, finalDescription, {
      actorId: userId,
      actorType: userId ? 'user' : 'system',
      targetType: options.targetType,
      targetId,
      severity: success ? options.severity : AuditSeverity.WARN,
      context: auditContext,
    });
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0];
      return ips.trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private sanitizeData(
    data: any,
    sensitiveFields: string[],
  ): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const defaultSensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'accessToken',
      'refreshToken',
      'creditCard',
      'cvv',
      'ssn',
    ];

    const allSensitive = [...new Set([...defaultSensitiveFields, ...sensitiveFields])];

    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      if (obj && typeof obj === 'object') {
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          const isSensitive = allSensitive.some(
            (field) => lowerKey.includes(field.toLowerCase()),
          );

          if (isSensitive) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = sanitize(value);
          }
        }
        return sanitized;
      }

      return obj;
    };

    return sanitize(data);
  }
}
