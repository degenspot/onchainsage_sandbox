import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NewsArticle } from '../entities/news-article.entity';
import { NewsProvider } from '../interfaces/news-provider.interface';
import { NewsDeduplicationService } from './news-deduplication.service';
import { SentimentAnalysisService } from './sentiment-analysis.service';
import { NewsScoringService } from './news-scoring.service';
import { NewsStreamGateway } from '../gateways/news-stream.gateway';

@Injectable()
export class NewsAggregatorService {
  private readonly logger = new Logger(NewsAggregatorService.name);
  private readonly providers: NewsProvider[] = [];

  constructor(
    @InjectRepository(NewsArticle)
    private readonly newsRepository: Repository<NewsArticle>,
    private readonly deduplicationService: NewsDeduplicationService,
    private readonly sentimentService: SentimentAnalysisService,
    private readonly scoringService: NewsScoringService,
    private readonly newsGateway: NewsStreamGateway,
  ) {}

  registerProvider(provider: NewsProvider): void {
    this.providers.push(provider);
    this.logger.log(`Registered news provider: ${provider.getName()}`);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async aggregateNews(): Promise<void> {
    this.logger.log('Starting news aggregation cycle');

    for (const provider of this.providers) {
      try {
        const rawNews = await provider.fetchLatestNews(50);
        const processedArticles = await this.processRawNews(rawNews, provider.getName());
        
        for (const article of processedArticles) {
          await this.saveAndBroadcast(article);
        }
      } catch (error) {
        this.logger.error(`Error aggregating from ${provider.getName()}: ${error.message}`);
      }
    }
  }

  private async processRawNews(rawNews: any[], providerName: string): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = [];

    for (const item of rawNews) {
      try {
        // Check for duplicates
        const isDuplicate = await this.deduplicationService.isDuplicate(item.content);
        if (isDuplicate) continue;

        // Create news article entity
        const article = new NewsArticle();
        article.title = item.title;
        article.content = item.content;
        article.url = item.url;
        article.source = providerName;
        article.author = item.author || 'Unknown';
        article.publishedAt = new Date(item.publishedAt);
        article.contentHash = this.deduplicationService.generateContentHash(item.content);

        // Perform sentiment analysis
        const sentiment = await this.sentimentService.analyzeSentiment(item.content);
        article.sentimentScore = sentiment.score;
        article.sentimentLabel = sentiment.label;
        article.keywords = sentiment.keywords;

        // Extract crypto mentions
        article.cryptoMentions = this.extractCryptoMentions(item.content);

        // Calculate impact score
        article.impactScore = await this.scoringService.calculateImpactScore(article);
        article.isProcessed = true;

        articles.push(article);
      } catch (error) {
        this.logger.error(`Error processing article: ${error.message}`);
      }
    }

    return articles;
  }

  private async saveAndBroadcast(article: NewsArticle): Promise<void> {
    try {
      const savedArticle = await this.newsRepository.save(article);
      
      // Broadcast to WebSocket clients if high impact
      if (savedArticle.impactScore > 7) {
        this.newsGateway.broadcastHighImpactNews(savedArticle);
      }
      
      this.newsGateway.broadcastNews(savedArticle);
    } catch (error) {
      this.logger.error(`Error saving article: ${error.message}`);
    }
  }

  private extractCryptoMentions(content: string): string[] {
    const cryptoKeywords = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'cardano', 'ada',
      'polkadot', 'dot', 'chainlink', 'link', 'litecoin', 'ltc'
    ];
    
    const mentions = [];
    const lowerContent = content.toLowerCase();
    
    for (const keyword of cryptoKeywords) {
      if (lowerContent.includes(keyword)) {
        mentions.push(keyword);
      }
    }
    
    return [...new Set(mentions)];
  }

  async getNewsByFilters(filters: any): Promise<NewsArticle[]> {
    const query = this.newsRepository.createQueryBuilder('article')
      .orderBy('article.publishedAt', 'DESC');

    if (filters.sentiment) {
      query.andWhere('article.sentimentLabel = :sentiment', { sentiment: filters.sentiment });
    }

    if (filters.minImpactScore) {
      query.andWhere('article.impactScore >= :minScore', { minScore: filters.minImpactScore });
    }

    if (filters.cryptoCurrency) {
      query.andWhere('article.cryptoMentions LIKE :crypto', { crypto: `%${filters.cryptoCurrency}%` });
    }

    if (filters.limit) {
      query.limit(filters.limit);
    }

    return query.getMany();
  }
}