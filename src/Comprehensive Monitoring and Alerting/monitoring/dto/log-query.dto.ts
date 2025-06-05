import { IsOptional, IsString, IsEnum } from 'class-validator';

export class LogQueryDto {
  @IsOptional()
  @IsEnum(['error', 'warn', 'info', 'debug'])
  level?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  start?: string;

  @IsOptional()
  @IsString()
  end?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;
}