import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.decorator';

@Global()
@Module({
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
