import { IsArray, IsOptional, IsString } from 'class-validator';

export class DetectNarrativeDto {
  @IsArray()
  socialData: Array<{
    content: string;
    authorId: string;
    timestamp: Date;
    sentiment?: number;
  }>;

  @IsArray()
  @IsString({ each: true })
  assetsToTrack: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  existingNarratives?: string[];
}