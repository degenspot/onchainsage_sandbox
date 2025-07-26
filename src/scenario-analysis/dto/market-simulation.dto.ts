import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class MarketSimulationDto {
  @IsString()
  symbol: string;

  @IsNumber()
  initialPrice: number;

  @IsNumber()
  volatility: number;

  @IsNumber()
  drift: number;

  @IsNumber()
  timeHorizon: number;

  @IsNumber()
  steps: number;

  @IsOptional()
  @IsEnum(['geometric_brownian', 'jump_diffusion', 'heston'])
  model?: string;
}
