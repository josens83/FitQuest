import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { CacheConfigService } from './cache-config.service';

// In-memory fallback cache for when Redis is unavailable
class MemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>();

  set(key: string, value: any, ttl: number): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  delByPattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
  }
}

export interface CacheSetOptions {
  ttl?: number;
  tags?: string[];
}

export interface SWROptions {
  ttl: number;
  staleTime: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly memoryCache = new MemoryCache();
  private isRedisAvailable = false;
  private redis: any = null;

  // Cache TTL presets (in seconds)
  readonly TTL = {
    SHORT: 60,           // 1 minute
    MEDIUM: 300,         // 5 minutes
    LONG: 3600,          // 1 hour
    VERY_LONG: 86400,    // 24 hours
  };

  // Cache key prefixes
  readonly KEYS = {
    USER: 'user:',
    WORKOUT: 'workout:',
    WORKOUT_LIST: 'workouts:',
    SESSION: 'session:',
    LEADERBOARD: 'leaderboard:',
    ACHIEVEMENT: 'achievement:',
    CHALLENGE: 'challenge:',
    STATS: 'stats:',
  };

  constructor(private readonly configService: CacheConfigService) {}

  async onModuleInit() {
    await this.initRedis();
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  private async initRedis() {
    try {
      // Dynamic import to handle Redis availability
      const Redis = require('ioredis');
      const config = this.configService.config;

      this.redis = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
        keyPrefix: config.keyPrefix,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed, using memory cache');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
      });

      this.redis.on('connect', () => {
        this.isRedisAvailable = true;
        this.logger.log('Redis connected');
      });

      this.redis.on('error', (err: Error) => {
        this.isRedisAvailable = false;
        this.logger.error(`Redis error: ${err.message}`);
      });

      // Test connection
      await this.redis.ping();
      this.isRedisAvailable = true;
    } catch (error) {
      this.logger.warn('Redis not available, using memory cache fallback');
      this.isRedisAvailable = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      }
      return this.memoryCache.get<T>(key);
    } catch (error) {
      this.logger.error(`Cache get error: ${error}`);
      return this.memoryCache.get<T>(key);
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheSetOptions = {}): Promise<void> {
    const ttl = options.ttl || this.configService.config.ttl;

    try {
      const serialized = JSON.stringify(value);

      if (this.isRedisAvailable && this.redis) {
        await this.redis.setex(key, ttl, serialized);

        // Handle cache tags for invalidation
        if (options.tags?.length) {
          for (const tag of options.tags) {
            await this.redis.sadd(`tag:${tag}`, key);
          }
        }
      } else {
        this.memoryCache.set(key, value, ttl);
      }
    } catch (error) {
      this.logger.error(`Cache set error: ${error}`);
      this.memoryCache.set(key, value, ttl);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        await this.redis.del(key);
      }
      this.memoryCache.del(key);
    } catch (error) {
      this.logger.error(`Cache del error: ${error}`);
      this.memoryCache.del(key);
    }
  }

  /**
   * Delete by pattern (e.g., "user:*")
   */
  async delByPattern(pattern: string): Promise<number> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return keys.length;
      }
      return this.memoryCache.delByPattern(pattern);
    } catch (error) {
      this.logger.error(`Cache delByPattern error: ${error}`);
      return 0;
    }
  }

  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          await this.redis.del(`tag:${tag}`);
        }
      }
    } catch (error) {
      this.logger.error(`Cache invalidateByTag error: ${error}`);
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheSetOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Stale-While-Revalidate pattern
   */
  async swr<T>(
    key: string,
    factory: () => Promise<T>,
    options: SWROptions
  ): Promise<T> {
    const staleKey = `${key}:stale`;
    const refreshingKey = `${key}:refreshing`;

    // Check fresh cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check stale cache
    const stale = await this.get<T>(staleKey);
    if (stale !== null) {
      // Return stale data and refresh in background
      const isRefreshing = await this.get<boolean>(refreshingKey);
      if (!isRefreshing) {
        this.refreshInBackground(key, staleKey, refreshingKey, factory, options);
      }
      return stale;
    }

    // No cache, fetch fresh
    const value = await factory();
    await this.set(key, value, { ttl: options.ttl });
    await this.set(staleKey, value, { ttl: options.ttl + options.staleTime });
    return value;
  }

  private async refreshInBackground<T>(
    key: string,
    staleKey: string,
    refreshingKey: string,
    factory: () => Promise<T>,
    options: SWROptions
  ): Promise<void> {
    try {
      await this.set(refreshingKey, true, { ttl: 60 });
      const value = await factory();
      await this.set(key, value, { ttl: options.ttl });
      await this.set(staleKey, value, { ttl: options.ttl + options.staleTime });
    } catch (error) {
      this.logger.error(`Background refresh error: ${error}`);
    } finally {
      await this.del(refreshingKey);
    }
  }

  /**
   * Multi-get for batch operations
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];

    try {
      if (this.isRedisAvailable && this.redis) {
        const values = await this.redis.mget(...keys);
        return values.map((v: string | null) => (v ? JSON.parse(v) : null));
      }
      return keys.map((key) => this.memoryCache.get<T>(key));
    } catch (error) {
      this.logger.error(`Cache mget error: ${error}`);
      return keys.map((key) => this.memoryCache.get<T>(key));
    }
  }

  /**
   * Increment value (for counters)
   */
  async incr(key: string, by: number = 1): Promise<number> {
    try {
      if (this.isRedisAvailable && this.redis) {
        return await this.redis.incrby(key, by);
      }

      const current = this.memoryCache.get<number>(key) || 0;
      const newValue = current + by;
      this.memoryCache.set(key, newValue, this.TTL.LONG);
      return newValue;
    } catch (error) {
      this.logger.error(`Cache incr error: ${error}`);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.isRedisAvailable && this.redis) {
        return (await this.redis.exists(key)) === 1;
      }
      return this.memoryCache.get(key) !== null;
    } catch (error) {
      this.logger.error(`Cache exists error: ${error}`);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.keys('*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      this.memoryCache.clear();
    } catch (error) {
      this.logger.error(`Cache clear error: ${error}`);
      this.memoryCache.clear();
    }
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<{
    isRedisAvailable: boolean;
    memorySize: number;
  }> {
    return {
      isRedisAvailable: this.isRedisAvailable,
      memorySize: 0, // Would need to track this
    };
  }
}
