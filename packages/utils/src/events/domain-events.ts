/**
 * Domain Events for FitQuest Platform
 * These events represent significant domain occurrences
 */

// User Events
export interface UserRegisteredEvent {
  userId: string;
  email: string;
  registrationMethod: 'email' | 'google' | 'apple';
  referralCode?: string;
  timestamp: Date;
}

export interface UserLoggedInEvent {
  userId: string;
  loginMethod: 'email' | 'google' | 'apple';
  deviceInfo?: {
    platform: string;
    userAgent: string;
  };
  timestamp: Date;
}

export interface UserProfileUpdatedEvent {
  userId: string;
  updatedFields: string[];
  timestamp: Date;
}

// Workout Events
export interface WorkoutStartedEvent {
  userId: string;
  workoutId: string;
  workoutType: string;
  difficulty: string;
  timestamp: Date;
}

export interface WorkoutCompletedEvent {
  userId: string;
  workoutId: string;
  sessionId: string;
  durationMinutes: number;
  caloriesBurned: number;
  xpEarned: number;
  exercisesCompleted: number;
  timestamp: Date;
}

export interface WorkoutPausedEvent {
  userId: string;
  workoutId: string;
  sessionId: string;
  pausedAt: number; // seconds into workout
  timestamp: Date;
}

export interface WorkoutAbandonedEvent {
  userId: string;
  workoutId: string;
  sessionId: string;
  abandonedAt: number; // seconds into workout
  reason?: string;
  timestamp: Date;
}

// Achievement Events
export interface AchievementUnlockedEvent {
  userId: string;
  achievementId: string;
  achievementName: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpAwarded: number;
  timestamp: Date;
}

export interface LevelUpEvent {
  userId: string;
  previousLevel: number;
  newLevel: number;
  totalXp: number;
  timestamp: Date;
}

export interface StreakMilestoneEvent {
  userId: string;
  streakDays: number;
  milestone: number; // e.g., 7, 14, 30, 60, 90, 180, 365
  xpBonus: number;
  timestamp: Date;
}

// Subscription Events
export interface SubscriptionCreatedEvent {
  userId: string;
  subscriptionId: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  timestamp: Date;
}

export interface SubscriptionCancelledEvent {
  userId: string;
  subscriptionId: string;
  reason?: string;
  effectiveDate: Date;
  timestamp: Date;
}

export interface SubscriptionRenewedEvent {
  userId: string;
  subscriptionId: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  timestamp: Date;
}

// Social Events
export interface FriendAddedEvent {
  userId: string;
  friendId: string;
  timestamp: Date;
}

export interface ChallengeCreatedEvent {
  creatorId: string;
  challengeId: string;
  challengeType: string;
  participantIds: string[];
  startDate: Date;
  endDate: Date;
  timestamp: Date;
}

export interface ChallengeCompletedEvent {
  challengeId: string;
  winnerId: string;
  participantResults: {
    userId: string;
    score: number;
    rank: number;
  }[];
  timestamp: Date;
}

// Notification Events
export interface NotificationSentEvent {
  userId: string;
  notificationId: string;
  type: 'push' | 'email' | 'in-app';
  category: string;
  timestamp: Date;
}

// All Domain Events Map
export interface DomainEvents {
  // User
  'user.registered': UserRegisteredEvent;
  'user.logged_in': UserLoggedInEvent;
  'user.profile_updated': UserProfileUpdatedEvent;

  // Workout
  'workout.started': WorkoutStartedEvent;
  'workout.completed': WorkoutCompletedEvent;
  'workout.paused': WorkoutPausedEvent;
  'workout.abandoned': WorkoutAbandonedEvent;

  // Achievement
  'achievement.unlocked': AchievementUnlockedEvent;
  'user.level_up': LevelUpEvent;
  'streak.milestone': StreakMilestoneEvent;

  // Subscription
  'subscription.created': SubscriptionCreatedEvent;
  'subscription.cancelled': SubscriptionCancelledEvent;
  'subscription.renewed': SubscriptionRenewedEvent;

  // Social
  'friend.added': FriendAddedEvent;
  'challenge.created': ChallengeCreatedEvent;
  'challenge.completed': ChallengeCompletedEvent;

  // Notification
  'notification.sent': NotificationSentEvent;
}

export type DomainEventName = keyof DomainEvents;
export type DomainEventPayload<K extends DomainEventName> = DomainEvents[K];
