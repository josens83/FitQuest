import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@fitquest/database';

@Injectable()
export class NutritionService {
  async logFood(
    userId: string,
    data: {
      date: string;
      mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      foodName: string;
      calories: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fiber?: number;
      quantity?: number;
      unit?: string;
      photoUrl?: string;
    },
  ) {
    const log = await prisma.nutritionLog.create({
      data: {
        userId,
        date: new Date(data.date),
        mealType: data.mealType,
        foodName: data.foodName,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        fiber: data.fiber,
        quantity: data.quantity || 1,
        unit: data.unit || '인분',
        photoUrl: data.photoUrl,
      },
    });

    return log;
  }

  async getDailyLog(userId: string, date: string) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const logs = await prisma.nutritionLog.findMany({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate totals
    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fat: acc.fat + (log.fat || 0),
        fiber: acc.fiber + (log.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );

    // Group by meal type
    const meals = {
      breakfast: logs.filter((l) => l.mealType === 'breakfast'),
      lunch: logs.filter((l) => l.mealType === 'lunch'),
      dinner: logs.filter((l) => l.mealType === 'dinner'),
      snack: logs.filter((l) => l.mealType === 'snack'),
    };

    return {
      date,
      totals,
      meals,
      goalProgress: await this.calculateGoalProgress(userId, totals),
    };
  }

  async getWeeklyStats(userId: string, startDate: string) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const logs = await prisma.nutritionLog.findMany({
      where: {
        userId,
        date: { gte: start, lt: end },
      },
    });

    // Group by date
    const dailyStats: Record<string, any> = {};

    logs.forEach((log) => {
      const dateKey = log.date.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          mealCount: 0,
        };
      }
      dailyStats[dateKey].calories += log.calories;
      dailyStats[dateKey].protein += log.protein || 0;
      dailyStats[dateKey].carbs += log.carbs || 0;
      dailyStats[dateKey].fat += log.fat || 0;
      dailyStats[dateKey].mealCount += 1;
    });

    const days = Object.values(dailyStats);
    const avgCalories =
      days.length > 0
        ? days.reduce((sum, d: any) => sum + d.calories, 0) / days.length
        : 0;

    return {
      startDate,
      endDate: end.toISOString().split('T')[0],
      days,
      averages: {
        calories: Math.round(avgCalories),
        protein: Math.round(
          days.reduce((sum, d: any) => sum + d.protein, 0) / Math.max(days.length, 1),
        ),
        carbs: Math.round(
          days.reduce((sum, d: any) => sum + d.carbs, 0) / Math.max(days.length, 1),
        ),
        fat: Math.round(
          days.reduce((sum, d: any) => sum + d.fat, 0) / Math.max(days.length, 1),
        ),
      },
      daysLogged: days.length,
    };
  }

  async deleteLog(userId: string, logId: string) {
    const log = await prisma.nutritionLog.findFirst({
      where: { id: logId, userId },
    });

    if (!log) {
      throw new NotFoundException('기록을 찾을 수 없습니다.');
    }

    await prisma.nutritionLog.delete({ where: { id: logId } });
    return { success: true };
  }

  async logBodyMetrics(
    userId: string,
    data: {
      date: string;
      weight?: number;
      bodyFat?: number;
      muscleMass?: number;
      bmi?: number;
      waist?: number;
      chest?: number;
      arms?: number;
      thighs?: number;
    },
  ) {
    const metrics = await prisma.bodyMetrics.create({
      data: {
        userId,
        date: new Date(data.date),
        weight: data.weight,
        bodyFat: data.bodyFat,
        muscleMass: data.muscleMass,
        bmi: data.bmi,
        waist: data.waist,
        chest: data.chest,
        arms: data.arms,
        thighs: data.thighs,
      },
    });

    // Create activity
    await prisma.activityFeed.create({
      data: {
        userId,
        type: 'metrics',
        title: '신체 기록 업데이트',
        description: data.weight ? `체중: ${data.weight}kg` : '신체 측정 기록 완료',
      },
    });

    return metrics;
  }

  async getBodyMetricsHistory(userId: string, limit = 30) {
    const metrics = await prisma.bodyMetrics.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });

    if (metrics.length === 0) {
      return { history: [], trends: null };
    }

    const latest = metrics[0];
    const oldest = metrics[metrics.length - 1];

    return {
      history: metrics,
      trends: {
        weight:
          latest.weight && oldest.weight
            ? latest.weight - oldest.weight
            : null,
        bodyFat:
          latest.bodyFat && oldest.bodyFat
            ? latest.bodyFat - oldest.bodyFat
            : null,
        muscleMass:
          latest.muscleMass && oldest.muscleMass
            ? latest.muscleMass - oldest.muscleMass
            : null,
        period: `${oldest.date.toISOString().split('T')[0]} - ${latest.date.toISOString().split('T')[0]}`,
      },
    };
  }

  private async calculateGoalProgress(
    userId: string,
    totals: { calories: number; protein: number; carbs: number; fat: number },
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { goals: true },
    });

    const goals = user?.goals as any;
    const dailyCalorieGoal = goals?.dailyCalorieGoal || 2000;
    const proteinGoal = goals?.proteinGoal || 100;

    return {
      calories: {
        current: totals.calories,
        goal: dailyCalorieGoal,
        percentage: Math.min(
          Math.round((totals.calories / dailyCalorieGoal) * 100),
          100,
        ),
      },
      protein: {
        current: totals.protein,
        goal: proteinGoal,
        percentage: Math.min(
          Math.round((totals.protein / proteinGoal) * 100),
          100,
        ),
      },
    };
  }
}
