# FitQuest 프로덕션 레디 고도화 계획 v2.0

> **벤치마킹 대상**: Netflix (스트리밍/개인화), Spotify (오프라인/동기화), Keep (피트니스), Peloton (운동 콘텐츠), Strava (소셜/게이미피케이션)

## 📊 현재 상태 분석

### ✅ 완료된 항목 (Phase 1: 코어 기능)
- 기본 기능 구현 (운동, 세션, 게이미피케이션)
- Happy Path 동작
- 기본 UI/UX

### ❌ 미완료 항목 (바이브 코딩 한계)
- 에러 처리 및 복원력
- 성능 최적화
- 모니터링/관찰가능성
- 보안 강화
- 확장성 설계
- 운영 준비
- 테스팅
- 문서화

---

## 🎯 Phase 2: 에러 처리 및 복원력 (Netflix 수준)

### 2.1 Circuit Breaker 패턴 구현

```typescript
// packages/utils/src/resilience/circuit-breaker.ts
interface CircuitBreakerConfig {
  timeout: number;           // 요청 타임아웃 (ms)
  errorThreshold: number;    // 에러 임계값 (%)
  volumeThreshold: number;   // 최소 요청 수
  resetTimeout: number;      // 리셋 대기 시간 (ms)
}

class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;

  async fire<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime! > this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitOpenError('Circuit is open');
      }
    }

    try {
      const result = await this.withTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### 2.2 재시도 로직 (Exponential Backoff)

```typescript
// packages/utils/src/resilience/retry.ts
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error, config.retryableErrors)) {
        throw error;
      }

      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );
        await sleep(delay + Math.random() * 100); // Jitter
      }
    }
  }

  throw lastError!;
}
```

### 2.3 Graceful Degradation

```typescript
// apps/api/src/common/fallback.service.ts
@Injectable()
export class FallbackService {
  // AI Coach 장애 시 정적 응답
  getCoachFallback(context: string): CoachResponse {
    const fallbackResponses = {
      workout: '오늘도 운동하러 오셨군요! 추천 운동을 확인해보세요.',
      motivation: '꾸준함이 결과를 만듭니다. 오늘도 화이팅!',
      default: '잠시 후 다시 시도해주세요.'
    };
    return { message: fallbackResponses[context] || fallbackResponses.default };
  }

  // 외부 서비스 장애 시 캐시된 데이터 반환
  async getWithFallback<T>(
    primaryFn: () => Promise<T>,
    fallbackFn: () => Promise<T>,
    cacheKey: string
  ): Promise<T> {
    try {
      const result = await primaryFn();
      await this.cache.set(cacheKey, result, 3600);
      return result;
    } catch {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;
      return fallbackFn();
    }
  }
}
```

### 2.4 에러 바운더리 (모든 레벨)

```typescript
// apps/web/src/components/error-boundaries/
// GlobalErrorBoundary.tsx - 앱 전체
// RouteErrorBoundary.tsx - 라우트별
// ComponentErrorBoundary.tsx - 컴포넌트별
// AsyncErrorBoundary.tsx - 비동기 작업

// apps/mobile/src/components/ErrorBoundary.tsx
class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sentry로 에러 전송
    Sentry.captureException(error, {
      extra: errorInfo,
      tags: { boundary: this.props.name }
    });

    // 분석 이벤트
    analytics.track('error_boundary_caught', {
      error: error.message,
      component: this.props.name
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallbackUI error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

## 🚀 Phase 3: 성능 최적화 (Google/Instagram 수준)

### 3.1 Core Web Vitals 최적화

| 지표 | 현재 (추정) | 목표 | 벤치마크 (Keep) |
|------|------------|------|----------------|
| LCP | 3.5s | < 2.5s | 2.1s |
| FID | 150ms | < 100ms | 80ms |
| CLS | 0.15 | < 0.1 | 0.05 |
| TTI | 5s | < 3.8s | 3.2s |

### 3.2 번들 최적화

```typescript
// apps/web/next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@fitquest/ui', 'lucide-react'],
  },

  webpack: (config) => {
    // Tree shaking 강화
    config.optimization.usedExports = true;

    // 청크 분할 전략
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        framework: {
          name: 'framework',
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          priority: 40,
          chunks: 'all',
        },
        lib: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
            return `npm.${match[1].replace('@', '')}`;
          },
          priority: 30,
          minChunks: 1,
          reuseExistingChunk: true,
        },
      },
    };

    return config;
  },
};
```

### 3.3 이미지 최적화

```typescript
// packages/utils/src/media/image-optimizer.ts
interface ImageOptimizationConfig {
  formats: ('webp' | 'avif' | 'jpeg')[];
  sizes: number[];
  quality: number;
  placeholder: 'blur' | 'empty' | 'color';
}

// Cloudflare Images 또는 Imgix 통합
const getOptimizedImageUrl = (
  src: string,
  width: number,
  format: string = 'webp'
): string => {
  return `${CDN_URL}/cdn-cgi/image/width=${width},format=${format},quality=80/${src}`;
};

// 반응형 이미지 컴포넌트
const OptimizedImage: FC<ImageProps> = ({ src, alt, priority }) => (
  <picture>
    <source
      type="image/avif"
      srcSet={generateSrcSet(src, 'avif')}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
    <source
      type="image/webp"
      srcSet={generateSrcSet(src, 'webp')}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
    <img
      src={getOptimizedImageUrl(src, 800)}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchpriority={priority ? 'high' : 'auto'}
    />
  </picture>
);
```

### 3.4 가상 스크롤링 (운동 목록)

```typescript
// apps/web/src/components/workouts/VirtualWorkoutList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualWorkoutList: FC<Props> = ({ workouts }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: workouts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280,
    overscan: 5,
  });

  // 무한 스크롤 + 가상화
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView]);

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <WorkoutCard
            key={workouts[virtualRow.index].id}
            workout={workouts[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
        <div ref={loadMoreRef} />
      </div>
    </div>
  );
};
```

### 3.5 데이터베이스 쿼리 최적화

```sql
-- 인덱스 추가
CREATE INDEX CONCURRENTLY idx_workouts_category_difficulty
  ON workouts(category, difficulty) WHERE is_published = true;

CREATE INDEX CONCURRENTLY idx_sessions_user_status
  ON workout_sessions(user_id, status, started_at DESC);

CREATE INDEX CONCURRENTLY idx_achievements_user_unlocked
  ON user_achievements(user_id, unlocked_at) WHERE unlocked_at IS NOT NULL;

-- 파티셔닝 (activity_feed)
CREATE TABLE activity_feed_partitioned (
  LIKE activity_feed INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE activity_feed_2024_q4 PARTITION OF activity_feed_partitioned
  FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
```

### 3.6 캐싱 전략

```typescript
// apps/api/src/common/cache/cache.strategy.ts
@Injectable()
export class CacheStrategy {
  // 캐시 레이어 구조
  // L1: 메모리 (node-cache) - 1초
  // L2: Redis - 분/시간 단위
  // L3: CDN - 정적 컨텐츠

  private readonly cacheTTL = {
    workoutList: 300,        // 5분
    workoutDetail: 3600,     // 1시간
    leaderboard: 60,         // 1분
    userProfile: 300,        // 5분
    achievements: 3600,      // 1시간
    staticContent: 86400,    // 24시간
  };

  // Stale-While-Revalidate 패턴
  async getWithSWR<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { staleTime: number; maxAge: number }
  ): Promise<T> {
    const cached = await this.get(key);

    if (cached) {
      if (!this.isStale(cached, options.staleTime)) {
        return cached.data;
      }
      // 백그라운드 리프레시
      this.refreshInBackground(key, fetcher, options.maxAge);
      return cached.data;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, options.maxAge);
    return fresh;
  }
}
```

---

## 📊 Phase 4: 모니터링 및 관찰가능성 (Uber/Datadog 수준)

### 4.1 APM 통합

```typescript
// apps/api/src/common/monitoring/apm.service.ts
import * as dd from 'dd-trace';

dd.init({
  service: 'fitquest-api',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION,
  logInjection: true,
  runtimeMetrics: true,
  profiling: true,
});

@Injectable()
export class APMService {
  // 모든 API 호출 추적
  @Trace('api.request')
  async trackRequest(req: Request, handler: () => Promise<any>) {
    const span = dd.scope().active();

    span?.setTag('http.method', req.method);
    span?.setTag('http.url', req.url);
    span?.setTag('user.id', req.user?.id);

    const start = Date.now();

    try {
      const result = await handler();
      span?.setTag('http.status_code', result.statusCode);
      return result;
    } catch (error) {
      span?.setTag('error', true);
      span?.setTag('error.message', error.message);
      throw error;
    } finally {
      this.metrics.histogram('api.latency', Date.now() - start, {
        endpoint: req.path,
        method: req.method,
      });
    }
  }
}
```

### 4.2 에러 추적 (Sentry)

```typescript
// apps/api/src/common/monitoring/error-tracking.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,

  // 성능 모니터링
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.1,

  // 에러 필터링
  beforeSend(event, hint) {
    // 무시할 에러
    if (isExpectedError(hint.originalException)) {
      return null;
    }

    // PII 제거
    event = removePII(event);

    return event;
  },

  // 컨텍스트 추가
  initialScope: {
    tags: { service: 'fitquest-api' },
  },
});

// 에러 심각도 분류
function classifyError(error: Error): Sentry.Severity {
  if (error instanceof DatabaseError) return 'fatal';
  if (error instanceof PaymentError) return 'error';
  if (error instanceof ValidationError) return 'warning';
  return 'error';
}
```

### 4.3 비즈니스 메트릭 대시보드

```typescript
// apps/api/src/common/monitoring/business-metrics.ts
@Injectable()
export class BusinessMetrics {
  private readonly metrics = new StatsD({
    host: process.env.STATSD_HOST,
    prefix: 'fitquest.',
  });

  // 운동 관련 메트릭
  trackWorkoutCompleted(session: WorkoutSession) {
    this.metrics.increment('workout.completed');
    this.metrics.histogram('workout.duration', session.actualDuration);
    this.metrics.histogram('workout.calories', session.caloriesBurned);
    this.metrics.increment('workout.by_category', 1, { category: session.category });
  }

  // 게이미피케이션 메트릭
  trackXPEarned(userId: string, amount: number, source: string) {
    this.metrics.increment('xp.earned', amount);
    this.metrics.increment('xp.by_source', amount, { source });
  }

  // 구독 메트릭
  trackSubscription(event: string, plan: string, amount: number) {
    this.metrics.increment(`subscription.${event}`, 1, { plan });
    if (event === 'created' || event === 'renewed') {
      this.metrics.increment('revenue.mrr', amount);
    }
  }

  // 리텐션 메트릭
  trackDAU(userId: string) {
    this.metrics.set('users.dau', userId);
  }

  trackMAU(userId: string) {
    this.metrics.set('users.mau', userId);
  }
}
```

### 4.4 실시간 알림 규칙

```yaml
# monitoring/alerts/critical.yaml
alerts:
  - name: high_error_rate
    condition: rate(http_errors_total[5m]) > 0.05
    severity: critical
    channels: [slack, pagerduty]
    message: "에러율이 5%를 초과했습니다"

  - name: api_latency_high
    condition: histogram_quantile(0.95, api_latency_seconds) > 2
    severity: warning
    channels: [slack]
    message: "API P95 응답시간이 2초를 초과했습니다"

  - name: database_connections_high
    condition: pg_stat_activity_count > 80
    severity: warning
    channels: [slack]
    message: "DB 커넥션이 80%를 초과했습니다"

  - name: payment_failure_spike
    condition: increase(payment_failures_total[10m]) > 10
    severity: critical
    channels: [slack, pagerduty, email]
    message: "결제 실패가 급증했습니다"

  - name: memory_usage_high
    condition: node_memory_usage_percent > 85
    severity: warning
    channels: [slack]
    message: "메모리 사용량이 85%를 초과했습니다"
```

---

## 🔒 Phase 5: 보안 강화 (은행/결제 시스템 수준)

### 5.1 OWASP Top 10 대응

```typescript
// apps/api/src/common/security/security.middleware.ts
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. SQL Injection 방어 (Prisma가 기본 제공)
    // 2. XSS 방어
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 3. CSRF 방어
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      this.validateCSRFToken(req);
    }

    // 4. 클릭재킹 방어
    res.setHeader('X-Frame-Options', 'DENY');

    // 5. CSP
    res.setHeader('Content-Security-Policy', this.getCSP());

    // 6. HSTS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    next();
  }

  private getCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.trusted.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' wss: https://api.fitquest.com",
      "frame-ancestors 'none'",
    ].join('; ');
  }
}
```

### 5.2 Rate Limiting (다층 구조)

```typescript
// apps/api/src/common/security/rate-limiter.ts
@Injectable()
export class RateLimiter {
  private readonly limits = {
    // IP 기반 (DDoS 방어)
    ip: {
      windowMs: 60000,  // 1분
      max: 100,         // 100 요청
    },
    // 사용자 기반
    user: {
      windowMs: 60000,
      max: 60,
    },
    // 엔드포인트별 (민감한 작업)
    endpoints: {
      '/auth/login': { windowMs: 300000, max: 5 },      // 5분에 5회
      '/auth/register': { windowMs: 3600000, max: 3 },  // 1시간에 3회
      '/subscription/subscribe': { windowMs: 60000, max: 3 },
      '/coach/chat': { windowMs: 60000, max: 20 },
    },
  };

  async checkLimit(req: Request): Promise<RateLimitResult> {
    const ipResult = await this.checkIPLimit(req.ip);
    if (!ipResult.allowed) return ipResult;

    if (req.user) {
      const userResult = await this.checkUserLimit(req.user.id);
      if (!userResult.allowed) return userResult;
    }

    const endpointLimit = this.limits.endpoints[req.path];
    if (endpointLimit) {
      return this.checkEndpointLimit(req, endpointLimit);
    }

    return { allowed: true };
  }
}
```

### 5.3 감사 로그

```typescript
// apps/api/src/common/security/audit-log.service.ts
@Injectable()
export class AuditLogService {
  // 모든 중요 작업 기록
  async log(event: AuditEvent) {
    const log = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      eventType: event.type,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      resource: event.resource,
      action: event.action,
      oldValue: event.oldValue ? this.hash(event.oldValue) : null,
      newValue: event.newValue ? this.hash(event.newValue) : null,
      metadata: event.metadata,
      // 변조 방지용 해시
      checksum: this.generateChecksum(event),
    };

    // 별도 보안 데이터베이스에 저장
    await this.auditDb.insert(log);

    // 실시간 모니터링
    if (this.isSuspicious(event)) {
      await this.alertSecurityTeam(log);
    }
  }

  // 감사 대상 이벤트
  private readonly auditableEvents = [
    'user.login',
    'user.logout',
    'user.password_change',
    'user.email_change',
    'subscription.created',
    'subscription.canceled',
    'payment.processed',
    'payment.refunded',
    'admin.user_modified',
    'admin.config_changed',
  ];
}
```

### 5.4 민감 데이터 암호화

```typescript
// packages/utils/src/security/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';

  // 필드 레벨 암호화 (결제 정보 등)
  encrypt(data: string): EncryptedData {
    const iv = randomBytes(16);
    const cipher = createCipheriv(
      this.algorithm,
      this.getKey(),
      iv
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      iv: iv.toString('hex'),
      data: encrypted,
      tag: cipher.getAuthTag().toString('hex'),
    };
  }

  // 키 로테이션 지원
  private getKey(): Buffer {
    const keyVersion = process.env.ENCRYPTION_KEY_VERSION || '1';
    return Buffer.from(
      process.env[`ENCRYPTION_KEY_V${keyVersion}`]!,
      'hex'
    );
  }
}
```

---

## 📦 Phase 6: 확장성 설계 (Amazon 수준)

### 6.1 마이크로서비스 분리 계획

```
현재 (모놀리식)              →    목표 (마이크로서비스)
┌─────────────────────┐         ┌──────────────────────┐
│   FitQuest API      │         │ ┌─────────────────┐  │
│  ┌───────────────┐  │         │ │  API Gateway    │  │
│  │ Auth          │  │         │ └────────┬────────┘  │
│  │ Users         │  │         │          │           │
│  │ Workouts      │  │    →    │  ┌───────┴───────┐   │
│  │ Sessions      │  │         │  │               │   │
│  │ Gamification  │  │         │ ┌▼─┐ ┌──┐ ┌──┐ ┌▼─┐│
│  │ Coach         │  │         │ │A │ │W │ │G │ │S ││
│  │ Social        │  │         │ │u │ │o │ │a │ │o ││
│  │ Subscription  │  │         │ │t │ │r │ │m │ │c ││
│  └───────────────┘  │         │ │h │ │k │ │e │ │i ││
└─────────────────────┘         │ └──┘ └──┘ └──┘ └──┘│
                                └──────────────────────┘
```

### 6.2 이벤트 기반 아키텍처

```typescript
// packages/events/src/event-bus.ts
interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: Date;
  payload: Record<string, any>;
  metadata: {
    correlationId: string;
    causationId: string;
    userId?: string;
  };
}

// 주요 도메인 이벤트
type FitQuestEvents =
  | 'workout.completed'
  | 'achievement.unlocked'
  | 'level.up'
  | 'challenge.joined'
  | 'challenge.completed'
  | 'subscription.created'
  | 'subscription.canceled'
  | 'streak.updated';

// apps/api/src/events/handlers/
// WorkoutCompletedHandler → XP 계산, 업적 체크, 피드 생성
// AchievementUnlockedHandler → 알림 발송, 피드 생성
// LevelUpHandler → 칭호 업데이트, 알림, 피드
```

### 6.3 데이터베이스 확장 전략

```typescript
// 읽기 복제본 설정
const readReplica = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_READ_URL }
  }
});

const writePrimary = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_WRITE_URL }
  }
});

// CQRS 패턴
@Injectable()
export class WorkoutRepository {
  // 쓰기 (Primary)
  async create(data: CreateWorkoutDto) {
    return writePrimary.workout.create({ data });
  }

  // 읽기 (Replica)
  async findMany(filters: WorkoutFilters) {
    return readReplica.workout.findMany({ where: filters });
  }
}
```

### 6.4 캐시 클러스터

```typescript
// Redis Cluster 설정
const redisCluster = new Redis.Cluster([
  { host: 'redis-1.fitquest.com', port: 6379 },
  { host: 'redis-2.fitquest.com', port: 6379 },
  { host: 'redis-3.fitquest.com', port: 6379 },
], {
  scaleReads: 'slave',
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
  },
});

// 캐시 무효화 전략
class CacheInvalidation {
  // Write-through
  async updateWorkout(id: string, data: UpdateWorkoutDto) {
    const result = await this.db.workout.update({ where: { id }, data });
    await this.cache.set(`workout:${id}`, result);
    await this.cache.del(`workouts:list:*`); // 목록 캐시 무효화
    return result;
  }

  // Event-driven 무효화
  @OnEvent('workout.updated')
  async handleWorkoutUpdated(event: WorkoutUpdatedEvent) {
    await this.cache.del(`workout:${event.workoutId}`);
  }
}
```

---

## 🔄 Phase 7: 운영 준비 (DevOps 수준)

### 7.1 CI/CD 파이프라인

```yaml
# .github/workflows/ci-cd.yml
name: FitQuest CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 1. 코드 품질 검증
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type Check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Security Audit
        run: pnpm audit --audit-level=high

  # 2. 테스트
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7

    steps:
      - name: Run Unit Tests
        run: pnpm test:unit --coverage

      - name: Run Integration Tests
        run: pnpm test:integration

      - name: Upload Coverage
        uses: codecov/codecov-action@v3

  # 3. 빌드
  build:
    needs: [quality, test]
    runs-on: ubuntu-latest
    steps:
      - name: Build Applications
        run: pnpm build

      - name: Build Docker Images
        run: |
          docker build -t fitquest/api:${{ github.sha }} ./apps/api
          docker build -t fitquest/web:${{ github.sha }} ./apps/web

      - name: Scan for Vulnerabilities
        run: |
          trivy image fitquest/api:${{ github.sha }}
          trivy image fitquest/web:${{ github.sha }}

      - name: Push to Registry
        run: |
          docker push fitquest/api:${{ github.sha }}
          docker push fitquest/web:${{ github.sha }}

  # 4. 스테이징 배포
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to Staging
        run: |
          kubectl set image deployment/api api=fitquest/api:${{ github.sha }}
          kubectl set image deployment/web web=fitquest/web:${{ github.sha }}

      - name: Run E2E Tests
        run: pnpm test:e2e --env=staging

      - name: Run Performance Tests
        run: k6 run tests/load/staging.js

  # 5. 프로덕션 배포 (카나리)
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy Canary (10%)
        run: |
          kubectl apply -f k8s/canary-deployment.yaml
          kubectl set image deployment/api-canary api=fitquest/api:${{ github.sha }}

      - name: Monitor Canary (15min)
        run: |
          ./scripts/monitor-canary.sh --duration=15m --threshold=0.01

      - name: Progressive Rollout
        run: |
          for pct in 25 50 75 100; do
            kubectl set env deployment/api TRAFFIC_WEIGHT=$pct
            sleep 300
            ./scripts/validate-deployment.sh
          done

      - name: Cleanup Canary
        run: kubectl delete deployment api-canary
```

### 7.2 인프라 as 코드 (Terraform)

```hcl
# infrastructure/terraform/main.tf
module "vpc" {
  source = "./modules/vpc"

  name = "fitquest-${var.environment}"
  cidr = "10.0.0.0/16"

  azs             = ["ap-northeast-2a", "ap-northeast-2b", "ap-northeast-2c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

module "eks" {
  source = "./modules/eks"

  cluster_name    = "fitquest-${var.environment}"
  cluster_version = "1.28"

  node_groups = {
    general = {
      instance_types = ["t3.medium"]
      min_size       = 2
      max_size       = 10
      desired_size   = 3
    }
  }
}

module "rds" {
  source = "./modules/rds"

  identifier     = "fitquest-${var.environment}"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.large"

  multi_az               = true
  backup_retention_period = 7

  read_replicas = var.environment == "production" ? 2 : 0
}

module "redis" {
  source = "./modules/elasticache"

  cluster_id      = "fitquest-${var.environment}"
  engine          = "redis"
  node_type       = "cache.r6g.large"
  num_cache_nodes = 3

  automatic_failover_enabled = true
}
```

### 7.3 재해 복구 계획

```markdown
## FitQuest 재해 복구 계획 (DRP)

### RTO/RPO 목표
- RTO (복구 시간 목표): 15분
- RPO (복구 시점 목표): 5분

### 장애 시나리오별 대응

#### 1. 단일 서버 장애
- 자동 감지: Health Check 실패 (10초)
- 자동 복구: Auto Scaling으로 새 인스턴스 시작 (2분)
- 수동 개입: 불필요

#### 2. 가용 영역 장애
- 자동 감지: CloudWatch 알람 (30초)
- 자동 복구: 다른 AZ로 트래픽 전환 (1분)
- 수동 개입: 상황 모니터링

#### 3. 리전 장애
- 자동 감지: Route 53 Health Check (1분)
- 수동 복구: DR 리전 활성화 (15분)
- 절차:
  1. Route 53 페일오버 활성화
  2. DR 리전 RDS 프로모션
  3. 애플리케이션 배포 확인
  4. 데이터 정합성 검증

### 백업 전략
- 데이터베이스: 자동 스냅샷 (매 5분)
- 파일 스토리지: S3 Cross-Region Replication
- 설정: Git 버전 관리 + S3 백업
```

---

## 🧪 Phase 8: 테스팅 (Microsoft 수준)

### 8.1 테스트 커버리지 목표

| 테스트 유형 | 현재 | 목표 | 설명 |
|------------|------|------|------|
| 단위 테스트 | 0% | 80% | 핵심 비즈니스 로직 |
| 통합 테스트 | 0% | 60% | API 엔드포인트 |
| E2E 테스트 | 0% | 40% | 주요 사용자 플로우 |
| 성능 테스트 | 0% | 100% | 모든 API |

### 8.2 단위 테스트 예시

```typescript
// apps/api/src/modules/gamification/__tests__/gamification.service.spec.ts
describe('GamificationService', () => {
  describe('processWorkoutCompletion', () => {
    it('should calculate XP correctly for beginner difficulty', async () => {
      const result = await service.processWorkoutCompletion(userId, workoutId, {
        duration: 1800, // 30분
        calories: 200,
        category: 'strength',
        difficulty: 'beginner',
      });

      expect(result.xpEarned).toBe(50); // 기본 XP
    });

    it('should apply streak bonus correctly', async () => {
      // 7일 연속 운동 중인 사용자
      await setUserStreak(userId, 7);

      const result = await service.processWorkoutCompletion(userId, workoutId, data);

      expect(result.xpEarned).toBeGreaterThan(50); // 스트릭 보너스 적용
    });

    it('should unlock achievement when conditions met', async () => {
      // 99번째 운동 완료 상태
      await setCompletedWorkouts(userId, 99);

      const result = await service.processWorkoutCompletion(userId, workoutId, data);

      expect(result.badgesEarned).toContain('workout_100');
    });

    it('should handle concurrent requests safely', async () => {
      const promises = Array(10).fill(null).map(() =>
        service.processWorkoutCompletion(userId, workoutId, data)
      );

      const results = await Promise.all(promises);

      // 중복 XP 지급 방지
      const user = await getUser(userId);
      expect(user.totalXP).toBeLessThanOrEqual(initialXP + 50 * 10);
    });
  });
});
```

### 8.3 E2E 테스트 (Playwright)

```typescript
// tests/e2e/workout-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Workout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should complete workout and receive XP', async ({ page }) => {
    // 1. 운동 선택
    await page.goto('/workouts');
    await page.click('[data-testid="workout-card-1"]');

    // 2. 운동 시작
    await page.click('[data-testid="start-workout"]');
    await expect(page).toHaveURL(/\/workouts\/.*\/play/);

    // 3. 운동 진행 (시뮬레이션)
    await page.click('[data-testid="next-exercise"]');
    await page.waitForTimeout(1000);
    await page.click('[data-testid="complete-workout"]');

    // 4. 결과 확인
    await expect(page).toHaveURL(/\/workouts\/.*\/complete/);
    await expect(page.locator('[data-testid="xp-earned"]')).toBeVisible();
    await expect(page.locator('[data-testid="xp-earned"]')).toContainText('XP');
  });

  test('should show error gracefully when API fails', async ({ page }) => {
    // API 실패 시뮬레이션
    await page.route('**/api/sessions/*/complete', route =>
      route.fulfill({ status: 500 })
    );

    await page.goto('/workouts/1/play');
    await page.click('[data-testid="complete-workout"]');

    // 에러 메시지 확인
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });
});
```

### 8.4 부하 테스트 (k6)

```javascript
// tests/load/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const workoutLatency = new Trend('workout_latency');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // 워밍업
    { duration: '5m', target: 500 },   // 목표 부하
    { duration: '2m', target: 1000 },  // 스트레스
    { duration: '2m', target: 0 },     // 쿨다운
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
  },
};

export default function () {
  const token = getAuthToken();

  // 운동 목록 조회
  let res = http.get(`${BASE_URL}/api/workouts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  workoutLatency.add(res.timings.duration);
  errorRate.add(res.status !== 200);

  sleep(1);
}
```

---

## 📚 Phase 9: 문서화 (Stripe 수준)

### 9.1 API 문서 (OpenAPI)

```yaml
# docs/api/openapi.yaml
openapi: 3.0.3
info:
  title: FitQuest API
  version: 1.0.0
  description: |
    FitQuest 게이미피케이션 피트니스 플랫폼 API

    ## 인증
    모든 API 요청에는 Bearer 토큰이 필요합니다.

    ## Rate Limiting
    - 일반 엔드포인트: 100 요청/분
    - 인증 엔드포인트: 5 요청/5분

    ## 에러 코드
    | 코드 | 설명 |
    |------|------|
    | 400 | 잘못된 요청 |
    | 401 | 인증 필요 |
    | 403 | 권한 없음 |
    | 404 | 리소스 없음 |
    | 429 | 요청 한도 초과 |
    | 500 | 서버 오류 |

paths:
  /api/workouts:
    get:
      summary: 운동 목록 조회
      description: |
        운동 프로그램 목록을 조회합니다.
        결과는 페이지네이션되어 반환됩니다.
      tags:
        - Workouts
      parameters:
        - name: category
          in: query
          schema:
            type: string
            enum: [strength, cardio, yoga, hiit, stretching]
        - name: difficulty
          in: query
          schema:
            type: string
            enum: [beginner, intermediate, advanced]
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: cursor
          in: query
          schema:
            type: string
      responses:
        '200':
          description: 성공
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkoutListResponse'
              example:
                items:
                  - id: "workout_123"
                    title: "전신 파워 트레이닝"
                    duration: 30
                    difficulty: "intermediate"
                    xpReward: 150
                meta:
                  total: 100
                  hasMore: true
                  nextCursor: "eyJpZCI6MTIzfQ"
```

### 9.2 개발자 가이드

```markdown
# FitQuest 개발자 가이드

## 목차
1. [시작하기](#시작하기)
2. [아키텍처 개요](#아키텍처-개요)
3. [로컬 개발 환경](#로컬-개발-환경)
4. [코드 스타일 가이드](#코드-스타일-가이드)
5. [테스팅 가이드](#테스팅-가이드)
6. [배포 가이드](#배포-가이드)
7. [트러블슈팅](#트러블슈팅)

## 아키텍처 개요

### 시스템 구성도
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  CloudFront │────▶│   ALB/API   │
│  (Web/App)  │     │     CDN     │     │   Gateway   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
              ┌─────▼─────┐            ┌───────▼───────┐          ┌───────▼───────┐
              │  API Pod  │            │  Worker Pod   │          │  Scheduler    │
              │  (NestJS) │            │  (Jobs)       │          │  (Cron)       │
              └─────┬─────┘            └───────┬───────┘          └───────┬───────┘
                    │                          │                          │
        ┌───────────┼───────────┬──────────────┼──────────────────────────┘
        │           │           │              │
  ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐ ┌─────▼─────┐
  │ PostgreSQL│ │ Redis │ │ RabbitMQ  │ │    S3     │
  │ (Primary) │ │Cluster│ │  Queue    │ │  Storage  │
  └─────┬─────┘ └───────┘ └───────────┘ └───────────┘
        │
  ┌─────▼─────┐
  │ PostgreSQL│
  │ (Replica) │
  └───────────┘
```

### 데이터 플로우
[상세 다이어그램 및 설명]

## 트러블슈팅

### 일반적인 문제

#### 1. 데이터베이스 연결 실패
```bash
# 증상: ECONNREFUSED 에러
# 원인: DB 서버 다운 또는 연결 정보 오류
# 해결:
1. DB 서버 상태 확인: pg_isready -h localhost -p 5432
2. 환경변수 확인: echo $DATABASE_URL
3. 연결 테스트: psql $DATABASE_URL -c "SELECT 1"
```

#### 2. Redis 캐시 미스 급증
```bash
# 증상: 캐시 히트율 급격히 감소
# 원인: 키 만료, 메모리 부족, 잘못된 캐시 키
# 해결:
1. Redis 메모리 확인: redis-cli INFO memory
2. 키 패턴 분석: redis-cli --scan --pattern "workout:*" | wc -l
3. 만료 시간 확인: redis-cli TTL "key_name"
```
```

---

## 📅 구현 로드맵

### Sprint 1-2 (Week 1-4): 기반 강화
- [ ] Circuit Breaker 패턴 구현
- [ ] 재시도 로직 추가
- [ ] 에러 바운더리 구현
- [ ] 기본 모니터링 설정 (Sentry, 기본 로깅)
- [ ] 단위 테스트 작성 (커버리지 50%)

### Sprint 3-4 (Week 5-8): 성능 최적화
- [ ] 번들 최적화 및 코드 스플리팅
- [ ] 이미지 최적화 파이프라인
- [ ] 가상 스크롤링 구현
- [ ] 데이터베이스 인덱스 최적화
- [ ] 캐싱 전략 구현 (Redis)

### Sprint 5-6 (Week 9-12): 보안 및 모니터링
- [ ] 보안 미들웨어 강화
- [ ] Rate Limiting 구현
- [ ] 감사 로그 시스템
- [ ] APM 통합 (Datadog)
- [ ] 비즈니스 메트릭 대시보드

### Sprint 7-8 (Week 13-16): 운영 준비
- [ ] CI/CD 파이프라인 구축
- [ ] 인프라 as 코드 (Terraform)
- [ ] 카나리 배포 설정
- [ ] 재해 복구 계획 수립
- [ ] E2E 테스트 작성

### Sprint 9-10 (Week 17-20): 확장성 및 문서화
- [ ] 이벤트 기반 아키텍처 전환
- [ ] 읽기 복제본 설정
- [ ] API 문서 완성
- [ ] 개발자 가이드 작성
- [ ] 운영 매뉴얼 작성

---

## 📊 성공 지표 (KPI)

| 지표 | 현재 (추정) | 3개월 목표 | 6개월 목표 |
|------|------------|-----------|-----------|
| API 응답시간 (P95) | 800ms | 300ms | 200ms |
| 에러율 | 2% | 0.5% | 0.1% |
| 가용성 | 95% | 99.5% | 99.9% |
| 테스트 커버리지 | 0% | 60% | 80% |
| Core Web Vitals | Poor | Needs Improvement | Good |
| 보안 취약점 | 미측정 | 0 Critical | 0 High |

---

## 🔗 참고 자료

- [Netflix Tech Blog](https://netflixtechblog.com/)
- [Spotify Engineering](https://engineering.atspotify.com/)
- [Uber Engineering](https://eng.uber.com/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
