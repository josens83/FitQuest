import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.id);
    return this.usersService.formatUser(user!);
  }

  @Patch('me')
  @ApiOperation({ summary: '내 정보 수정' })
  @ApiResponse({ status: 200, description: '성공' })
  async updateMe(@Request() req: any, @Body() updateData: any) {
    const user = await this.usersService.updateUser(req.user.id, updateData);
    return this.usersService.formatUser(user);
  }

  @Get('me/stats')
  @ApiOperation({ summary: '내 통계 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getMyStats(@Request() req: any) {
    return this.usersService.getUserStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '사용자 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return null;
    }
    return this.usersService.formatUser(user);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: '사용자 통계 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getUserStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }
}
