import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementService } from '../services/achievement.service';
import { CreateAchievementDto } from '../dto/achievement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('achievements')
@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @ApiOperation({ summary: 'Create new achievement' })
  @ApiResponse({ status: 201, description: 'Achievement created successfully' })
  @Post()
  @UseGuards(JwtAuthGuard)
  async createAchievement(@Body() createAchievementDto: CreateAchievementDto) {
    return this.achievementService.createAchievement(createAchievementDto);
  }

  @ApiOperation({ summary: 'Get all achievements' })
  @ApiResponse({ status: 200, description: 'List of all achievements' })
  @Get()
  async getAllAchievements() {
    return this.achievementService.getAllAchievements();
  }

  @ApiOperation({ summary: 'Get user achievements' })
  @ApiResponse({ status: 200, description: 'User achievements with progress' })
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserAchievements(@Param('userId') userId: string) {
    return this.achievementService.getUserAchievements(userId);
  }

  @ApiOperation({ summary: 'Get current user achievements' })
  @ApiResponse({ status: 200, description: 'Current user achievements' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMyAchievements(@Request() req) {
    return this.achievementService.getUserAchievements(req.user.id);
  }

  @ApiOperation({ summary: 'Get user points and stats' })
  @ApiResponse({ status: 200, description: 'User points and statistics' })
  @Get('points/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserPoints(@Param('userId') userId: string) {
    return this.achievementService.getUserPoints(userId);
  }

  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiResponse({ status: 200, description: 'Top users by points' })
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit: number = 10) {
    return this.achievementService.getLeaderboard(limit);
  }
}