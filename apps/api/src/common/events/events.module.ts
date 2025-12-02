import { Module, Global } from '@nestjs/common';
import { DomainEventService } from './domain-event.service';
import { EventHandlersService } from './event-handlers.service';
import { MetricsModule } from '../metrics';

@Global()
@Module({
  imports: [MetricsModule.forRoot({})],
  providers: [DomainEventService, EventHandlersService],
  exports: [DomainEventService],
})
export class EventsModule {}
