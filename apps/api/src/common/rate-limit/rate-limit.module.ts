import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard, DynamicRateLimitGuard } from './rate-limit.guard';

export interface RateLimitModuleOptions {
  enableGlobalGuard?: boolean;
  useDynamicGuard?: boolean;
  redisClient?: any;
}

@Global()
@Module({
  providers: [RateLimitService, RateLimitGuard, DynamicRateLimitGuard],
  exports: [RateLimitService, RateLimitGuard, DynamicRateLimitGuard],
})
export class RateLimitModule {
  static forRoot(options: RateLimitModuleOptions = {}): any {
    const providers: any[] = [
      RateLimitService,
      RateLimitGuard,
      DynamicRateLimitGuard,
    ];

    if (options.enableGlobalGuard) {
      providers.push({
        provide: APP_GUARD,
        useClass: options.useDynamicGuard ? DynamicRateLimitGuard : RateLimitGuard,
      });
    }

    return {
      module: RateLimitModule,
      providers,
      exports: [RateLimitService, RateLimitGuard, DynamicRateLimitGuard],
    };
  }
}
