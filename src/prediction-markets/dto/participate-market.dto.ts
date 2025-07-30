import { IsString, IsEnum, IsNumber, IsOptional, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParticipationType } from '../entities/market-participant.entity';

export class ParticipateMarketDto {
  @ApiProperty({ description: 'Market ID to participate in' })
  @IsString()
  @IsNotEmpty()
  marketId: string;

  @ApiProperty({ enum: ParticipationType, description: 'Type of participation' })
  @IsEnum(ParticipationType)
  participationType: ParticipationType;

  @ApiProperty({ description: 'Amount to stake in the prediction' })
  @IsNumber()
  @Min(0.01)
  amountStaked: number;

  @ApiPropertyOptional({ description: 'User blockchain address' })
  @IsOptional()
  @IsString()
  userAddress?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
} 