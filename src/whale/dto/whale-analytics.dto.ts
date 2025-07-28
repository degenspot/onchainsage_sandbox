import { IsString, IsOptional, IsDateString, IsNumber, IsArray, IsEnum, IsBoolean } from "class-validator"
import { WhaleAlertType, WhaleAlertSeverity } from "../entities/whale-alert.entity"

export class WhaleAnalyticsQueryDto {
  @IsString()
  @IsOptional()
  blockchain?: string

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  blockchains?: string[]

  @IsString()
  @IsOptional()
  assetSymbol?: string

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  assetSymbols?: string[]

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsNumber()
  @IsOptional()
  minAmountUSD?: number

  @IsString()
  @IsOptional()
  address?: string // For filtering transactions by from/to address
}

export class HeatmapDataPointDto {
  timestamp: string // YYYY-MM-DDTHH:00:00Z (hourly or daily aggregation)
  blockchain: string
  totalWhaleVolumeUSD: number
  whaleTransactionCount: number
}

export class WhaleVolumeTrendDto {
  period: string // YYYY-MM-DD or YYYY-MM
  totalVolumeUSD: number
  whaleVolumeUSD: number
  transactionCount: number
  whaleTransactionCount: number
}

export class TopWhaleTransactionDto {
  transactionHash: string
  blockchain: string
  fromAddress: string
  toAddress: string
  assetSymbol: string
  amountUSD: number
  timestamp: Date
}

export class WhaleAlertQueryDto {
  @IsEnum(WhaleAlertType)
  @IsOptional()
  type?: WhaleAlertType

  @IsEnum(WhaleAlertSeverity)
  @IsOptional()
  severity?: WhaleAlertSeverity

  @IsString()
  @IsOptional()
  blockchain?: string

  @IsBoolean()
  @IsOptional()
  isRead?: boolean
}
