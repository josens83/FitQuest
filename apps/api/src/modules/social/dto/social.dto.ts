import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked',
}

export enum ActivityType {
  WORKOUT_COMPLETED = 'workout_completed',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_UP = 'level_up',
  STREAK_MILESTONE = 'streak_milestone',
  CHALLENGE_JOINED = 'challenge_joined',
  CHALLENGE_COMPLETED = 'challenge_completed',
}

// Friend DTOs
export class FriendDto {
  @ApiProperty({ example: 'usr_abc123' })
  userId: string;

  @ApiProperty({ example: '홍길동' })
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiProperty({ example: 15 })
  level: number;

  @ApiProperty({ example: 7 })
  currentStreak: number;

  @ApiProperty({ enum: FriendshipStatus })
  status: FriendshipStatus;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  friendsSince?: string;

  @ApiPropertyOptional({ example: true, description: 'Is online/recently active' })
  isActive?: boolean;
}

export class FriendRequestDto {
  @ApiProperty({ example: 'req_abc123' })
  id: string;

  @ApiProperty({ example: 'usr_sender123' })
  fromUserId: string;

  @ApiProperty({ example: '김철수' })
  fromUserName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  fromUserAvatar?: string;

  @ApiProperty({ example: 12 })
  fromUserLevel: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;
}

// Activity Feed DTOs
export class ActivityFeedItemDto {
  @ApiProperty({ example: 'act_abc123' })
  id: string;

  @ApiProperty({ example: 'usr_abc123' })
  userId: string;

  @ApiProperty({ example: '홍길동' })
  userName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  userAvatar?: string;

  @ApiProperty({ enum: ActivityType })
  type: ActivityType;

  @ApiProperty({ example: '전신 파워 트레이닝을 완료했습니다!' })
  message: string;

  @ApiPropertyOptional({
    example: {
      workoutId: 'wk_xyz789',
      workoutTitle: '전신 파워 트레이닝',
      xpEarned: 150,
    },
  })
  metadata?: Record<string, any>;

  @ApiProperty({ example: 5 })
  likeCount: number;

  @ApiProperty({ example: 2 })
  commentCount: number;

  @ApiProperty({ example: false, description: 'Has current user liked this' })
  isLiked: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;
}

export class ActivityCommentDto {
  @ApiProperty({ example: 'cmt_abc123' })
  id: string;

  @ApiProperty({ example: 'usr_commenter' })
  userId: string;

  @ApiProperty({ example: '김철수' })
  userName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  userAvatar?: string;

  @ApiProperty({ example: '대단해요! 화이팅!' })
  content: string;

  @ApiProperty({ example: '2024-01-15T11:00:00.000Z' })
  createdAt: string;
}

// Request DTOs
export class AddFriendDto {
  @ApiProperty({ example: 'usr_abc123', description: 'User ID to add as friend' })
  @IsUUID()
  userId: string;
}

export class SearchUsersDto {
  @ApiProperty({ example: '홍길동' })
  @IsString()
  @MaxLength(100)
  query: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

export class RespondFriendRequestDto {
  @ApiProperty({ example: 'accept' })
  @IsEnum(['accept', 'reject'])
  action: 'accept' | 'reject';
}

export class CreateCommentDto {
  @ApiProperty({ example: '대단해요! 화이팅!' })
  @IsString()
  @MaxLength(500)
  content: string;
}

export class ActivityFeedFilterDto {
  @ApiPropertyOptional({ description: 'Filter by friend activities only' })
  @IsOptional()
  friendsOnly?: boolean;

  @ApiPropertyOptional({ enum: ActivityType })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @ApiPropertyOptional({ example: 'usr_abc123', description: 'Filter by specific user' })
  @IsOptional()
  @IsString()
  userId?: string;
}
