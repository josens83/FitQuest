# FitQuest 🎮💪

게이미피케이션 기반 홈트레이닝 플랫폼

## Overview

FitQuest는 Keep(중국 #1 피트니스 앱, MAU 2,966만)을 벤치마킹한 프리미엄 홈트레이닝 플랫폼입니다.
RPG 스타일의 게이미피케이션을 통해 운동을 게임처럼 즐기며 건강한 습관을 만들어갑니다.

### Core Features

- 🎮 **게이미피케이션 시스템**: XP, 레벨업, 업적, 칭호, 스탯 성장
- 🤖 **AI 코치**: Claude API 기반 맞춤형 운동 추천 및 실시간 피드백
- 📺 **운동 영상 플레이어**: 타이머, 운동 가이드, 실시간 통계
- 🏆 **챌린지 & 리더보드**: 친구들과 함께 도전하고 경쟁
- 📊 **상세 통계**: 운동 기록, 신체 변화, 영양 추적
- 🎖️ **가상 이벤트**: 버추얼 마라톤, 시즌별 챌린지, 메달 수집

## Tech Stack

### Frontend
- **Web**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Mobile**: React Native, Expo, TypeScript

### Backend
- **API**: NestJS, TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma

### Shared
- **Monorepo**: Turborepo + pnpm workspaces
- **Types**: Shared TypeScript definitions
- **Utils**: Gamification logic, formatters, validators

## Project Structure

```
FitQuest/
├── apps/
│   ├── web/          # Next.js 14 웹 애플리케이션
│   ├── mobile/       # React Native + Expo 모바일 앱
│   └── api/          # NestJS 백엔드 API
├── packages/
│   ├── types/        # 공유 TypeScript 타입 정의
│   ├── utils/        # 공유 유틸리티 함수
│   ├── ui/           # 공유 UI 컴포넌트 (React)
│   └── database/     # Prisma 스키마 및 클라이언트
└── turbo.json        # Turborepo 설정
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL (or Supabase account)

### Installation

```bash
# Clone the repository
git clone https://github.com/josens83/FitQuest.git
cd FitQuest

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Generate Prisma client
pnpm --filter @fitquest/database db:generate

# Run database migrations
pnpm --filter @fitquest/database db:push

# Seed the database (optional)
pnpm --filter @fitquest/database db:seed

# Start development servers
pnpm dev
```

### Development Commands

```bash
# Run all apps in development
pnpm dev

# Run specific app
pnpm --filter @fitquest/web dev
pnpm --filter @fitquest/mobile start
pnpm --filter @fitquest/api dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Run tests
pnpm test
```

## Environment Variables

Create a `.env.local` file with the following:

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/fitquest"

# Supabase
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# AI Coach (optional)
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Storage
CLOUDFLARE_R2_ACCESS_KEY="your-r2-access-key"
CLOUDFLARE_R2_SECRET_KEY="your-r2-secret-key"
```

## Subscription Plans

| Feature | Free | Premium (₩9,900/월) | Premium+ (₩19,900/월) |
|---------|------|---------------------|----------------------|
| 운동 콘텐츠 | 기본 | 무제한 | 무제한 |
| AI 코치 | ❌ | ✅ | ✅ + 1:1 코칭 |
| 오프라인 다운로드 | ❌ | 10개 | 무제한 |
| 상세 통계 | 기본 | ✅ | ✅ |
| 광고 | ✅ | ❌ | ❌ |
| 전용 챌린지 | ❌ | ✅ | ✅ |
| 우선 지원 | ❌ | ❌ | ✅ |

## API Documentation

API documentation is available at `/api/docs` when running the backend in development mode.

### Main Endpoints

- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `GET /workouts` - 운동 목록
- `POST /sessions/start/:workoutId` - 운동 시작
- `POST /sessions/:id/complete` - 운동 완료
- `GET /gamification/leaderboard` - 리더보드
- `GET /challenges` - 챌린지 목록
- `POST /coach/chat` - AI 코치 대화

## License

This project is proprietary software. All rights reserved.

## Contributing

This is a private project. Contact the repository owner for contribution guidelines.
