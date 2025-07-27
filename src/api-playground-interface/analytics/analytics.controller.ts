import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { UsageStatsDto } from './dto/usage-stats.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get usage overview statistics' })
  @ApiResponse({ status: 200, type: UsageStatsDto })
  async getOverview(): Promise<UsageStatsDto> {
    return this.analyticsService.getOverviewStats();
  }

  @Get('api-key/:apiKey')
  @ApiOperation({ summary: 'Get statistics for specific API key' })
  @ApiResponse({ status: 200 })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  async getApiKeyStats(
    @Param('apiKey') apiKey: string,
    @Query('days') days?: number
  ) {
    return this.analyticsService.getApiKeyStats(apiKey, days || 30);
  }

  @Get('endpoints')
  @ApiOperation({ summary: 'Get endpoint usage statistics' })
  @ApiResponse({ status: 200 })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getEndpointStats(@Query('days') days?: number) {
    return this.analyticsService.getEndpointStats(days || 30);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({ status: 200 })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getPerformanceMetrics(@Query('days') days?: number) {
    return this.analyticsService.getPerformanceMetrics(days || 30);
  }

  @Get('errors')
  @ApiOperation({ summary: 'Get error statistics' })
  @ApiResponse({ status: 200 })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getErrorStats(@Query('days') days?: number) {
    return this.analyticsService.getErrorStats(days || 30);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get usage trends over time' })
  @ApiResponse({ status: 200 })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'interval', required: false, enum: ['hour', 'day', 'week'] })
  async getTrends(
    @Query('days') days?: number,
    @Query('interval') interval?: 'hour' | 'day' | 'week'
  ) {
    return this.analyticsService.getTrends(days || 30, interval || 'day');
  }
}