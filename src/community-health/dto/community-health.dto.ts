import { IsString, IsNumber, IsOptional, IsEnum, IsArray } from 'class-validator';

export enum PlatformType {
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
}

export enum HealthStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  MODERATE = 'moderate',
  POOR = 'poor',
  CRITICAL = 'critical',
}

export class CommunityMetricsDto {
  @IsString()
  communityId: string;

  @IsEnum(PlatformType)
  platform: PlatformType;

  @IsNumber()
  memberCount: number;

  @IsNumber()
  activeMembers: number;

  @IsNumber()
  messageCount: number;

  @IsNumber()
  engagementRate: number;

  @IsNumber()
  healthScore: number;

  @IsEnum(HealthStatus)
  healthStatus: HealthStatus;

  @IsArray()
  alerts: string[];
}

export class EngagementPatternDto {
  @IsString()
  communityId: string;

  @IsNumber()
  peakHour: number;

  @IsArray()
  dailyActivity: number[];

  @IsArray()
  weeklyActivity: number[];

  @IsNumber()
  responseRate: number;

  @IsNumber()
  averageResponseTime: number;
}

