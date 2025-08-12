import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from "class-validator"
import { Type } from "class-transformer"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { TokenMetricsResponseDto } from "./token-metrics-response.dto" // Import TokenMetricsResponseDto

export class GetHistoricalDataDto {
  @ApiPropertyOptional({ description: "Number of days of historical data", minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number = 30
}

export class CompareTokensDto {
  @ApiProperty({ description: "First token ID to compare" })
  @IsString()
  tokenAId: string

  @ApiProperty({ description: "Second token ID to compare" })
  @IsString()
  tokenBId: string
}

export class TopPerformersDto {
  @ApiPropertyOptional({ description: "Filter by specific chain ID" })
  @IsOptional()
  @IsString()
  chainId?: string

  @ApiPropertyOptional({ description: "Timeframe for performance calculation", enum: ["24h", "7d", "30d"] })
  @IsOptional()
  @IsEnum(["24h", "7d", "30d"])
  timeframe?: string = "24h"

  @ApiPropertyOptional({ description: "Number of results to return", minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10
}

export class HistoricalDataResponseDto {
  @ApiProperty()
  timestamp: Date

  @ApiProperty()
  price: string

  @ApiProperty()
  volume: string

  @ApiProperty()
  marketCap: string

  @ApiProperty()
  holderCount: number
}

export class TokenComparisonResponseDto {
  @ApiProperty()
  tokenA: TokenMetricsResponseDto

  @ApiProperty()
  tokenB: TokenMetricsResponseDto

  @ApiProperty()
  priceRatio: string

  @ApiProperty()
  volumeRatio: string

  @ApiProperty()
  marketCapRatio: string

  @ApiProperty()
  holderRatio: string
}

export class ChainAnalyticsResponseDto {
  @ApiProperty()
  chainId: string

  @ApiProperty()
  chainName: string

  @ApiProperty()
  totalTokens: number

  @ApiProperty()
  totalVolume24h: string

  @ApiProperty()
  totalMarketCap: string

  @ApiProperty()
  averagePrice: string

  @ApiProperty({ type: [TokenMetricsResponseDto] })
  topTokens: TokenMetricsResponseDto[]
}
