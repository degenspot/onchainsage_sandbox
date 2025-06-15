import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { CommunityHealthService } from '../services/community-health.service';
import { CommunityMetricsDto, EngagementPatternDto } from '../dto/community-health.dto';
import { PlatformType } from '../interfaces/community-data.interface';

@Controller('community-health')
export class CommunityHealthController {
  constructor(private readonly communityHealthService: CommunityHealthService) {}

  @Get(':platform/:communityId/metrics')
  async getCommunityMetrics(
    @Param('platform') platform: PlatformType,
    @Param('communityId') communityId: string,
  ): Promise<CommunityMetricsDto> {
    return this.communityHealthService.getCommunityMetrics(communityId, platform);
  }

  @Get(':platform/:communityId/engagement-patterns')
  async getEngagementPatterns(
    @Param('platform') platform: PlatformType,
    @Param('communityId') communityId: string,
  ): Promise<EngagementPatternDto> {
    return this.communityHealthService.getEngagementPatterns(communityId, platform);
  }

  @Get(':platform/:communityId/health-history')
  async getHealthHistory(
    @Param('platform') platform: PlatformType,
    @Param('communityId') communityId: string,
    @Query('days') days = 30,
  ) {
    return this.communityHealthService.getHealthHistory(communityId, platform, days);
  }

  @Post(':platform/:communityId/analyze')
  async analyzeCommunityHealth(
    @Param('platform') platform: PlatformType,
    @Param('communityId') communityId: string,
  ) {
    return this.communityHealthService.analyzeCommunityHealth(communityId, platform);
  }

  @Post('alerts/configure')
  async configureAlerts(@Body() alertConfig: any) {
    return this.communityHealthService.configureAlerts(alertConfig);
  }
}

// src/community-health/services/community-health.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MetricsService } from './metrics.service';
import { AlertService } from './alert.service';
import { CommunityMetricsDto, EngagementPatternDto } from '../dto/community-health.dto';
import { CommunityHealthData, PlatformType } from '../interfaces/community-data.interface';

@Injectable()
export class CommunityHealthService {
  private readonly logger = new Logger(CommunityHealthService.name);
  private readonly healthHistory = new Map<string, CommunityHealthData[]>();
  private readonly monitoredCommunities = new Set<{ id: string; platform: PlatformType }>();

  constructor(
    private readonly metricsService: MetricsService,
    private readonly alertService: AlertService,
  ) {}

  async getCommunityMetrics(communityId: string, platform: PlatformType): Promise<CommunityMetricsDto> {
    const healthData = await this.metricsService.calculateCommunityHealth(communityId, platform);
    
    return {
      communityId: healthData.communityId,
      platform: healthData.platform,
      memberCount: healthData.metrics.memberCount,
      activeMembers: healthData.metrics.activeMembers,
      messageCount: healthData.metrics.messageCount,
      engagementRate: healthData.metrics.engagementRate,
      healthScore: healthData.healthScore,
      healthStatus: healthData.healthStatus,
      alerts: healthData.alerts,
    };
  }

  async getEngagementPatterns(communityId: string, platform: PlatformType): Promise<EngagementPatternDto> {
    const healthData = await this.metricsService.calculateCommunityHealth(communityId, platform);
    
    return {
      communityId: healthData.communityId,
      peakHour: healthData.patterns.peakActivity.hour,
      dailyActivity: new Array(24).fill(0), // Would be populated with real data
      weeklyActivity: new Array(7).fill(0), // Would be populated with real data
      responseRate: healthData.patterns.responseRate,
      averageResponseTime: healthData.patterns.averageResponseTime,
    };
  }

  async getHealthHistory(communityId: string, platform: PlatformType, days: number) {
    const key = `${platform}:${communityId}`;
    const history = this.healthHistory.get(key) || [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return history
      .filter(entry => entry.timestamp >= cutoffDate)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async analyzeCommunityHealth(communityId: string, platform: PlatformType) {
    const healthData = await this.metricsService.calculateCommunityHealth(communityId, platform);
    
    // Store in history
    const key = `${platform}:${communityId}`;
    const history = this.healthHistory.get(key) || [];
    history.push(healthData);
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    this.healthHistory.set(key, history);

    // Process alerts
    await this.alertService.processHealthAlerts(healthData);

    return {
      ...healthData,
      recommendations: this.generateRecommendations(healthData),
    };
  }

  async configureAlerts(alertConfig: any) {
    // Store alert configuration
    this.logger.log('Alert configuration updated', alertConfig);
    return { success: true, message: 'Alert configuration updated' };
  }

  addCommunityToMonitoring(communityId: string, platform: PlatformType): void {
    this.monitoredCommunities.add({ id: communityId, platform });
    this.logger.log(`Added community ${communityId} (${platform}) to monitoring`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async performScheduledHealthCheck(): Promise<void> {
    this.logger.log('Starting scheduled community health check');
    
    for (const community of this.monitoredCommunities) {
      try {
        await this.analyzeCommunityHealth(community.id, community.platform);
      } catch (error) {
        this.logger.error(`Failed to analyze community ${community.id}: ${error.message}`);
      }
    }
  }

  private generateRecommendations(healthData: CommunityHealthData): string[] {
    const recommendations: string[] = [];

    if (healthData.metrics.engagementRate < 10) {
      recommendations.push('Consider hosting events or contests to boost engagement');
      recommendations.push('Create discussion topics or polls to encourage participation');
    }

    if (healthData.metrics.activeMembers < healthData.metrics.memberCount * 0.05) {
      recommendations.push('Review content strategy to better engage inactive members');
      recommendations.push('Consider welcome messages for new members');
    }

    if (healthData.patterns.responseRate < 0.5) {
      recommendations.push('Improve moderation response times');
      recommendations.push('Encourage community members to help answer questions');
    }

    if (healthData.healthScore < 50) {
      recommendations.push('Conduct a comprehensive community audit');
      recommendations.push('Consider restructuring channels or chat organization');
    }

    return recommendations;
  }
}
