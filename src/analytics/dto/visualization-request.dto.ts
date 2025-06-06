import { IsString, IsIn } from 'class-validator';

export class VisualizationRequestDto {
  @IsString()
  @IsIn(['ethereum', 'solana', 'polygon', 'bnb']) // Add other chains
  chainA: string;

  @IsString()
  @IsIn(['ethereum', 'solana', 'polygon', 'bnb']) // Add other chains
  chainB: string;

  @IsString()
  @IsIn(['24h', '7d', '30d', '90d'])
  timeRange: string;
}