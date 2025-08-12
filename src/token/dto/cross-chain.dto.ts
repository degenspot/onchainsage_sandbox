import { IsString, IsOptional, IsArray, IsNumber, Min, Max } from "class-validator"
import { Type } from "class-transformer"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class CrossChainComparisonDto {
  @ApiProperty({ description: "Token symbol to compare across chains" })
  @IsString()
  symbol: string
}

export class CrossChainPortfolioDto {
  @ApiProperty({ description: "Array of token IDs to include in portfolio", type: [String] })
  @IsArray()
  @IsString({ each: true })
  tokenIds: string[]
}

export class ArbitrageOpportunitiesDto {
  @ApiProperty({ description: "Token symbol to find arbitrage opportunities for" })
  @IsString()
  symbol: string

  @ApiPropertyOptional({ description: "Minimum profit percentage to consider", minimum: 0.1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  minProfitPercentage?: number = 1
}

export class CrossChainTokenDataDto {
  @ApiProperty()
  tokenId: string

  @ApiProperty()
  symbol: string

  @ApiProperty()
  name: string

  @ApiProperty()
  chainId: string

  @ApiProperty()
  chainName: string

  @ApiProperty()
  contractAddress: string

  @ApiProperty()
  price: string

  @ApiProperty()
  marketCap: string

  @ApiProperty()
  volume24h: string

  @ApiProperty()
  liquidity: string

  @ApiProperty()
  holderCount: number

  @ApiProperty()
  priceChange24h: string
}

export class CrossChainComparisonResponseDto {
  @ApiProperty()
  symbol: string

  @ApiProperty({ type: [CrossChainTokenDataDto] })
  tokens: CrossChainTokenDataDto[]

  @ApiProperty()
  totalMarketCap: string

  @ApiProperty()
  totalVolume24h: string

  @ApiProperty()
  totalLiquidity: string

  @ApiProperty()
  totalHolders: number

  @ApiProperty()
  averagePrice: string

  @ApiProperty()
  priceSpread: {
    min: CrossChainTokenDataDto
    max: CrossChainTokenDataDto
    spreadPercentage: string
  }

  @ApiProperty()
  volumeDistribution: {
    chainId: string
    chainName: string
    volume: string
    percentage: string
  }[]
}

export class CrossChainPortfolioResponseDto {
  @ApiProperty()
  totalValue: string

  @ApiProperty()
  chainDistribution: {
    chainId: string
    chainName: string
    value: string
    percentage: string
    tokenCount: number
  }[]

  @ApiProperty({ type: [CrossChainTokenDataDto] })
  topTokens: CrossChainTokenDataDto[]

  @ApiProperty()
  performanceMetrics: {
    totalReturn24h: string
    totalReturnPercentage24h: string
    bestPerformer: CrossChainTokenDataDto
    worstPerformer: CrossChainTokenDataDto
  }
}

export class ArbitrageOpportunityDto {
  @ApiProperty()
  buyChain: CrossChainTokenDataDto

  @ApiProperty()
  sellChain: CrossChainTokenDataDto

  @ApiProperty()
  profitPercentage: string

  @ApiProperty()
  profitUsd: string

  @ApiProperty()
  liquidityScore: number
}

export class ArbitrageOpportunitiesResponseDto {
  @ApiProperty()
  symbol: string

  @ApiProperty({ type: [ArbitrageOpportunityDto] })
  opportunities: ArbitrageOpportunityDto[]
}

export class CrossChainMarketDataResponseDto {
  @ApiProperty()
  totalMarketCap: string

  @ApiProperty()
  totalVolume24h: string

  @ApiProperty()
  chainMetrics: {
    chainId: string
    chainName: string
    marketCap: string
    volume24h: string
    tokenCount: number
    dominancePercentage: string
  }[]

  @ApiProperty({ type: [CrossChainTokenDataDto] })
  topCrossChainTokens: CrossChainTokenDataDto[]
}
