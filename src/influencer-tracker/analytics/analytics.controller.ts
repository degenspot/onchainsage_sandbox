import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('influencer/:id/impact')
  @ApiOperation({ summary: 'Get influencer impact analysis' })
  @ApiQuery({ name: 'hours', required: false, description: 'Hours to analyze (default: 24)' })
  getInfluencerImpact(
    @Param('id') id: string,
    @Query('hours') hours: string = '24',
  ) {
    return this.analyticsService.getInfluencerImpact(id, parseInt(hours));
  }

  @Get('token/:id/mentions')
  @ApiOperation({ summary: 'Get token mention analytics' })
  @ApiQuery({ name: 'hours', required: false })
  getTokenMentionAnalytics(
    @Param('id') id: string,
    @Query('hours') hours: string = '24',
  ) {
    return this.analyticsService.getTokenMentionAnalytics(id, parseInt(hours));
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending tokens' })
  @ApiQuery({ name: 'hours', required: false })
  getTrendingTokens(@Query('hours') hours: string = '24') {
    return this.analyticsService.getTrendingTokens(parseInt(hours));
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get influencer leaderboard' })
  getInfluencerLeaderboard() {
    return this.analyticsService.getInfluencerLeaderboard();
  }
}