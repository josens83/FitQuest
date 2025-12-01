import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@fitquest/database';

@Injectable()
export class WorkoutsService {
  async findAll(options: {
    category?: string;
    difficulty?: string;
    accessType?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      category,
      difficulty,
      accessType,
      search,
      limit = 20,
      offset = 0,
    } = options;

    const where: any = {
      isPublished: true,
    };

    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (accessType) where.accessType = accessType;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where,
        include: {
          trainer: true,
          _count: {
            select: { exercises: true },
          },
        },
        orderBy: { completionCount: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.workout.count({ where }),
    ]);

    return {
      items: workouts,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + workouts.length < total,
      },
    };
  }

  async findById(id: string) {
    const workout = await prisma.workout.findUnique({
      where: { id },
      include: {
        trainer: true,
        exercises: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!workout) {
      throw new NotFoundException('운동을 찾을 수 없습니다.');
    }

    return workout;
  }

  async findRecommended(userId: string) {
    // Get user's recent workout categories
    const recentSessions = await prisma.workoutSession.findMany({
      where: { userId, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: 10,
      include: { workout: true },
    });

    const recentCategories = recentSessions.map((s) => s.workout.category);
    const preferredCategory = this.getMostFrequent(recentCategories) || 'strength';

    // Get recommended workouts
    const workouts = await prisma.workout.findMany({
      where: {
        isPublished: true,
        category: preferredCategory,
        id: { notIn: recentSessions.map((s) => s.workoutId) },
      },
      include: { trainer: true },
      orderBy: { rating: 'desc' },
      take: 5,
    });

    return workouts;
  }

  async incrementCompletion(id: string) {
    await prisma.workout.update({
      where: { id },
      data: { completionCount: { increment: 1 } },
    });
  }

  async updateRating(id: string, rating: number) {
    const workout = await prisma.workout.findUnique({ where: { id } });
    if (!workout) return;

    const newRatingCount = workout.ratingCount + 1;
    const newRating =
      (workout.rating * workout.ratingCount + rating) / newRatingCount;

    await prisma.workout.update({
      where: { id },
      data: {
        rating: newRating,
        ratingCount: newRatingCount,
      },
    });
  }

  private getMostFrequent<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;

    const frequency: Record<string, number> = {};
    arr.forEach((item) => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
    });

    let maxFreq = 0;
    let mostFrequent: T | undefined;
    Object.entries(frequency).forEach(([key, freq]) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mostFrequent = key as unknown as T;
      }
    });

    return mostFrequent;
  }
}
