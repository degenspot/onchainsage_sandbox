import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { CreateAlertDto } from './create-alert.dto';
import { AlertStatus } from '../entities/custom-alert.entity';

export class UpdateAlertDto extends PartialType(CreateAlertDto) {
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class AlertStatusDto {
  @IsEnum(AlertStatus)
  status: AlertStatus;
}

export class AlertPerformanceDto {
  totalTriggers: number;
  successfulTriggers: number;
  falsePositives: number;
  missedAlerts: number;
  averageResponseTime: number;
  lastTriggeredAt?: Date;
  successRate: number;
} 