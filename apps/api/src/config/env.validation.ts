import { plainToInstance, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Min, Max, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  PORT: number = 4000;

  // Database
  @IsString()
  DATABASE_URL: string;

  @IsOptional()
  @IsString()
  DATABASE_HOST?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  DATABASE_PORT?: number;

  // Redis
  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  REDIS_PORT?: number;

  // JWT (required in production)
  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;

  // CORS
  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  // External Services (optional in dev)
  @IsOptional()
  @IsUrl()
  SUPABASE_URL?: string;

  @IsOptional()
  @IsString()
  SUPABASE_ANON_KEY?: string;

  @IsOptional()
  @IsString()
  SUPABASE_SERVICE_KEY?: string;

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsString()
  SENTRY_DSN?: string;

  // Feature Flags
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ENABLE_AI_COACH?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ENABLE_PREMIUM_FEATURES?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  MAINTENANCE_MODE?: boolean;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    const messages = errors.map((error) => {
      const constraints = error.constraints ? Object.values(error.constraints).join(', ') : 'Unknown error';
      return `${error.property}: ${constraints}`;
    });

    throw new Error(`Environment validation failed:\n${messages.join('\n')}`);
  }

  // Additional production checks
  if (validatedConfig.NODE_ENV === Environment.Production) {
    const requiredInProduction = [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
    ];

    const missing = requiredInProduction.filter((key) => !config[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
    }

    // Check for default/weak secrets
    if (validatedConfig.JWT_SECRET.includes('change-me') || validatedConfig.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters and not contain default values in production');
    }
  }

  return validatedConfig;
}
