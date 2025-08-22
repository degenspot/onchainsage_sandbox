import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialSentimentEntity } from '../entities/trading-signal.entity';
import { SocialSentiment } from '../interfaces/trading-signal.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SentimentAnalyzerService {
  private readonly logger = new Logger(SentimentAnalyzerService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(SocialSentimentEntity)
    private readonly sentimentRepository: Repository<SocialSentimentEntity>,
  ) {}

  async analyzeSentiment(tokenAddress: string, tokenSymbol: string): Promise<number> {
    try {
      const sentiments = await Promise.all([
        this.getTwitterSentiment(tokenSymbol),
        this.getRedditSentiment(tokenSymbol),
        this.getTelegramSentiment(tokenSymbol),
      ]);

      // Store individual sentiment data
      await this.storeSentiments(tokenAddress, sentiments);

      // Calculate weighted average sentiment
      const weightedSentiment = this.calculateWeightedSentiment(sentiments);
      
      this.logger.log(`Sentiment analysis for ${tokenSymbol}: ${weightedSentiment}`);
      return weightedSentiment;
    } catch (error) {
      this.logger.error(`Sentiment analysis failed for ${tokenSymbol}:`, error);
      return 0; // Neutral sentiment on error
    }
  }

  async getHistoricalSentiment(tokenAddress: string, hours: number = 24): Promise<SocialSentiment[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const entities = await this.sentimentRepository.find({
      where: {
        tokenAddress,
        timestamp: { $gte: since } as any,
      },
      order: { timestamp: 'DESC' },
    });

    return entities.map(entity => ({
      tokenAddress: entity.tokenAddress,
      platform: entity.platform as any,
      sentiment: Number(entity.sentiment),
      volume: entity.volume,
      influencerScore: Number(entity.influencerScore),
      timestamp: entity.timestamp,
    }));
  }

  private async getTwitterSentiment(tokenSymbol: string): Promise<SocialSentiment> {
    // This would integrate with Twitter API v2 or social sentiment services
    // Mock implementation for demonstration
    const sentiment = this.generateMockSentiment();
    
    return {
      tokenAddress: '', // Will be set by caller
      platform: 'twitter',
      sentiment: sentiment.score,
      volume: sentiment.mentions,
      influencerScore: sentiment.influencerScore,
      timestamp: new Date(),
    };
  }

  private async getRedditSentiment(tokenSymbol: string): Promise<SocialSentiment> {
    // Would integrate with Reddit API
    const sentiment = this.generateMockSentiment();
    
    return {
      tokenAddress: '',
      platform: 'reddit',
      sentiment: sentiment.score,
      volume: sentiment.mentions,
      influencerScore: sentiment.influencerScore,
      timestamp: new Date(),
    };
  }

  private async getTelegramSentiment(tokenSymbol: string): Promise<SocialSentiment> {
    // Would integrate with Telegram API or third-party services
    const sentiment = this.generateMockSentiment();
    
    return {
      tokenAddress: '',
      platform: 'telegram',
      sentiment: sentiment.score,
      volume: sentiment.mentions,
      influencerScore: sentiment.influencerScore,
      timestamp: new Date(),
    };
  }

  private generateMockSentiment() {
    return {
      score: (Math.random() - 0.5) * 2, // -1 to 1
      mentions: Math.floor(Math.random() * 1000) + 10,
      influencerScore: Math.random() * 100,
    };
  }

  private calculateWeightedSentiment(sentiments: SocialSentiment[]): number {
    const weights = {
      twitter: 0.4,
      reddit: 0.3,
      telegram: 0.2,
      discord: 0.1,
    };

    let totalWeightedSentiment = 0;
    let totalWeight = 0;

    sentiments.forEach(sentiment => {
      const weight = weights[sentiment.platform] || 0.1;
      const volumeMultiplier = Math.min(sentiment.volume / 100, 2); // Volume boost up to 2x
      const influencerMultiplier = 1 + (sentiment.influencerScore / 200); // Influencer boost up to 1.5x
      
      const adjustedWeight = weight * volumeMultiplier * influencerMultiplier;
      
      totalWeightedSentiment += sentiment.sentiment * adjustedWeight;
      totalWeight += adjustedWeight;
    });

    return totalWeight > 0 ? totalWeightedSentiment / totalWeight : 0;
  }

  private async storeSentiments(tokenAddress: string, sentiments: SocialSentiment[]): Promise<void> {
    const entities = sentiments.map(sentiment => {
      const entity = new SocialSentimentEntity();
      entity.tokenAddress = tokenAddress;
      entity.platform = sentiment.platform;
      entity.sentiment = sentiment.sentiment;
      entity.volume = sentiment.volume;
      entity.influencerScore = sentiment.influencerScore;
      entity.timestamp = sentiment.timestamp;
      return entity;
    });

    await this.sentimentRepository.save(entities);
  }
}