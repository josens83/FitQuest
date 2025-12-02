import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TracingInterceptor } from './tracing.interceptor';
import { TelemetryService } from './telemetry.service';
import { shutdownTracing } from './tracing';

@Global()
@Module({
  providers: [
    TelemetryService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
  ],
  exports: [TelemetryService],
})
export class TelemetryModule implements OnModuleDestroy {
  async onModuleDestroy() {
    await shutdownTracing();
  }
}
