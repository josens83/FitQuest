import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ChallengeType {
  WORKOUT_COUNT = 'workout_count',
  TOTAL_MINUTES = 'total_minutes',
  TOTAL_CALORIES = 'total_calories',
  STREAK = 'streak',
  SPECIFIC_WORKOUT = 'specific_workout',
}

export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Response DTOs
export class ChallengeParticipantDto {
  @ApiProperty({ example: 'usr_abc123' })
  userId: string;

  @ApiProperty({ example: '홍길동' })
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiProperty({ example: 750 })
  score: number;

  @ApiProperty({ example: 2 })
  rank: number;

  @ApiProperty({ example: 75, description: 'Progress percentage' })
  progress: number;
}

export class ChallengeResponseDto {
  @ApiProperty({ example: 'ch_abc123' })
  id: string;

  @ApiProperty({ example: '1월 피트니스 챌린지' })
  title: string;

  @ApiPropertyOptional({ example: '한 달 동안 30회 운동을 완료하세요' })
  description?: string;

  @ApiProperty({ enum: ChallengeType })
  type: ChallengeType;

  @ApiProperty({ enum: ChallengeStatus })
  status: ChallengeStatus;

  @ApiProperty({ example: 30, description: 'Target value' })
  targetValue: number;

  @ApiProperty({ example: 200, description: 'XP reward for completion' })
  xpReward: number;

  @ApiPropertyOptional({ example: 'https://example.com/images/challenge.jpg' })
  imageUrl?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  startDate: string;

  @ApiProperty({ example: '2024-01-31T23:59:59.000Z' })
  endDate: string;

  @ApiProperty({ example: 150 })
  participantCount: number;

  @ApiPropertyOptional({ example: true, description: 'Is current user participating' })
  isParticipating?: boolean;

  @ApiPropertyOptional({ example: 15, description: 'Current user progress value' })
  userProgress?: number;

  @ApiPropertyOptional({ example: 50, description: 'Current user progress percentage' })
  userProgressPercent?: number;
}

export class ChallengeDetailDto extends ChallengeResponseDto {
  @ApiProperty({ type: [ChallengeParticipantDto] })
  topParticipants: ChallengeParticipantDto[];

  @ApiPropertyOptional({ type: ChallengeParticipantDto })
  userParticipation?: ChallengeParticipantDto;

  @ApiPropertyOptional({ example: 'usr_creator123' })
  creatorId?: string;

  @ApiPropertyOptional({ example: '김트레이너' })
  creatorName?: string;
}

// Request DTOs
export class CreateChallengeDto {
  @ApiProperty({ example: '1월 피트니스 챌린지' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: '한 달 동안 30회 운동을 완료하세요' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: ChallengeType })
  @IsEnum(ChallengeType)
  type: ChallengeType;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  targetValue: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ example: '2024-01-31T23:59:59.000Z' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ example: ['usr_friend1', 'usr_friend2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  invitedUserIds?: string[];
}

export class JoinChallengeDto {
  @ApiProperty({ example: 'ch_abc123' })
  @IsUUID()
  challengeId: string;
}

export class ChallengeFilterDto {
  @ApiPropertyOptional({ enum: ChallengeStatus })
  @IsOptional()
  @IsEnum(ChallengeStatus)
  status?: ChallengeStatus;

  @ApiPropertyOptional({ enum: ChallengeType })
  @IsOptional()
  @IsEnum(ChallengeType)
  type?: ChallengeType;

  @ApiPropertyOptional({ description: 'Only show challenges user is participating in' })
  @IsOptional()
  participating?: boolean;

  @ApiPropertyOptional({ description: 'Only show challenges created by user' })
  @IsOptional()
  created?: boolean;
}

export class UpdateChallengeProgressDto {
  @ApiProperty({ example: 15, description: 'New progress value' })
  @IsInt()
  @Min(0)
  progressValue: number;
}
