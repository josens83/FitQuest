import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';

export enum NotificationType {
  ACHIEVEMENT = 'achievement',
  CHALLENGE = 'challenge',
  FRIEND = 'friend',
  SYSTEM = 'system',
  WORKOUT = 'workout',
}

export enum LeaderboardType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all-time',
}

export enum ActivityType {
  WORKOUT_COMPLETED = 'workout_completed',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  CHALLENGE_JOINED = 'challenge_joined',
  LEVEL_UP = 'level_up',
}

// WebSocket event payloads

export class SubscribeLeaderboardDto {
  @ApiProperty({
    enum: LeaderboardType,
    description: 'Type of leaderboard to subscribe',
  })
  @IsEnum(LeaderboardType)
  type: LeaderboardType;
}

export class SubscribeChallengeDto {
  @ApiProperty({ description: 'Challenge ID to subscribe' })
  @IsString()
  challengeId: string;
}

export class WorkoutProgressDto {
  @ApiProperty({ description: 'Session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Current exercise index' })
  @IsNumber()
  @Min(0)
  exerciseIndex: number;

  @ApiProperty({ description: 'Current set index' })
  @IsNumber()
  @Min(0)
  setIndex: number;

  @ApiProperty({ description: 'Reps completed' })
  @IsNumber()
  @Min(0)
  reps: number;

  @ApiPropertyOptional({ description: 'Weight used (kg)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ description: 'Duration (seconds)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;
}

export class WatchWorkoutDto {
  @ApiProperty({ description: 'Session ID to watch' })
  @IsString()
  sessionId: string;
}

export class ChatTypingDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @IsString()
  recipientId: string;
}

export class ChatMessageDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @IsString()
  recipientId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  message: string;
}

// Response DTOs

export class NotificationResponseDto {
  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  timestamp: Date;

  @ApiPropertyOptional()
  data?: Record<string, unknown>;
}

export class LeaderboardEntryDto {
  @ApiProperty({ description: 'Rank position' })
  rank: number;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Score value' })
  score: number;

  @ApiProperty({ description: 'Rank change (+/-)', example: 2 })
  change: number;
}

export class LeaderboardUpdateDto {
  @ApiProperty({ enum: LeaderboardType })
  type: LeaderboardType;

  @ApiProperty({ type: [LeaderboardEntryDto] })
  entries: LeaderboardEntryDto[];
}

export class ActivityFeedItemDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ enum: ActivityType })
  type: ActivityType;

  @ApiProperty()
  message: string;

  @ApiProperty()
  timestamp: Date;

  @ApiPropertyOptional()
  data?: Record<string, unknown>;
}

export class UserOnlineStatusDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  isOnline: boolean;
}

export class ChallengeProgressUpdateDto {
  @ApiProperty()
  challengeId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  progress: number;

  @ApiPropertyOptional()
  milestone?: string;

  @ApiProperty()
  timestamp: Date;
}

export class WorkoutProgressBroadcastDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  exerciseIndex: number;

  @ApiProperty()
  setIndex: number;

  @ApiProperty()
  reps: number;

  @ApiPropertyOptional()
  weight?: number;

  @ApiPropertyOptional()
  duration?: number;

  @ApiProperty()
  timestamp: Date;
}

export class ChatMessageReceivedDto {
  @ApiProperty()
  from: {
    userId: string;
    username: string;
  };

  @ApiProperty()
  message: string;

  @ApiProperty()
  timestamp: Date;
}
