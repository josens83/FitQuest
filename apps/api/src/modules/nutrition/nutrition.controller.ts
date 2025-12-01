import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
import { NutritionService } from './nutrition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('nutrition')
@Controller('nutrition')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Post('food')
  @ApiOperation({ summary: '음식 기록' })
  @ApiResponse({ status: 201, description: '기록 성공' })
  async logFood(
    @Request() req: any,
    @Body()
    body: {
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
    return this.nutritionService.logFood(req.user.id, body);
  }

  @Get('daily')
  @ApiOperation({ summary: '일일 영양 기록 조회' })
  @ApiQuery({ name: 'date', required: true })
  @ApiResponse({ status: 200, description: '성공' })
  async getDailyLog(@Request() req: any, @Query('date') date: string) {
    return this.nutritionService.getDailyLog(req.user.id, date);
  }

  @Get('weekly')
  @ApiOperation({ summary: '주간 영양 통계' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiResponse({ status: 200, description: '성공' })
  async getWeeklyStats(
    @Request() req: any,
    @Query('startDate') startDate: string,
  ) {
    return this.nutritionService.getWeeklyStats(req.user.id, startDate);
  }

  @Delete('food/:id')
  @ApiOperation({ summary: '음식 기록 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  async deleteLog(@Request() req: any, @Param('id') id: string) {
    return this.nutritionService.deleteLog(req.user.id, id);
  }

  @Post('body-metrics')
  @ApiOperation({ summary: '신체 측정 기록' })
  @ApiResponse({ status: 201, description: '기록 성공' })
  async logBodyMetrics(
    @Request() req: any,
    @Body()
    body: {
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
    return this.nutritionService.logBodyMetrics(req.user.id, body);
  }

  @Get('body-metrics')
  @ApiOperation({ summary: '신체 측정 기록 조회' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: '성공' })
  async getBodyMetrics(@Request() req: any, @Query('limit') limit?: number) {
    return this.nutritionService.getBodyMetricsHistory(req.user.id, limit);
  }
}
