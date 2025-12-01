import {
  Controller,
  Get,
  Post,
  Delete,
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
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  @ApiOperation({ summary: '챌린지 목록 조회' })
  @ApiQuery({ name: 'status', enum: ['upcoming', 'active', 'completed'], required: false })
  @ApiQuery({ name: 'type', enum: ['individual', 'group', 'global'], required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, description: '성공' })
  async findAll(
    @Query('status') status?: 'upcoming' | 'active' | 'completed',
    @Query('type') type?: 'individual' | 'group' | 'global',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.challengesService.findAll({ status, type, limit, offset });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 챌린지 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getMyChallenges(@Request() req: any) {
    return this.challengesService.getMyChallenges(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '챌린지 상세 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async findById(@Param('id') id: string) {
    return this.challengesService.findById(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '챌린지 참가' })
  @ApiResponse({ status: 201, description: '참가 성공' })
  async join(@Request() req: any, @Param('id') id: string) {
    return this.challengesService.join(req.user.id, id);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '챌린지 탈퇴' })
  @ApiResponse({ status: 200, description: '탈퇴 성공' })
  async leave(@Request() req: any, @Param('id') id: string) {
    return this.challengesService.leave(req.user.id, id);
  }
}
