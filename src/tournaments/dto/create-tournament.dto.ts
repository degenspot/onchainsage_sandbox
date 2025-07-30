import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, IsNotEmpty, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentType, TournamentFormat } from '../entities/tournament.entity';

export class CreateTournamentDto {
  @ApiProperty({ description: 'Tournament title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Tournament description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: TournamentType, description: 'Type of tournament' })
  @IsEnum(TournamentType)
  tournamentType: TournamentType;

  @ApiProperty({ enum: TournamentFormat, description: 'Tournament format' })
  @IsEnum(TournamentFormat)
  format: TournamentFormat;

  @ApiProperty({ description: 'Tournament start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Tournament end date' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Registration deadline' })
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @ApiProperty({ description: 'Maximum number of participants' })
  @IsNumber()
  @Min(2)
  @Max(1000)
  maxParticipants: number;

  @ApiProperty({ description: 'Total number of rounds' })
  @IsNumber()
  @Min(1)
  @Max(50)
  totalRounds: number;

  @ApiPropertyOptional({ description: 'Entry fee in tokens' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  entryFee?: number;

  @ApiPropertyOptional({ description: 'Prize pool amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prizePool?: number;

  @ApiPropertyOptional({ description: 'Prize distribution percentages' })
  @IsOptional()
  prizeDistribution?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Tournament scoring rules' })
  @IsOptional()
  scoringRules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Tournament-specific rules' })
  @IsOptional()
  tournamentRules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether tournament is public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Whether participants need approval' })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
} 