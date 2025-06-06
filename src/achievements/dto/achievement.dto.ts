import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AchievementCategory {
  PREDICTION_ACCURACY = 'prediction_accuracy',
  EARLY_TREND = 'early_trend',
  ENGAGEMENT = 'engagement',
  STREAK = 'streak',
  SOCIAL = 'social',
  MILESTONE = 'milestone'
}

export enum AchievementRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export class CreateAchievementDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: AchievementCategory })
  @IsEnum(AchievementCategory)
  category: AchievementCategory;

  @ApiProperty({ enum: AchievementRarity })
  @IsEnum(AchievementRarity)
  rarity: AchievementRarity;

  @ApiProperty()
  @IsString()
  iconUrl: string;

  @ApiProperty()
  @IsNumber()
  pointsReward: number;

  @ApiProperty()
  @IsString()
  criteria: string; // JSON string describing criteria

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UserAchievementDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  achievementId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  progress?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxProgress?: number;
}