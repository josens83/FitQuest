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
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('social')
@Controller('social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('friends')
  @ApiOperation({ summary: '친구 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getFriends(@Request() req: any) {
    return this.socialService.getFriends(req.user.id);
  }

  @Get('friends/requests')
  @ApiOperation({ summary: '친구 요청 목록' })
  @ApiResponse({ status: 200, description: '성공' })
  async getPendingRequests(@Request() req: any) {
    return this.socialService.getPendingRequests(req.user.id);
  }

  @Post('friends/request/:userId')
  @ApiOperation({ summary: '친구 요청 보내기' })
  @ApiResponse({ status: 201, description: '요청 성공' })
  async sendFriendRequest(
    @Request() req: any,
    @Param('userId') targetUserId: string,
  ) {
    return this.socialService.sendFriendRequest(req.user.id, targetUserId);
  }

  @Post('friends/accept/:requestId')
  @ApiOperation({ summary: '친구 요청 수락' })
  @ApiResponse({ status: 200, description: '수락 성공' })
  async acceptFriendRequest(
    @Request() req: any,
    @Param('requestId') requestId: string,
  ) {
    return this.socialService.acceptFriendRequest(req.user.id, requestId);
  }

  @Post('friends/decline/:requestId')
  @ApiOperation({ summary: '친구 요청 거절' })
  @ApiResponse({ status: 200, description: '거절 성공' })
  async declineFriendRequest(
    @Request() req: any,
    @Param('requestId') requestId: string,
  ) {
    return this.socialService.declineFriendRequest(req.user.id, requestId);
  }

  @Delete('friends/:friendId')
  @ApiOperation({ summary: '친구 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  async removeFriend(@Request() req: any, @Param('friendId') friendId: string) {
    return this.socialService.removeFriend(req.user.id, friendId);
  }

  @Get('feed')
  @ApiOperation({ summary: '소셜 피드 조회' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, description: '성공' })
  async getActivityFeed(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.socialService.getActivityFeed(req.user.id, { limit, offset });
  }

  @Get('activity')
  @ApiOperation({ summary: '내 활동 조회' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: '성공' })
  async getMyActivity(@Request() req: any, @Query('limit') limit?: number) {
    return this.socialService.getMyActivity(req.user.id, limit);
  }

  @Get('search')
  @ApiOperation({ summary: '사용자 검색' })
  @ApiQuery({ name: 'q', required: true })
  @ApiResponse({ status: 200, description: '성공' })
  async searchUsers(@Request() req: any, @Query('q') query: string) {
    return this.socialService.searchUsers(query, req.user.id);
  }

  @Post('feed/:activityId/like')
  @ApiOperation({ summary: '활동 좋아요' })
  @ApiResponse({ status: 200, description: '성공' })
  async likeActivity(
    @Request() req: any,
    @Param('activityId') activityId: string,
  ) {
    return this.socialService.likeActivity(req.user.id, activityId);
  }

  @Post('feed/:activityId/comment')
  @ApiOperation({ summary: '활동 댓글' })
  @ApiResponse({ status: 201, description: '성공' })
  async commentActivity(
    @Request() req: any,
    @Param('activityId') activityId: string,
    @Body() body: { content: string },
  ) {
    return this.socialService.commentActivity(
      req.user.id,
      activityId,
      body.content,
    );
  }
}
