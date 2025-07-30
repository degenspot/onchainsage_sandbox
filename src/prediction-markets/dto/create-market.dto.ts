import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketType, ResolutionType } from '../entities/prediction-market.entity';

export class CreateMarketDto {
  @ApiProperty({ description: 'Title of the prediction market' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description of the prediction market' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: MarketType, description: 'Type of prediction market' })
  @IsEnum(MarketType)
  marketType: MarketType;

  @ApiProperty({ enum: ResolutionType, description: 'How the market will be resolved' })
  @IsEnum(ResolutionType)
  resolutionType: ResolutionType;

  @ApiPropertyOptional({ description: 'Token symbol for token price markets' })
  @IsOptional()
  @IsString()
  tokenSymbol?: string;

  @ApiPropertyOptional({ description: 'Target price for token price markets' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPrice?: number;

  @ApiPropertyOptional({ description: 'Price threshold for resolution' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceThreshold?: number;

  @ApiPropertyOptional({ description: 'Event description for event outcome markets' })
  @IsOptional()
  @IsString()
  eventDescription?: string;

  @ApiPropertyOptional({ description: 'Clear criteria for outcome resolution' })
  @IsOptional()
  @IsString()
  outcomeCriteria?: string;

  @ApiProperty({ description: 'Market start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Market end date' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Platform fee percentage (0-10)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  platformFeePercentage?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
} 