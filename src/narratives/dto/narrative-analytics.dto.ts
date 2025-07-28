import { IsString, IsOptional, IsDateString, IsArray, IsEnum, IsNumber } from "class-validator"
import { NarrativeStatus } from "../entities/narrative.entity"

export class NarrativeQueryDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsArray()
  @IsOptional()
  associatedTokens?: string[]

  @IsEnum(NarrativeStatus)
  @IsOptional()
  status?: NarrativeStatus

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsNumber()
  @IsOptional()
  minTrendScore?: number
}

export class NarrativeTrendDto {
  period: string
  narrativeName: string
  averageSentiment: number
  averageTrendScore: number
  totalMentions: number
}

export class TopTokensByNarrativeDto {
  narrativeName: string
  token: string
  mentions: number
  averageSentiment: number
}

export class SentimentBreakdownDto {
  narrativeName: string
  positiveCount: number
  negativeCount: number
  neutralCount: number
  overallSentiment: number
}
