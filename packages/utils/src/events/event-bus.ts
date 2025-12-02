/**
 * Type-safe Event Bus Implementation
 * Supports both synchronous and asynchronous event handling
 */

export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export interface EventSubscription {
  unsubscribe: () => void;
}

export interface EventBusOptions {
  maxListeners?: number;
  enableLogging?: boolean;
  onError?: (error: Error, eventName: string) => void;
}

export class EventBus<TEvents extends Record<string, unknown> = Record<string, unknown>> {
  private handlers: Map<keyof TEvents, Set<EventHandler<any>>> = new Map();
  private onceHandlers: Map<keyof TEvents, Set<EventHandler<any>>> = new Map();
  private readonly maxListeners: number;
  private readonly enableLogging: boolean;
  private readonly onError?: (error: Error, eventName: string) => void;

  constructor(options: EventBusOptions = {}) {
    this.maxListeners = options.maxListeners ?? 100;
    this.enableLogging = options.enableLogging ?? false;
    this.onError = options.onError;
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof TEvents>(
    eventName: K,
    handler: EventHandler<TEvents[K]>
  ): EventSubscription {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    const handlers = this.handlers.get(eventName)!;

    if (handlers.size >= this.maxListeners) {
      console.warn(
        `EventBus: Max listeners (${this.maxListeners}) reached for event "${String(eventName)}"`
      );
    }

    handlers.add(handler);

    if (this.enableLogging) {
      console.log(`EventBus: Subscribed to "${String(eventName)}", total: ${handlers.size}`);
    }

    return {
      unsubscribe: () => this.off(eventName, handler),
    };
  }

  /**
   * Subscribe to an event once
   */
  once<K extends keyof TEvents>(
    eventName: K,
    handler: EventHandler<TEvents[K]>
  ): EventSubscription {
    if (!this.onceHandlers.has(eventName)) {
      this.onceHandlers.set(eventName, new Set());
    }

    this.onceHandlers.get(eventName)!.add(handler);

    return {
      unsubscribe: () => {
        this.onceHandlers.get(eventName)?.delete(handler);
      },
    };
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof TEvents>(eventName: K, handler: EventHandler<TEvents[K]>): void {
    this.handlers.get(eventName)?.delete(handler);
    this.onceHandlers.get(eventName)?.delete(handler);

    if (this.enableLogging) {
      console.log(
        `EventBus: Unsubscribed from "${String(eventName)}", remaining: ${this.handlers.get(eventName)?.size ?? 0}`
      );
    }
  }

  /**
   * Emit an event synchronously
   */
  emit<K extends keyof TEvents>(eventName: K, payload: TEvents[K]): void {
    if (this.enableLogging) {
      console.log(`EventBus: Emitting "${String(eventName)}"`, payload);
    }

    // Regular handlers
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (error) {
          this.handleError(error as Error, String(eventName));
        }
      }
    }

    // Once handlers
    const onceHandlers = this.onceHandlers.get(eventName);
    if (onceHandlers) {
      for (const handler of onceHandlers) {
        try {
          handler(payload);
        } catch (error) {
          this.handleError(error as Error, String(eventName));
        }
      }
      this.onceHandlers.delete(eventName);
    }
  }

  /**
   * Emit an event asynchronously and wait for all handlers
   */
  async emitAsync<K extends keyof TEvents>(
    eventName: K,
    payload: TEvents[K]
  ): Promise<void> {
    if (this.enableLogging) {
      console.log(`EventBus: Emitting async "${String(eventName)}"`, payload);
    }

    const promises: Promise<void>[] = [];

    // Regular handlers
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      for (const handler of handlers) {
        promises.push(
          Promise.resolve()
            .then(() => handler(payload))
            .catch((error) => this.handleError(error, String(eventName)))
        );
      }
    }

    // Once handlers
    const onceHandlers = this.onceHandlers.get(eventName);
    if (onceHandlers) {
      for (const handler of onceHandlers) {
        promises.push(
          Promise.resolve()
            .then(() => handler(payload))
            .catch((error) => this.handleError(error, String(eventName)))
        );
      }
      this.onceHandlers.delete(eventName);
    }

    await Promise.all(promises);
  }

  /**
   * Remove all handlers for an event or all events
   */
  removeAllListeners(eventName?: keyof TEvents): void {
    if (eventName) {
      this.handlers.delete(eventName);
      this.onceHandlers.delete(eventName);
    } else {
      this.handlers.clear();
      this.onceHandlers.clear();
    }

    if (this.enableLogging) {
      console.log(
        `EventBus: Removed all listeners${eventName ? ` for "${String(eventName)}"` : ''}`
      );
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(eventName: keyof TEvents): number {
    const regular = this.handlers.get(eventName)?.size ?? 0;
    const once = this.onceHandlers.get(eventName)?.size ?? 0;
    return regular + once;
  }

  /**
   * Get all event names with registered handlers
   */
  eventNames(): (keyof TEvents)[] {
    const names = new Set<keyof TEvents>();

    for (const name of this.handlers.keys()) {
      if (this.handlers.get(name)?.size) {
        names.add(name);
      }
    }

    for (const name of this.onceHandlers.keys()) {
      if (this.onceHandlers.get(name)?.size) {
        names.add(name);
      }
    }

    return Array.from(names);
  }

  private handleError(error: Error, eventName: string): void {
    if (this.onError) {
      this.onError(error, eventName);
    } else {
      console.error(`EventBus: Error in handler for "${eventName}":`, error);
    }
  }
}

// Singleton instance for global events
let globalEventBus: EventBus | null = null;

export function getGlobalEventBus<
  TEvents extends Record<string, unknown> = Record<string, unknown>
>(): EventBus<TEvents> {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus as EventBus<TEvents>;
}

export function resetGlobalEventBus(): void {
  globalEventBus?.removeAllListeners();
  globalEventBus = null;
}
