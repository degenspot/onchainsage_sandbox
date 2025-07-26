import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Alert } from '../entities/alert.entity';
import { MentionsService } from '../mentions/mentions.service';
import { MarketDataService } from '../market-data/market-data.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private alertsRepository: Repository<Alert>,
    private mentionsService: MentionsService,
    private marketDataService: MarketDataService,
    private websocketGateway: WebsocketGateway,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkForAlerts() {
    await this.checkInfluencerMentions();
    await this.checkPriceMovements();
    await this.checkVolumeSpikes();
  }

  private async checkInfluencerMentions() {
    const recentMentions = await this.mentionsService.findRecentMentions(0.5); // Last 30 minutes
    
    for (const mention of recentMentions) {
      // High engagement alert
      const engagementScore = mention.likeCount + mention.retweetCount * 2 + mention.replyCount;
      if (engagementScore > 1000) {
        await this.createAlert({
          type: 'high_engagement_mention',
          title: 'High Engagement Mention Detected',
          message: `${mention.influencer.displayName} mentioned ${mention.token.symbol} with ${engagementScore} engagement`,
          priority: 'high',
          metadata: {
            mentionId: mention.id,
            influencerId: mention.influencerId,
            tokenId: mention.tokenId,
            engagementScore,
          },
        });
      }

      // Sentiment alert
      if (Math.abs(mention.sentimentScore) >= 3) {
        await this.createAlert({
          type: 'strong_sentiment',
          title: `Strong ${mention.sentiment} Sentiment Detected`,
          message: `${mention.influencer.displayName} expressed strong ${mention.sentiment} sentiment about ${mention.token.symbol}`,
          priority: mention.sentimentScore > 0 ? 'medium' : 'high',
          metadata: {
            mentionId: mention.id,
            sentiment: mention.sentiment,
            sentimentScore: mention.sentimentScore,
          },
        });
      }
    }
  }

  private async checkPriceMovements() {
    // This would check for significant price movements after mentions
    // Implementation would compare current prices with historical data
    this.logger.log('Checking price movements...');
  }

  private async checkVolumeSpikes() {
    // This would check for unusual volume spikes
    this.logger.log('Checking volume spikes...');
  }

  async createAlert(alertData: Partial<Alert>): Promise<Alert> {
    const alert = this.alertsRepository.create(alertData);
    const savedAlert = await this.alertsRepository.save(alert);
    
    // Send real-time alert via WebSocket
    this.websocketGateway.sendAlert(savedAlert);
    
    this.logger.log(`Alert created: ${alertData.title}`);
    return savedAlert;
  }

  async getAlerts(limit: number = 50): Promise<Alert[]> {
    return this.alertsRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.alertsRepository.update(id, { isRead: true });
  }

  async getUnreadCount(): Promise<number> {
    return this.alertsRepository.count({
      where: { isRead: false },
    });
  }
}
