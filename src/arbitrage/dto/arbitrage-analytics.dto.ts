import { IsString, IsOptional, IsDateString, IsNumber, IsArray } from "class-validator"

export class ArbitrageAnalyticsQueryDto {
  @IsString()
  @IsOptional()
  tokenPair?: string

  @IsString()
  @IsOptional()
  chain?: string

  @IsString()
  @IsOptional()
  dex?: string

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsNumber()
  @IsOptional()
  minProfitPercentage?: number

  @IsNumber()
  @IsOptional()
  minProfitUSD?: number

  @IsArray()
  @IsOptional()
  chains?: string[]

  @IsArray()
  @IsOptional()
  tokenPairs?: string[]
}

export class ProfitabilitySummaryDto {
  totalOpportunitiesDetected: number
  totalEventsRecorded: number
  totalProfitUSD: number
  averageProfitPerEventUSD: number
  highestProfitEventUSD: number
  mostProfitablePair: string
  mostProfitableChain: string
}

export class ArbitrageTrendDto {
  period: string // e.g., "YYYY-MM"
  opportunitiesCount: number
  executedEventsCount: number
  totalProfitUSD: number
  averageProfitUSD: number
}

export class TopOpportunityDto {
  tokenPair: string
  chain1: string
  dex1: string
  chain2: string
  dex2: string
  priceDifferencePercentage: number
  potentialProfitUSD: number
  detectedAt: Date
}
