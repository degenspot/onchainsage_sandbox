import { IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { SignalType, TradingPair } from '../../../shared/enums/signal.enums';

export class CreateSignalDto {
  @IsEnum(SignalType)
  type: SignalType;

  @IsEnum(TradingPair)
  tradingPair: TradingPair;

  @IsNumber()
  @Min(0)
  entryPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stopLoss?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  takeProfit?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceScore: number;

  @IsOptional()
  @IsString()
  analysis?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}