import { CircuitBreaker, CircuitBreakerConfig } from './circuit-breaker';
import { retryWithBackoff, RetryConfig } from './retry';
import { Bulkhead, BulkheadConfig } from './bulkhead';
import { withFallback, FallbackConfig } from './fallback';

export interface ResilientCallConfig<T> {
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  retry?: Partial<RetryConfig>;
  bulkhead?: Partial<BulkheadConfig>;
  fallback?: FallbackConfig<T>;
  timeout?: number;
}

/**
 * Combined resilience patterns for maximum protection
 * Order: Bulkhead -> Circuit Breaker -> Retry -> Timeout -> Fallback
 */
export class ResilientService {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private bulkheads: Map<string, Bulkhead> = new Map();

  /**
   * Execute a function with full resilience protection
   */
  async call<T>(
    name: string,
    fn: () => Promise<T>,
    config: ResilientCallConfig<T> = {}
  ): Promise<T> {
    // Get or create circuit breaker
    let circuitBreaker = this.circuitBreakers.get(name);
    if (!circuitBreaker && config.circuitBreaker !== false) {
      circuitBreaker = new CircuitBreaker({
        name,
        ...config.circuitBreaker,
      });
      this.circuitBreakers.set(name, circuitBreaker);
    }

    // Get or create bulkhead
    let bulkhead = this.bulkheads.get(name);
    if (!bulkhead && config.bulkhead !== false) {
      bulkhead = new Bulkhead({
        name,
        ...config.bulkhead,
      });
      this.bulkheads.set(name, bulkhead);
    }

    // Build the execution chain
    let execution: () => Promise<T> = fn;

    // Wrap with timeout if configured
    if (config.timeout) {
      const originalExecution = execution;
      execution = () => this.withTimeout(originalExecution, config.timeout!);
    }

    // Wrap with retry if configured
    if (config.retry !== false) {
      const originalExecution = execution;
      execution = () => retryWithBackoff(originalExecution, {
        maxRetries: 3,
        ...config.retry,
      });
    }

    // Wrap with circuit breaker
    if (circuitBreaker) {
      const originalExecution = execution;
      execution = () => circuitBreaker!.fire(originalExecution);
    }

    // Wrap with bulkhead
    if (bulkhead) {
      const originalExecution = execution;
      execution = () => bulkhead!.execute(originalExecution);
    }

    // Execute with fallback
    if (config.fallback) {
      return withFallback(execution, config.fallback);
    }

    return execution();
  }

  /**
   * Timeout wrapper
   */
  private withTimeout<T>(fn: () => Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Get stats for all components
   */
  getStats() {
    const circuitBreakerStats: Record<string, any> = {};
    this.circuitBreakers.forEach((cb, name) => {
      circuitBreakerStats[name] = cb.getStats();
    });

    const bulkheadStats: Record<string, any> = {};
    this.bulkheads.forEach((bh, name) => {
      bulkheadStats[name] = bh.getStats();
    });

    return {
      circuitBreakers: circuitBreakerStats,
      bulkheads: bulkheadStats,
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.forEach((cb) => cb.reset());
  }
}

// Export singleton instance
export const resilientService = new ResilientService();

// Export all resilience utilities
export * from './circuit-breaker';
export * from './retry';
export * from './bulkhead';
export * from './fallback';
