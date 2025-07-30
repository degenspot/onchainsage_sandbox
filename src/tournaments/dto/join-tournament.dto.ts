import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JoinTournamentDto {
  @ApiProperty({ description: 'Tournament ID to join' })
  @IsString()
  @IsNotEmpty()
  tournamentId: string;

  @ApiPropertyOptional({ description: 'User blockchain address' })
  @IsOptional()
  @IsString()
  userAddress?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
} 