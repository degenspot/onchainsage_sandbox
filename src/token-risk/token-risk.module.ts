import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TokenRiskController } from './controllers/token-risk.controller';
import { TokenRiskService } from './services/token-risk.service';
import { MLRiskAnalyzerService } from './services/ml-risk-analyzer.service';
import { AlertService } from './services/alert.service';
import { TokenDataService } from './services/token-data.service';
import { TokenRiskEntity, TokenMetricsEntity } from './entities/token-risk.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenRiskEntity, TokenMetricsEntity]),
    HttpModule,
    EventEmitterModule,
  ],
  controllers: [TokenRiskController],
  providers: [
    TokenRiskService,
    MLRiskAnalyzerService,
    AlertService,
    TokenDataService,
  ],
  exports: [TokenRiskService, MLRiskAnalyzerService],
})
export class TokenRiskModule {}