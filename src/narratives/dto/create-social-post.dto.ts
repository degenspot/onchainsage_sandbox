import { IsString, IsEnum, IsOptional, IsObject, IsDateString, IsNumber, IsArray } from "class-validator"
import { SocialPlatform } from "../entities/social-post.entity"

export class CreateSocialPostDto {
  @IsString()
  externalId: string

  @IsString()
  authorId: string

  @IsString()
  content: string

  @IsEnum(SocialPlatform)
  platform: SocialPlatform

  @IsNumber()
  @IsOptional()
  sentimentScore?: number

  @IsArray()
  @IsOptional()
  detectedNarratives?: string[]

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>

  @IsDateString()
  timestamp: string
}
