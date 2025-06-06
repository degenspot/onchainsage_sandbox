import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PerformanceAnalyticsService } from '../services/performance-analytics.service';
import { PerformanceQueryDto } from '../dto/signal-performance.dto';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('analytics')
// @UseGuards(JwtAuthGuard)
export class AnalyticsDashboardController {
  constructor(
    private readonly analyticsService: PerformanceAnalyticsService,
  ) {}

  @Get('performance')
  async getPerformanceMetrics(@Query() query: PerformanceQueryDto) {
    return await this.analyticsService.calculateOverallMetrics(query);
  }

  @Get('detailed')
  async getDetailedAnalytics(@Query() query: PerformanceQueryDto) {
    return await this.analyticsService.getSignalAnalytics(query);
  }

  @Get('transparency-report')
  async getTransparencyReport(@Query('period') period: string = 'monthly') {
    return await this.analyticsService.generateTransparencyReport(period);
  }

  @Get('dashboard')
  async getDashboardData(@Query() query: PerformanceQueryDto) {
    const [metrics, analytics] = await Promise.all([
      this.analyticsService.calculateOverallMetrics(query),
      this.analyticsService.getSignalAnalytics(query),
    ]);

    return {
      summary: metrics,
      detailed: analytics,
      lastUpdated: new Date(),
    };
  }
}