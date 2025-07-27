import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { RateLimitingService } from './rate-limiting.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@ApiTags('Rate Limiting')
@Controller('rate-limiting')
export class RateLimitingController {
  constructor(private readonly rateLimitingService: RateLimitingService) {}

  @Get('visualization')
  @ApiOperation({ summary: 'Get rate limiting visualization data' })
  @ApiResponse({ status: 200 })
  @ApiQuery({ name: 'apiKey', required: false, type: String })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days (default: 7)' })
  async getVisualizationData(
    @Query('apiKey') apiKey?: string,
    @Query('days') days?: number
  ) {
    return this.rateLimitingService.getVisualizationData(apiKey, days || 7);
  }

  @Get('info/:apiKey')
  @ApiOperation({ summary: 'Get current rate limit info for API key' })
  @ApiResponse({ status: 200 })
  async getRateLimitInfo(@Param('apiKey') apiKey: string) {
    return this.rateLimitingService.getRateLimitInfo(apiKey);
  }

  @Get('top-consumers')
  @ApiOperation({ summary: 'Get top API consumers by request volume' })
  @ApiResponse({ status: 200 })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopConsumers(
    @Query('days') days?: number,
    @Query('limit') limit?: number
  ) {
    return this.rateLimitingService.getTopConsumers(days || 7, limit || 10);
  }

  @Get('status/:apiKey')
  @ApiOperation({ summary: 'Check if API key is within rate limits' })
  @ApiResponse({ status: 200 })
  async checkStatus(@Param('apiKey') apiKey: string) {
    const info = await this.rateLimitingService.getRateLimitInfo(apiKey);
    return {
      ...info,
      status: info.requestCount < 1000 ? 'within_limits' : 'rate_limited' // Default limit
    };
  }
}