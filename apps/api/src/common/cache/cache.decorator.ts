import { SetMetadata } from '@nestjs/common';

// Metadata keys
export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const CACHE_TAGS_METADATA = 'cache:tags';

/**
 * Decorator to cache method results
 * Usage:
 * @Cacheable({ key: 'users:{userId}', ttl: 300 })
 * async getUser(userId: string) { ... }
 */
export interface CacheableOptions {
  key: string;
  ttl?: number;
  tags?: string[];
}

export const Cacheable = (options: CacheableOptions): MethodDecorator => {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, options.key)(target, propertyKey, descriptor);
    if (options.ttl) {
      SetMetadata(CACHE_TTL_METADATA, options.ttl)(target, propertyKey, descriptor);
    }
    if (options.tags) {
      SetMetadata(CACHE_TAGS_METADATA, options.tags)(target, propertyKey, descriptor);
    }
    return descriptor;
  };
};

/**
 * Decorator to invalidate cache on method execution
 * Usage:
 * @CacheInvalidate({ key: 'users:{userId}' })
 * async updateUser(userId: string) { ... }
 */
export interface CacheInvalidateOptions {
  key?: string;
  pattern?: string;
  tags?: string[];
}

export const CACHE_INVALIDATE_METADATA = 'cache:invalidate';

export const CacheInvalidate = (options: CacheInvalidateOptions): MethodDecorator => {
  return SetMetadata(CACHE_INVALIDATE_METADATA, options);
};

/**
 * Parse cache key template with parameters
 * e.g., 'users:{userId}' with { userId: '123' } => 'users:123'
 */
export function parseCacheKey(template: string, params: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing cache key parameter: ${key}`);
    }
    return String(value);
  });
}

/**
 * Generate cache key from method arguments
 */
export function generateCacheKey(
  prefix: string,
  methodName: string,
  args: any[]
): string {
  const argsHash = args.length > 0
    ? ':' + JSON.stringify(args).replace(/[{}"\s]/g, '').substring(0, 64)
    : '';
  return `${prefix}:${methodName}${argsHash}`;
}
