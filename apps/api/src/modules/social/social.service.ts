import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@fitquest/database';

@Injectable()
export class SocialService {
  async sendFriendRequest(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('자신에게 친구 요청을 보낼 수 없습니다.');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Check for existing friendship
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'accepted') {
        throw new BadRequestException('이미 친구입니다.');
      }
      if (existing.status === 'pending') {
        throw new BadRequestException('이미 친구 요청을 보냈습니다.');
      }
    }

    const friendship = await prisma.friendship.create({
      data: {
        userId,
        friendId: targetUserId,
        status: 'pending',
      },
    });

    // Create activity for target user
    await prisma.activityFeed.create({
      data: {
        userId: targetUserId,
        type: 'social',
        title: '친구 요청',
        description: '새로운 친구 요청이 도착했습니다!',
        referenceId: userId,
        referenceType: 'user',
        isPrivate: true,
      },
    });

    return friendship;
  }

  async acceptFriendRequest(userId: string, requestId: string) {
    const request = await prisma.friendship.findFirst({
      where: {
        id: requestId,
        friendId: userId,
        status: 'pending',
      },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }

    const friendship = await prisma.friendship.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    });

    // Create activity
    await prisma.activityFeed.create({
      data: {
        userId: request.userId,
        type: 'social',
        title: '친구 수락',
        description: '친구 요청이 수락되었습니다!',
        referenceId: userId,
        referenceType: 'user',
      },
    });

    return friendship;
  }

  async declineFriendRequest(userId: string, requestId: string) {
    const request = await prisma.friendship.findFirst({
      where: {
        id: requestId,
        friendId: userId,
        status: 'pending',
      },
    });

    if (!request) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }

    await prisma.friendship.delete({ where: { id: requestId } });
    return { success: true };
  }

  async removeFriend(userId: string, friendId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId, status: 'accepted' },
          { userId: friendId, friendId: userId, status: 'accepted' },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    }

    await prisma.friendship.delete({ where: { id: friendship.id } });
    return { success: true };
  }

  async getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            level: true,
            totalXP: true,
            currentStreak: true,
            lastWorkoutAt: true,
          },
        },
        friend: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            level: true,
            totalXP: true,
            currentStreak: true,
            lastWorkoutAt: true,
          },
        },
      },
    });

    return friendships.map((f) => {
      const friend = f.userId === userId ? f.friend : f.user;
      return {
        friendshipId: f.id,
        ...friend,
        since: f.createdAt,
      };
    });
  }

  async getPendingRequests(userId: string) {
    const [received, sent] = await Promise.all([
      prisma.friendship.findMany({
        where: { friendId: userId, status: 'pending' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true,
            },
          },
        },
      }),
      prisma.friendship.findMany({
        where: { userId, status: 'pending' },
        include: {
          friend: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true,
            },
          },
        },
      }),
    ]);

    return {
      received: received.map((r) => ({
        requestId: r.id,
        ...r.user,
        sentAt: r.createdAt,
      })),
      sent: sent.map((s) => ({
        requestId: s.id,
        ...s.friend,
        sentAt: s.createdAt,
      })),
    };
  }

  async getActivityFeed(userId: string, options?: { limit?: number; offset?: number }) {
    // Get user's friends
    const friends = await this.getFriends(userId);
    const friendIds = friends.map((f) => f.id);

    const activities = await prisma.activityFeed.findMany({
      where: {
        userId: { in: [...friendIds, userId] },
        isPrivate: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return activities;
  }

  async getMyActivity(userId: string, limit = 20) {
    return prisma.activityFeed.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async searchUsers(query: string, currentUserId: string) {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        level: true,
        totalXP: true,
      },
      take: 20,
    });

    // Check friendship status for each user
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: currentUserId, friendId: { in: users.map((u) => u.id) } },
          { userId: { in: users.map((u) => u.id) }, friendId: currentUserId },
        ],
      },
    });

    return users.map((user) => {
      const friendship = friendships.find(
        (f) =>
          (f.userId === currentUserId && f.friendId === user.id) ||
          (f.userId === user.id && f.friendId === currentUserId),
      );

      return {
        ...user,
        friendshipStatus: friendship?.status || null,
      };
    });
  }

  async likeActivity(userId: string, activityId: string) {
    const activity = await prisma.activityFeed.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('활동을 찾을 수 없습니다.');
    }

    const currentLikes = (activity.likes as string[]) || [];
    const hasLiked = currentLikes.includes(userId);

    const newLikes = hasLiked
      ? currentLikes.filter((id) => id !== userId)
      : [...currentLikes, userId];

    await prisma.activityFeed.update({
      where: { id: activityId },
      data: { likes: newLikes },
    });

    return {
      liked: !hasLiked,
      likeCount: newLikes.length,
    };
  }

  async commentActivity(userId: string, activityId: string, content: string) {
    const activity = await prisma.activityFeed.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('활동을 찾을 수 없습니다.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, avatarUrl: true },
    });

    const currentComments = (activity.comments as any[]) || [];
    const newComment = {
      id: Date.now().toString(),
      userId,
      username: user?.username,
      avatar: user?.avatarUrl,
      content,
      createdAt: new Date().toISOString(),
    };

    await prisma.activityFeed.update({
      where: { id: activityId },
      data: { comments: [...currentComments, newComment] },
    });

    return newComment;
  }
}
