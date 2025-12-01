export interface FallbackConfig<T> {
  fallbackFn: () => T | Promise<T>;
  shouldFallback?: (error: Error) => boolean;
  onFallback?: (error: Error) => void;
}

export interface CacheConfig {
  ttl: number;              // Time to live in ms
  staleWhileRevalidate?: number;  // Additional time to serve stale content
  key?: string;             // Cache key
}

/**
 * Execute with fallback on failure
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  config: FallbackConfig<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const shouldFallback = config.shouldFallback?.(error as Error) ?? true;

    if (shouldFallback) {
      config.onFallback?.(error as Error);
      return config.fallbackFn();
    }

    throw error;
  }
}

/**
 * Simple in-memory cache for fallback data
 */
export class FallbackCache<T> {
  private cache: Map<string, { data: T; timestamp: number; stale?: boolean }> = new Map();

  set(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    });
  }

  get(key: string, staleTime?: number): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();

    // Fresh data
    if (now < item.timestamp) {
      return item.data;
    }

    // Stale but acceptable
    if (staleTime && now < item.timestamp + staleTime) {
      item.stale = true;
      return item.data;
    }

    // Expired
    this.cache.delete(key);
    return null;
  }

  isStale(key: string): boolean {
    const item = this.cache.get(key);
    return item?.stale ?? false;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Stale-While-Revalidate pattern
 */
export class SWRCache<T> {
  private cache: FallbackCache<T>;
  private pendingRevalidations: Map<string, Promise<T>> = new Map();

  constructor(private defaultTTL: number = 60000) {
    this.cache = new FallbackCache();
  }

  async get(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; staleTime?: number }
  ): Promise<T> {
    const ttl = options?.ttl ?? this.defaultTTL;
    const staleTime = options?.staleTime ?? ttl;

    // Check cache
    const cached = this.cache.get(key, staleTime);

    if (cached !== null) {
      // If stale, revalidate in background
      if (this.cache.isStale(key) && !this.pendingRevalidations.has(key)) {
        this.revalidateInBackground(key, fetcher, ttl);
      }
      return cached;
    }

    // No cache, fetch fresh
    return this.fetchAndCache(key, fetcher, ttl);
  }

  private async fetchAndCache(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const data = await fetcher();
    this.cache.set(key, data, ttl);
    return data;
  }

  private async revalidateInBackground(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    const revalidation = fetcher()
      .then((data) => {
        this.cache.set(key, data, ttl);
        return data;
      })
      .finally(() => {
        this.pendingRevalidations.delete(key);
      });

    this.pendingRevalidations.set(key, revalidation);
  }

  invalidate(key: string): void {
    this.cache.invalidate(key);
  }

  clear(): void {
    this.cache.clear();
    this.pendingRevalidations.clear();
  }
}

/**
 * Default/static fallback responses
 */
export const FallbackResponses = {
  // Empty list fallback
  emptyList: <T>(): T[] => [],

  // Null fallback
  nullable: <T>(): T | null => null,

  // Default value fallback
  defaultValue: <T>(value: T): () => T => () => value,

  // Cached fallback (returns last known good value)
  cached: <T>(cache: FallbackCache<T>, key: string): () => T | null =>
    () => cache.get(key),
};

/**
 * Graceful degradation decorator
 */
export function GracefulDegradation<T>(config: FallbackConfig<T>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withFallback(
        () => originalMethod.apply(this, args),
        config
      );
    };

    return descriptor;
  };
}
