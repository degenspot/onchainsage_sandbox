import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionMarket } from './entities/prediction-market.entity';
import { MarketParticipant } from './entities/market-participant.entity';
import { MarketOutcome } from './entities/market-outcome.entity';
import { MarketResolution } from './entities/market-resolution.entity';
import { PredictionMarketController } from './controllers/prediction-market.controller';
import { PredictionMarketService } from './services/prediction-market.service';
import { MarketParticipationService } from './services/market-participation.service';
import { MarketResolutionService } from './services/market-resolution.service';
import { MarketAnalyticsService } from './services/market-analytics.service';
import { BlockchainService } from './services/blockchain.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PredictionMarket,
      MarketParticipant,
      MarketOutcome,
      MarketResolution,
    ]),
  ],
  controllers: [PredictionMarketController],
  providers: [
    PredictionMarketService,
    MarketParticipationService,
    MarketResolutionService,
    MarketAnalyticsService,
    BlockchainService,
  ],
  exports: [
    PredictionMarketService,
    MarketParticipationService,
    MarketResolutionService,
    MarketAnalyticsService,
  ],
})
export class PredictionMarketsModule {} 