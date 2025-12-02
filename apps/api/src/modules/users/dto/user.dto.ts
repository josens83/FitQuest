import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export enum FitnessGoal {
  LOSE_WEIGHT = 'lose_weight',
  BUILD_MUSCLE = 'build_muscle',
  STAY_FIT = 'stay_fit',
  INCREASE_ENDURANCE = 'increase_endurance',
}

export enum FitnessLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

// Response DTOs
export class UserResponseDto {
  @ApiProperty({ example: 'usr_abc123' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: '홍길동' })
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiProperty({ example: 15 })
  level: number;

  @ApiProperty({ example: 12500 })
  totalXp: number;

  @ApiProperty({ example: 7 })
  currentStreak: number;

  @ApiProperty({ example: 30 })
  longestStreak: number;

  @ApiPropertyOptional({ enum: FitnessGoal })
  fitnessGoal?: FitnessGoal;

  @ApiPropertyOptional({ enum: FitnessLevel })
  fitnessLevel?: FitnessLevel;

  @ApiProperty({ example: false })
  isPremium: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;
}

export class UserStatsDto {
  @ApiProperty({ example: 150 })
  totalWorkouts: number;

  @ApiProperty({ example: 4500 })
  totalMinutes: number;

  @ApiProperty({ example: 35000 })
  totalCalories: number;

  @ApiProperty({ example: 30 })
  longestStreak: number;

  @ApiProperty({ example: 25 })
  achievementsUnlocked: number;

  @ApiProperty({ example: 15 })
  challengesCompleted: number;

  @ApiProperty({
    example: { strength: 45, cardio: 35, yoga: 20, hiit: 30, stretching: 20 },
  })
  workoutsByCategory: Record<string, number>;

  @ApiProperty({
    example: [
      { date: '2024-01-15', workouts: 2, minutes: 60 },
      { date: '2024-01-14', workouts: 1, minutes: 30 },
    ],
  })
  recentActivity: {
    date: string;
    workouts: number;
    minutes: number;
  }[];
}

// Request DTOs
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '홍길동', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({ enum: FitnessGoal })
  @IsOptional()
  @IsEnum(FitnessGoal)
  fitnessGoal?: FitnessGoal;

  @ApiPropertyOptional({ enum: FitnessLevel })
  @IsOptional()
  @IsEnum(FitnessLevel)
  fitnessLevel?: FitnessLevel;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  weeklyGoal?: number;

  @ApiPropertyOptional({ example: 'Asia/Seoul' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentPassword123' })
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @ApiProperty({ example: 'newPassword456' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class UpdateEmailDto {
  @ApiProperty({ example: 'newemail@example.com' })
  @IsEmail()
  newEmail: string;

  @ApiProperty({ example: 'currentPassword123' })
  @IsString()
  password: string;
}

export class UserSettingsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  pushNotifications?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  workoutReminders?: boolean;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  reminderTime?: string;

  @ApiPropertyOptional({ example: 'ko' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'metric' })
  @IsOptional()
  @IsString()
  unitSystem?: 'metric' | 'imperial';
}
