import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import { AppModule } from './app.module';

// Initialize OpenTelemetry tracing before anything else
if (process.env.OTEL_ENABLED === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { startTracing } = require('./common/telemetry/tracing');
  startTracing();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable compression
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses > 1KB
      level: 6, // Compression level (1-9, 6 is default balance)
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation for v1
  const configV1 = new DocumentBuilder()
    .setTitle('FitQuest API')
    .setDescription(
      '게이미피케이션 홈 피트니스 플랫폼 API\n\n' +
        '## API Versioning\n' +
        '- Current version: v1\n' +
        '- Base URL: `/api/v1`\n' +
        '- Deprecation policy: Old versions supported for 6 months after new release\n\n' +
        '## Rate Limits\n' +
        '- Standard: 100 requests/minute\n' +
        '- Auth endpoints: 10 requests/minute\n' +
        '- Premium users: 500 requests/minute',
    )
    .setVersion('1.0.0')
    .addServer('/api/v1', 'API v1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT-auth',
    )
    .addTag('auth', '인증 - 회원가입, 로그인, 토큰 관리')
    .addTag('users', '사용자 - 프로필, 설정, 통계')
    .addTag('workouts', '운동 - 운동 프로그램 및 카탈로그')
    .addTag('sessions', '운동 세션 - 실시간 운동 기록')
    .addTag('gamification', '게이미피케이션 - XP, 레벨, 리더보드')
    .addTag('achievements', '업적 - 달성 조건 및 보상')
    .addTag('challenges', '챌린지 - 개인/그룹 도전')
    .addTag('coach', 'AI 코치 - 맞춤 추천 및 분석')
    .addTag('nutrition', '영양 - 식단 관리 및 추천')
    .addTag('social', '소셜 - 친구, 피드, 공유')
    .addTag('subscription', '구독 - 프리미엄 플랜 관리')
    .addTag('health', '헬스체크 - 서버 상태 확인')
    .build();

  const documentV1 = SwaggerModule.createDocument(app, configV1);
  SwaggerModule.setup('docs', app, documentV1, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`FitQuest API running on: http://localhost:${port}`);
  console.log(`API v1: http://localhost:${port}/api/v1`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
