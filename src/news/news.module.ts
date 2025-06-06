import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NewsController } from './controllers/news.controller';
import { NewsAggregatorService } from './services/news-aggregator.service';
import { NewsDeduplicationService } from './services/news-deduplication.service';
import { SentimentAnalysisService } from './services/sentiment-analysis.service';
import { NewsScoringService } from './services/news-scoring.service';
import { NewsAlertService } from './services/news-alert.service';
import { NewsStreamGateway } from './gateways/news-stream.gateway';
import { NewsArticle } from './entities/news-article.entity';
import { CoindeskProvider } from './providers/coindesk.provider';
import { CointelegraphProvider } from './providers/cointelegraph.provider';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NewsArticle]),
    ScheduleModule.forRoot(),
    AIModule,
  ],
  controllers: [NewsController],
  providers: [
    NewsAggregatorService,
    NewsDeduplicationService,
    SentimentAnalysisService,
    NewsScoringService,
    NewsAlertService,
    NewsStreamGateway,
    CoindeskProvider,
    CointelegraphProvider,
  ],
  exports: [NewsAggregatorService],
})
export class NewsModule {
  constructor(
    private readonly aggregatorService: NewsAggregatorService,
    private readonly coindeskProvider: CoindeskProvider,
    private readonly cointelegraphProvider: CointelegraphProvider,
  ) {
    // Register news providers
    this.aggregatorService.registerProvider(this.coindeskProvider);
    this.aggregatorService.registerProvider(this.cointelegraphProvider);
  }
}