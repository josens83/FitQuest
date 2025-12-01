import {
  Controller,
  Get,
  Post,
  Patch,
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
} from '@nestjs/swagger';
import { CoachService } from './coach.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('coach')
@Controller('coach')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get('profile')
  @ApiOperation({ summary: 'AI 코치 프로필 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getProfile(@Request() req: any) {
    return this.coachService.getCoachProfile(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'AI 코치 프로필 수정' })
  @ApiResponse({ status: 200, description: '성공' })
  async updateProfile(
    @Request() req: any,
    @Body()
    body: {
      coachName?: string;
      coachPersonality?: string;
      coachAvatar?: string;
      preferences?: any;
    },
  ) {
    return this.coachService.updateCoachProfile(req.user.id, body);
  }

  @Get('history')
  @ApiOperation({ summary: '대화 기록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getHistory(@Request() req: any, @Query('limit') limit?: number) {
    return this.coachService.getConversationHistory(req.user.id, limit);
  }

  @Post('chat')
  @ApiOperation({ summary: 'AI 코치와 대화' })
  @ApiResponse({ status: 200, description: '성공' })
  async chat(
    @Request() req: any,
    @Body()
    body: {
      message: string;
      context?: {
        workoutId?: string;
        exerciseId?: string;
        type?: string;
      };
    },
  ) {
    return this.coachService.chat(req.user.id, body.message, body.context);
  }

  @Get('plan')
  @ApiOperation({ summary: '운동 플랜 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getPlan(@Request() req: any) {
    return this.coachService.getWorkoutPlan(req.user.id);
  }

  @Post('plan/generate')
  @ApiOperation({ summary: 'AI 운동 플랜 생성' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  async generatePlan(
    @Request() req: any,
    @Body()
    body: {
      goal: string;
      daysPerWeek: number;
      duration: number;
      difficulty: string;
      focusAreas: string[];
    },
  ) {
    return this.coachService.generateWorkoutPlan(req.user.id, body);
  }
}
