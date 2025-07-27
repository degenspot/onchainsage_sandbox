import { IsString, IsNumber, IsDate, IsEnum, IsOptional, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNarrativeDataDto {
  @ApiProperty({ description: 'Token symbol', example: 'BTC' })
  @IsString()
  tokenSymbol: string;

  @ApiProperty({ description: 'Narrative identifier (hashtag or topic)', example: '#bitcoin' })
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'Type of narrative', enum: ['hashtag', 'topic'] })
  @IsEnum(['hashtag', 'topic'])
  type: 'hashtag' | 'topic';

  @ApiProperty({ description: 'Timestamp of the data point' })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty({ description: 'Sentiment score (-1 to 1)', minimum: -1, maximum: 1 })
  @IsNumber()
  @Min(-1)
  @Max(1)
  sentiment: number;

  @ApiProperty({ description: 'Volume of mentions', minimum: 0 })
  @IsNumber()
  @Min(0)
  volume: number;

  @ApiProperty({ description: 'Total reach/impressions', minimum: 0 })
  @IsNumber()
  @Min(0)
  reach: number;

  @ApiProperty({ description: 'Engagement rate', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  engagementRate: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}