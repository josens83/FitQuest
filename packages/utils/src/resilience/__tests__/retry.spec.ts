import {
  retryWithBackoff,
  RetryConfig,
  isRetryableError,
  createRetryableError,
} from '../retry';

describe('retryWithBackoff', () => {
  const defaultConfig: Partial<RetryConfig> = {
    maxRetries: 3,
    baseDelay: 10,
    maxDelay: 100,
    backoffMultiplier: 2,
  };

  describe('successful operations', () => {
    it('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn, defaultConfig);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should succeed after retries', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(fn, defaultConfig);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('failed operations', () => {
    it('should throw after max retries exceeded', async () => {
      const error = new Error('persistent failure');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(
        retryWithBackoff(fn, defaultConfig)
      ).rejects.toThrow('persistent failure');

      // 1 initial + 3 retries = 4 calls
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('should not retry non-retryable errors', async () => {
      const error = new Error('non-retryable');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(
        retryWithBackoff(fn, {
          ...defaultConfig,
          retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT'],
        })
      ).rejects.toThrow('non-retryable');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry retryable errors', async () => {
      const error = new Error('ECONNREFUSED');
      error.name = 'ECONNREFUSED';
      const fn = jest.fn().mockRejectedValue(error);

      await expect(
        retryWithBackoff(fn, {
          ...defaultConfig,
          retryableErrors: ['ECONNREFUSED'],
        })
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  describe('backoff timing', () => {
    it('should apply exponential backoff', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const startTime = Date.now();

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 2,
          baseDelay: 50,
          maxDelay: 1000,
          backoffMultiplier: 2,
        })
      ).rejects.toThrow();

      const elapsed = Date.now() - startTime;

      // Expected delays: 50ms, 100ms = ~150ms minimum
      expect(elapsed).toBeGreaterThanOrEqual(140);
    });

    it('should respect maxDelay', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const startTime = Date.now();

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 3,
          baseDelay: 100,
          maxDelay: 50, // Lower than base, should cap
          backoffMultiplier: 10,
        })
      ).rejects.toThrow();

      const elapsed = Date.now() - startTime;

      // Should be capped at 50ms per retry
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('onRetry callback', () => {
    it('should call onRetry for each retry attempt', async () => {
      const onRetry = jest.fn();
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      await retryWithBackoff(fn, {
        ...defaultConfig,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1);
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2);
    });
  });
});

describe('isRetryableError', () => {
  it('should return true for network errors', () => {
    const error = new Error('ECONNREFUSED');
    error.name = 'ECONNREFUSED';

    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for timeout errors', () => {
    const error = new Error('ETIMEDOUT');
    error.name = 'ETIMEDOUT';

    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for 5xx status codes', () => {
    const error = new Error('Server Error') as any;
    error.status = 503;

    expect(isRetryableError(error)).toBe(true);
  });

  it('should return false for 4xx status codes', () => {
    const error = new Error('Not Found') as any;
    error.status = 404;

    expect(isRetryableError(error)).toBe(false);
  });

  it('should return false for validation errors', () => {
    const error = new Error('ValidationError');
    error.name = 'ValidationError';

    expect(isRetryableError(error)).toBe(false);
  });
});

describe('createRetryableError', () => {
  it('should create error with retryable flag', () => {
    const error = createRetryableError('Temporary failure', true);

    expect(error.message).toBe('Temporary failure');
    expect((error as any).retryable).toBe(true);
  });

  it('should create non-retryable error', () => {
    const error = createRetryableError('Permanent failure', false);

    expect(error.message).toBe('Permanent failure');
    expect((error as any).retryable).toBe(false);
  });
});
