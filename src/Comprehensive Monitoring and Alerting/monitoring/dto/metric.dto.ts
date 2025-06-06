import { IsString, IsNumber, IsOptional, IsObject, IsEnum } from 'class-validator';

export class CreateMetricDto {
  @IsString()
  name: string;

  @IsNumber()
  value: number;

  @IsEnum(['counter', 'gauge', 'histogram', 'summary'])
  type: string;

  @IsOptional()
  @IsObject()
  tags?: Record<string, string>;
}

export class BusinessMetricDto {
  @IsString()
  name: string;

  @IsNumber()
  value: number;

  @IsString()
  unit: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}