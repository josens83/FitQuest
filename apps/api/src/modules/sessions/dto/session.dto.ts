import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ABANDONED = 'abandoned',
}

// Response DTOs
export class SessionResponseDto {
  @ApiProperty({ example: 'sess_abc123' })
  id: string;

  @ApiProperty({ example: 'wk_xyz789' })
  workoutId: string;

  @ApiProperty({ example: 'usr_def456' })
  userId: string;

  @ApiProperty({ enum: SessionStatus })
  status: SessionStatus;

  @ApiProperty({ example: 75, description: 'Progress percentage' })
  progress: number;

  @ApiProperty({ example: 5, description: 'Current exercise index' })
  currentExerciseIndex: number;

  @ApiPropertyOptional({ example: 1200, description: 'Elapsed time in seconds' })
  elapsedTime?: number;

  @ApiPropertyOptional({ example: 150, description: 'Calories burned so far' })
  caloriesBurned?: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  startedAt: string;

  @ApiPropertyOptional({ example: '2024-01-15T11:00:00.000Z' })
  completedAt?: string;
}

export class SessionCompleteResponseDto {
  @ApiProperty({ type: SessionResponseDto })
  session: SessionResponseDto;

  @ApiProperty({ example: 150 })
  xpEarned: number;

  @ApiProperty({
    example: {
      base: 100,
      streakBonus: 20,
      difficultyBonus: 15,
      completionBonus: 15,
    },
  })
  xpBreakdown: {
    base: number;
    streakBonus: number;
    difficultyBonus: number;
    completionBonus: number;
  };

  @ApiProperty({ example: true })
  levelUp: boolean;

  @ApiPropertyOptional({ example: 16 })
  newLevel?: number;

  @ApiProperty({
    example: [
      { id: 'ach_1', name: '첫 운동 완료', tier: 'bronze' },
    ],
    type: 'array',
  })
  achievementsUnlocked: {
    id: string;
    name: string;
    tier: string;
    xpReward: number;
  }[];

  @ApiProperty({
    example: {
      currentStreak: 8,
      longestStreak: 15,
      streakMultiplier: 1.2,
    },
  })
  streakInfo: {
    currentStreak: number;
    longestStreak: number;
    streakMultiplier: number;
    nextMilestone?: number;
  };
}

export class SessionHistoryDto {
  @ApiProperty({ example: 'sess_abc123' })
  id: string;

  @ApiProperty({ example: 'wk_xyz789' })
  workoutId: string;

  @ApiProperty({ example: '전신 파워 트레이닝' })
  workoutTitle: string;

  @ApiProperty({ example: 'strength' })
  workoutCategory: string;

  @ApiProperty({ enum: SessionStatus })
  status: SessionStatus;

  @ApiProperty({ example: 1800, description: 'Duration in seconds' })
  duration: number;

  @ApiProperty({ example: 250 })
  caloriesBurned: number;

  @ApiProperty({ example: 150 })
  xpEarned: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  completedAt: string;

  @ApiPropertyOptional({ example: 4 })
  rating?: number;
}

// Request DTOs
export class StartSessionDto {
  @ApiProperty({ example: 'wk_xyz789' })
  @IsUUID()
  workoutId: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional({ example: 5, description: 'Current exercise index' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  exerciseIndex?: number;

  @ApiPropertyOptional({ example: 75, description: 'Progress percentage' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progress?: number;

  @ApiPropertyOptional({ example: 150, description: 'Current calories burned' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  caloriesBurned?: number;

  @ApiPropertyOptional({ example: 600, description: 'Current elapsed time in seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  elapsedTime?: number;
}

export class PauseSessionDto {
  @ApiPropertyOptional({ example: 'Taking a short break' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CompleteSessionDto {
  @ApiProperty({ example: 1800, description: 'Actual duration in seconds' })
  @IsInt()
  @Min(0)
  actualDuration: number;

  @ApiProperty({ example: 250 })
  @IsInt()
  @Min(0)
  caloriesBurned: number;

  @ApiPropertyOptional({ example: 4, description: 'Rating 1-5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: '좋은 운동이었습니다!' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}

export class AbandonSessionDto {
  @ApiPropertyOptional({ example: 'Too tired to continue' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({ example: 600, description: 'Time at abandonment in seconds' })
  @IsInt()
  @Min(0)
  abandonedAt: number;
}

export class SessionFilterDto {
  @ApiPropertyOptional({ enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-01-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'wk_xyz789' })
  @IsOptional()
  @IsString()
  workoutId?: string;
}
