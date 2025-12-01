import { Injectable, OnModuleInit } from '@nestjs/common';
import { getMetricsService } from '../metrics';

export interface RateLimitConfig {
  windowMs: number;       // Time window in milliseconds
  maxRequests: number;    // Maximum requests per window
  keyPrefix?: string;     // Prefix for rate limit keys
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  total: number;
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
  decrement(key: string): Promise<void>;
  reset(key: string): Promise<void>;
  get(key: string): Promise<{ count: number; resetAt: number } | null>;
}

/**
 * In-memory rate limit store (for development/single instance)
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.resetAt > now) {
      existing.count += 1;
      return { count: existing.count, resetAt: existing.resetAt };
    }

    const resetAt = now + windowMs;
    this.store.set(key, { count: 1, resetAt });
    return { count: 1, resetAt };
  }

  async decrement(key: string): Promise<void> {
    const existing = this.store.get(key);
    if (existing && existing.count > 0) {
      existing.count -= 1;
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async get(key: string): Promise<{ count: number; resetAt: number } | null> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.resetAt > now) {
      return existing;
    }

    return null;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/**
 * Redis-based rate limit store (for production/distributed)
 */
export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly redis: any) {}

  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const windowSec = Math.ceil(windowMs / 1000);
    const resetAt = now + windowMs;

    const pipeline = this.redis.pipeline();
    pipeline.incr(key);
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();
    const count = results[0][1] as number;

    return { count, resetAt };
  }

  async decrement(key: string): Promise<void> {
    await this.redis.decr(key);
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async get(key: string): Promise<{ count: number; resetAt: number } | null> {
    const [count, ttl] = await Promise.all([
      this.redis.get(key),
      this.redis.pttl(key),
    ]);

    if (count === null || ttl <= 0) {
      return null;
    }

    return {
      count: parseInt(count, 10),
      resetAt: Date.now() + ttl,
    };
  }
}

/**
 * Sliding window rate limiter using sorted sets (more accurate)
 */
export class SlidingWindowStore implements RateLimitStore {
  constructor(private readonly redis: any) {}

  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const member = `${now}:${Math.random().toString(36).substring(7)}`;

    const pipeline = this.redis.pipeline();
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Add new entry
    pipeline.zadd(key, now, member);
    // Count entries
    pipeline.zcard(key);
    // Set expiry
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();
    const count = results[2][1] as number;

    return {
      count,
      resetAt: now + windowMs,
    };
  }

  async decrement(key: string): Promise<void> {
    // Remove most recent entry
    await this.redis.zpopmax(key);
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async get(key: string): Promise<{ count: number; resetAt: number } | null> {
    const [count, ttl] = await Promise.all([
      this.redis.zcard(key),
      this.redis.pttl(key),
    ]);

    if (count === 0 || ttl <= 0) {
      return null;
    }

    return {
      count,
      resetAt: Date.now() + ttl,
    };
  }
}

@Injectable()
export class RateLimitService implements OnModuleInit {
  private store: RateLimitStore;
  private configs: Map<string, RateLimitConfig> = new Map();

  // Preset configurations
  static readonly PRESETS = {
    // Standard API rate limits
    API_STANDARD: { windowMs: 60000, maxRequests: 100 },      // 100 req/min
    API_BURST: { windowMs: 1000, maxRequests: 10 },           // 10 req/sec

    // Auth endpoints (stricter)
    AUTH_LOGIN: { windowMs: 900000, maxRequests: 5 },         // 5 req/15min
    AUTH_REGISTER: { windowMs: 3600000, maxRequests: 3 },     // 3 req/hour
    AUTH_PASSWORD_RESET: { windowMs: 3600000, maxRequests: 3 }, // 3 req/hour

    // Sensitive operations
    PAYMENT: { windowMs: 60000, maxRequests: 5 },             // 5 req/min
    EXPORT: { windowMs: 3600000, maxRequests: 10 },           // 10 req/hour

    // High-volume endpoints
    SEARCH: { windowMs: 60000, maxRequests: 30 },             // 30 req/min
    LIST: { windowMs: 60000, maxRequests: 60 },               // 60 req/min

    // Premium tier limits
    PREMIUM_API: { windowMs: 60000, maxRequests: 500 },       // 500 req/min
  };

  constructor() {
    // Default to memory store
    this.store = new MemoryRateLimitStore();
  }

  onModuleInit() {
    // Register default configs
    this.registerConfig('default', RateLimitService.PRESETS.API_STANDARD);
    this.registerConfig('auth:login', RateLimitService.PRESETS.AUTH_LOGIN);
    this.registerConfig('auth:register', RateLimitService.PRESETS.AUTH_REGISTER);
    this.registerConfig('auth:password-reset', RateLimitService.PRESETS.AUTH_PASSWORD_RESET);
  }

  setStore(store: RateLimitStore): void {
    this.store = store;
  }

  registerConfig(name: string, config: RateLimitConfig): void {
    this.configs.set(name, {
      keyPrefix: name,
      message: 'Too many requests, please try again later.',
      ...config,
    });
  }

  getConfig(name: string): RateLimitConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(
    identifier: string,
    configName: string = 'default',
    customConfig?: Partial<RateLimitConfig>,
  ): Promise<RateLimitResult> {
    const baseConfig = this.configs.get(configName) || RateLimitService.PRESETS.API_STANDARD;
    const config = { ...baseConfig, ...customConfig };

    const key = this.buildKey(identifier, config.keyPrefix);
    const { count, resetAt } = await this.store.increment(key, config.windowMs);

    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);

    // Track metrics
    if (!allowed) {
      const metrics = getMetricsService();
      metrics.incrementCounter('rate_limit_exceeded_total', {
        endpoint: config.keyPrefix || 'default',
      });
    }

    return {
      allowed,
      remaining,
      resetAt,
      total: config.maxRequests,
    };
  }

  /**
   * Consume a rate limit token (for successful requests only)
   */
  async consume(
    identifier: string,
    configName: string = 'default',
  ): Promise<RateLimitResult> {
    return this.checkLimit(identifier, configName);
  }

  /**
   * Revert a rate limit consumption (for failed requests)
   */
  async revert(
    identifier: string,
    configName: string = 'default',
  ): Promise<void> {
    const config = this.configs.get(configName);
    const key = this.buildKey(identifier, config?.keyPrefix);
    await this.store.decrement(key);
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(
    identifier: string,
    configName: string = 'default',
  ): Promise<void> {
    const config = this.configs.get(configName);
    const key = this.buildKey(identifier, config?.keyPrefix);
    await this.store.reset(key);
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    identifier: string,
    configName: string = 'default',
  ): Promise<RateLimitResult | null> {
    const config = this.configs.get(configName);
    if (!config) return null;

    const key = this.buildKey(identifier, config.keyPrefix);
    const result = await this.store.get(key);

    if (!result) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: Date.now() + config.windowMs,
        total: config.maxRequests,
      };
    }

    const remaining = Math.max(0, config.maxRequests - result.count);

    return {
      allowed: remaining > 0,
      remaining,
      resetAt: result.resetAt,
      total: config.maxRequests,
    };
  }

  private buildKey(identifier: string, prefix?: string): string {
    return prefix ? `ratelimit:${prefix}:${identifier}` : `ratelimit:${identifier}`;
  }
}
