import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { MonitoringService } from './monitoring.service';
import { LoggingService } from './logging.service';
import { AlertingService } from './alerting.service';
import { MetricsService } from './metrics.service';
import { HealthController } from './health.controller';
import { MonitoringController } from './monitoring.controller';

@Global()
@Module({
  imports: [
    ConfigModule,
    TerminusModule,
    HttpModule,
  ],
  controllers: [HealthController, MonitoringController],
  providers: [
    MonitoringService,
    LoggingService,
    AlertingService,
    MetricsService,
  ],
  exports: [
    MonitoringService,
    LoggingService,
    AlertingService,
    MetricsService,
  ],
})
export class MonitoringModule {}