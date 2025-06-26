import { Module } from '@nestjs/common';

@Module({
  controllers: [BacktestingController],
  providers: [
    BacktestingEngine,
    DataProcessingService,
    ReportService,
    OptimizationService
  ],
  exports: [
    BacktestingEngine,
    DataProcessingService,
    ReportService,
    OptimizationService
  ]
})
export class BacktestingModule {}