import {
  CircuitBreaker,
  CircuitBreakerConfig,
  CircuitState,
  CircuitBreakerRegistry,
} from './circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  const defaultConfig: CircuitBreakerConfig = {
    timeout: 1000,
    errorThreshold: 50,
    volumeThreshold: 5,
    resetTimeout: 1000,
  };

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-circuit', defaultConfig);
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should have zero failure count initially', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });

  describe('successful operations', () => {
    it('should execute function and return result on success', async () => {
      const result = await circuitBreaker.fire(async () => 'success');
      expect(result).toBe('success');
    });

    it('should increment success count', async () => {
      await circuitBreaker.fire(async () => 'success');
      await circuitBreaker.fire(async () => 'success');

      const stats = circuitBreaker.getStats();
      expect(stats.successes).toBe(2);
    });

    it('should remain in CLOSED state after successful operations', async () => {
      for (let i = 0; i < 10; i++) {
        await circuitBreaker.fire(async () => 'success');
      }
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('failed operations', () => {
    it('should throw error and increment failure count', async () => {
      const error = new Error('Test error');

      await expect(
        circuitBreaker.fire(async () => { throw error; })
      ).rejects.toThrow('Test error');

      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(1);
    });

    it('should transition to OPEN state after reaching error threshold', async () => {
      // Need to meet volume threshold first (5 requests)
      // With 50% error threshold, need 3 failures out of 5
      const failingFn = async () => { throw new Error('fail'); };
      const succeedingFn = async () => 'success';

      // 2 successes, 3 failures = 60% error rate > 50% threshold
      await circuitBreaker.fire(succeedingFn);
      await circuitBreaker.fire(succeedingFn);

      try { await circuitBreaker.fire(failingFn); } catch {}
      try { await circuitBreaker.fire(failingFn); } catch {}
      try { await circuitBreaker.fire(failingFn); } catch {}

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('OPEN state behavior', () => {
    beforeEach(async () => {
      // Force circuit to OPEN state
      const failingFn = async () => { throw new Error('fail'); };

      for (let i = 0; i < 5; i++) {
        try { await circuitBreaker.fire(failingFn); } catch {}
      }
    });

    it('should reject calls immediately when OPEN', async () => {
      await expect(
        circuitBreaker.fire(async () => 'success')
      ).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Next call should be allowed (HALF_OPEN)
      const result = await circuitBreaker.fire(async () => 'success');
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('HALF_OPEN state behavior', () => {
    beforeEach(async () => {
      // Force circuit to OPEN, then wait for HALF_OPEN
      const failingFn = async () => { throw new Error('fail'); };

      for (let i = 0; i < 5; i++) {
        try { await circuitBreaker.fire(failingFn); } catch {}
      }

      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    it('should transition to CLOSED on success in HALF_OPEN', async () => {
      await circuitBreaker.fire(async () => 'success');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition back to OPEN on failure in HALF_OPEN', async () => {
      try {
        await circuitBreaker.fire(async () => { throw new Error('fail'); });
      } catch {}

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('timeout handling', () => {
    it('should timeout slow operations', async () => {
      const slowFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return 'slow';
      };

      await expect(circuitBreaker.fire(slowFn)).rejects.toThrow('timeout');
    }, 5000);
  });

  describe('reset functionality', () => {
    it('should reset all stats and return to CLOSED state', async () => {
      // Create some failures
      const failingFn = async () => { throw new Error('fail'); };
      for (let i = 0; i < 3; i++) {
        try { await circuitBreaker.fire(failingFn); } catch {}
      }

      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });
});

describe('CircuitBreakerRegistry', () => {
  let registry: CircuitBreakerRegistry;

  beforeEach(() => {
    registry = new CircuitBreakerRegistry();
  });

  it('should create and return circuit breaker', () => {
    const cb = registry.getCircuitBreaker('test', { timeout: 1000 });
    expect(cb).toBeInstanceOf(CircuitBreaker);
  });

  it('should return same instance for same name', () => {
    const cb1 = registry.getCircuitBreaker('test', { timeout: 1000 });
    const cb2 = registry.getCircuitBreaker('test', { timeout: 2000 });
    expect(cb1).toBe(cb2);
  });

  it('should return different instances for different names', () => {
    const cb1 = registry.getCircuitBreaker('test1', { timeout: 1000 });
    const cb2 = registry.getCircuitBreaker('test2', { timeout: 1000 });
    expect(cb1).not.toBe(cb2);
  });

  it('should remove circuit breaker', () => {
    const cb1 = registry.getCircuitBreaker('test', { timeout: 1000 });
    registry.removeCircuitBreaker('test');
    const cb2 = registry.getCircuitBreaker('test', { timeout: 1000 });
    expect(cb1).not.toBe(cb2);
  });

  it('should get all circuit breakers', () => {
    registry.getCircuitBreaker('test1', { timeout: 1000 });
    registry.getCircuitBreaker('test2', { timeout: 1000 });

    const all = registry.getAll();
    expect(all.size).toBe(2);
  });
});
