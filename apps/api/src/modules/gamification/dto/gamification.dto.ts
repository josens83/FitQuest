import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum AchievementCategory {
  WORKOUT = 'workout',
  STREAK = 'streak',
  SOCIAL = 'social',
  MILESTONE = 'milestone',
  SPECIAL = 'special',
}

export enum LeaderboardType {
  XP = 'xp',
  WORKOUTS = 'workouts',
  STREAK = 'streak',
  CALORIES = 'calories',
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'alltime',
}

// Achievement DTOs
export class AchievementResponseDto {
  @ApiProperty({ example: 'ach_abc123' })
  id: string;

  @ApiProperty({ example: '첫 운동 완료' })
  name: string;

  @ApiProperty({ example: '첫 번째 운동을 완료하세요' })
  description: string;

  @ApiProperty({ enum: AchievementCategory })
  category: AchievementCategory;

  @ApiProperty({ enum: AchievementTier })
  tier: AchievementTier;

  @ApiProperty({ example: 'https://example.com/badges/first-workout.png' })
  iconUrl: string;

  @ApiProperty({ example: 50 })
  xpReward: number;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  unlockedAt?: string;

  @ApiProperty({ example: 100, description: 'Progress percentage' })
  progress: number;

  @ApiPropertyOptional({ example: '1/1 workouts' })
  progressDescription?: string;
}

export class AchievementFilterDto {
  @ApiPropertyOptional({ enum: AchievementCategory })
  @IsOptional()
  @IsEnum(AchievementCategory)
  category?: AchievementCategory;

  @ApiPropertyOptional({ enum: AchievementTier })
  @IsOptional()
  @IsEnum(AchievementTier)
  tier?: AchievementTier;

  @ApiPropertyOptional({ description: 'true for unlocked only, false for locked only' })
  @IsOptional()
  unlocked?: boolean;
}

// XP DTOs
export class XPHistoryItemDto {
  @ApiProperty({ example: 'xp_abc123' })
  id: string;

  @ApiProperty({ example: 150 })
  amount: number;

  @ApiProperty({ example: 'workout' })
  source: 'workout' | 'achievement' | 'streak' | 'challenge' | 'daily_bonus' | 'referral';

  @ApiProperty({ example: '전신 파워 트레이닝 완료' })
  description: string;

  @ApiPropertyOptional({ example: 'sess_xyz789' })
  referenceId?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;
}

export class LevelInfoDto {
  @ApiProperty({ example: 15 })
  currentLevel: number;

  @ApiProperty({ example: 12500 })
  totalXp: number;

  @ApiProperty({ example: 12000 })
  currentLevelXp: number;

  @ApiProperty({ example: 15000 })
  nextLevelXp: number;

  @ApiProperty({ example: 83.3, description: 'Progress to next level (%)' })
  progress: number;

  @ApiProperty({ example: 2500, description: 'XP needed for next level' })
  xpToNextLevel: number;
}

// Streak DTOs
export class StreakInfoDto {
  @ApiProperty({ example: 7 })
  currentStreak: number;

  @ApiProperty({ example: 30 })
  longestStreak: number;

  @ApiProperty({ example: '2024-01-15' })
  lastWorkoutDate: string;

  @ApiProperty({ example: 1.2 })
  streakMultiplier: number;

  @ApiPropertyOptional({ example: 14 })
  nextMilestone?: number;

  @ApiProperty({ example: 7, description: 'Days to next milestone' })
  daysToNextMilestone: number;

  @ApiProperty({
    example: [
      { date: '2024-01-15', completed: true },
      { date: '2024-01-14', completed: true },
    ],
    description: 'Last 7 days activity',
  })
  recentDays: { date: string; completed: boolean }[];
}

// Leaderboard DTOs
export class LeaderboardEntryDto {
  @ApiProperty({ example: 1 })
  rank: number;

  @ApiProperty({ example: 'usr_abc123' })
  userId: string;

  @ApiProperty({ example: '홍길동' })
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiProperty({ example: 12500 })
  score: number;

  @ApiProperty({ example: 15 })
  level: number;

  @ApiPropertyOptional({ example: 2, description: 'Rank change from previous period' })
  rankChange?: number;
}

export class LeaderboardResponseDto {
  @ApiProperty({ enum: LeaderboardType })
  type: LeaderboardType;

  @ApiProperty({ enum: LeaderboardPeriod })
  period: LeaderboardPeriod;

  @ApiProperty({ type: [LeaderboardEntryDto] })
  entries: LeaderboardEntryDto[];

  @ApiPropertyOptional({ example: 42, description: 'Current user rank' })
  userRank?: number;

  @ApiPropertyOptional({ type: LeaderboardEntryDto })
  userEntry?: LeaderboardEntryDto;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

export class LeaderboardQueryDto {
  @ApiPropertyOptional({ enum: LeaderboardType, default: LeaderboardType.XP })
  @IsOptional()
  @IsEnum(LeaderboardType)
  type?: LeaderboardType = LeaderboardType.XP;

  @ApiPropertyOptional({ enum: LeaderboardPeriod, default: LeaderboardPeriod.WEEKLY })
  @IsOptional()
  @IsEnum(LeaderboardPeriod)
  period?: LeaderboardPeriod = LeaderboardPeriod.WEEKLY;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}
