export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors?: string[];
  retryCondition?: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

// Common retryable error types
const DEFAULT_RETRYABLE_ERRORS = [
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'NetworkError',
  'TimeoutError',
  'ServiceUnavailableError',
];

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);

  // Cap at maxDelay
  delay = Math.min(delay, config.maxDelay);

  // Add jitter to prevent thundering herd
  if (config.jitter) {
    // Add random jitter between 0-25% of delay
    const jitterRange = delay * 0.25;
    delay += Math.random() * jitterRange;
  }

  return Math.floor(delay);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error, config: RetryConfig): boolean {
  // Custom retry condition takes precedence
  if (config.retryCondition) {
    return config.retryCondition(error);
  }

  const retryableErrors = config.retryableErrors || DEFAULT_RETRYABLE_ERRORS;

  // Check error name
  if (retryableErrors.includes(error.name)) {
    return true;
  }

  // Check error code (for Node.js errors)
  const errorWithCode = error as Error & { code?: string };
  if (errorWithCode.code && retryableErrors.includes(errorWithCode.code)) {
    return true;
  }

  // Check HTTP status codes for HTTP errors
  const httpError = error as Error & { status?: number; statusCode?: number };
  const statusCode = httpError.status || httpError.statusCode;
  if (statusCode) {
    // Retry on 5xx errors (except 501 Not Implemented)
    if (statusCode >= 500 && statusCode !== 501) {
      return true;
    }
    // Retry on 429 Too Many Requests
    if (statusCode === 429) {
      return true;
    }
  }

  return false;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error = new Error('Unknown error');
  const startTime = Date.now();

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if not retryable
      if (!isRetryableError(lastError, fullConfig)) {
        throw lastError;
      }

      // Don't retry if we've exhausted all attempts
      if (attempt >= fullConfig.maxRetries) {
        break;
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, fullConfig);

      // Call onRetry callback if provided
      if (fullConfig.onRetry) {
        fullConfig.onRetry(lastError, attempt + 1, delay);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries exhausted
  const totalTime = Date.now() - startTime;
  const enrichedError = new RetryExhaustedError(
    `All ${fullConfig.maxRetries} retries exhausted after ${totalTime}ms`,
    lastError,
    fullConfig.maxRetries,
    totalTime
  );

  throw enrichedError;
}

/**
 * Retry with detailed result (doesn't throw on exhaustion)
 */
export async function retryWithResult<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;
  const startTime = Date.now();
  let attempts = 0;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    attempts++;
    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error as Error;

      if (!isRetryableError(lastError, fullConfig)) {
        return {
          success: false,
          error: lastError,
          attempts,
          totalTime: Date.now() - startTime,
        };
      }

      if (attempt < fullConfig.maxRetries) {
        const delay = calculateDelay(attempt, fullConfig);
        if (fullConfig.onRetry) {
          fullConfig.onRetry(lastError, attempt + 1, delay);
        }
        await sleep(delay);
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Error thrown when all retries are exhausted
 */
export class RetryExhaustedError extends Error {
  constructor(
    message: string,
    public readonly lastError: Error,
    public readonly attempts: number,
    public readonly totalTime: number
  ) {
    super(message);
    this.name = 'RetryExhaustedError';

    // Preserve the original error's stack
    if (lastError.stack) {
      this.stack = `${this.stack}\n\nCaused by:\n${lastError.stack}`;
    }
  }
}

/**
 * Decorator for retry functionality (for class methods)
 */
export function Retry(config: Partial<RetryConfig> = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retryWithBackoff(
        () => originalMethod.apply(this, args),
        config
      );
    };

    return descriptor;
  };
}

/**
 * Create a retry-wrapped version of a function
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  return (async (...args: Parameters<T>) => {
    return retryWithBackoff(() => fn(...args), config);
  }) as T;
}
