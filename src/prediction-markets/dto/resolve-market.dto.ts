import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveMarketDto {
  @ApiProperty({ description: 'Market ID to resolve' })
  @IsString()
  @IsNotEmpty()
  marketId: string;

  @ApiProperty({ description: 'The correct outcome' })
  @IsString()
  @IsNotEmpty()
  outcome: string;

  @ApiProperty({ description: 'Explanation of why this outcome was chosen' })
  @IsString()
  @IsNotEmpty()
  resolutionReason: string;

  @ApiPropertyOptional({ description: 'Oracle data used for resolution' })
  @IsOptional()
  @IsString()
  oracleData?: string;

  @ApiPropertyOptional({ description: 'Community vote result' })
  @IsOptional()
  @IsString()
  communityVoteResult?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
} 