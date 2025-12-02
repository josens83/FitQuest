import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../cache.service';
import { CacheConfigService } from '../cache-config.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CacheConfigService,
          useValue: {
            getRedisConfig: () => null, // Use memory fallback
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  describe('set and get', () => {
    it('should store and retrieve a value', async () => {
      await service.set('test-key', { data: 'test-value' });
      const result = await service.get('test-key');

      expect(result).toEqual({ data: 'test-value' });
    });

    it('should return null for non-existent keys', async () => {
      const result = await service.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should store primitive values', async () => {
      await service.set('string-key', 'hello');
      await service.set('number-key', 42);
      await service.set('boolean-key', true);

      expect(await service.get('string-key')).toBe('hello');
      expect(await service.get('number-key')).toBe(42);
      expect(await service.get('boolean-key')).toBe(true);
    });

    it('should store arrays', async () => {
      const array = [1, 2, 3, { nested: 'value' }];
      await service.set('array-key', array);

      expect(await service.get('array-key')).toEqual(array);
    });
  });

  describe('TTL handling', () => {
    it('should expire keys after TTL', async () => {
      await service.set('expiring-key', 'value', 1); // 1 second TTL

      // Should exist immediately
      expect(await service.get('expiring-key')).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be gone
      expect(await service.get('expiring-key')).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a key', async () => {
      await service.set('delete-key', 'value');
      await service.delete('delete-key');

      expect(await service.get('delete-key')).toBeNull();
    });

    it('should not throw when deleting non-existent key', async () => {
      await expect(service.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      await service.set('cached-key', 'cached-value');
      const factory = jest.fn().mockResolvedValue('factory-value');

      const result = await service.getOrSet('cached-key', factory);

      expect(result).toBe('cached-value');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const factory = jest.fn().mockResolvedValue('factory-value');

      const result = await service.getOrSet('new-key', factory);

      expect(result).toBe('factory-value');
      expect(factory).toHaveBeenCalledTimes(1);

      // Should be cached now
      const cachedResult = await service.get('new-key');
      expect(cachedResult).toBe('factory-value');
    });

    it('should apply custom TTL', async () => {
      const factory = jest.fn().mockResolvedValue('value');

      await service.getOrSet('ttl-key', factory, { ttl: 1 });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should call factory again
      await service.getOrSet('ttl-key', factory, { ttl: 1 });

      expect(factory).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteByPattern', () => {
    it('should delete keys matching pattern', async () => {
      await service.set('user:1:profile', 'profile1');
      await service.set('user:2:profile', 'profile2');
      await service.set('workout:1', 'workout1');

      await service.deleteByPattern('user:*');

      expect(await service.get('user:1:profile')).toBeNull();
      expect(await service.get('user:2:profile')).toBeNull();
      expect(await service.get('workout:1')).toBe('workout1');
    });
  });

  describe('mget', () => {
    it('should get multiple keys at once', async () => {
      await service.set('multi:1', 'value1');
      await service.set('multi:2', 'value2');
      await service.set('multi:3', 'value3');

      const results = await service.mget(['multi:1', 'multi:2', 'multi:3', 'multi:4']);

      expect(results).toEqual(['value1', 'value2', 'value3', null]);
    });
  });

  describe('swr (Stale-While-Revalidate)', () => {
    it('should return stale data while revalidating', async () => {
      const factory = jest.fn()
        .mockResolvedValueOnce('initial')
        .mockResolvedValueOnce('updated');

      // Initial fetch
      const result1 = await service.swr('swr-key', factory, {
        ttl: 2,
        staleTime: 1,
      });
      expect(result1).toBe('initial');

      // Wait until stale but not expired
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should return stale data immediately
      const result2 = await service.swr('swr-key', factory, {
        ttl: 2,
        staleTime: 1,
      });
      expect(result2).toBe('initial');

      // Wait for background refresh
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have updated value now
      const result3 = await service.get('swr-key');
      expect(result3).toBe('updated');
    });
  });

  describe('invalidateByTags', () => {
    it('should invalidate all keys with specified tags', async () => {
      await service.set('tagged:1', 'value1', 300, ['user:1', 'profile']);
      await service.set('tagged:2', 'value2', 300, ['user:1', 'settings']);
      await service.set('tagged:3', 'value3', 300, ['user:2', 'profile']);

      await service.invalidateByTags(['user:1']);

      expect(await service.get('tagged:1')).toBeNull();
      expect(await service.get('tagged:2')).toBeNull();
      expect(await service.get('tagged:3')).toBe('value3');
    });
  });
});

describe('CacheService TTL Constants', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CacheConfigService,
          useValue: {
            getRedisConfig: () => null,
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should have predefined TTL constants', () => {
    expect(service.TTL.SHORT).toBe(60);
    expect(service.TTL.MEDIUM).toBe(300);
    expect(service.TTL.LONG).toBe(3600);
    expect(service.TTL.VERY_LONG).toBe(86400);
  });
});
