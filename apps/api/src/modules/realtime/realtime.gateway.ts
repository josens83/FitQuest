import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

interface NotificationPayload {
  type: 'achievement' | 'challenge' | 'friend' | 'system' | 'workout';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

interface LeaderboardUpdatePayload {
  type: 'daily' | 'weekly' | 'monthly' | 'all-time';
  entries: Array<{
    rank: number;
    userId: string;
    username: string;
    score: number;
    change: number;
  }>;
}

interface ActivityFeedPayload {
  userId: string;
  username: string;
  type: 'workout_completed' | 'achievement_unlocked' | 'challenge_joined' | 'level_up';
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

interface WorkoutProgressPayload {
  sessionId: string;
  exerciseIndex: number;
  setIndex: number;
  reps: number;
  weight?: number;
  duration?: number;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/realtime',
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedUsers = new Map<string, Set<string>>(); // userId -> socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      client.userId = payload.sub;
      client.username = payload.username;

      // Track connected users
      if (!this.connectedUsers.has(client.userId)) {
        this.connectedUsers.set(client.userId, new Set());
      }
      this.connectedUsers.get(client.userId).add(client.id);

      // Join user-specific room
      client.join(`user:${client.userId}`);

      this.logger.log(
        `Client connected: ${client.id} (User: ${client.userId})`,
      );

      // Notify friends that user is online
      this.server.emit('user:online', {
        userId: client.userId,
        username: client.username,
      });
    } catch (error) {
      this.logger.warn(
        `Client ${client.id} connection rejected: Invalid token`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(client.userId);
          // Notify friends that user is offline
          this.server.emit('user:offline', {
            userId: client.userId,
            username: client.username,
          });
        }
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return client.handshake.auth?.token || null;
  }

  // Subscribe to leaderboard updates
  @SubscribeMessage('leaderboard:subscribe')
  handleLeaderboardSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { type: string },
  ) {
    const room = `leaderboard:${data.type}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    return { event: 'leaderboard:subscribed', data: { type: data.type } };
  }

  @SubscribeMessage('leaderboard:unsubscribe')
  handleLeaderboardUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { type: string },
  ) {
    const room = `leaderboard:${data.type}`;
    client.leave(room);
    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'leaderboard:unsubscribed', data: { type: data.type } };
  }

  // Subscribe to activity feed
  @SubscribeMessage('activity:subscribe')
  handleActivitySubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
    client.join('activity:feed');
    this.logger.debug(`Client ${client.id} subscribed to activity feed`);
    return { event: 'activity:subscribed' };
  }

  // Subscribe to challenge updates
  @SubscribeMessage('challenge:subscribe')
  handleChallengeSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { challengeId: string },
  ) {
    const room = `challenge:${data.challengeId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    return { event: 'challenge:subscribed', data: { challengeId: data.challengeId } };
  }

  // Real-time workout progress sharing
  @SubscribeMessage('workout:progress')
  handleWorkoutProgress(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: WorkoutProgressPayload,
  ) {
    // Broadcast to friends watching this workout
    this.server.to(`workout:${data.sessionId}`).emit('workout:progress', {
      userId: client.userId,
      username: client.username,
      ...data,
      timestamp: new Date(),
    });
    return { event: 'workout:progress:sent' };
  }

  @SubscribeMessage('workout:watch')
  handleWorkoutWatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string },
  ) {
    client.join(`workout:${data.sessionId}`);
    return { event: 'workout:watching', data: { sessionId: data.sessionId } };
  }

  // Typing indicator for chat
  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recipientId: string },
  ) {
    this.server.to(`user:${data.recipientId}`).emit('chat:typing', {
      userId: client.userId,
      username: client.username,
    });
  }

  // Send direct message
  @SubscribeMessage('chat:message')
  handleChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recipientId: string; message: string },
  ) {
    this.server.to(`user:${data.recipientId}`).emit('chat:message', {
      from: {
        userId: client.userId,
        username: client.username,
      },
      message: data.message,
      timestamp: new Date(),
    });
    return { event: 'chat:message:sent' };
  }

  // Server-side methods to emit events

  /**
   * Send notification to a specific user
   */
  sendNotification(userId: string, notification: NotificationPayload) {
    this.server.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast notification to all connected users
   */
  broadcastNotification(notification: NotificationPayload) {
    this.server.emit('notification', {
      ...notification,
      timestamp: new Date(),
    });
  }

  /**
   * Update leaderboard for subscribed users
   */
  updateLeaderboard(type: string, data: LeaderboardUpdatePayload) {
    this.server.to(`leaderboard:${type}`).emit('leaderboard:update', data);
  }

  /**
   * Post activity to feed
   */
  postActivityFeed(activity: ActivityFeedPayload) {
    this.server.to('activity:feed').emit('activity:new', activity);
  }

  /**
   * Update challenge progress
   */
  updateChallengeProgress(
    challengeId: string,
    data: {
      userId: string;
      username: string;
      progress: number;
      milestone?: string;
    },
  ) {
    this.server.to(`challenge:${challengeId}`).emit('challenge:progress', {
      ...data,
      timestamp: new Date(),
    });
  }

  /**
   * Notify achievement unlocked
   */
  notifyAchievement(
    userId: string,
    achievement: {
      id: string;
      name: string;
      description: string;
      icon: string;
      xpReward: number;
    },
  ) {
    this.sendNotification(userId, {
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: achievement.name,
      data: achievement,
    });

    // Also broadcast to activity feed
    this.postActivityFeed({
      userId,
      username: '', // Should be populated by the service
      type: 'achievement_unlocked',
      message: `unlocked "${achievement.name}"`,
      timestamp: new Date(),
      data: achievement,
    });
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get all online user IDs
   */
  getOnlineUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}
