import { IsString, IsNumber, IsOptional } from 'class-validator';

export class TrackInfluencerDto {
  @IsString()
  username: string;

  @IsString()
  platform: string;

  @IsNumber()
  @IsOptional()
  followers?: number;

  @IsNumber()
  @IsOptional()
  engagementRate?: number;
}