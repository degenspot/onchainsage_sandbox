import { Injectable, Logger } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { TelegramService } from './telegram.service';
import { CommunityHealthData, PlatformType, HealthStatus } from '../interfaces/community-data.interface';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly discordService: DiscordService,
    private readonly telegramService: TelegramService,
  ) {}

  async calculateCommunityHealth(
    communityId: string,
    platform: PlatformType,
  ): Promise<CommunityHealthData> {
    const healthData: CommunityHealthData = {
      communityId,
      platform,
      timestamp: new Date(),
      metrics: {
        memberCount: 0,
        activeMembers: 0,
        messageCount: 0,
        engagementRate: 0,
        growthRate: 0,
        retentionRate: 0,
      },
      patterns: {
        peakActivity: { hour: 0, day: 'Monday' },
        responseRate: 0,
        averageResponseTime: 0,
        contentTypes: {},
      },
      healthScore: 0,
      healthStatus: HealthStatus.MODERATE,
      alerts: [],
    };

    try {
      if (platform === PlatformType.DISCORD) {
        await this.analyzeDiscordCommunity(communityId, healthData);
      } else if (platform === PlatformType.TELEGRAM) {
        await this.analyzeTelegramCommunity(communityId, healthData);
      }

      this.calculateHealthScore(healthData);
      this.generateAlerts(healthData);
    } catch (error) {
      this.logger.error(`Failed to calculate community health: ${error.message}`);
      healthData.alerts.push('Error calculating metrics');
    }

    return healthData;
  }

  private async analyzeDiscordCommunity(guildId: string, healthData: CommunityHealthData): Promise<void> {
    const guildData = await this.discordService.getGuildData(guildId);
    const activeMembers = await this.discordService.getActiveMembers(guildId);

    healthData.metrics.memberCount = guildData.memberCount;
    healthData.metrics.activeMembers = activeMembers.size;
    healthData.metrics.engagementRate = (activeMembers.size / guildData.memberCount) * 100;

    // Analyze message patterns
    let totalMessages = 0;
    const hourlyActivity = new Array(24).fill(0);
    const contentTypes: Record<string, number> = {
      text: 0,
      images: 0,
      links: 0,
      reactions: 0,
    };

    for (const channel of guildData.channels) {
      if (channel.type === 0) { // Text channel
        const messages = await this.discordService.getChannelMessages(channel.id, 100);
        totalMessages += messages.length;

        messages.forEach(msg => {
          const hour = new Date(msg.timestamp).getHours();
          hourlyActivity[hour]++;

          // Analyze content types
          if (msg.content) contentTypes.text++;
          if (msg.attachments?.length > 0) contentTypes.images++;
          if (msg.content?.includes('http')) contentTypes.links++;
          if (msg.reactions?.length > 0) contentTypes.reactions += msg.reactions.length;
        });
      }
    }

    healthData.metrics.messageCount = totalMessages;
    healthData.patterns.peakActivity.hour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
    healthData.patterns.contentTypes = contentTypes;
  }

  private async analyzeTelegramCommunity(chatId: string, healthData: CommunityHealthData): Promise<void> {
    const chatData = await this.telegramService.getChatData(chatId);
    const administrators = await this.telegramService.getChatAdministrators(chatId);

    healthData.metrics.memberCount = chatData.memberCount || 0;
    // Note: Telegram Bot API has limitations for message history access
    // Active members would require webhook/polling implementation
    healthData.metrics.activeMembers = Math.floor(healthData.metrics.memberCount * 0.1); // Estimated
    healthData.metrics.engagementRate = healthData.metrics.memberCount > 0 
      ? (healthData.metrics.activeMembers / healthData.metrics.memberCount) * 100 
      : 0;
  }

  private calculateHealthScore(healthData: CommunityHealthData): void {
    let score = 0;
    const weights = {
      engagement: 0.3,
      growth: 0.2,
      activity: 0.2,
      retention: 0.15,
      diversity: 0.15,
    };

    // Engagement score (0-100)
    const engagementScore = Math.min(healthData.metrics.engagementRate * 2, 100);
    score += engagementScore * weights.engagement;

    // Activity score based on message count
    const activityScore = Math.min((healthData.metrics.messageCount / 1000) * 100, 100);
    score += activityScore * weights.activity;

    // Growth score (placeholder - would need historical data)
    const growthScore = 50; // Default moderate score
    score += growthScore * weights.growth;

    // Retention score (placeholder)
    const retentionScore = 60;
    score += retentionScore * weights.retention;

    // Content diversity score
    const contentTypes = Object.values(healthData.patterns.contentTypes);
    const diversityScore = contentTypes.length > 0 
      ? Math.min((contentTypes.filter(count => count > 0).length / 4) * 100, 100)
      : 0;
    score += diversityScore * weights.diversity;

    healthData.healthScore = Math.round(score);
    healthData.healthStatus = this.getHealthStatus(score);
  }

  private getHealthStatus(score: number): HealthStatus {
    if (score >= 90) return HealthStatus.EXCELLENT;
    if (score >= 75) return HealthStatus.GOOD;
    if (score >= 50) return HealthStatus.MODERATE;
    if (score >= 25) return HealthStatus.POOR;
    return HealthStatus.CRITICAL;
  }

  private generateAlerts(healthData: CommunityHealthData): void {
    const alerts: string[] = [];

    if (healthData.metrics.engagementRate < 5) {
      alerts.push('Low engagement rate detected');
    }

    if (healthData.metrics.activeMembers < 10) {
      alerts.push('Very low active member count');
    }

    if (healthData.healthScore < 30) {
      alerts.push('Critical community health - immediate attention required');
    }

    if (healthData.metrics.messageCount < 50) {
      alerts.push('Low message activity in recent period');
    }

    healthData.alerts = alerts;
  }
}
