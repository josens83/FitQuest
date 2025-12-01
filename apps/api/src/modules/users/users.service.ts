import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@fitquest/database';
import type { User } from '@prisma/client';

@Injectable()
export class UsersService {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async getUserStats(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        workoutSessions: {
          where: { status: 'completed' },
        },
        achievements: {
          where: { unlockedAt: { not: null } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const totalWorkouts = user.workoutSessions.length;
    const totalDuration = user.workoutSessions.reduce(
      (sum, s) => sum + (s.actualDuration || 0),
      0,
    );
    const totalCalories = user.workoutSessions.reduce(
      (sum, s) => sum + (s.caloriesBurned || 0),
      0,
    );

    return {
      totalWorkouts,
      totalDuration,
      totalCalories,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      level: user.level,
      totalXP: user.totalXP,
      achievements: user.achievements.length,
    };
  }

  formatUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      stats: typeof user.stats === 'string' ? JSON.parse(user.stats) : user.stats,
      settings: typeof user.settings === 'string' ? JSON.parse(user.settings) : user.settings,
      connectedDevices:
        typeof user.connectedDevices === 'string'
          ? JSON.parse(user.connectedDevices)
          : user.connectedDevices,
    };
  }
}
