import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateAlertDto {
  @IsEnum(['error', 'performance', 'security', 'business'])
  type: string;

  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class AlertQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  start?: string;

  @IsOptional()
  @IsString()
  end?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}