import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@fitquest/database';

@Injectable()
export class CoachService {
  async getCoachProfile(userId: string) {
    let profile = await prisma.aICoachProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Create default profile
      profile = await prisma.aICoachProfile.create({
        data: {
          userId,
          coachName: '핏코치',
          coachPersonality: 'encouraging',
          coachAvatar: '/coaches/default.png',
          preferences: {
            motivationStyle: 'positive',
            feedbackFrequency: 'moderate',
            focusAreas: ['strength', 'endurance'],
          },
        },
      });
    }

    return profile;
  }

  async updateCoachProfile(
    userId: string,
    data: {
      coachName?: string;
      coachPersonality?: string;
      coachAvatar?: string;
      preferences?: any;
    },
  ) {
    return prisma.aICoachProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        coachName: data.coachName || '핏코치',
        coachPersonality: data.coachPersonality || 'encouraging',
        coachAvatar: data.coachAvatar || '/coaches/default.png',
        preferences: data.preferences || {},
      },
    });
  }

  async getConversationHistory(userId: string, limit = 50) {
    return prisma.coachConversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async chat(
    userId: string,
    message: string,
    context?: {
      workoutId?: string;
      exerciseId?: string;
      type?: string;
    },
  ) {
    // Get user data for context
    const [user, profile, recentWorkouts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      this.getCoachProfile(userId),
      prisma.workoutSession.findMany({
        where: { userId, status: 'completed' },
        orderBy: { completedAt: 'desc' },
        take: 5,
        include: { workout: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Save user message
    await prisma.coachConversation.create({
      data: {
        userId,
        role: 'user',
        content: message,
        context: context || {},
      },
    });

    // Generate AI response (placeholder - integrate with Claude API)
    const aiResponse = await this.generateAIResponse(
      message,
      {
        user: {
          level: user.level,
          totalXP: user.totalXP,
          streak: user.currentStreak,
          stats: user.stats,
          goals: user.goals,
        },
        coachPersonality: profile.coachPersonality,
        preferences: profile.preferences,
        recentWorkouts: recentWorkouts.map((w) => ({
          name: w.workout.title,
          duration: w.actualDuration,
          calories: w.caloriesBurned,
          completedAt: w.completedAt,
        })),
      },
      context,
    );

    // Save AI response
    const conversation = await prisma.coachConversation.create({
      data: {
        userId,
        role: 'assistant',
        content: aiResponse.message,
        context: context || {},
      },
    });

    return {
      message: aiResponse.message,
      suggestions: aiResponse.suggestions,
      recommendedWorkouts: aiResponse.recommendedWorkouts,
      conversationId: conversation.id,
    };
  }

  private async generateAIResponse(
    message: string,
    userContext: any,
    messageContext?: any,
  ): Promise<{
    message: string;
    suggestions?: string[];
    recommendedWorkouts?: string[];
  }> {
    // TODO: Integrate with Claude API
    // For now, return contextual placeholder responses

    const personality = userContext.coachPersonality || 'encouraging';
    const level = userContext.user.level;
    const streak = userContext.user.streak;

    // Simple response logic based on message content
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('운동') && lowerMessage.includes('추천')) {
      return {
        message: `${level}레벨이시네요! 현재 ${streak}일 연속 운동 중이시군요. 오늘은 전신 운동으로 균형 잡힌 트레이닝을 추천드려요. 💪`,
        suggestions: [
          '오늘의 추천 운동 시작하기',
          '난이도 조절하기',
          '다른 운동 보기',
        ],
        recommendedWorkouts: ['beginner-full-body', 'cardio-fat-burn'],
      };
    }

    if (lowerMessage.includes('피곤') || lowerMessage.includes('힘들')) {
      return {
        message:
          '오늘 컨디션이 안 좋으시군요. 무리하지 마시고, 가벼운 스트레칭이나 요가로 몸을 풀어주는 건 어떨까요? 휴식도 운동의 일부입니다! 🧘‍♂️',
        suggestions: ['가벼운 스트레칭 추천받기', '오늘은 휴식하기', '컨디션 기록하기'],
      };
    }

    if (lowerMessage.includes('식단') || lowerMessage.includes('먹')) {
      return {
        message:
          '운동과 함께 균형 잡힌 식단도 중요해요! 단백질 섭취를 충분히 하시고, 운동 후 30분 이내에 단백질을 섭취하시면 근육 회복에 도움이 됩니다. 🥗',
        suggestions: ['오늘 식단 기록하기', '단백질 음식 추천', '칼로리 계산하기'],
      };
    }

    if (lowerMessage.includes('목표') || lowerMessage.includes('달성')) {
      const xpToNext = 1000 - (userContext.user.totalXP % 1000);
      return {
        message: `다음 레벨까지 ${xpToNext} XP 남았어요! 매일 꾸준히 운동하면 금방 달성할 수 있을 거예요. 현재 연속 ${streak}일째 운동 중이시니, 이 페이스 유지해주세요! 🎯`,
        suggestions: ['오늘의 목표 확인', '주간 목표 설정', '업적 확인하기'],
      };
    }

    // Default response
    return {
      message:
        '안녕하세요! 오늘도 운동하러 오셨군요. 무엇을 도와드릴까요? 운동 추천, 자세 교정, 식단 조언 등 무엇이든 물어보세요! 💪',
      suggestions: ['오늘의 운동 추천', '내 기록 보기', '목표 설정하기'],
    };
  }

  async getWorkoutPlan(userId: string) {
    const plan = await prisma.workoutPlan.findFirst({
      where: { userId, isActive: true },
      include: {
        planItems: {
          include: { workout: true },
          orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
        },
      },
    });

    if (!plan) {
      return null;
    }

    return plan;
  }

  async generateWorkoutPlan(
    userId: string,
    preferences: {
      goal: string;
      daysPerWeek: number;
      duration: number;
      difficulty: string;
      focusAreas: string[];
    },
  ) {
    // Get user's stats and history
    const [user, completedWorkouts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.workoutSession.findMany({
        where: { userId, status: 'completed' },
        include: { workout: true },
        take: 20,
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Deactivate existing plans
    await prisma.workoutPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Get suitable workouts
    const workouts = await prisma.workout.findMany({
      where: {
        difficulty: preferences.difficulty,
        category: { in: preferences.focusAreas },
        isPublished: true,
      },
      take: preferences.daysPerWeek * preferences.duration,
    });

    // Create new plan
    const plan = await prisma.workoutPlan.create({
      data: {
        userId,
        name: `${preferences.goal} - ${preferences.duration}주 플랜`,
        description: `목표: ${preferences.goal}, 주 ${preferences.daysPerWeek}일 운동`,
        durationWeeks: preferences.duration,
        difficulty: preferences.difficulty,
        goal: preferences.goal,
        isActive: true,
        generatedBy: 'ai',
      },
    });

    // Create plan items
    const planItems: any[] = [];
    let workoutIndex = 0;

    for (let week = 1; week <= preferences.duration; week++) {
      for (let day = 0; day < preferences.daysPerWeek; day++) {
        const workout = workouts[workoutIndex % workouts.length];
        if (workout) {
          planItems.push({
            planId: plan.id,
            workoutId: workout.id,
            weekNumber: week,
            dayOfWeek: day + 1,
            isRestDay: false,
          });
          workoutIndex++;
        }
      }
    }

    await prisma.workoutPlanItem.createMany({ data: planItems });

    // Create activity
    await prisma.activityFeed.create({
      data: {
        userId,
        type: 'plan',
        title: 'AI 운동 플랜 생성',
        description: `${preferences.duration}주 ${preferences.goal} 플랜이 생성되었습니다!`,
        referenceId: plan.id,
        referenceType: 'plan',
      },
    });

    return this.getWorkoutPlan(userId);
  }
}
