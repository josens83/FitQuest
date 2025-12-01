import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface SecurityHeadersConfig {
  enableHSTS?: boolean;
  hstsMaxAge?: number;
  enableCSP?: boolean;
  cspDirectives?: Record<string, string[]>;
  enableXSSProtection?: boolean;
  enableNoSniff?: boolean;
  enableFrameGuard?: boolean;
  frameGuardAction?: 'DENY' | 'SAMEORIGIN';
  enableReferrerPolicy?: boolean;
  referrerPolicy?: string;
  enablePermissionsPolicy?: boolean;
  permissionsPolicy?: Record<string, string[]>;
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  enableHSTS: true,
  hstsMaxAge: 31536000, // 1 year
  enableCSP: true,
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  },
  enableXSSProtection: true,
  enableNoSniff: true,
  enableFrameGuard: true,
  frameGuardAction: 'DENY',
  enableReferrerPolicy: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  enablePermissionsPolicy: true,
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: ["'self'"],
    'payment': [],
  },
};

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly config: SecurityHeadersConfig;

  constructor(config?: SecurityHeadersConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // HSTS - HTTP Strict Transport Security
    if (this.config.enableHSTS) {
      res.setHeader(
        'Strict-Transport-Security',
        `max-age=${this.config.hstsMaxAge}; includeSubDomains; preload`,
      );
    }

    // CSP - Content Security Policy
    if (this.config.enableCSP && this.config.cspDirectives) {
      const csp = Object.entries(this.config.cspDirectives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
      res.setHeader('Content-Security-Policy', csp);
    }

    // X-XSS-Protection
    if (this.config.enableXSSProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // X-Content-Type-Options
    if (this.config.enableNoSniff) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // X-Frame-Options
    if (this.config.enableFrameGuard) {
      res.setHeader('X-Frame-Options', this.config.frameGuardAction || 'DENY');
    }

    // Referrer-Policy
    if (this.config.enableReferrerPolicy) {
      res.setHeader('Referrer-Policy', this.config.referrerPolicy || 'strict-origin-when-cross-origin');
    }

    // Permissions-Policy (formerly Feature-Policy)
    if (this.config.enablePermissionsPolicy && this.config.permissionsPolicy) {
      const pp = Object.entries(this.config.permissionsPolicy)
        .map(([key, values]) => {
          if (values.length === 0) {
            return `${key}=()`;
          }
          return `${key}=(${values.join(' ')})`;
        })
        .join(', ');
      res.setHeader('Permissions-Policy', pp);
    }

    // Additional security headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Remove potentially dangerous headers
    res.removeHeader('X-Powered-By');

    next();
  }
}
