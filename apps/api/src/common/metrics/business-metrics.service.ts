import { Injectable } from '@nestjs/common';
import { MetricsService } from './metrics.service';

export interface WorkoutCompletedData {
  userId: string;
  workoutId: string;
  category: string;
  difficulty: string;
  duration: number; // in seconds
  caloriesBurned: number;
  xpEarned: number;
}

export interface AchievementUnlockedData {
  userId: string;
  achievementId: string;
  achievementType: string;
  xpEarned: number;
}

export interface SubscriptionEventData {
  userId: string;
  plan: string;
  amount: number;
  currency: string;
}

export interface SessionEventData {
  userId: string;
  sessionType: 'web' | 'mobile' | 'api';
}

@Injectable()
export class BusinessMetricsService {
  constructor(private readonly metricsService: MetricsService) {
    this.registerBusinessMetrics();
  }

  private registerBusinessMetrics(): void {
    // User engagement metrics
    this.metricsService.registerCounter({
      name: 'user_signups_total',
      help: 'Total number of user signups',
      labelNames: ['source', 'plan'],
    });

    this.metricsService.registerCounter({
      name: 'user_logins_total',
      help: 'Total number of user logins',
      labelNames: ['platform'],
    });

    this.metricsService.registerGauge({
      name: 'daily_active_users',
      help: 'Number of daily active users',
      labelNames: [],
    });

    this.metricsService.registerGauge({
      name: 'weekly_active_users',
      help: 'Number of weekly active users',
      labelNames: [],
    });

    this.metricsService.registerGauge({
      name: 'monthly_active_users',
      help: 'Number of monthly active users',
      labelNames: [],
    });

    // Workout metrics
    this.metricsService.registerHistogram({
      name: 'workout_duration_seconds',
      help: 'Duration of completed workouts in seconds',
      labelNames: ['category', 'difficulty'],
      buckets: [300, 600, 900, 1200, 1800, 2700, 3600],
    });

    this.metricsService.registerHistogram({
      name: 'workout_calories_burned',
      help: 'Calories burned per workout',
      labelNames: ['category'],
      buckets: [50, 100, 150, 200, 300, 400, 500, 750, 1000],
    });

    // Streak metrics
    this.metricsService.registerHistogram({
      name: 'user_streak_length',
      help: 'Distribution of user streak lengths',
      labelNames: [],
      buckets: [1, 3, 7, 14, 30, 60, 90, 180, 365],
    });

    this.metricsService.registerCounter({
      name: 'streaks_broken_total',
      help: 'Total number of streaks broken',
      labelNames: ['streak_length_bucket'],
    });

    // Gamification metrics
    this.metricsService.registerHistogram({
      name: 'xp_earned_per_session',
      help: 'XP earned per workout session',
      labelNames: ['source'],
      buckets: [10, 25, 50, 100, 150, 200, 300, 500],
    });

    this.metricsService.registerCounter({
      name: 'level_ups_total',
      help: 'Total number of level ups',
      labelNames: ['level'],
    });

    // Social metrics
    this.metricsService.registerCounter({
      name: 'social_follows_total',
      help: 'Total number of follow actions',
      labelNames: [],
    });

    this.metricsService.registerCounter({
      name: 'challenge_joins_total',
      help: 'Total number of challenge joins',
      labelNames: ['challenge_type'],
    });

    // Revenue metrics
    this.metricsService.registerGauge({
      name: 'mrr_cents',
      help: 'Monthly recurring revenue in cents',
      labelNames: [],
    });

    this.metricsService.registerCounter({
      name: 'subscription_events_total',
      help: 'Subscription lifecycle events',
      labelNames: ['event_type', 'plan'],
    });

    this.metricsService.registerHistogram({
      name: 'subscription_value_cents',
      help: 'Subscription value distribution',
      labelNames: ['plan'],
      buckets: [499, 999, 1999, 4999, 9999],
    });
  }

  // User engagement tracking
  trackSignup(source: string, plan: string = 'free'): void {
    this.metricsService.incrementCounter('user_signups_total', { source, plan });
  }

  trackLogin(platform: 'web' | 'mobile' | 'api'): void {
    this.metricsService.incrementCounter('user_logins_total', { platform });
  }

  updateActiveUsers(dau: number, wau: number, mau: number): void {
    this.metricsService.setGauge('daily_active_users', dau);
    this.metricsService.setGauge('weekly_active_users', wau);
    this.metricsService.setGauge('monthly_active_users', mau);
  }

  // Workout tracking
  trackWorkoutCompleted(data: WorkoutCompletedData): void {
    const labels = { category: data.category, difficulty: data.difficulty };

    this.metricsService.incrementCounter('workouts_completed_total', labels);
    this.metricsService.observeHistogram('workout_duration_seconds', data.duration, labels);
    this.metricsService.observeHistogram('workout_calories_burned', data.caloriesBurned, { category: data.category });
    this.metricsService.observeHistogram('xp_earned_per_session', data.xpEarned, { source: 'workout' });
  }

  // Streak tracking
  trackStreakUpdate(streakLength: number): void {
    this.metricsService.observeHistogram('user_streak_length', streakLength);
  }

  trackStreakBroken(previousLength: number): void {
    const bucket = this.getStreakBucket(previousLength);
    this.metricsService.incrementCounter('streaks_broken_total', { streak_length_bucket: bucket });
  }

  private getStreakBucket(length: number): string {
    if (length < 7) return '1-6';
    if (length < 14) return '7-13';
    if (length < 30) return '14-29';
    if (length < 60) return '30-59';
    if (length < 90) return '60-89';
    return '90+';
  }

  // Achievement tracking
  trackAchievementUnlocked(data: AchievementUnlockedData): void {
    this.metricsService.incrementCounter('achievements_unlocked_total', {
      achievement_type: data.achievementType,
    });
    this.metricsService.observeHistogram('xp_earned_per_session', data.xpEarned, { source: 'achievement' });
  }

  // Level tracking
  trackLevelUp(newLevel: number): void {
    this.metricsService.incrementCounter('level_ups_total', { level: newLevel.toString() });
  }

  // Social tracking
  trackFollow(): void {
    this.metricsService.incrementCounter('social_follows_total', {});
  }

  trackChallengeJoin(challengeType: string): void {
    this.metricsService.incrementCounter('challenge_joins_total', { challenge_type: challengeType });
  }

  // Revenue tracking
  trackSubscriptionCreated(data: SubscriptionEventData): void {
    this.metricsService.incrementCounter('subscription_events_total', {
      event_type: 'created',
      plan: data.plan,
    });
    this.metricsService.observeHistogram('subscription_value_cents', data.amount, { plan: data.plan });
  }

  trackSubscriptionRenewed(data: SubscriptionEventData): void {
    this.metricsService.incrementCounter('subscription_events_total', {
      event_type: 'renewed',
      plan: data.plan,
    });
  }

  trackSubscriptionCanceled(data: SubscriptionEventData): void {
    this.metricsService.incrementCounter('subscription_events_total', {
      event_type: 'canceled',
      plan: data.plan,
    });
  }

  trackSubscriptionChurned(data: SubscriptionEventData): void {
    this.metricsService.incrementCounter('subscription_events_total', {
      event_type: 'churned',
      plan: data.plan,
    });
  }

  updateMRR(amountCents: number): void {
    this.metricsService.setGauge('mrr_cents', amountCents);
  }
}
