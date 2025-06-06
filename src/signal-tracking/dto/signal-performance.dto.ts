import { IsDateString, IsOptional, IsEnum } from 'class-validator';
import { TradingPair } from '../../../shared/enums/signal.enums';

export class PerformanceQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TradingPair)
  tradingPair?: TradingPair;

  @IsOptional()
  minConfidence?: number;

  @IsOptional()
  maxConfidence?: number;
}