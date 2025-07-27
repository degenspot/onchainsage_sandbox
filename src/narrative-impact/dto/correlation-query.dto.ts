import { IsString, IsOptional, IsDateString, IsArray, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CorrelationQueryDto {
  @ApiProperty({ description: 'Token symbol to analyze', example: 'BTC' })
  @IsString()
  tokenSymbol: string;

  @ApiPropertyOptional({ description: 'Start date for analysis', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analysis', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Specific hashtags to analyze', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  hashtags?: string[];

  @ApiPropertyOptional({ description: 'Specific topics to analyze', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  topics?: string[];

  @ApiPropertyOptional({ description: 'Time interval for aggregation', enum: ['1h', '4h', '1d', '1w'] })
  @IsOptional()
  @IsEnum(['1h', '4h', '1d', '1w'])
  interval?: '1h' | '4h' | '1d' | '1w' = '1d';

  @ApiPropertyOptional({ description: 'Minimum correlation coefficient to include', minimum: -1, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Max(1)
  minCorrelation?: number = 0.1;
}
