import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Signal } from './entities/signal.entity';
import { SignalPerformance } from './entities/signal-performance.entity';
import { SignalValidation } from './entities/signal-validation.entity';
import { SignalTrackingService } from './services/signal-tracking.service';
import { PerformanceAnalyticsService } from './services/performance-analytics.service';
import { SignalValidationService } from './services/signal-validation.service';
import { SignalTrackingController } from './controllers/signal-tracking.controller';
import { AnalyticsDashboardController } from './controllers/analytics-dashboard.controller';
import { SignalTrackingRepository } from './repositories/signal-tracking.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Signal,
      SignalPerformance,
      SignalValidation,
    ]),
  ],
  controllers: [
    SignalTrackingController,
    AnalyticsDashboardController,
  ],
  providers: [
    SignalTrackingService,
    PerformanceAnalyticsService,
    SignalValidationService,
    SignalTrackingRepository,
  ],
  exports: [
    SignalTrackingService,
    PerformanceAnalyticsService,
    SignalValidationService,
  ],
})
export class SignalTrackingModule {}