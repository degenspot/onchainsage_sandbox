import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ChallengeType {
  TRADING = 'TRADING',
  RESEARCH = 'RESEARCH',
}

export class CreateChallengeDto {
  @ApiProperty({ example: 'DeFi Mastery Challenge', description: 'Title of the challenge' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Complete DeFi tutorials to earn NFTs', description: 'Detailed description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ChallengeType, example: ChallengeType.TRADING, description: 'Type of challenge' })
  @IsEnum(ChallengeType)
  type: ChallengeType;

  @ApiProperty({ example: '2025-08-01T09:00:00Z', description: 'Start date (ISO format)' })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ example: '2025-08-10T09:00:00Z', description: 'End date (ISO format)' })
  @IsDateString()
  endDate: Date;
}