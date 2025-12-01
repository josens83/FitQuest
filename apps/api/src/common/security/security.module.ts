import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { SecurityHeadersMiddleware, SecurityHeadersConfig } from './security-headers.middleware';
import { CsrfGuard, CsrfService, CsrfConfig } from './csrf.guard';
import { SanitizationPipe } from './input-sanitizer';

export interface SecurityModuleOptions {
  enableSecurityHeaders?: boolean;
  securityHeadersConfig?: SecurityHeadersConfig;
  enableCsrf?: boolean;
  csrfConfig?: CsrfConfig;
  enableSanitization?: boolean;
  sanitizationOptions?: { escapeHtml?: boolean };
}

const DEFAULT_OPTIONS: SecurityModuleOptions = {
  enableSecurityHeaders: true,
  enableCsrf: true,
  enableSanitization: true,
  sanitizationOptions: { escapeHtml: false },
};

@Global()
@Module({})
export class SecurityModule implements NestModule {
  private static options: SecurityModuleOptions = DEFAULT_OPTIONS;

  static forRoot(options: SecurityModuleOptions = {}): any {
    SecurityModule.options = { ...DEFAULT_OPTIONS, ...options };

    const providers: any[] = [
      CsrfService,
    ];

    if (options.enableCsrf !== false) {
      providers.push({
        provide: APP_GUARD,
        useFactory: () => new CsrfGuard(
          { getAllAndOverride: () => false } as any,
          options.csrfConfig,
        ),
      });
    }

    if (options.enableSanitization !== false) {
      providers.push({
        provide: APP_PIPE,
        useFactory: () => new SanitizationPipe(options.sanitizationOptions),
      });
    }

    return {
      module: SecurityModule,
      providers,
      exports: [CsrfService],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    if (SecurityModule.options.enableSecurityHeaders !== false) {
      consumer
        .apply(SecurityHeadersMiddleware)
        .forRoutes('*');
    }
  }
}
