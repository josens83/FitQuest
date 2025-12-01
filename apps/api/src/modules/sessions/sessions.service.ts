import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@fitquest/database';
import { WorkoutsService } from '../workouts/workouts.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly workoutsService: WorkoutsService,
    private readonly gamificationService: GamificationService,
  ) {}

  async startSession(userId: string, workoutId: string) {
    // Check for existing active session
    const activeSession = await prisma.workoutSession.findFirst({
      where: {
        userId,
        status: { in: ['in_progress', 'paused'] },
      },
    });

    if (activeSession) {
      throw new BadRequestException('이미 진행 중인 운동이 있습니다.');
    }

    // Get workout details
    const workout = await this.workoutsService.findById(workoutId);
    const totalExercises = workout.exercises.length;

    // Create session
    const session = await prisma.workoutSession.create({
      data: {
        userId,
        workoutId,
        status: 'in_progress',
        startedAt: new Date(),
        totalExercises,
      },
      include: {
        workout: {
          include: {
            exercises: { orderBy: { sortOrder: 'asc' } },
            trainer: true,
          },
        },
      },
    });

    return session;
  }

  async updateSession(
    id: string,
    userId: string,
    data: {
      currentExerciseIndex?: number;
      currentSetIndex?: number;
      status?: string;
    },
  ) {
    const session = await prisma.workoutSession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다.');
    }

    const updateData: any = {};
    if (data.currentExerciseIndex !== undefined) {
      updateData.currentExerciseIndex = data.currentExerciseIndex;
    }
    if (data.currentSetIndex !== undefined) {
      updateData.currentSetIndex = data.currentSetIndex;
    }
    if (data.status === 'paused') {
      updateData.status = 'paused';
      updateData.pausedAt = new Date();
    }
    if (data.status === 'in_progress') {
      updateData.status = 'in_progress';
      updateData.pausedAt = null;
    }

    return prisma.workoutSession.update({
      where: { id },
      data: updateData,
    });
  }

  async completeSession(
    id: string,
    userId: string,
    data: {
      actualDuration: number;
      caloriesBurned: number;
      exercisesCompleted: number;
      rating?: number;
      feedback?: string;
      difficultyFeedback?: string;
      heartRateData?: any;
    },
  ) {
    const session = await prisma.workoutSession.findFirst({
      where: { id, userId },
      include: { workout: true },
    });

    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다.');
    }

    // Process gamification rewards
    const rewards = await this.gamificationService.processWorkoutCompletion(
      userId,
      session.workoutId,
      {
        duration: data.actualDuration,
        calories: data.caloriesBurned,
        category: session.workout.category,
        difficulty: session.workout.difficulty,
      },
    );

    // Update session
    const completedSession = await prisma.workoutSession.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        actualDuration: data.actualDuration,
        caloriesBurned: data.caloriesBurned,
        exercisesCompleted: data.exercisesCompleted,
        rating: data.rating,
        feedback: data.feedback,
        difficultyFeedback: data.difficultyFeedback,
        heartRateData: data.heartRateData,
        xpEarned: rewards.xpEarned,
        badgesEarned: rewards.badgesEarned,
        personalRecords: rewards.personalRecords,
      },
      include: {
        workout: { include: { trainer: true } },
      },
    });

    // Update workout stats
    await this.workoutsService.incrementCompletion(session.workoutId);
    if (data.rating) {
      await this.workoutsService.updateRating(session.workoutId, data.rating);
    }

    return {
      session: completedSession,
      rewards,
    };
  }

  async abandonSession(id: string, userId: string) {
    const session = await prisma.workoutSession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다.');
    }

    return prisma.workoutSession.update({
      where: { id },
      data: { status: 'abandoned' },
    });
  }

  async getUserSessions(userId: string, limit = 20, offset = 0) {
    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { userId },
        include: {
          workout: { include: { trainer: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.workoutSession.count({ where: { userId } }),
    ]);

    return {
      items: sessions,
      meta: { total, limit, offset, hasMore: offset + sessions.length < total },
    };
  }

  async getSessionById(id: string, userId: string) {
    const session = await prisma.workoutSession.findFirst({
      where: { id, userId },
      include: {
        workout: {
          include: {
            exercises: { orderBy: { sortOrder: 'asc' } },
            trainer: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다.');
    }

    return session;
  }
}
