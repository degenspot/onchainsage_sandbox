import { IsString, IsOptional, IsNumber, IsArray, IsEnum, Min, Max } from "class-validator"
import { Type } from "class-transformer"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class SearchTokensDto {
  @ApiPropertyOptional({ description: "Search query for token name or symbol" })
  @IsOptional()
  @IsString()
  query?: string

  @ApiPropertyOptional({ description: "Filter by blockchain chain IDs", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chainIds?: string[]

  @ApiPropertyOptional({ description: "Minimum market cap filter" })
  @IsOptional()
  @IsString()
  minMarketCap?: string

  @ApiPropertyOptional({ description: "Maximum market cap filter" })
  @IsOptional()
  @IsString()
  maxMarketCap?: string

  @ApiPropertyOptional({ description: "Minimum 24h volume filter" })
  @IsOptional()
  @IsString()
  minVolume24h?: string

  @ApiPropertyOptional({ description: "Maximum 24h volume filter" })
  @IsOptional()
  @IsString()
  maxVolume24h?: string

  @ApiPropertyOptional({ description: "Minimum holder count" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minHolders?: number

  @ApiPropertyOptional({ description: "Maximum holder count" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxHolders?: number

  @ApiPropertyOptional({
    description: "Sort by field",
    enum: ["price", "volume", "marketCap", "holders", "priceChange"],
  })
  @IsOptional()
  @IsEnum(["price", "volume", "marketCap", "holders", "priceChange"])
  sortBy?: "price" | "volume" | "marketCap" | "holders" | "priceChange"

  @ApiPropertyOptional({ description: "Sort order", enum: ["asc", "desc"] })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc"

  @ApiPropertyOptional({ description: "Number of results to return", minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number

  @ApiPropertyOptional({ description: "Number of results to skip", minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number
}

export class AddTokenDto {
  @ApiProperty({ description: "Token contract address" })
  @IsString()
  contractAddress: string

  @ApiProperty({ description: "Blockchain chain ID" })
  @IsString()
  chainId: string
}

export class GetHistoricalDataDto {
  @ApiPropertyOptional({ description: "Number of days of historical data", minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number = 30
}

export class TokenResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  symbol: string

  @ApiProperty()
  contractAddress: string

  @ApiProperty()
  decimals: number

  @ApiPropertyOptional()
  description?: string

  @ApiPropertyOptional()
  logoUrl?: string

  @ApiPropertyOptional()
  websiteUrl?: string

  @ApiProperty()
  totalSupply: string

  @ApiProperty()
  circulatingSupply: string

  @ApiProperty()
  blockchain: {
    id: string
    name: string
    chainId: string
    type: string
  }

  @ApiProperty()
  isActive: boolean

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}

export class TokenMetricsResponseDto {
  @ApiProperty()
  tokenId: string

  @ApiProperty()
  symbol: string

  @ApiProperty()
  name: string

  @ApiProperty()
  chainId: string

  @ApiProperty()
  currentPrice: string

  @ApiProperty()
  priceChange24h: string

  @ApiProperty()
  priceChangePercentage24h: string

  @ApiProperty()
  volume24h: string

  @ApiProperty()
  volumeChange24h: string

  @ApiProperty()
  marketCap: string

  @ApiPropertyOptional()
  marketCapRank?: number

  @ApiProperty()
  liquidity: string

  @ApiProperty()
  holderCount: number

  @ApiProperty()
  holderChange24h: number

  @ApiProperty()
  transactionCount24h: number

  @ApiProperty()
  lastUpdated: Date
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
