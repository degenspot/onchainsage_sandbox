import { IsString, IsNumber, IsObject, ValidateNested, Min, Max, IsIn, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class WeightsDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  sentiment: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  technical: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  onChain: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  volume: number;
}

class ThresholdsDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  buySignal: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  sellSignal: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  strongBuy: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  strongSell: number;
}

class FiltersDto {
  @IsNumber()
  @Min(0)
  minVolume: number;

  @IsNumber()
  @Min(0)
  minMarketCap: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxVolatility: number;

  @IsNumber()
  @Min(0)
  minLiquidity: number;
}

export class CreateSignalParametersDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @ValidateNested()
  @Type(() => WeightsDto)
  weights: WeightsDto;

  @ValidateNested()
  @Type(() => ThresholdsDto)
  thresholds: ThresholdsDto;

  @ValidateNested()
  @Type(() => FiltersDto)
  filters: FiltersDto;

  @IsString()
  @IsIn(['1m', '5m', '15m', '1h', '4h', '1d'])
  timeframe: string;
}

export class BacktestRequestDto {
  @IsString()
  parameterSetId: string;

  @IsString()
  startDate: string; // ISO date string

  @IsString()
  endDate: string; // ISO date string

  @IsOptional()
  @IsString({ each: true })
  tokenAddresses?: string[]; // If not provided, test on all available tokens
}
