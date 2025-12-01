import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { CoachModule } from './modules/coach/coach.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { SocialModule } from './modules/social/social.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    WorkoutsModule,
    SessionsModule,
    GamificationModule,
    ChallengesModule,
    CoachModule,
    NutritionModule,
    SocialModule,
    SubscriptionModule,
    HealthModule,
  ],
})
export class AppModule {}
