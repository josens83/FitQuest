import { Injectable } from '@nestjs/common';
import { prisma } from '@fitquest/database';
import {
  calculateLevel,
  getXPForNextLevel,
  getTitleForLevel,
  calculateWorkoutXP,
  calculateStreak,
  updateStatsFromWorkout,
  isEarlyBirdWorkout,
  isNightOwlWorkout,
  ACHIEVEMENT_DEFINITIONS,
} from '@fitquest/utils';
import type { Difficulty, WorkoutCategory, UserStats } from '@fitquest/types';

@Injectable()
export class GamificationService {
  async processWorkoutCompletion(
    userId: string,
    workoutId: string,
    data: {
      duration: number;
      calories: number;
      category: string;
      difficulty: string;
    },
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const now = new Date();
    const isFirstOfDay =
      !user.lastWorkoutAt ||
      user.lastWorkoutAt.toDateString() !== now.toDateString();

    // Calculate XP
    const xpEarned = calculateWorkoutXP(
      data.difficulty as Difficulty,
      user.currentStreak,
      isFirstOfDay,
    );

    // Calculate new streak
    const newStreak = calculateStreak(user.lastWorkoutAt, user.currentStreak);
    const longestStreak = Math.max(newStreak, user.longestStreak);

    // Update stats
    const currentStats = user.stats as unknown as UserStats;
    const newStats = updateStatsFromWorkout(
      currentStats,
      data.category as WorkoutCategory,
      data.difficulty as Difficulty,
    );

    // Calculate new level
    const newTotalXP = user.totalXP + xpEarned;
    const newLevel = calculateLevel(newTotalXP);
    const xpToNextLevel = getXPForNextLevel(newLevel, newTotalXP);

    // Check for level up
    const leveledUp = newLevel > user.level;
    const newTitle = leveledUp ? getTitleForLevel(newLevel) : undefined;

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalXP: newTotalXP,
        currentXP: newTotalXP - calculateLevelBaseXP(newLevel),
        xpToNextLevel,
        level: newLevel,
        currentStreak: newStreak,
        longestStreak,
        lastWorkoutAt: now,
        stats: newStats as any,
      },
    });

    // Check and update achievements
    const achievements = await this.checkAchievements(userId);
    const badgesEarned: string[] = [];

    // Check for special achievements
    if (isEarlyBirdWorkout(now)) {
      const earlyBird = await this.unlockAchievement(userId, 'early_bird');
      if (earlyBird) badgesEarned.push('early_bird');
    }
    if (isNightOwlWorkout(now)) {
      const nightOwl = await this.unlockAchievement(userId, 'night_owl');
      if (nightOwl) badgesEarned.push('night_owl');
    }

    // Check streak achievements
    const streakAchievements = ['streak_3', 'streak_7', 'streak_30', 'streak_100', 'streak_365'];
    for (const achId of streakAchievements) {
      const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achId);
      if (def && newStreak >= def.requirement.target) {
        const unlocked = await this.unlockAchievement(userId, achId);
        if (unlocked) badgesEarned.push(achId);
      }
    }

    // Create activity feed
    await prisma.activityFeed.create({
      data: {
        userId,
        type: 'workout',
        title: '운동 완료',
        description: `${Math.round(data.duration / 60)}분 운동으로 ${xpEarned} XP 획득!`,
        referenceId: workoutId,
        referenceType: 'workout',
      },
    });

    // Create level up feed if leveled up
    if (leveledUp) {
      await prisma.activityFeed.create({
        data: {
          userId,
          type: 'level_up',
          title: `레벨 ${newLevel} 달성!`,
          description: newTitle ? `새로운 칭호: ${newTitle}` : undefined,
        },
      });
    }

    return {
      xpEarned,
      totalXP: newTotalXP,
      level: newLevel,
      leveledUp,
      newTitle,
      streak: newStreak,
      statGains: {
        strength: newStats.strength - currentStats.strength,
        endurance: newStats.endurance - currentStats.endurance,
        flexibility: newStats.flexibility - currentStats.flexibility,
        balance: newStats.balance - currentStats.balance,
        mindfulness: newStats.mindfulness - currentStats.mindfulness,
      },
      badgesEarned,
      personalRecords: [],
    };
  }

  async checkAchievements(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workoutSessions: { where: { status: 'completed' } },
        achievements: true,
      },
    });

    if (!user) return [];

    const totalWorkouts = user.workoutSessions.length;
    const totalCalories = user.workoutSessions.reduce(
      (sum, s) => sum + (s.caloriesBurned || 0),
      0,
    );

    const newlyUnlocked: string[] = [];

    // Check workout count achievements
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      if (def.requirement.type === 'workouts') {
        if (totalWorkouts >= def.requirement.target) {
          const unlocked = await this.unlockAchievement(userId, def.id);
          if (unlocked) newlyUnlocked.push(def.id);
        }
      }
      if (def.requirement.type === 'calories') {
        if (totalCalories >= def.requirement.target) {
          const unlocked = await this.unlockAchievement(userId, def.id);
          if (unlocked) newlyUnlocked.push(def.id);
        }
      }
    }

    return newlyUnlocked;
  }

  async unlockAchievement(userId: string, achievementId: string) {
    const existing = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    });

    if (existing?.unlockedAt) return false;

    const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
    if (!def) return false;

    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      update: {
        unlockedAt: new Date(),
        progress: def.requirement.target,
      },
      create: {
        userId,
        achievementId,
        progress: def.requirement.target,
        target: def.requirement.target,
        unlockedAt: new Date(),
      },
    });

    // Award XP
    await prisma.user.update({
      where: { id: userId },
      data: { totalXP: { increment: def.xpReward } },
    });

    // Create activity
    await prisma.activityFeed.create({
      data: {
        userId,
        type: 'achievement',
        title: `업적 달성: ${def.name}`,
        description: `+${def.xpReward} XP`,
        referenceId: achievementId,
        referenceType: 'achievement',
      },
    });

    return true;
  }

  async getLeaderboard(
    type: 'weekly' | 'monthly' | 'all_time',
    category: 'xp' | 'workouts' | 'calories' | 'streak',
    limit = 50,
  ) {
    let orderBy: any;
    switch (category) {
      case 'xp':
        orderBy = { totalXP: 'desc' };
        break;
      case 'streak':
        orderBy = { currentStreak: 'desc' };
        break;
      case 'workouts':
      case 'calories':
      default:
        orderBy = { totalXP: 'desc' };
    }

    const users = await prisma.user.findMany({
      orderBy,
      take: limit,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        level: true,
        totalXP: true,
        currentStreak: true,
      },
    });

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      avatar: user.avatarUrl,
      level: user.level,
      value:
        category === 'xp'
          ? user.totalXP
          : category === 'streak'
            ? user.currentStreak
            : user.totalXP,
      change: 0,
    }));
  }

  async getUserAchievements(userId: string) {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
    });

    return ACHIEVEMENT_DEFINITIONS.map((def) => {
      const userAch = achievements.find((a) => a.achievementId === def.id);
      return {
        ...def,
        progress: userAch?.progress || 0,
        target: def.requirement.target,
        unlockedAt: userAch?.unlockedAt,
        isUnlocked: !!userAch?.unlockedAt,
      };
    });
  }
}

function calculateLevelBaseXP(level: number): number {
  // Simplified - should match LEVEL_REQUIREMENTS
  const xpPerLevel = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
  if (level <= 10) return xpPerLevel[level - 1] || 0;
  return 2700 + (level - 10) * 500;
}
