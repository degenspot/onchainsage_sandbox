import { IsString, IsOptional, IsArray, IsNumber, IsEnum, IsObject, IsDateString } from "class-validator"
import { NarrativeStatus } from "../entities/narrative.entity"

export class CreateNarrativeDto {
  @IsString()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsArray()
  @IsOptional()
  associatedTokens?: string[]

  @IsArray()
  @IsOptional()
  keywords?: string[]

  @IsNumber()
  @IsOptional()
  sentimentScore?: number

  @IsNumber()
  @IsOptional()
  trendScore?: number

  @IsEnum(NarrativeStatus)
  @IsOptional()
  status?: NarrativeStatus

  @IsObject()
  @IsOptional()
  predictionData?: Record<string, any>

  @IsDateString()
  @IsOptional()
  lastDetectedAt?: string
}
