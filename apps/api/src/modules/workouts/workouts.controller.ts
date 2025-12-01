import {
  Controller,
  Get,
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
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('workouts')
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get()
  @ApiOperation({ summary: '운동 목록 조회' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'difficulty', required: false })
  @ApiQuery({ name: 'accessType', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, description: '성공' })
  async findAll(
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('accessType') accessType?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.workoutsService.findAll({
      category,
      difficulty,
      accessType,
      search,
      limit,
      offset,
    });
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '추천 운동 목록' })
  @ApiResponse({ status: 200, description: '성공' })
  async findRecommended(@Request() req: any) {
    return this.workoutsService.findRecommended(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '운동 상세 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '운동을 찾을 수 없음' })
  async findById(@Param('id') id: string) {
    return this.workoutsService.findById(id);
  }

  @Get(':id/exercises')
  @ApiOperation({ summary: '운동 동작 목록' })
  @ApiResponse({ status: 200, description: '성공' })
  async getExercises(@Param('id') id: string) {
    const workout = await this.workoutsService.findById(id);
    return workout.exercises;
  }
}
