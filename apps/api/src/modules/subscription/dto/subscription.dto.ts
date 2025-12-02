import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SubscriptionPlan {
  FREE = 'free',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  EXPIRED = 'expired',
  TRIALING = 'trialing',
}

export enum PaymentMethod {
  CARD = 'card',
  PAYPAL = 'paypal',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
}

// Response DTOs
export class SubscriptionPlanDto {
  @ApiProperty({ example: 'plan_monthly' })
  id: string;

  @ApiProperty({ example: 'Premium Monthly' })
  name: string;

  @ApiProperty({ example: '모든 프리미엄 기능을 매월 이용하세요' })
  description: string;

  @ApiProperty({ example: 9.99 })
  price: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ enum: ['month', 'year'] })
  interval: 'month' | 'year';

  @ApiProperty({
    example: [
      '모든 운동 프로그램 이용',
      'AI 코치 무제한 이용',
      '광고 제거',
      '상세 분석 리포트',
    ],
  })
  features: string[];

  @ApiPropertyOptional({ example: true, description: 'Recommended plan' })
  isPopular?: boolean;

  @ApiPropertyOptional({ example: 20, description: 'Discount percentage for yearly' })
  discountPercent?: number;
}

export class SubscriptionResponseDto {
  @ApiProperty({ example: 'sub_abc123' })
  id: string;

  @ApiProperty({ enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  currentPeriodStart: string;

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z' })
  currentPeriodEnd: string;

  @ApiProperty({ example: false })
  cancelAtPeriodEnd: boolean;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  cancelledAt?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  trialEnd?: string;

  @ApiProperty({ example: '2023-06-01T00:00:00.000Z' })
  createdAt: string;
}

export class PaymentHistoryItemDto {
  @ApiProperty({ example: 'pay_abc123' })
  id: string;

  @ApiProperty({ example: 9.99 })
  amount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 'succeeded' })
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';

  @ApiProperty({ example: 'Premium Monthly subscription' })
  description: string;

  @ApiPropertyOptional({ example: '**** 4242' })
  last4?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiPropertyOptional({ example: 'https://receipts.stripe.com/...' })
  receiptUrl?: string;
}

// Request DTOs
export class SubscribePlanDto {
  @ApiProperty({ example: 'plan_monthly' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ example: 'pm_card_visa' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({ example: 'SAVE20' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class UpdatePaymentMethodDto {
  @ApiProperty({ example: 'pm_card_visa' })
  @IsString()
  paymentMethodId: string;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ example: 'Too expensive' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Cancel immediately or at period end' })
  @IsOptional()
  immediate?: boolean;
}

// Webhook DTOs
export class StripeWebhookDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  data: {
    object: any;
  };

  @ApiProperty()
  created: number;
}

export class PaymentIntentDto {
  @ApiProperty({ example: 'pi_abc123' })
  clientSecret: string;

  @ApiProperty({ example: 9.99 })
  amount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;
}
