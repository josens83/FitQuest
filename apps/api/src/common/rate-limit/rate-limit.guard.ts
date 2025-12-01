import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitService, RateLimitConfig } from './rate-limit.service';

export const RATE_LIMIT_CONFIG = 'rateLimitConfig';
export const SKIP_RATE_LIMIT = 'skipRateLimit';

export interface RateLimitOptions {
  configName?: string;
  customConfig?: Partial<RateLimitConfig>;
  keyGenerator?: (request: Request) => string;
  errorMessage?: string;
}

/**
 * Decorator to apply rate limiting to a route or controller
 */
export const RateLimit = (options: RateLimitOptions = {}) =>
  SetMetadata(RATE_LIMIT_CONFIG, options);

/**
 * Decorator to skip rate limiting
 */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT, true);

/**
 * Preset rate limit decorators for common use cases
 */
export const RateLimitLogin = () =>
  RateLimit({ configName: 'auth:login' });

export const RateLimitRegister = () =>
  RateLimit({ configName: 'auth:register' });

export const RateLimitPasswordReset = () =>
  RateLimit({ configName: 'auth:password-reset' });

export const RateLimitBurst = () =>
  RateLimit({
    customConfig: { windowMs: 1000, maxRequests: 10 },
  });

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if rate limiting should be skipped
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(
      SKIP_RATE_LIMIT,
      [context.getHandler(), context.getClass()],
    );

    if (skipRateLimit) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get rate limit options from decorator
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_CONFIG,
      [context.getHandler(), context.getClass()],
    ) || {};

    // Generate identifier
    const identifier = options.keyGenerator
      ? options.keyGenerator(request)
      : this.getIdentifier(request);

    // Check rate limit
    const result = await this.rateLimitService.checkLimit(
      identifier,
      options.configName || 'default',
      options.customConfig,
    );

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', result.total);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      response.setHeader('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000));

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: options.errorMessage || 'Too many requests, please try again later.',
          error: 'Too Many Requests',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getIdentifier(request: Request): string {
    // Use user ID if authenticated
    const user = (request as any).user;
    if (user?.id) {
      return `user:${user.id}`;
    }

    // Fall back to IP address
    return `ip:${this.getClientIp(request)}`;
  }

  private getClientIp(request: Request): string {
    // Check common proxy headers
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0];
      return ips.trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.ip || request.socket.remoteAddress || 'unknown';
  }
}

/**
 * Dynamic rate limit guard that can be configured at runtime
 */
@Injectable()
export class DynamicRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Determine rate limit based on user tier
    const user = (request as any).user;
    let configName = 'default';

    if (user) {
      const tier = user.subscriptionTier || 'free';
      configName = tier === 'premium' || tier === 'enterprise'
        ? 'premium'
        : 'default';
    }

    const identifier = user?.id
      ? `user:${user.id}`
      : `ip:${this.getClientIp(request)}`;

    const result = await this.rateLimitService.checkLimit(identifier, configName);

    // Set headers
    response.setHeader('X-RateLimit-Limit', result.total);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      response.setHeader('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000));

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please try again later.',
          error: 'Too Many Requests',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
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
}
