import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScenarioAnalysisController } from './controllers/scenario-analysis.controller';
import {
  ScenarioModelingService,
  MarketSimulatorService,
  RiskAssessmentService,
  StressTestingService,
  VisualizationService,
  AlertService,
} from './services';
import {
  Scenario,
  MarketConditionEntity,
  RiskAssessment,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Scenario,
      MarketConditionEntity,
      RiskAssessment,
    ]),
  ],
  controllers: [ScenarioAnalysisController],
  providers: [
    ScenarioModelingService,
    MarketSimulatorService,
    RiskAssessmentService,
    StressTestingService,
    VisualizationService,
    AlertService,
  ],
  exports: [
    ScenarioModelingService,
    MarketSimulatorService,
    RiskAssessmentService,
    StressTestingService,
    VisualizationService,
    AlertService,
  ],
})
export class ScenarioAnalysisModule {}