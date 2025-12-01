import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@fitquest/database';

type SubscriptionPlan = 'free' | 'premium' | 'premium_plus';

const PLAN_PRICES = {
  free: 0,
  premium: 9900,
  premium_plus: 19900,
};

const PLAN_FEATURES = {
  free: {
    name: '무료',
    features: [
      '기본 운동 콘텐츠',
      '리더보드 참여',
      '기본 업적 시스템',
      '주간 챌린지 1회',
    ],
    workoutLimit: 3,
    coachQuestions: 0,
    offlineDownloads: 0,
  },
  premium: {
    name: '프리미엄',
    features: [
      '모든 운동 콘텐츠 무제한',
      'AI 코치 무제한 상담',
      '상세 통계 분석',
      '오프라인 다운로드 10개',
      '광고 제거',
      '전용 챌린지 참여',
    ],
    workoutLimit: -1,
    coachQuestions: -1,
    offlineDownloads: 10,
  },
  premium_plus: {
    name: '프리미엄+',
    features: [
      '프리미엄 모든 기능',
      '1:1 전문 코칭',
      '맞춤 운동 플랜',
      '우선 고객 지원',
      '오프라인 다운로드 무제한',
      '베타 기능 우선 체험',
    ],
    workoutLimit: -1,
    coachQuestions: -1,
    offlineDownloads: -1,
  },
};

@Injectable()
export class SubscriptionService {
  async getCurrentSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] },
      },
    });

    if (!subscription) {
      return {
        plan: 'free',
        status: 'active',
        features: PLAN_FEATURES.free,
        price: PLAN_PRICES.free,
      };
    }

    const plan = subscription.plan as SubscriptionPlan;
    return {
      ...subscription,
      features: PLAN_FEATURES[plan],
      price: PLAN_PRICES[plan],
    };
  }

  async getPlans() {
    return [
      {
        id: 'free',
        name: PLAN_FEATURES.free.name,
        price: PLAN_PRICES.free,
        priceFormatted: '무료',
        features: PLAN_FEATURES.free.features,
        recommended: false,
      },
      {
        id: 'premium',
        name: PLAN_FEATURES.premium.name,
        price: PLAN_PRICES.premium,
        priceFormatted: '₩9,900/월',
        features: PLAN_FEATURES.premium.features,
        recommended: true,
      },
      {
        id: 'premium_plus',
        name: PLAN_FEATURES.premium_plus.name,
        price: PLAN_PRICES.premium_plus,
        priceFormatted: '₩19,900/월',
        features: PLAN_FEATURES.premium_plus.features,
        recommended: false,
      },
    ];
  }

  async subscribe(
    userId: string,
    plan: SubscriptionPlan,
    paymentMethod: 'card' | 'toss' | 'apple' | 'google',
    paymentData?: any,
  ) {
    if (plan === 'free') {
      throw new BadRequestException('무료 플랜은 구독이 필요하지 않습니다.');
    }

    // Check for existing active subscription
    const existing = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] },
      },
    });

    if (existing) {
      throw new BadRequestException('이미 활성화된 구독이 있습니다. 먼저 해지해주세요.');
    }

    // TODO: Integrate with actual payment providers (Toss, Apple IAP, Google Play)
    // For now, create a mock payment and subscription

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        type: 'subscription',
        amount: PLAN_PRICES[plan],
        currency: 'KRW',
        status: 'completed',
        provider: paymentMethod,
        providerPaymentId: `mock_${Date.now()}`,
        metadata: paymentData || {},
      },
    });

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        plan,
        status: 'active',
        startDate,
        endDate,
        autoRenew: true,
        paymentMethod,
      },
    });

    // Update user's subscription tier
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: plan },
    });

    // Create activity
    await prisma.activityFeed.create({
      data: {
        userId,
        type: 'subscription',
        title: '구독 시작',
        description: `${PLAN_FEATURES[plan].name} 구독을 시작했습니다!`,
        isPrivate: true,
      },
    });

    return {
      subscription,
      payment,
      features: PLAN_FEATURES[plan],
    };
  }

  async cancelSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] },
      },
    });

    if (!subscription) {
      throw new NotFoundException('활성화된 구독이 없습니다.');
    }

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'canceled',
        autoRenew: false,
        canceledAt: new Date(),
      },
    });

    // Note: User keeps access until endDate
    // A cron job should update user's subscriptionTier to 'free' after endDate

    return {
      success: true,
      message: `구독이 해지되었습니다. ${subscription.endDate.toLocaleDateString()}까지 프리미엄 기능을 이용하실 수 있습니다.`,
      endDate: subscription.endDate,
    };
  }

  async changePlan(userId: string, newPlan: SubscriptionPlan) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] },
      },
    });

    if (!subscription) {
      throw new NotFoundException('활성화된 구독이 없습니다.');
    }

    const currentPlan = subscription.plan as SubscriptionPlan;
    if (currentPlan === newPlan) {
      throw new BadRequestException('이미 같은 플랜을 이용 중입니다.');
    }

    // Calculate proration (simplified)
    const daysRemaining = Math.ceil(
      (subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    const dailyRateOld = PLAN_PRICES[currentPlan] / 30;
    const dailyRateNew = PLAN_PRICES[newPlan] / 30;
    const credit = daysRemaining * dailyRateOld;
    const newCost = daysRemaining * dailyRateNew;
    const amountDue = Math.max(0, newCost - credit);

    if (amountDue > 0) {
      // TODO: Process additional payment
      await prisma.payment.create({
        data: {
          userId,
          type: 'subscription_upgrade',
          amount: Math.round(amountDue),
          currency: 'KRW',
          status: 'completed',
          provider: subscription.paymentMethod || 'card',
          providerPaymentId: `mock_upgrade_${Date.now()}`,
        },
      });
    }

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { plan: newPlan },
    });

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: newPlan },
    });

    return {
      success: true,
      oldPlan: currentPlan,
      newPlan,
      amountCharged: amountDue,
      features: PLAN_FEATURES[newPlan],
    };
  }

  async getPaymentHistory(userId: string, limit = 20) {
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return payments;
  }

  async checkFeatureAccess(
    userId: string,
    feature: 'unlimited_workouts' | 'ai_coach' | 'offline_downloads' | 'premium_challenges',
  ) {
    const subscription = await this.getCurrentSubscription(userId);
    const plan = subscription.plan as SubscriptionPlan;

    switch (feature) {
      case 'unlimited_workouts':
        return plan !== 'free';
      case 'ai_coach':
        return plan !== 'free';
      case 'offline_downloads':
        return plan !== 'free';
      case 'premium_challenges':
        return plan !== 'free';
      default:
        return false;
    }
  }

  async incrementUsage(
    userId: string,
    type: 'workout' | 'coach_question' | 'download',
  ) {
    const subscription = await this.getCurrentSubscription(userId);
    const plan = subscription.plan as SubscriptionPlan;
    const features = PLAN_FEATURES[plan];

    // Check limits for free tier
    if (plan === 'free') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (type === 'workout') {
        const todayWorkouts = await prisma.workoutSession.count({
          where: {
            userId,
            startedAt: { gte: today },
          },
        });

        if (todayWorkouts >= features.workoutLimit) {
          throw new BadRequestException(
            '오늘의 무료 운동 횟수를 초과했습니다. 프리미엄으로 업그레이드하세요!',
          );
        }
      }

      if (type === 'coach_question') {
        throw new BadRequestException(
          'AI 코치는 프리미엄 기능입니다. 업그레이드하세요!',
        );
      }
    }

    return { allowed: true };
  }
}
