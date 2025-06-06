import { Injectable } from '@nestjs/common';
import { NewsArticle } from '../entities/news-article.entity';

@Injectable()
export class NewsScoringService {
  private readonly impactKeywords = {
    high: ['regulation', 'ban', 'approve', 'etf', 'sec', 'federal', 'government'],
    medium: ['partnership', 'adoption', 'launch', 'announcement', 'update'],
    low: ['price', 'trading', 'market', 'analysis']
  };

  async calculateImpactScore(article: NewsArticle): Promise<number> {
    let score = 0;
    const content = (article.title + ' ' + article.content).toLowerCase();

    // Sentiment impact (0-3 points)
    score += this.calculateSentimentImpact(article.sentimentScore);

    // Keyword relevance (0-4 points)
    score += this.calculateKeywordImpact(content);

    // Source credibility (0-2 points)
    score += this.calculateSourceImpact(article.source);

    // Recency bonus (0-1 point)
    score += this.calculateRecencyBonus(article.publishedAt);

    return Math.min(10, Math.max(0, score));
  }

  private calculateSentimentImpact(sentimentScore: number): number {
    const absScore = Math.abs(sentimentScore);
    if (absScore > 0.7) return 3;
    if (absScore > 0.4) return 2;
    if (absScore > 0.2) return 1;
    return 0;
  }

  private calculateKeywordImpact(content: string): number {
    let score = 0;
    
    // High impact keywords
    for (const keyword of this.impactKeywords.high) {
      if (content.includes(keyword)) score += 1.5;
    }
    
    // Medium impact keywords
    for (const keyword of this.impactKeywords.medium) {
      if (content.includes(keyword)) score += 1;
    }
    
    // Low impact keywords
    for (const keyword of this.impactKeywords.low) {
      if (content.includes(keyword)) score += 0.5;
    }
    
    return Math.min(4, score);
  }

  private calculateSourceImpact(source: string): number {
    const highCredibilitySources = ['coindesk', 'cointelegraph', 'reuters', 'bloomberg'];
    const mediumCredibilitySources = ['decrypt', 'coinbase', 'binance'];
    
    const lowerSource = source.toLowerCase();
    
    if (highCredibilitySources.some(s => lowerSource.includes(s))) return 2;
    if (mediumCredibilitySources.some(s => lowerSource.includes(s))) return 1;
    return 0.5;
  }

  private calculateRecencyBonus(publishedAt: Date): number {
    const hoursOld = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld < 1) return 1;
    if (hoursOld < 6) return 0.5;
    return 0;
  }
}