import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class MarketConditionDto {
  @IsString()
  symbol: string;

  @IsNumber()
  price: number;

  @IsNumber()
  volatility: number;

  @IsNumber()
  volume: number;
}

export class TradingStrategyDto {
  @IsString()
  name: string;

  @IsEnum(['long', 'short', 'neutral'])
  type: 'long' | 'short' | 'neutral';

  @IsNumber()
  entryPrice: number;

  @IsOptional()
  @IsNumber()
  exitPrice?: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @IsOptional()
  @IsNumber()
  takeProfit?: number;
}

export class CreateScenarioDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  duration: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarketConditionDto)
  marketConditions: MarketConditionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradingStrategyDto)
  strategies: TradingStrategyDto[];
}