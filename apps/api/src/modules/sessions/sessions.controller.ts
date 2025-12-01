import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
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
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start/:workoutId')
  @ApiOperation({ summary: '운동 세션 시작' })
  @ApiResponse({ status: 201, description: '세션 생성 성공' })
  async startSession(
    @Request() req: any,
    @Param('workoutId') workoutId: string,
  ) {
    return this.sessionsService.startSession(req.user.id, workoutId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '세션 업데이트' })
  @ApiResponse({ status: 200, description: '성공' })
  async updateSession(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    return this.sessionsService.updateSession(id, req.user.id, updateData);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '운동 완료' })
  @ApiResponse({ status: 200, description: '성공' })
  async completeSession(
    @Request() req: any,
    @Param('id') id: string,
    @Body() completeData: any,
  ) {
    return this.sessionsService.completeSession(id, req.user.id, completeData);
  }

  @Post(':id/abandon')
  @ApiOperation({ summary: '운동 포기' })
  @ApiResponse({ status: 200, description: '성공' })
  async abandonSession(@Request() req: any, @Param('id') id: string) {
    return this.sessionsService.abandonSession(id, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '세션 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getSessions(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.sessionsService.getUserSessions(req.user.id, limit, offset);
  }

  @Get(':id')
  @ApiOperation({ summary: '세션 상세 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getSession(@Request() req: any, @Param('id') id: string) {
    return this.sessionsService.getSessionById(id, req.user.id);
  }
}
