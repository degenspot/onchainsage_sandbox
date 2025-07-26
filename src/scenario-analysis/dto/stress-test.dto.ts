import { IsString, IsEnum, IsObject, IsNumber } from 'class-validator';

export class StressTestDto {
  @IsString()
  scenarioId: string;

  @IsString()
  name: string;

  @IsEnum(['market_crash', 'volatility_spike', 'interest_rate_change', 'liquidity_crisis'])
  type: 'market_crash' | 'volatility_spike' | 'interest_rate_change' | 'liquidity_crisis';

  @IsEnum(['mild', 'moderate', 'severe'])
  severity: 'mild' | 'moderate' | 'severe';

  @IsObject()
  parameters: Record<string, number>;
}