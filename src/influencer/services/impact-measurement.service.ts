import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { MarketMovement } from '../interfaces/market-movement.interface';
import { SocialPost } from '../interfaces/social-post.interface';

@Injectable()
export class ImpactMeasurementService {
  constructor(private readonly httpService: HttpService) {}

  async measurePostImpact(post: SocialPost): Promise<{
    priceImpact: number;
    volumeImpact: number;
    sentimentImpact: number;
  }> {
    // Get market data before and after post
    const [beforeData, afterData] = await Promise.all([
      this.getMarketData(post.asset, post.timestamp - 3600), // 1 hour before
      this.getMarketData(post.asset, post.timestamp + 3600), // 1 hour after
    ]);

    return {
      priceImpact: this.calculatePriceImpact(beforeData, afterData),
      volumeImpact: this.calculateVolumeImpact(beforeData, afterData),
      sentimentImpact: this.analyzeSentiment(post.content),
    };
  }

  private async getMarketData(asset: string, timestamp: number): Promise<MarketMovement> {
    // Implementation to fetch market data from your data source
    const response = await this.httpService.get(`/market-data/${asset}/${timestamp}`).toPromise();
    return response.data;
  }

  private calculatePriceImpact(before: MarketMovement, after: MarketMovement): number {
    return ((after.price - before.price) / before.price) * 100;
  }

  private calculateVolumeImpact(before: MarketMovement, after: MarketMovement): number {
    return ((after.volume - before.volume) / before.volume) * 100;
  }

  private analyzeSentiment(content: string): number {
    // Simple sentiment analysis - integrate with NLP service in production
    const positiveWords = ['bullish', 'buy', 'moon', 'growth'];
    const negativeWords = ['bearish', 'sell', 'dump', 'warning'];
    
    const text = content.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => { if(text.includes(word)) score += 1; });
    negativeWords.forEach(word => { if(text.includes(word)) score -= 1; });
    
    return score;
  }
}