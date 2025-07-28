import { IsString, IsOptional, IsDateString, IsArray, IsEnum } from "class-validator"
import { RiskProfile } from "../entities/user-portfolio.entity"
import type { TrendType } from "../entities/market-trend.entity"

export class PortfolioAnalyticsQueryDto {
  @IsString()
  @IsOptional()
  userId?: string

  @IsString()
  @IsOptional()
  portfolioId?: string

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  symbols?: string[]

  @IsEnum(RiskProfile)
  @IsOptional()
  riskProfile?: RiskProfile
}

export class PortfolioSummaryDto {
  totalValueUSD: number
  totalProfitLossUSD: number
  dailyProfitLossPercentage: number
  currentAllocation: Record<string, number>
  targetAllocation: Record<string, number>
  riskProfile: RiskProfile
  lastSyncedAt: Date
}

export class AssetPerformanceDto {
  symbol: string
  quantity: number
  currentPriceUSD: number
  valueUSD: number
  profitLossPercentage: number
  averageCostUSD: number
}

export class MarketSentimentOverviewDto {
  assetSymbol: string
  marketTrend: TrendType
  marketTrendStrength: number
  socialSentimentScore: number
  socialSentimentSummary: string
}
