// Circuit Breaker States
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject all requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerConfig {
  timeout: number;           // Request timeout in ms
  errorThreshold: number;    // Error percentage to trip circuit (0-100)
  volumeThreshold: number;   // Minimum requests before calculating error rate
  resetTimeout: number;      // Time to wait before trying again (ms)
  name: string;              // Circuit name for logging/metrics
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
}

export class CircuitOpenError extends Error {
  constructor(
    message: string,
    public readonly circuitName: string,
    public readonly stats: CircuitBreakerStats
  ) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string, public readonly timeout: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private totalRequests = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private halfOpenSuccesses = 0;

  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    this.config = {
      timeout: 3000,
      errorThreshold: 50,
      volumeThreshold: 10,
      resetTimeout: 30000,
      ...config,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async fire<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitOpenError(
          `Circuit "${this.config.name}" is open`,
          this.config.name,
          this.getStats()
        );
      }
    }

    this.totalRequests++;

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError(
          `Request timed out after ${this.config.timeout}ms`,
          this.config.timeout
        ));
      }, this.config.timeout);

      fn()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenSuccesses++;
      // Require multiple successes before closing
      if (this.halfOpenSuccesses >= 3) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(error: Error): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN immediately opens circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we should trip the circuit
      if (this.shouldTrip()) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Check if circuit should trip to OPEN
   */
  private shouldTrip(): boolean {
    if (this.totalRequests < this.config.volumeThreshold) {
      return false;
    }

    const errorRate = (this.failures / this.totalRequests) * 100;
    return errorRate >= this.config.errorThreshold;
  }

  /**
   * Check if we should attempt to reset (try HALF_OPEN)
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    if (newState === CircuitState.CLOSED) {
      // Reset counters when closing
      this.failures = 0;
      this.successes = 0;
      this.totalRequests = 0;
      this.halfOpenSuccesses = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.halfOpenSuccesses = 0;
    }

    // Log state transition (can be replaced with proper logging)
    console.log(`[CircuitBreaker:${this.config.name}] ${oldState} -> ${newState}`);
  }

  /**
   * Get current circuit stats
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Manually reset the circuit (for testing/admin purposes)
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Manually open the circuit (for maintenance)
   */
  open(): void {
    this.transitionTo(CircuitState.OPEN);
  }
}

// Circuit Breaker Registry for managing multiple circuits
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private circuits: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, new CircuitBreaker({ name, ...config }));
    }
    return this.circuits.get(name)!;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.circuits.get(name);
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    this.circuits.forEach((circuit, name) => {
      stats[name] = circuit.getStats();
    });
    return stats;
  }

  resetAll(): void {
    this.circuits.forEach((circuit) => circuit.reset());
  }
}
