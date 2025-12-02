import { Test, TestingModule } from '@nestjs/testing';
import {
  RateLimitService,
  MemoryRateLimitStore,
  RateLimitStore,
} from '../rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitService],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
    service.onModuleInit();
  });

  afterEach(() => {
    // Reset any registered configs
  });

  describe('checkLimit', () => {
    it('should allow requests under the limit', async () => {
      const result = await service.checkLimit('user:123', 'default');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should decrement remaining count on each request', async () => {
      const result1 = await service.checkLimit('user:456', 'default');
      const result2 = await service.checkLimit('user:456', 'default');

      expect(result2.remaining).toBe(result1.remaining - 1);
    });

    it('should block requests over the limit', async () => {
      // Register a very restrictive config
      service.registerConfig('restrictive', {
        windowMs: 60000,
        maxRequests: 2,
      });

      await service.checkLimit('user:789', 'restrictive');
      await service.checkLimit('user:789', 'restrictive');
      const result = await service.checkLimit('user:789', 'restrictive');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should use default config when config not found', async () => {
      const result = await service.checkLimit('user:test', 'nonexistent');

      expect(result).toBeDefined();
      expect(result.total).toBe(100); // Default API_STANDARD
    });
  });

  describe('registerConfig', () => {
    it('should register custom rate limit config', () => {
      service.registerConfig('custom', {
        windowMs: 30000,
        maxRequests: 50,
      });

      const config = service.getConfig('custom');

      expect(config).toBeDefined();
      expect(config?.maxRequests).toBe(50);
      expect(config?.windowMs).toBe(30000);
    });

    it('should override existing config', () => {
      service.registerConfig('test', { windowMs: 1000, maxRequests: 10 });
      service.registerConfig('test', { windowMs: 2000, maxRequests: 20 });

      const config = service.getConfig('test');

      expect(config?.maxRequests).toBe(20);
    });
  });

  describe('reset', () => {
    it('should reset rate limit for identifier', async () => {
      service.registerConfig('reset-test', {
        windowMs: 60000,
        maxRequests: 2,
      });

      await service.checkLimit('user:reset', 'reset-test');
      await service.checkLimit('user:reset', 'reset-test');

      // Should be at limit now
      let status = await service.getStatus('user:reset', 'reset-test');
      expect(status?.remaining).toBe(0);

      // Reset
      await service.reset('user:reset', 'reset-test');

      // Should have full quota again
      status = await service.getStatus('user:reset', 'reset-test');
      expect(status?.remaining).toBe(2);
    });
  });

  describe('getStatus', () => {
    it('should return current rate limit status', async () => {
      await service.checkLimit('user:status', 'default');

      const status = await service.getStatus('user:status', 'default');

      expect(status).toBeDefined();
      expect(status?.allowed).toBe(true);
      expect(status?.total).toBe(100);
    });

    it('should return full quota for new identifiers', async () => {
      const status = await service.getStatus('user:new', 'default');

      expect(status?.remaining).toBe(100);
      expect(status?.allowed).toBe(true);
    });
  });

  describe('customConfig override', () => {
    it('should allow custom config override', async () => {
      const result = await service.checkLimit('user:custom', 'default', {
        maxRequests: 5,
      });

      expect(result.total).toBe(5);
    });
  });
});

describe('MemoryRateLimitStore', () => {
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore();
  });

  afterEach(() => {
    store.destroy();
  });

  describe('increment', () => {
    it('should start count at 1 for new keys', async () => {
      const result = await store.increment('test-key', 60000);

      expect(result.count).toBe(1);
    });

    it('should increment existing keys', async () => {
      await store.increment('test-key', 60000);
      const result = await store.increment('test-key', 60000);

      expect(result.count).toBe(2);
    });

    it('should reset count after window expires', async () => {
      await store.increment('expiring-key', 50);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await store.increment('expiring-key', 50);

      expect(result.count).toBe(1);
    });
  });

  describe('decrement', () => {
    it('should decrement count', async () => {
      await store.increment('dec-key', 60000);
      await store.increment('dec-key', 60000);
      await store.decrement('dec-key');

      const result = await store.get('dec-key');

      expect(result?.count).toBe(1);
    });

    it('should not go below zero', async () => {
      await store.increment('zero-key', 60000);
      await store.decrement('zero-key');
      await store.decrement('zero-key');

      const result = await store.get('zero-key');

      expect(result?.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('reset', () => {
    it('should remove key from store', async () => {
      await store.increment('reset-key', 60000);
      await store.reset('reset-key');

      const result = await store.get('reset-key');

      expect(result).toBeNull();
    });
  });

  describe('get', () => {
    it('should return null for non-existent keys', async () => {
      const result = await store.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for expired keys', async () => {
      await store.increment('expired-key', 50);

      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await store.get('expired-key');

      expect(result).toBeNull();
    });
  });
});
