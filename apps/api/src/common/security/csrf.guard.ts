import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as crypto from 'crypto';

export const SKIP_CSRF = 'skipCsrf';
export const SkipCsrf = () => Reflect.metadata(SKIP_CSRF, true);

export interface CsrfConfig {
  cookieName?: string;
  headerName?: string;
  secretLength?: number;
  tokenLength?: number;
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
  };
}

const DEFAULT_CONFIG: CsrfConfig = {
  cookieName: '_csrf',
  headerName: 'x-csrf-token',
  secretLength: 32,
  tokenLength: 32,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 86400000, // 24 hours
  },
};

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly config: CsrfConfig;

  constructor(
    private readonly reflector: Reflector,
    config?: CsrfConfig,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  canActivate(context: ExecutionContext): boolean {
    // Check if CSRF check should be skipped
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) {
      return true;
    }

    // Skip CSRF for API requests with Bearer token (typically from mobile apps)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return true;
    }

    // Verify CSRF token
    const token = this.getTokenFromRequest(request);
    const secret = this.getSecretFromRequest(request);

    if (!token || !secret) {
      throw new UnauthorizedException('CSRF token missing');
    }

    if (!this.verifyToken(secret, token)) {
      throw new UnauthorizedException('Invalid CSRF token');
    }

    return true;
  }

  private getTokenFromRequest(request: Request): string | undefined {
    // Check header first
    const headerToken = request.headers[this.config.headerName || 'x-csrf-token'];
    if (headerToken) {
      return Array.isArray(headerToken) ? headerToken[0] : headerToken;
    }

    // Check body
    if (request.body && request.body._csrf) {
      return request.body._csrf;
    }

    // Check query
    if (request.query && request.query._csrf) {
      return request.query._csrf as string;
    }

    return undefined;
  }

  private getSecretFromRequest(request: Request): string | undefined {
    const cookies = request.cookies || {};
    return cookies[this.config.cookieName || '_csrf'];
  }

  private verifyToken(secret: string, token: string): boolean {
    try {
      const expectedToken = this.generateToken(secret);
      return crypto.timingSafeEqual(
        Buffer.from(token),
        Buffer.from(expectedToken),
      );
    } catch {
      return false;
    }
  }

  generateToken(secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(secret)
      .digest('hex')
      .slice(0, this.config.tokenLength || 32);
  }

  generateSecret(): string {
    return crypto
      .randomBytes(this.config.secretLength || 32)
      .toString('hex');
  }
}

/**
 * CSRF token generation service
 */
@Injectable()
export class CsrfService {
  private readonly config: CsrfConfig;

  constructor(config?: CsrfConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a new CSRF secret and token pair
   */
  generateTokenPair(): { secret: string; token: string } {
    const secret = crypto
      .randomBytes(this.config.secretLength || 32)
      .toString('hex');

    const token = crypto
      .createHmac('sha256', secret)
      .update(secret)
      .digest('hex')
      .slice(0, this.config.tokenLength || 32);

    return { secret, token };
  }

  /**
   * Get the cookie options for setting the CSRF cookie
   */
  getCookieOptions(): CsrfConfig['cookieOptions'] {
    return this.config.cookieOptions;
  }

  /**
   * Get the cookie name
   */
  getCookieName(): string {
    return this.config.cookieName || '_csrf';
  }
}
