import { Controller, Get, Query, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NewsAggregatorService } from '../services/news-aggregator.service';
import { NewsAlertService } from '../services/news-alert.service';
import { NewsQueryDto } from '../dto/news-query.dto';
import { NewsAlertDto } from '../dto/news-alert.dto';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard';

@ApiTags('News')
@Controller('news')
@UseGuards(RateLimitGuard)
export class NewsController {
  constructor(
    private readonly newsAggregator: NewsAggregatorService,
    private readonly alertService: NewsAlertService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get crypto news with filters' })
  @ApiResponse({ status: 200, description: 'News articles retrieved successfully' })
  async getNews(@Query() query: NewsQueryDto) {
    return this.newsAggregator.getNewsByFilters(query);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending crypto news' })
  async getTrendingNews(@Query('limit') limit: number = 10) {
    return this.newsAggregator.getNewsByFilters({
      minImpactScore: 7,
      limit,
    });
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create news alert' })
  async createAlert(@Body() alertDto: NewsAlertDto) {
    return this.alertService.createAlert(alertDto);
  }

  @Get('sentiment-summary')
  @ApiOperation({ summary: 'Get sentiment summary for crypto market' })
  async getSentimentSummary() {
    return this.newsAggregator.getSentimentSummary();
  }
}