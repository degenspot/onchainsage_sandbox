import { IsEnum, IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { TokenCategory, TokenLifecycleStage } from '../enums/lifecycle-stage.enum';

export class CreateTokenDto {
  @IsString()
  symbol: string;

  @IsString()
  name: string;

  @IsString()
  contractAddress: string;

  @IsString()
  blockchain: string;

  @IsEnum(TokenCategory)
  category: TokenCategory;

  @IsDateString()
  launchDate: string;

  @IsOptional()
  @IsNumber()
  initialPrice?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTokenStageDto {
  @IsEnum(TokenLifecycleStage)
  stage: TokenLifecycleStage;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsOptional()
  triggerFactors?: Record<string, any>;
}

export class TokenMetricsDto {
  @IsNumber()
  price: number;

  @IsNumber()
  volume: number;

  @IsNumber()
  marketCap: number;

  @IsNumber()
  holders: number;

  @IsNumber()
  transactions: number;

  @IsNumber()
  volatility: number;

  @IsNumber()
  liquidityScore: number;

  @IsNumber()
  socialMentions: number;

  @IsNumber()
  sentimentScore: number;

  @IsNumber()
  githubActivity: number;
}