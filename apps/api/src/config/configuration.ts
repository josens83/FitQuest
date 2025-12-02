import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
}

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  poolMin: number;
  poolMax: number;
}

export interface RedisConfig {
  url: string;
  host: string;
  port: number;
  password: string;
  db: number;
}

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface CorsConfig {
  origins: string[];
  credentials: boolean;
}

export interface RateLimitConfig {
  ttl: number;
  max: number;
}

export interface LoggingConfig {
  level: string;
  format: 'json' | 'pretty';
}

export interface ExternalServicesConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  openaiApiKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  sentryDsn: string;
  sendgridApiKey: string;
}

export interface FeatureFlagsConfig {
  enableAiCoach: boolean;
  enablePremiumFeatures: boolean;
  enableBetaFeatures: boolean;
  maintenanceMode: boolean;
}

export const appConfig = registerAs('app', (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || process.env.API_PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
}));

export const databaseConfig = registerAs('database', (): DatabaseConfig => {
  const url = process.env.DATABASE_URL || '';
  const parsed = parseDatabaseUrl(url);

  return {
    url,
    host: process.env.DATABASE_HOST || parsed.host || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || String(parsed.port) || '5432', 10),
    username: process.env.DATABASE_USER || parsed.username || 'fitquest',
    password: process.env.DATABASE_PASSWORD || parsed.password || '',
    database: process.env.DATABASE_NAME || parsed.database || 'fitquest',
    ssl: process.env.DATABASE_SSL === 'true',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  };
});

export const redisConfig = registerAs('redis', (): RedisConfig => ({
  url: process.env.REDIS_URL || '',
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB || '0', 10),
}));

export const jwtConfig = registerAs('jwt', (): JwtConfig => ({
  secret: process.env.JWT_SECRET || 'change-me-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-in-production-refresh',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const corsConfig = registerAs('cors', (): CorsConfig => ({
  origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()),
  credentials: process.env.CORS_CREDENTIALS !== 'false',
}));

export const rateLimitConfig = registerAs('rateLimit', (): RateLimitConfig => ({
  ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
}));

export const loggingConfig = registerAs('logging', (): LoggingConfig => ({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: (process.env.LOG_FORMAT as 'json' | 'pretty') || (process.env.NODE_ENV === 'production' ? 'json' : 'pretty'),
}));

export const externalServicesConfig = registerAs('externalServices', (): ExternalServicesConfig => ({
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  sentryDsn: process.env.SENTRY_DSN || '',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
}));

export const featureFlagsConfig = registerAs('featureFlags', (): FeatureFlagsConfig => ({
  enableAiCoach: process.env.ENABLE_AI_COACH !== 'false',
  enablePremiumFeatures: process.env.ENABLE_PREMIUM_FEATURES !== 'false',
  enableBetaFeatures: process.env.ENABLE_BETA_FEATURES === 'true',
  maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
}));

// Helper function to parse DATABASE_URL
function parseDatabaseUrl(url: string): Partial<DatabaseConfig> {
  if (!url) return {};

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 5432,
      username: parsed.username,
      password: parsed.password,
      database: parsed.pathname.slice(1).split('?')[0],
    };
  } catch {
    return {};
  }
}

// All configurations
export const configurations = [
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  corsConfig,
  rateLimitConfig,
  loggingConfig,
  externalServicesConfig,
  featureFlagsConfig,
];
