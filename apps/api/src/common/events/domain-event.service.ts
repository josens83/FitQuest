import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  EventBus,
  DomainEvents,
  DomainEventName,
  DomainEventPayload,
  EventSubscription,
} from '@fitquest/utils';
import { LoggerService } from '../logging';

export type DomainEventHandler<K extends DomainEventName> = (
  payload: DomainEventPayload<K>
) => void | Promise<void>;

@Injectable()
export class DomainEventService implements OnModuleDestroy {
  private readonly eventBus: EventBus<DomainEvents>;
  private readonly logger = new LoggerService();
  private readonly subscriptions: EventSubscription[] = [];

  constructor() {
    this.logger.setContext('DomainEventService');

    this.eventBus = new EventBus<DomainEvents>({
      enableLogging: process.env.NODE_ENV === 'development',
      maxListeners: 50,
      onError: (error, eventName) => {
        this.logger.error(`Error in event handler for ${eventName}`, error.stack);
      },
    });

    this.logger.log('Domain event service initialized');
  }

  /**
   * Publish a domain event
   */
  publish<K extends DomainEventName>(eventName: K, payload: DomainEventPayload<K>): void {
    this.logger.debug(`Publishing event: ${eventName}`, { payload });
    this.eventBus.emit(eventName, payload);
  }

  /**
   * Publish a domain event and wait for all handlers to complete
   */
  async publishAsync<K extends DomainEventName>(
    eventName: K,
    payload: DomainEventPayload<K>
  ): Promise<void> {
    this.logger.debug(`Publishing async event: ${eventName}`, { payload });
    await this.eventBus.emitAsync(eventName, payload);
  }

  /**
   * Subscribe to a domain event
   */
  subscribe<K extends DomainEventName>(
    eventName: K,
    handler: DomainEventHandler<K>
  ): EventSubscription {
    const subscription = this.eventBus.on(eventName, handler);
    this.subscriptions.push(subscription);
    return subscription;
  }

  /**
   * Subscribe to a domain event once
   */
  subscribeOnce<K extends DomainEventName>(
    eventName: K,
    handler: DomainEventHandler<K>
  ): EventSubscription {
    return this.eventBus.once(eventName, handler);
  }

  /**
   * Get listener count for an event
   */
  getListenerCount(eventName: DomainEventName): number {
    return this.eventBus.listenerCount(eventName);
  }

  onModuleDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.eventBus.removeAllListeners();
    this.logger.log('Domain event service destroyed');
  }
}
