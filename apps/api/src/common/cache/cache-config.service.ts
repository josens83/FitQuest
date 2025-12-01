import { Injectable, Inject } from '@nestjs/common';

export interface CacheOptions {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  ttl: number;
}

@Injectable()
export class CacheConfigService {
  private readonly options: CacheOptions;

  constructor(@Inject('CACHE_OPTIONS') options: Partial<CacheOptions>) {
    this.options = {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || parseInt(process.env.REDIS_PORT || '6379', 10),
      password: options.password || process.env.REDIS_PASSWORD,
      db: options.db || parseInt(process.env.REDIS_DB || '0', 10),
      keyPrefix: options.keyPrefix || 'fitquest:',
      ttl: options.ttl || 3600, // Default 1 hour
    };
  }

  get config(): CacheOptions {
    return this.options;
  }
}
