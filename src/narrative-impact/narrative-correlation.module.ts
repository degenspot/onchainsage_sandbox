import { Module } from '@nestjs/common';
import { NarrativeCorrelationController } from './narrative-correlation.controller';
import { NarrativeCorrelationService } from './services/narrative-correlation.service';
import { CorrelationAnalysisService } from './services/correlation-analysis.service';
import { PatternDetectionService } from './services/pattern-detection.service';
import { MockNarrativeDataSource, MockPriceDataSource } from './__tests__/mock-data-sources';

@Module({
  controllers: [NarrativeCorrelationController],
  providers: [
    NarrativeCorrelationService,
    CorrelationAnalysisService,
    PatternDetectionService,
    {
      provide: 'NarrativeDataSource',
      useClass: MockNarrativeDataSource, // Replace with real implementation
    },
    {
      provide: 'PriceDataSource',
      useClass: MockPriceDataSource, // Replace with real implementation
    },
  ],
  exports: [NarrativeCorrelationService],
})
export class NarrativeCorrelationModule {}