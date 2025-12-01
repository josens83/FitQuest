import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@fitquest/database';

@Injectable()
export class ChallengesService {
  async findAll(filters?: {
    status?: 'upcoming' | 'active' | 'completed';
    type?: 'individual' | 'group' | 'global';
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    const now = new Date();

    if (filters?.status === 'upcoming') {
      where.startDate = { gt: now };
    } else if (filters?.status === 'active') {
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    } else if (filters?.status === 'completed') {
      where.endDate = { lt: now };
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        orderBy: { startDate: 'asc' },
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
        include: {
          _count: { select: { participants: true } },
        },
      }),
      prisma.challenge.count({ where }),
    ]);

    return {
      items: challenges.map((c) => ({
        ...c,
        participantCount: c._count.participants,
      })),
      meta: {
        total,
        limit: filters?.limit || 20,
        offset: filters?.offset || 0,
      },
    };
  }

  async findById(id: string) {
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        participants: {
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
          orderBy: { progress: 'desc' },
          take: 50,
        },
        _count: { select: { participants: true } },
      },
    });

    if (!challenge) {
      throw new NotFoundException('챌린지를 찾을 수 없습니다.');
    }

    return {
      ...challenge,
      participantCount: challenge._count.participants,
      leaderboard: challenge.participants.map((p, index) => ({
        rank: index + 1,
        userId: p.user.id,
        username: p.user.username,
        avatar: p.user.avatarUrl,
        level: p.user.level,
        progress: p.progress,
        completedAt: p.completedAt,
      })),
    };
  }

  async join(userId: string, challengeId: string) {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('챌린지를 찾을 수 없습니다.');
    }

    const now = new Date();
    if (challenge.startDate > now) {
      // Allow joining upcoming challenges
    } else if (challenge.endDate < now) {
      throw new BadRequestException('이미 종료된 챌린지입니다.');
    }

    const existing = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    if (existing) {
      throw new BadRequestException('이미 참가 중인 챌린지입니다.');
    }

    const participant = await prisma.challengeParticipant.create({
      data: {
        challengeId,
        userId,
        progress: 0,
      },
    });

    // Create activity
    await prisma.activityFeed.create({
      data: {
        userId,
        type: 'challenge',
        title: '챌린지 참가',
        description: `${challenge.title} 챌린지에 참가했습니다!`,
        referenceId: challengeId,
        referenceType: 'challenge',
      },
    });

    return participant;
  }

  async leave(userId: string, challengeId: string) {
    const participant = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    if (!participant) {
      throw new NotFoundException('참가 중인 챌린지가 아닙니다.');
    }

    if (participant.completedAt) {
      throw new BadRequestException('이미 완료한 챌린지는 탈퇴할 수 없습니다.');
    }

    await prisma.challengeParticipant.delete({
      where: { challengeId_userId: { challengeId, userId } },
    });

    return { success: true };
  }

  async updateProgress(userId: string, challengeId: string, progressIncrement: number) {
    const participant = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
      include: { challenge: true },
    });

    if (!participant) return null;
    if (participant.completedAt) return participant;

    const newProgress = participant.progress + progressIncrement;
    const isCompleted = newProgress >= participant.challenge.targetValue;

    const updated = await prisma.challengeParticipant.update({
      where: { challengeId_userId: { challengeId, userId } },
      data: {
        progress: newProgress,
        completedAt: isCompleted ? new Date() : undefined,
      },
    });

    if (isCompleted) {
      // Award XP
      await prisma.user.update({
        where: { id: userId },
        data: { totalXP: { increment: participant.challenge.xpReward } },
      });

      // Create completion activity
      await prisma.activityFeed.create({
        data: {
          userId,
          type: 'challenge',
          title: '챌린지 완료!',
          description: `${participant.challenge.title} 챌린지를 완료하고 ${participant.challenge.xpReward} XP를 획득했습니다!`,
          referenceId: challengeId,
          referenceType: 'challenge',
        },
      });
    }

    return updated;
  }

  async getMyChallenges(userId: string) {
    const participations = await prisma.challengeParticipant.findMany({
      where: { userId },
      include: {
        challenge: {
          include: {
            _count: { select: { participants: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const now = new Date();

    return {
      active: participations
        .filter(
          (p) =>
            !p.completedAt &&
            p.challenge.startDate <= now &&
            p.challenge.endDate >= now,
        )
        .map((p) => ({
          ...p.challenge,
          myProgress: p.progress,
          participantCount: p.challenge._count.participants,
        })),
      completed: participations
        .filter((p) => p.completedAt)
        .map((p) => ({
          ...p.challenge,
          myProgress: p.progress,
          completedAt: p.completedAt,
          participantCount: p.challenge._count.participants,
        })),
      upcoming: participations
        .filter((p) => p.challenge.startDate > now)
        .map((p) => ({
          ...p.challenge,
          participantCount: p.challenge._count.participants,
        })),
    };
  }
}
