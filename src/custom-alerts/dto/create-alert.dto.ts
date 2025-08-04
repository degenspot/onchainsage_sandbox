import { IsString, IsEnum, IsObject, IsArray, IsOptional, IsNumber, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AlertType, AlertCondition, NotificationChannel } from '../entities/custom-alert.entity';

export class AlertParametersDto {
  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsNumber()
  threshold?: number;

  @IsOptional()
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @IsNumber()
  timeWindow?: number;

  @IsOptional()
  @IsString()
  whaleAddress?: string;

  @IsOptional()
  @IsString()
  narrativeName?: string;

  @IsOptional()
  @IsNumber()
  sentimentThreshold?: number;

  @IsOptional()
  @IsNumber()
  volumeThreshold?: number;

  @IsOptional()
  @IsNumber()
  priceThreshold?: number;
}

export class NotificationConfigDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  pushToken?: string;
}

export class CreateAlertDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AlertType)
  alertType: AlertType;

  @IsEnum(AlertCondition)
  condition: AlertCondition;

  @IsObject()
  @ValidateNested()
  @Type(() => AlertParametersDto)
  parameters: AlertParametersDto;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  notificationChannels: NotificationChannel[];

  @IsObject()
  @ValidateNested()
  @Type(() => NotificationConfigDto)
  notificationConfig: NotificationConfigDto;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;
} 