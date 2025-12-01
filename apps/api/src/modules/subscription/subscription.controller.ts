import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: '구독 플랜 목록' })
  @ApiResponse({ status: 200, description: '성공' })
  async getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 구독 정보' })
  @ApiResponse({ status: 200, description: '성공' })
  async getCurrentSubscription(@Request() req: any) {
    return this.subscriptionService.getCurrentSubscription(req.user.id);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '구독 시작' })
  @ApiResponse({ status: 201, description: '구독 성공' })
  async subscribe(
    @Request() req: any,
    @Body()
    body: {
      plan: 'premium' | 'premium_plus';
      paymentMethod: 'card' | 'toss' | 'apple' | 'google';
      paymentData?: any;
    },
  ) {
    return this.subscriptionService.subscribe(
      req.user.id,
      body.plan,
      body.paymentMethod,
      body.paymentData,
    );
  }

  @Delete('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '구독 해지' })
  @ApiResponse({ status: 200, description: '해지 성공' })
  async cancelSubscription(@Request() req: any) {
    return this.subscriptionService.cancelSubscription(req.user.id);
  }

  @Patch('change-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '플랜 변경' })
  @ApiResponse({ status: 200, description: '변경 성공' })
  async changePlan(
    @Request() req: any,
    @Body() body: { plan: 'premium' | 'premium_plus' },
  ) {
    return this.subscriptionService.changePlan(req.user.id, body.plan);
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '결제 내역' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: '성공' })
  async getPaymentHistory(@Request() req: any, @Query('limit') limit?: number) {
    return this.subscriptionService.getPaymentHistory(req.user.id, limit);
  }

  @Get('check-access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '기능 접근 권한 확인' })
  @ApiQuery({
    name: 'feature',
    enum: ['unlimited_workouts', 'ai_coach', 'offline_downloads', 'premium_challenges'],
  })
  @ApiResponse({ status: 200, description: '성공' })
  async checkFeatureAccess(
    @Request() req: any,
    @Query('feature')
    feature: 'unlimited_workouts' | 'ai_coach' | 'offline_downloads' | 'premium_challenges',
  ) {
    const hasAccess = await this.subscriptionService.checkFeatureAccess(
      req.user.id,
      feature,
    );
    return { feature, hasAccess };
  }
}
