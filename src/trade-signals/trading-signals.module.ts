import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TradingSignalsController } from './controllers/trading-signals.controller';
import { SignalGeneratorService } from './services/signal-generator.service';
import { SentimentAnalyzerService } from './services/sentiment-analyzer.service';
import { TechnicalAnalysisService } from './services/technical-analysis.service';
import { OnChainDataService } from './services/on-chain-data.service';
import { BacktestService } from './services/backtest.service';
import { NotificationService } from './services/notification.service';
import { SignalParametersService } from './services/signal-parameters.service';
import { SignalGenerationJob } from './jobs/signal-generation.job';
import {
  TradingSignalEntity,
  SignalParametersEntity,
  SocialSentimentEntity,
  BacktestResultEntity,
} from './entities/trading-signal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradingSignalEntity,
      SignalParametersEntity,
      SocialSentimentEntity,
      BacktestResultEntity,
    ]),
    HttpModule,
    EventEmitterModule,
    ScheduleModule,
  ],
  controllers: [TradingSignalsController],
  providers: [
    SignalGeneratorService,
    SentimentAnalyzerService,
    TechnicalAnalysisService,
    OnChainDataService,
    BacktestService,
    NotificationService,
    SignalParametersService,
    SignalGenerationJob,
  ],
  exports: [SignalGeneratorService, BacktestService],
})
export class TradingSignalsModule {}