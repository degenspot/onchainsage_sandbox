import { IsString, IsOptional, IsObject, IsDateString, IsNumber, IsArray } from "class-validator"

export class CreateNewsArticleDto {
  @IsString()
  externalId: string

  @IsString()
  title: string

  @IsString()
  content: string

  @IsString()
  @IsOptional()
  url?: string

  @IsString()
  @IsOptional()
  source?: string

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
  publishedAt: string
}
