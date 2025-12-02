import { Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEventService } from './domain-event.service';
import { BusinessMetricsService } from '../metrics/business-metrics.service';
import { LoggerService } from '../logging';

/**
 * Central event handlers for domain events
 * Connects domain events to various side effects (metrics, notifications, etc.)
 */
@Injectable()
export class EventHandlersService implements OnModuleInit {
  private readonly logger = new LoggerService();

  constructor(
    private readonly eventService: DomainEventService,
    private readonly businessMetrics: BusinessMetricsService
  ) {
    this.logger.setContext('EventHandlers');
  }

  onModuleInit(): void {
    this.registerHandlers();
    this.logger.log('Event handlers registered');
  }

  private registerHandlers(): void {
    // User events
    this.eventService.subscribe('user.registered', async (event) => {
      this.logger.log(`User registered: ${event.userId}`);
      await this.businessMetrics.trackUserSignup(event.registrationMethod);
    });

    this.eventService.subscribe('user.logged_in', async (event) => {
      this.logger.debug(`User logged in: ${event.userId}`);
      await this.businessMetrics.trackUserLogin(event.loginMethod);
    });

    // Workout events
    this.eventService.subscribe('workout.completed', async (event) => {
      this.logger.log(`Workout completed: ${event.workoutId} by user ${event.userId}`);

      await this.businessMetrics.trackWorkoutCompleted({
        userId: event.userId,
        workoutId: event.workoutId,
        type: 'custom',
        duration: event.durationMinutes * 60,
        caloriesBurned: event.caloriesBurned,
        xpEarned: event.xpEarned,
      });
    });

    this.eventService.subscribe('workout.abandoned', async (event) => {
      this.logger.warn(
        `Workout abandoned: ${event.workoutId} by user ${event.userId} at ${event.abandonedAt}s`
      );
    });

    // Achievement events
    this.eventService.subscribe('achievement.unlocked', async (event) => {
      this.logger.log(
        `Achievement unlocked: ${event.achievementName} (${event.tier}) for user ${event.userId}`
      );

      await this.businessMetrics.trackAchievementUnlocked({
        achievementId: event.achievementId,
        userId: event.userId,
        tier: event.tier,
      });
    });

    this.eventService.subscribe('user.level_up', async (event) => {
      this.logger.log(
        `User ${event.userId} leveled up: ${event.previousLevel} -> ${event.newLevel}`
      );
    });

    this.eventService.subscribe('streak.milestone', async (event) => {
      this.logger.log(
        `Streak milestone: User ${event.userId} reached ${event.streakDays} days`
      );

      await this.businessMetrics.trackStreakMilestone(
        event.userId,
        event.streakDays,
        event.milestone
      );
    });

    // Subscription events
    this.eventService.subscribe('subscription.created', async (event) => {
      this.logger.log(`Subscription created: ${event.subscriptionId} for user ${event.userId}`);

      await this.businessMetrics.trackSubscriptionEvent({
        type: 'created',
        userId: event.userId,
        plan: event.plan,
        amount: event.amount,
      });
    });

    this.eventService.subscribe('subscription.cancelled', async (event) => {
      this.logger.log(
        `Subscription cancelled: ${event.subscriptionId} for user ${event.userId}`
      );

      await this.businessMetrics.trackSubscriptionEvent({
        type: 'cancelled',
        userId: event.userId,
      });
    });

    this.eventService.subscribe('subscription.renewed', async (event) => {
      this.logger.log(`Subscription renewed: ${event.subscriptionId} for user ${event.userId}`);

      await this.businessMetrics.trackSubscriptionEvent({
        type: 'renewed',
        userId: event.userId,
        plan: event.plan,
        amount: event.amount,
      });
    });

    // Social events
    this.eventService.subscribe('challenge.created', async (event) => {
      this.logger.log(
        `Challenge created: ${event.challengeId} by user ${event.creatorId} with ${event.participantIds.length} participants`
      );
    });

    this.eventService.subscribe('challenge.completed', async (event) => {
      this.logger.log(
        `Challenge completed: ${event.challengeId}, winner: ${event.winnerId}`
      );
    });
  }
}
