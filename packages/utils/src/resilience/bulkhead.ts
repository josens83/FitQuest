export interface BulkheadConfig {
  maxConcurrent: number;      // Maximum concurrent executions
  maxQueue: number;           // Maximum queued requests
  timeout?: number;           // Queue timeout in ms
  name: string;               // Bulkhead name for logging
}

interface QueuedItem<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  enqueuedAt: number;
}

export class BulkheadFullError extends Error {
  constructor(
    message: string,
    public readonly bulkheadName: string,
    public readonly currentConcurrent: number,
    public readonly queueSize: number
  ) {
    super(message);
    this.name = 'BulkheadFullError';
  }
}

/**
 * Bulkhead pattern for limiting concurrent executions
 * Prevents resource exhaustion by limiting parallelism
 */
export class Bulkhead {
  private concurrent = 0;
  private queue: QueuedItem<any>[] = [];
  private readonly config: BulkheadConfig;

  constructor(config: Partial<BulkheadConfig> & { name: string }) {
    this.config = {
      maxConcurrent: 10,
      maxQueue: 100,
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Execute a function with bulkhead protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // If under limit, execute immediately
    if (this.concurrent < this.config.maxConcurrent) {
      return this.run(fn);
    }

    // If queue is full, reject
    if (this.queue.length >= this.config.maxQueue) {
      throw new BulkheadFullError(
        `Bulkhead "${this.config.name}" is full`,
        this.config.name,
        this.concurrent,
        this.queue.length
      );
    }

    // Add to queue
    return this.enqueue(fn);
  }

  /**
   * Execute function and manage concurrency
   */
  private async run<T>(fn: () => Promise<T>): Promise<T> {
    this.concurrent++;

    try {
      return await fn();
    } finally {
      this.concurrent--;
      this.processQueue();
    }
  }

  /**
   * Add to queue and return promise
   */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const item: QueuedItem<T> = {
        fn,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      };

      this.queue.push(item);

      // Set timeout if configured
      if (this.config.timeout) {
        setTimeout(() => {
          const index = this.queue.indexOf(item);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(new Error(`Bulkhead queue timeout after ${this.config.timeout}ms`));
          }
        }, this.config.timeout);
      }
    });
  }

  /**
   * Process next item in queue
   */
  private processQueue(): void {
    if (this.queue.length === 0) return;
    if (this.concurrent >= this.config.maxConcurrent) return;

    const item = this.queue.shift()!;

    // Check if timed out
    if (this.config.timeout) {
      const elapsed = Date.now() - item.enqueuedAt;
      if (elapsed > this.config.timeout) {
        item.reject(new Error(`Bulkhead queue timeout after ${elapsed}ms`));
        this.processQueue();
        return;
      }
    }

    this.run(item.fn)
      .then(item.resolve)
      .catch(item.reject);
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      name: this.config.name,
      concurrent: this.concurrent,
      maxConcurrent: this.config.maxConcurrent,
      queueSize: this.queue.length,
      maxQueue: this.config.maxQueue,
      available: this.config.maxConcurrent - this.concurrent,
    };
  }
}

// Bulkhead Registry
export class BulkheadRegistry {
  private static instance: BulkheadRegistry;
  private bulkheads: Map<string, Bulkhead> = new Map();

  private constructor() {}

  static getInstance(): BulkheadRegistry {
    if (!BulkheadRegistry.instance) {
      BulkheadRegistry.instance = new BulkheadRegistry();
    }
    return BulkheadRegistry.instance;
  }

  getOrCreate(name: string, config?: Partial<BulkheadConfig>): Bulkhead {
    if (!this.bulkheads.has(name)) {
      this.bulkheads.set(name, new Bulkhead({ name, ...config }));
    }
    return this.bulkheads.get(name)!;
  }

  getAllStats() {
    const stats: Record<string, ReturnType<Bulkhead['getStats']>> = {};
    this.bulkheads.forEach((bulkhead, name) => {
      stats[name] = bulkhead.getStats();
    });
    return stats;
  }
}
