import { IsString, IsEnum, IsNumber, IsOptional, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PredictionType } from '../entities/tournament-prediction.entity';

export class SubmitPredictionDto {
  @ApiProperty({ description: 'Tournament ID' })
  @IsString()
  @IsNotEmpty()
  tournamentId: string;

  @ApiProperty({ description: 'Round ID' })
  @IsString()
  @IsNotEmpty()
  roundId: string;

  @ApiProperty({ description: 'Prediction market ID' })
  @IsString()
  @IsNotEmpty()
  marketId: string;

  @ApiProperty({ enum: PredictionType, description: 'Type of prediction' })
  @IsEnum(PredictionType)
  predictionType: PredictionType;

  @ApiProperty({ description: 'The actual prediction' })
  @IsString()
  @IsNotEmpty()
  prediction: string;

  @ApiPropertyOptional({ description: 'Confidence level (0-1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @ApiPropertyOptional({ description: 'Amount to stake on this prediction' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stakeAmount?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
} 