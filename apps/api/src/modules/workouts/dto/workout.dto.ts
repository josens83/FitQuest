import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum WorkoutCategory {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  YOGA = 'yoga',
  HIIT = 'hiit',
  STRETCHING = 'stretching',
  PILATES = 'pilates',
  DANCE = 'dance',
}

export enum WorkoutDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

// Exercise DTOs
export class ExerciseDto {
  @ApiProperty({ example: 'ex_123' })
  id: string;

  @ApiProperty({ example: '스쿼트' })
  name: string;

  @ApiPropertyOptional({ example: '기본 스쿼트 자세로 하체 근력을 강화합니다.' })
  description?: string;

  @ApiProperty({ example: 45 })
  duration: number; // seconds

  @ApiPropertyOptional({ example: 15 })
  reps?: number;

  @ApiPropertyOptional({ example: 3 })
  sets?: number;

  @ApiPropertyOptional({ example: 'https://example.com/videos/squat.mp4' })
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/images/squat.jpg' })
  thumbnailUrl?: string;

  @ApiProperty({ example: 0 })
  order: number;
}

// Response DTOs
export class WorkoutResponseDto {
  @ApiProperty({ example: 'wk_abc123' })
  id: string;

  @ApiProperty({ example: '전신 파워 트레이닝' })
  title: string;

  @ApiPropertyOptional({ example: '근력과 지구력을 동시에 기르는 전신 운동' })
  description?: string;

  @ApiProperty({ enum: WorkoutCategory })
  category: WorkoutCategory;

  @ApiProperty({ enum: WorkoutDifficulty })
  difficulty: WorkoutDifficulty;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  duration: number;

  @ApiProperty({ example: 250, description: 'Estimated calories burned' })
  calories: number;

  @ApiProperty({ example: 150 })
  xpReward: number;

  @ApiPropertyOptional({ example: 'https://example.com/images/workout.jpg' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/videos/preview.mp4' })
  previewVideoUrl?: string;

  @ApiProperty({ example: false })
  isPremium: boolean;

  @ApiPropertyOptional({ type: [String], example: ['덤벨', '매트'] })
  equipment?: string[];

  @ApiPropertyOptional({ type: [String], example: ['근력', '전신', '체중 감량'] })
  tags?: string[];

  @ApiProperty({ example: 4.5 })
  rating: number;

  @ApiProperty({ example: 1250 })
  completionCount: number;
}

export class WorkoutDetailDto extends WorkoutResponseDto {
  @ApiProperty({ type: [ExerciseDto] })
  exercises: ExerciseDto[];

  @ApiPropertyOptional({ example: 'trainer_123' })
  trainerId?: string;

  @ApiPropertyOptional({ example: '김트레이너' })
  trainerName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/trainers/kim.jpg' })
  trainerAvatar?: string;
}

// Request DTOs
export class WorkoutFilterDto {
  @ApiPropertyOptional({ enum: WorkoutCategory })
  @IsOptional()
  @IsEnum(WorkoutCategory)
  category?: WorkoutCategory;

  @ApiPropertyOptional({ enum: WorkoutDifficulty })
  @IsOptional()
  @IsEnum(WorkoutDifficulty)
  difficulty?: WorkoutDifficulty;

  @ApiPropertyOptional({ example: 30, description: 'Maximum duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  @Type(() => Number)
  maxDuration?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPremium?: boolean;

  @ApiPropertyOptional({ example: ['덤벨'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiPropertyOptional({ example: '전신' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateWorkoutDto {
  @ApiProperty({ example: '전신 파워 트레이닝' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: '근력과 지구력을 동시에 기르는 전신 운동' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: WorkoutCategory })
  @IsEnum(WorkoutCategory)
  category: WorkoutCategory;

  @ApiProperty({ enum: WorkoutDifficulty })
  @IsEnum(WorkoutDifficulty)
  difficulty: WorkoutDifficulty;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(5)
  @Max(120)
  duration: number;

  @ApiProperty({ example: 250 })
  @IsInt()
  @Min(0)
  calories: number;

  @ApiPropertyOptional({ example: 'https://example.com/images/workout.jpg' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}

export class UpdateWorkoutDto {
  @ApiPropertyOptional({ example: '전신 파워 트레이닝 v2' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: '업데이트된 설명' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: WorkoutCategory })
  @IsOptional()
  @IsEnum(WorkoutCategory)
  category?: WorkoutCategory;

  @ApiPropertyOptional({ enum: WorkoutDifficulty })
  @IsOptional()
  @IsEnum(WorkoutDifficulty)
  difficulty?: WorkoutDifficulty;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  duration?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}
