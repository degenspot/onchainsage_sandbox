import { Injectable } from '@nestjs/common';
import { MentionsService } from '../mentions/mentions.service';
import { MarketDataService } from '../market-data/market-data.service';
import { TokensService } from '../tokens/tokens.service';
import { InfluencersService } from '../influencers/influencers.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private mentionsService: MentionsService,
    private marketDataService: MarketDataService,
    private tokensService: TokensService,
    private influencersService: InfluencersService,
  ) {}

  async getInfluencerImpact(influencerId: string, hours: number = 24) {
    const mentions = await this.mentionsService.getMentionsByInfluencer(influencerId, 100);
    const recentMentions = mentions.filter(m => 
      new Date(m.createdAt) > new Date(Date.now() - hours * 60 * 60 * 1000)
    );

    const impactData = [];
    
    for (const mention of recentMentions) {
      const priceDataBefore = await this.getPriceDataAroundTime(
        mention.tokenId,
        new Date(mention.createdAt),
        -1 // 1 hour before
      );
      
      const priceDataAfter = await this.getPriceDataAroundTime(
        mention.tokenId,
        new Date(mention.createdAt),
        2 // 2 hours after
      );

      if (priceDataBefore && priceDataAfter) {
        const priceChange = ((priceDataAfter.price - priceDataBefore.price) / priceDataBefore.price) * 100;
        const volumeChange = ((priceDataAfter.volume24h - priceDataBefore.volume24h) / priceDataBefore.volume24h) * 100;

        impactData.push({
          mention,
          priceChange,
          volumeChange,
          engagementScore: mention.likeCount + mention.retweetCount * 2 + mention.replyCount,
        });
      }
    }

    return {
      totalMentions: recentMentions.length,
      averagePriceImpact: impactData.reduce((sum, item) => sum + item.priceChange, 0) / impactData.length || 0,
      averageVolumeImpact: impactData.reduce((sum, item) => sum + item.volumeChange, 0) / impactData.length || 0,
      totalEngagement: impactData.reduce((sum, item) => sum + item.engagementScore, 0),
      impacts: impactData,
    };
  }

  async getTokenMentionAnalytics(tokenId: string, hours: number = 24) {
    const mentions = await this.mentionsService.getMentionsByToken(tokenId, 100);
    const recentMentions = mentions.filter(m => 
      new Date(m.createdAt) > new Date(Date.now() - hours * 60 * 60 * 1000)
    );

    const sentimentDistribution = {
      positive: recentMentions.filter(m => m.sentiment === 'positive').length,
      negative: recentMentions.filter(m => m.sentiment === 'negative').length,
      neutral: recentMentions.filter(m => m.sentiment === 'neutral').length,
    };

    const topInfluencers = recentMentions
      .reduce((acc, mention) => {
        const existing = acc.find(item => item.influencerId === mention.influencerId);
        if (existing) {
          existing.mentionCount++;
          existing.totalEngagement += mention.likeCount + mention.retweetCount * 2;
        } else {
          acc.push({
            influencerId: mention.influencerId,
            influencer: mention.influencer,
            mentionCount: 1,
            totalEngagement: mention.likeCount + mention.retweetCount * 2,
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 10);

    return {
      totalMentions: recentMentions.length,
      sentimentDistribution,
      averageSentimentScore: recentMentions.reduce((sum, m) => sum + m.sentimentScore, 0) / recentMentions.length || 0,
      totalEngagement: recentMentions.reduce((sum, m) => sum + m.likeCount + m.retweetCount * 2, 0),
      topInfluencers,
      mentionTimeline: this.generateMentionTimeline(recentMentions),
    };
  }

  async getTrendingTokens(hours: number = 24) {
    const mentions = await this.mentionsService.findRecentMentions(hours);
    
    const tokenStats = mentions.reduce((acc, mention) => {
      const existing = acc.find(item => item.tokenId === mention.tokenId);
      if (existing) {
        existing.mentionCount++;
        existing.totalEngagement += mention.likeCount + mention.retweetCount * 2;
        existing.sentimentScore += mention.sentimentScore;
      } else {
        acc.push({
          tokenId: mention.tokenId,
          token: mention.token,
          mentionCount: 1,
          totalEngagement: mention.likeCount + mention.retweetCount * 2,
          sentimentScore: mention.sentimentScore,
        });
      }
      return acc;
    }, []);

    return tokenStats
      .map(stat => ({
        ...stat,
        averageSentiment: stat.sentimentScore / stat.mentionCount,
        trendScore: stat.mentionCount * 0.4 + (stat.totalEngagement / 1000) * 0.6,
      }))
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 20);
  }

  async getInfluencerLeaderboard() {
    const influencers = await this.influencersService.findAll();
    
    const leaderboard = [];
    
    for (const influencer of influencers) {
      const recentMentions = await this.mentionsService.getMentionsByInfluencer(influencer.id, 50);
      const last24h = recentMentions.filter(m => 
        new Date(m.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      const totalEngagement = last24h.reduce((sum, m) => sum + m.likeCount + m.retweetCount * 2, 0);
      const averageSentiment = last24h.reduce((sum, m) => sum + m.sentimentScore, 0) / last24h.length || 0;

      leaderboard.push({
        influencer,
        mentionsLast24h: last24h.length,
        totalEngagement,
        averageSentiment,
        impactScore: (last24h.length * 0.3) + (totalEngagement / 1000 * 0.4) + (averageSentiment * 0.3),
      });
    }

    return leaderboard
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 50);
  }

  private async getPriceDataAroundTime(tokenId: string, targetTime: Date, hourOffset: number) {
    const targetTimeWithOffset = new Date(targetTime.getTime() + hourOffset * 60 * 60 * 1000);
    
    // Find closest price data within 30 minutes of target time
    const priceHistory = await this.marketDataService.getPriceHistory(tokenId, Math.abs(hourOffset) + 1);
    
    return priceHistory.find(data => {
      const timeDiff = Math.abs(new Date(data.timestamp).getTime() - targetTimeWithOffset.getTime());
      return timeDiff <= 30 * 60 * 1000; // Within 30 minutes
    });
  }

  private generateMentionTimeline(mentions: any[]) {
    const hourlyData = {};
    
    mentions.forEach(mention => {
      const hour = new Date(mention.createdAt).toISOString().slice(0, 13);
      if (!hourlyData[hour]) {
        hourlyData[hour] = { count: 0, engagement: 0, sentiment: 0 };
      }
      hourlyData[hour].count++;
      hourlyData[hour].engagement += mention.likeCount + mention.retweetCount * 2;
      hourlyData[hour].sentiment += mention.sentimentScore;
    });

    return Object.entries(hourlyData).map(([hour, data]: [string, any]) => ({
      time: hour,
      mentionCount: data.count,
      totalEngagement: data.engagement,
      averageSentiment: data.sentiment / data.count,
    }));
  }
}
