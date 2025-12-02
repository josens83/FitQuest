import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SentryService } from './sentry.service';
import { SentryExceptionFilter } from './sentry.filter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SentryService,
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },
  ],
  exports: [SentryService],
})
export class MonitoringModule {}
