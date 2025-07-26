import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MentionsModule } from '../mentions/mentions.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { TokensModule } from '../tokens/tokens.module';
import { InfluencersModule } from '../influencers/influencers.module';

@Module({
  imports: [MentionsModule, MarketDataModule, TokensModule, InfluencersModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}