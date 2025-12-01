import {
  Controller,
  Get,
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
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: '리더보드 조회' })
  @ApiQuery({ name: 'type', enum: ['weekly', 'monthly', 'all_time'] })
  @ApiQuery({ name: 'category', enum: ['xp', 'workouts', 'calories', 'streak'] })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: '성공' })
  async getLeaderboard(
    @Query('type') type: 'weekly' | 'monthly' | 'all_time' = 'weekly',
    @Query('category') category: 'xp' | 'workouts' | 'calories' | 'streak' = 'xp',
    @Query('limit') limit?: number,
  ) {
    return this.gamificationService.getLeaderboard(type, category, limit);
  }

  @Get('achievements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 업적 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getMyAchievements(@Request() req: any) {
    return this.gamificationService.getUserAchievements(req.user.id);
  }
}
