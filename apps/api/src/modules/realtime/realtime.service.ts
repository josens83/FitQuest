import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

export interface NotificationData {
  type: 'achievement' | 'challenge' | 'friend' | 'system' | 'workout';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  change: number;
}

export interface ActivityData {
  userId: string;
  username: string;
  type: 'workout_completed' | 'achievement_unlocked' | 'challenge_joined' | 'level_up';
  message: string;
  data?: Record<string, unknown>;
}

export interface AchievementData {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface ChallengeProgressData {
  userId: string;
  username: string;
  progress: number;
  milestone?: string;
}

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  /**
   * Send notification to a specific user
   */
  notifyUser(userId: string, notification: NotificationData): void {
    this.logger.debug(`Sending notification to user ${userId}: ${notification.title}`);
    this.realtimeGateway.sendNotification(userId, notification);
  }

  /**
   * Broadcast notification to all users
   */
  broadcastNotification(notification: NotificationData): void {
    this.logger.debug(`Broadcasting notification: ${notification.title}`);
    this.realtimeGateway.broadcastNotification(notification);
  }

  /**
   * Send system-wide announcement
   */
  sendSystemAnnouncement(title: string, message: string): void {
    this.broadcastNotification({
      type: 'system',
      title,
      message,
    });
  }

  /**
   * Notify user about new friend request
   */
  notifyFriendRequest(
    userId: string,
    fromUser: { id: string; username: string },
  ): void {
    this.notifyUser(userId, {
      type: 'friend',
      title: 'New Friend Request',
      message: `${fromUser.username} sent you a friend request`,
      data: { fromUserId: fromUser.id, fromUsername: fromUser.username },
    });
  }

  /**
   * Notify user about friend request accepted
   */
  notifyFriendAccepted(
    userId: string,
    friend: { id: string; username: string },
  ): void {
    this.notifyUser(userId, {
      type: 'friend',
      title: 'Friend Request Accepted',
      message: `${friend.username} accepted your friend request`,
      data: { friendId: friend.id, friendUsername: friend.username },
    });
  }

  /**
   * Notify about achievement unlock
   */
  notifyAchievementUnlocked(
    userId: string,
    username: string,
    achievement: AchievementData,
  ): void {
    // Notify the user
    this.realtimeGateway.notifyAchievement(userId, achievement);

    // Post to activity feed
    this.postToActivityFeed({
      userId,
      username,
      type: 'achievement_unlocked',
      message: `unlocked "${achievement.name}"`,
      data: achievement,
    });
  }

  /**
   * Notify about workout completion
   */
  notifyWorkoutCompleted(
    userId: string,
    username: string,
    workout: {
      name: string;
      duration: number;
      calories: number;
      xpEarned: number;
    },
  ): void {
    this.notifyUser(userId, {
      type: 'workout',
      title: 'Workout Completed!',
      message: `Great job! You completed ${workout.name}`,
      data: workout,
    });

    this.postToActivityFeed({
      userId,
      username,
      type: 'workout_completed',
      message: `completed ${workout.name} (${workout.duration}min, ${workout.calories} cal)`,
      data: workout,
    });
  }

  /**
   * Notify about level up
   */
  notifyLevelUp(
    userId: string,
    username: string,
    newLevel: number,
    rewards?: { xpBonus?: number; badge?: string },
  ): void {
    this.notifyUser(userId, {
      type: 'system',
      title: 'Level Up!',
      message: `Congratulations! You reached level ${newLevel}`,
      data: { level: newLevel, rewards },
    });

    this.postToActivityFeed({
      userId,
      username,
      type: 'level_up',
      message: `reached level ${newLevel}`,
      data: { level: newLevel },
    });
  }

  /**
   * Notify about challenge invitation
   */
  notifyChallengeInvitation(
    userId: string,
    challenge: { id: string; name: string; invitedBy: string },
  ): void {
    this.notifyUser(userId, {
      type: 'challenge',
      title: 'Challenge Invitation',
      message: `${challenge.invitedBy} invited you to "${challenge.name}"`,
      data: challenge,
    });
  }

  /**
   * Notify challenge participants about progress
   */
  updateChallengeProgress(
    challengeId: string,
    progress: ChallengeProgressData,
  ): void {
    this.logger.debug(
      `Updating challenge ${challengeId} progress: ${progress.username} at ${progress.progress}%`,
    );
    this.realtimeGateway.updateChallengeProgress(challengeId, progress);
  }

  /**
   * Update leaderboard
   */
  updateLeaderboard(
    type: 'daily' | 'weekly' | 'monthly' | 'all-time',
    entries: LeaderboardEntry[],
  ): void {
    this.logger.debug(`Updating ${type} leaderboard with ${entries.length} entries`);
    this.realtimeGateway.updateLeaderboard(type, { type, entries });
  }

  /**
   * Post activity to feed
   */
  postToActivityFeed(activity: ActivityData): void {
    this.realtimeGateway.postActivityFeed({
      ...activity,
      timestamp: new Date(),
    });
  }

  /**
   * Check if user is currently online
   */
  isUserOnline(userId: string): boolean {
    return this.realtimeGateway.isUserOnline(userId);
  }

  /**
   * Get count of online users
   */
  getOnlineUsersCount(): number {
    return this.realtimeGateway.getOnlineUsersCount();
  }

  /**
   * Get list of online user IDs
   */
  getOnlineUserIds(): string[] {
    return this.realtimeGateway.getOnlineUserIds();
  }

  /**
   * Notify when streak is at risk
   */
  notifyStreakAtRisk(userId: string, currentStreak: number): void {
    this.notifyUser(userId, {
      type: 'system',
      title: 'Streak at Risk!',
      message: `Complete a workout today to maintain your ${currentStreak}-day streak!`,
      data: { currentStreak },
    });
  }

  /**
   * Notify daily reminder
   */
  notifyDailyReminder(
    userId: string,
    suggestion: { workoutName: string; duration: number },
  ): void {
    this.notifyUser(userId, {
      type: 'workout',
      title: 'Time to Work Out!',
      message: `How about a ${suggestion.duration}-minute ${suggestion.workoutName}?`,
      data: suggestion,
    });
  }
}
