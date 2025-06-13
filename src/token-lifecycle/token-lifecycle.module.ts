import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { TokenMetrics } from './entities/token-metrics.entity';
import { LifecycleTransition } from './entities/lifecycle-transition.entity';
import { PatternRecognition } from './entities/pattern-recognition.entity';
import { TokenLifecycleController } from './controllers/token-lifecycle.controller';
import { TokenLifecycleService } from './services/token-lifecycle.service';
import { LifecycleAnalyzerService } from './services/lifecycle-analyzer.service';
import { PatternRecognitionService } from './services/pattern-recognition.service';
import { PredictiveModelingService } from './services/predictive-modeling.service';
import { AutomatedCategorizationService } from './services/automated-categorization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Token,
      TokenMetrics,
      LifecycleTransition,
      PatternRecognition
    ])
  ],
  controllers: [TokenLifecycleController],
  providers: [
    TokenLifecycleService,
    LifecycleAnalyzerService,
    PatternRecognitionService,
    PredictiveModelingService,
    AutomatedCategorizationService
  ],
  exports: [
    TokenLifecycleService,
    LifecycleAnalyzerService,
    PatternRecognitionService,
    PredictiveModelingService
  ]
})
export class TokenLifecycleModule {}