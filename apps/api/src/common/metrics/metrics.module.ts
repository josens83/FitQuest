import { Module, Global, OnModuleInit, Inject } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsService, setMetricsService } from './metrics.service';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsController } from './metrics.controller';
import {
  HealthService,
  createMemoryHealthCheck,
} from './health.service';

export interface MetricsModuleOptions {
  enableHttpMetrics?: boolean;
  enableMemoryHealthCheck?: boolean;
  maxHeapUsedPercent?: number;
}

@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    HealthService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [MetricsService, HealthService],
})
export class MetricsModule implements OnModuleInit {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly healthService: HealthService,
  ) {}

  onModuleInit() {
    // Set singleton instance for global access
    setMetricsService(this.metricsService);

    // Register default health checks
    this.healthService.registerHealthCheck(
      'memory',
      createMemoryHealthCheck(90),
    );
  }

  static forRoot(options: MetricsModuleOptions = {}) {
    const providers: any[] = [
      MetricsService,
      HealthService,
    ];

    if (options.enableHttpMetrics !== false) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: MetricsInterceptor,
      });
    }

    return {
      module: MetricsModule,
      controllers: [MetricsController],
      providers,
      exports: [MetricsService, HealthService],
    };
  }
}
