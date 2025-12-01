import {
  LEVEL_REQUIREMENTS,
  ACHIEVEMENT_DEFINITIONS,
  XP_REWARDS,
  type UserStats,
  type Difficulty,
  type WorkoutCategory,
  type LevelRequirement,
} from '@fitquest/types';

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  for (const req of LEVEL_REQUIREMENTS) {
    if (totalXP >= req.xp) {
      level = req.level;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Get level requirement for a specific level
 */
export function getLevelRequirement(level: number): LevelRequirement | undefined {
  return LEVEL_REQUIREMENTS.find((req) => req.level === level);
}

/**
 * Calculate XP needed for next level
 */
export function getXPForNextLevel(currentLevel: number, totalXP: number): number {
  const nextReq = LEVEL_REQUIREMENTS.find((req) => req.level > currentLevel);
  if (!nextReq) return 0;
  return Math.max(0, nextReq.xp - totalXP);
}

/**
 * Calculate XP progress percentage to next level
 */
export function getLevelProgress(level: number, totalXP: number): number {
  const currentReq = getLevelRequirement(level);
  const nextReq = LEVEL_REQUIREMENTS.find((req) => req.level > level);

  if (!currentReq || !nextReq) return 100;

  const xpInCurrentLevel = totalXP - currentReq.xp;
  const xpNeeded = nextReq.xp - currentReq.xp;

  return Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100));
}

/**
 * Get title for a level
 */
export function getTitleForLevel(level: number): string {
  let title = '운동 입문';
  for (const req of LEVEL_REQUIREMENTS) {
    if (level >= req.level) {
      title = req.title;
    } else {
      break;
    }
  }
  return title;
}

/**
 * Calculate XP reward for completing a workout
 */
export function calculateWorkoutXP(
  difficulty: Difficulty,
  streak: number,
  isFirstOfDay: boolean
): number {
  const xpKey = `workout_${difficulty}` as keyof typeof XP_REWARDS;
  let xp = XP_REWARDS[xpKey]?.baseXP || 50;

  // First workout of the day bonus
  if (isFirstOfDay) {
    xp += XP_REWARDS.first_workout_day.baseXP;
  }

  // Streak bonuses
  if (streak >= 30) {
    xp = Math.round(xp * 1.5); // 50% bonus for 30+ day streak
  } else if (streak >= 7) {
    xp = Math.round(xp * 1.25); // 25% bonus for 7+ day streak
  } else if (streak >= 3) {
    xp = Math.round(xp * 1.1); // 10% bonus for 3+ day streak
  }

  return xp;
}

/**
 * Update user stats based on workout category
 */
export function updateStatsFromWorkout(
  currentStats: UserStats,
  category: WorkoutCategory,
  difficulty: Difficulty
): UserStats {
  const statIncrease = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  }[difficulty];

  const newStats = { ...currentStats };

  switch (category) {
    case 'strength':
    case 'hiit':
      newStats.strength += statIncrease;
      newStats.endurance += Math.round(statIncrease * 0.5);
      break;
    case 'cardio':
    case 'running':
    case 'boxing':
      newStats.endurance += statIncrease;
      newStats.strength += Math.round(statIncrease * 0.3);
      break;
    case 'yoga':
    case 'stretching':
      newStats.flexibility += statIncrease;
      newStats.balance += Math.round(statIncrease * 0.7);
      newStats.mindfulness += Math.round(statIncrease * 0.5);
      break;
    case 'pilates':
    case 'posture':
      newStats.flexibility += Math.round(statIncrease * 0.7);
      newStats.strength += Math.round(statIncrease * 0.5);
      newStats.balance += statIncrease;
      break;
    case 'meditation':
      newStats.mindfulness += statIncrease;
      break;
    case 'dance':
      newStats.endurance += Math.round(statIncrease * 0.7);
      newStats.flexibility += Math.round(statIncrease * 0.5);
      newStats.balance += Math.round(statIncrease * 0.5);
      break;
  }

  return newStats;
}

/**
 * Calculate streak from last workout date
 */
export function calculateStreak(lastWorkoutAt: Date | null, currentStreak: number): number {
  if (!lastWorkoutAt) return 0;

  const now = new Date();
  const lastWorkout = new Date(lastWorkoutAt);

  // Reset time to midnight for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDay = new Date(lastWorkout.getFullYear(), lastWorkout.getMonth(), lastWorkout.getDate());

  const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day - keep streak
    return currentStreak;
  } else if (diffDays === 1) {
    // Yesterday - streak continues
    return currentStreak + 1;
  } else {
    // More than 1 day - reset streak
    return 1;
  }
}

/**
 * Check if workout was early morning (before 6 AM)
 */
export function isEarlyBirdWorkout(date: Date): boolean {
  return new Date(date).getHours() < 6;
}

/**
 * Check if workout was late night (after 11 PM)
 */
export function isNightOwlWorkout(date: Date): boolean {
  return new Date(date).getHours() >= 23;
}

/**
 * Get achievement definition by ID
 */
export function getAchievementDefinition(achievementId: string) {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
}

/**
 * Check achievements progress and return newly unlocked achievements
 */
export function checkAchievements(
  achievements: Array<{ achievementId: string; progress: number; target: number; unlockedAt?: Date }>,
  stats: {
    totalWorkouts: number;
    currentStreak: number;
    totalCalories: number;
    categoriesWorkedOut: number;
    friendsCount: number;
    challengesCompleted: number;
    hasEarlyWorkout: boolean;
    hasLateWorkout: boolean;
  }
): string[] {
  const newlyUnlocked: string[] = [];

  for (const achievement of achievements) {
    if (achievement.unlockedAt) continue; // Already unlocked

    const def = getAchievementDefinition(achievement.achievementId);
    if (!def) continue;

    let currentProgress = 0;

    switch (def.requirement.type) {
      case 'workouts':
        currentProgress = stats.totalWorkouts;
        break;
      case 'streak':
        currentProgress = stats.currentStreak;
        break;
      case 'calories':
        currentProgress = stats.totalCalories;
        break;
      case 'categories':
        currentProgress = stats.categoriesWorkedOut;
        break;
      case 'friends':
        currentProgress = stats.friendsCount;
        break;
      case 'challenges':
        currentProgress = stats.challengesCompleted;
        break;
      case 'early_workout':
        currentProgress = stats.hasEarlyWorkout ? 1 : 0;
        break;
      case 'late_workout':
        currentProgress = stats.hasLateWorkout ? 1 : 0;
        break;
    }

    if (currentProgress >= def.requirement.target && !achievement.unlockedAt) {
      newlyUnlocked.push(achievement.achievementId);
    }
  }

  return newlyUnlocked;
}

/**
 * Determine fitness class based on workout history
 */
export function determineFitnessClass(
  categoryCounts: Record<WorkoutCategory, number>
): string {
  const total = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  if (total < 10) return 'beginner';

  const maxCategory = Object.entries(categoryCounts).reduce((a, b) =>
    a[1] > b[1] ? a : b
  );

  const categoryToClass: Record<string, string> = {
    strength: 'warrior',
    hiit: 'warrior',
    cardio: 'runner',
    running: 'runner',
    yoga: 'yogi',
    meditation: 'yogi',
    pilates: 'yogi',
    dance: 'dancer',
  };

  // If no strong preference (max < 40% of total), return athlete
  if (maxCategory[1] / total < 0.4) return 'athlete';

  return categoryToClass[maxCategory[0]] || 'athlete';
}
