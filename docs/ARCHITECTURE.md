# FitQuest Architecture

## System Overview

FitQuest is a gamified fitness platform built with a modern microservices-ready architecture.

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                    │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│    Web App      │   Mobile App    │      Admin Dashboard            │
│   (Next.js)     │  (React Native) │        (Next.js)                │
└────────┬────────┴────────┬────────┴─────────────┬───────────────────┘
         │                 │                       │
         └─────────────────┴───────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  CloudFront │
                    │     CDN     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Ingress   │
                    │  (NGINX)    │
                    └──────┬──────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
  ┌──────▼──────┐                    ┌───────▼───────┐
  │  FitQuest   │                    │   FitQuest    │
  │     API     │◄───────────────────│      Web      │
  │  (NestJS)   │                    │   (Next.js)   │
  └──────┬──────┘                    └───────────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌───▼───┐ ┌────▼────┐ ┌───▼───┐
│ Redis │ │ Postgres│ │   S3   │ │External│
│ Cache │ │   DB   │ │ Assets │ │Services│
└───────┘ └────────┘ └─────────┘ └───────┘
```

## Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **API Documentation**: Swagger/OpenAPI

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand + TanStack Query
- **UI Components**: Custom + Radix UI

### Frontend (Mobile)
- **Framework**: React Native (Expo)
- **Navigation**: Expo Router
- **State Management**: Zustand

### Infrastructure
- **Container Orchestration**: Kubernetes
- **Infrastructure as Code**: Terraform
- **CI/CD**: GitHub Actions
- **Cloud Provider**: AWS

## Core Modules

### Authentication (`/api/auth`)
- JWT-based authentication
- Refresh token rotation
- OAuth providers (Google, Apple)

### Users (`/api/users`)
- Profile management
- Settings and preferences
- Statistics tracking

### Workouts (`/api/workouts`)
- Workout program catalog
- Exercise management
- Category/difficulty filtering

### Sessions (`/api/sessions`)
- Workout session tracking
- Progress monitoring
- Session completion

### Gamification (`/api/gamification`)
- XP system
- Leveling
- Achievements/badges
- Leaderboards

### Challenges (`/api/challenges`)
- Challenge creation
- Participation tracking
- Progress updates

### Social (`/api/social`)
- Friend system
- Activity feed
- Comments and likes

### Subscription (`/api/subscription`)
- Plan management
- Stripe integration
- Payment processing

## Data Flow

### Workout Completion Flow
```
User completes workout
        │
        ▼
┌───────────────────┐
│  Session Service  │
│  - Save session   │
│  - Calculate stats│
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Gamification Svc  │
│  - Calculate XP   │
│  - Check levels   │
│  - Check badges   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Event Bus       │
│  - workout.done   │
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌───────┐  ┌────────┐
│Metrics│  │Activity│
│Service│  │ Feed   │
└───────┘  └────────┘
```

## Security

### Authentication
- JWT with RS256 signing
- Refresh tokens with rotation
- HTTP-only cookies for refresh tokens

### API Security
- Rate limiting (100 req/min)
- CORS configuration
- Input validation (class-validator)
- SQL injection prevention (Prisma)

### Infrastructure Security
- Network policies (Kubernetes)
- TLS everywhere
- Secrets management
- RBAC

## Caching Strategy

| Data Type | TTL | Cache Key Pattern |
|-----------|-----|-------------------|
| Workout list | 5 min | `workouts:list:{filters}` |
| Workout detail | 1 hour | `workouts:{id}` |
| User profile | 5 min | `users:{id}:profile` |
| Leaderboard | 1 min | `leaderboard:{type}:{period}` |
| Achievements | 1 hour | `achievements:all` |

## Monitoring

### Metrics
- Prometheus metrics at `/api/metrics`
- Business metrics tracking
- Custom dashboards (Grafana)

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking (Sentry)

### Alerting
- Error rate > 5%
- P95 latency > 2s
- Database connection issues
- Pod health issues

## Scalability Considerations

1. **Horizontal Scaling**: API pods scale based on CPU/memory
2. **Database**: Read replicas for query distribution
3. **Cache**: Redis cluster for high availability
4. **CDN**: Static assets served via CloudFront
5. **Event-Driven**: Async processing for non-critical operations
