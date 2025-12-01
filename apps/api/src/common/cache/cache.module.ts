import { Module, Global, DynamicModule } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheConfigService } from './cache-config.service';

export interface CacheModuleOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number;
}

@Global()
@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions = {}): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        {
          provide: 'CACHE_OPTIONS',
          useValue: options,
        },
        CacheConfigService,
        CacheService,
      ],
      exports: [CacheService],
    };
  }

  static forRootAsync(optionsFactory: {
    useFactory: (...args: any[]) => Promise<CacheModuleOptions> | CacheModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        {
          provide: 'CACHE_OPTIONS',
          useFactory: optionsFactory.useFactory,
          inject: optionsFactory.inject || [],
        },
        CacheConfigService,
        CacheService,
      ],
      exports: [CacheService],
    };
  }
}
