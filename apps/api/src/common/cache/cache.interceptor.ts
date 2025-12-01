import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  CACHE_TAGS_METADATA,
  CACHE_INVALIDATE_METADATA,
  parseCacheKey,
  CacheInvalidateOptions,
} from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const handler = context.getHandler();

    // Check for cache invalidation
    const invalidateOptions = this.reflector.get<CacheInvalidateOptions>(
      CACHE_INVALIDATE_METADATA,
      handler,
    );

    if (invalidateOptions) {
      return next.handle().pipe(
        tap(async () => {
          await this.handleInvalidation(context, invalidateOptions);
        }),
      );
    }

    // Check for cacheable
    const keyTemplate = this.reflector.get<string>(CACHE_KEY_METADATA, handler);
    if (!keyTemplate) {
      return next.handle();
    }

    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, handler) || 300;
    const tags = this.reflector.get<string[]>(CACHE_TAGS_METADATA, handler) || [];

    // Build cache key from request parameters
    const request = context.switchToHttp().getRequest();
    const params = {
      ...request.params,
      ...request.query,
      userId: request.user?.id,
    };

    let cacheKey: string;
    try {
      cacheKey = parseCacheKey(keyTemplate, params);
    } catch (error) {
      // If key parsing fails, skip caching
      return next.handle();
    }

    // Check cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached !== null) {
      return of(cached);
    }

    // Execute handler and cache result
    return next.handle().pipe(
      tap(async (data) => {
        if (data !== null && data !== undefined) {
          await this.cacheService.set(cacheKey, data, { ttl, tags });
        }
      }),
    );
  }

  private async handleInvalidation(
    context: ExecutionContext,
    options: CacheInvalidateOptions,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const params = {
      ...request.params,
      ...request.query,
      userId: request.user?.id,
    };

    // Invalidate by specific key
    if (options.key) {
      try {
        const key = parseCacheKey(options.key, params);
        await this.cacheService.del(key);
      } catch (error) {
        // Ignore key parsing errors
      }
    }

    // Invalidate by pattern
    if (options.pattern) {
      try {
        const pattern = parseCacheKey(options.pattern, params);
        await this.cacheService.delByPattern(pattern);
      } catch (error) {
        // Ignore pattern parsing errors
      }
    }

    // Invalidate by tags
    if (options.tags?.length) {
      for (const tag of options.tags) {
        await this.cacheService.invalidateByTag(tag);
      }
    }
  }
}
