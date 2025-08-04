import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomAlertsController } from './custom-alerts.controller';
import { CustomAlertsService } from './custom-alerts.service';
import { AlertExecutionService } from './alert-execution.service';
import { NotificationService } from './notification.service';
import { CustomAlert } from './entities/custom-alert.entity';
import { AlertHistory } from './entities/alert-history.entity';
import { AlertConfiguration } from './entities/alert-configuration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomAlert, AlertHistory, AlertConfiguration]),
    HttpModule,
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [CustomAlertsController],
  providers: [
    CustomAlertsService,
    AlertExecutionService,
    NotificationService,
  ],
  exports: [CustomAlertsService, AlertExecutionService],
})
export class CustomAlertsModule {} 