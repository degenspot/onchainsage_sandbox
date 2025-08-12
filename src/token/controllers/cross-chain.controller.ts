import { Controller, Get, Post, Body, HttpException, HttpStatus, Logger } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import type { CrossChainAnalyticsService } from "../services/cross-chain/cross-chain-analytics.service"
import type { CacheService } from "../services/analytics/cache.service"
import {
  type CrossChainPortfolioDto,
  CrossChainComparisonResponseDto,
  CrossChainPortfolioResponseDto,
  ArbitrageOpportunitiesResponseDto,
  CrossChainMarketDataResponseDto,
} from "../dto/cross-chain.dto"

@ApiTags("Cross-Chain")
@Controller("api/cross-chain")
export class CrossChainController {
  private readonly logger = new Logger(CrossChainController.name)

  constructor(
    private crossChainAnalyticsService: CrossChainAnalyticsService,
    private cacheService: CacheService,
  ) {}

  @Get("compare")
  @ApiOperation({ summary: "Compare token across multiple blockchains" })
  @ApiResponse({ status: 200, description: "Cross-chain token comparison", type: CrossChainComparisonResponseDto })
  @ApiResponse({ status: 404, description: "Token not found on any chain" })
  async compareToken(symbol: string): Promise<CrossChainComparisonResponseDto> {
    try {
      const queryDto = { symbol }
      const cacheKey = `cross_chain_compare_${queryDto.symbol.toLowerCase()}`
      const cached = this.cacheService.get<CrossChainComparisonResponseDto>(cacheKey)

      if (cached) {
        return cached
      }

      const comparison = await this.crossChainAnalyticsService.compareCrossChainToken(queryDto.symbol)

      if (!comparison) {
        throw new HttpException(`Token ${queryDto.symbol} not found on any supported chain`, HttpStatus.NOT_FOUND)
      }

      this.cacheService.set(cacheKey, comparison, 5 * 60 * 1000) // 5 minutes cache
      return comparison
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      this.logger.error(`Failed to compare cross-chain token ${symbol}:`, error)
      throw new HttpException("Failed to compare cross-chain token", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post("portfolio")
  @ApiOperation({ summary: "Analyze cross-chain portfolio" })
  @ApiResponse({ status: 200, description: "Cross-chain portfolio analysis", type: CrossChainPortfolioResponseDto })
  async analyzePortfolio(@Body() portfolioDto: CrossChainPortfolioDto): Promise<CrossChainPortfolioResponseDto> {
    try {
      const cacheKey = `cross_chain_portfolio_${portfolioDto.tokenIds.sort().join(",")}`
      const cached = this.cacheService.get<CrossChainPortfolioResponseDto>(cacheKey)

      if (cached) {
        return cached
      }

      const portfolio = await this.crossChainAnalyticsService.getCrossChainPortfolio(portfolioDto.tokenIds)

      this.cacheService.set(cacheKey, portfolio, 3 * 60 * 1000) // 3 minutes cache
      return portfolio
    } catch (error) {
      this.logger.error("Failed to analyze cross-chain portfolio:", error)
      throw new HttpException("Failed to analyze cross-chain portfolio", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get("arbitrage")
  @ApiOperation({ summary: "Find arbitrage opportunities across chains" })
  @ApiResponse({ status: 200, description: "Arbitrage opportunities", type: ArbitrageOpportunitiesResponseDto })
  @ApiResponse({ status: 404, description: "No arbitrage opportunities found" })
  async findArbitrageOpportunities(
    symbol: string,
    minProfitPercentage: number,
  ): Promise<ArbitrageOpportunitiesResponseDto> {
    try {
      const queryDto = { symbol, minProfitPercentage }
      const cacheKey = `arbitrage_${queryDto.symbol.toLowerCase()}_${queryDto.minProfitPercentage}`
      const cached = this.cacheService.get<ArbitrageOpportunitiesResponseDto>(cacheKey)

      if (cached) {
        return cached
      }

      const opportunities = await this.crossChainAnalyticsService.findArbitrageOpportunities(
        queryDto.symbol,
        queryDto.minProfitPercentage,
      )

      if (!opportunities || opportunities.opportunities.length === 0) {
        throw new HttpException(
          `No arbitrage opportunities found for ${queryDto.symbol} with minimum ${queryDto.minProfitPercentage}% profit`,
          HttpStatus.NOT_FOUND,
        )
      }

      this.cacheService.set(cacheKey, opportunities, 2 * 60 * 1000) // 2 minutes cache
      return opportunities
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      this.logger.error(`Failed to find arbitrage opportunities for ${symbol}:`, error)
      throw new HttpException("Failed to find arbitrage opportunities", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get("market-data")
  @ApiOperation({ summary: "Get cross-chain market overview" })
  @ApiResponse({ status: 200, description: "Cross-chain market data", type: CrossChainMarketDataResponseDto })
  async getMarketData(): Promise<CrossChainMarketDataResponseDto> {
    try {
      const cacheKey = "cross_chain_market_data"
      const cached = this.cacheService.get<CrossChainMarketDataResponseDto>(cacheKey)

      if (cached) {
        return cached
      }

      const marketData = await this.crossChainAnalyticsService.getCrossChainMarketData()

      this.cacheService.set(cacheKey, marketData, 10 * 60 * 1000) // 10 minutes cache
      return marketData
    } catch (error) {
      this.logger.error("Failed to get cross-chain market data:", error)
      throw new HttpException("Failed to get cross-chain market data", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get("dominance")
  @ApiOperation({ summary: "Get blockchain dominance metrics" })
  @ApiResponse({
    status: 200,
    description: "Blockchain dominance data",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          chainId: { type: "string" },
          chainName: { type: "string" },
          dominancePercentage: { type: "string" },
        },
      },
    },
  })
  async getChainDominance(): Promise<{ chainId: string; chainName: string; dominancePercentage: string }[]> {
    try {
      const cacheKey = "chain_dominance"
      const cached =
        this.cacheService.get<{ chainId: string; chainName: string; dominancePercentage: string }[]>(cacheKey)

      if (cached) {
        return cached
      }

      const dominance = await this.crossChainAnalyticsService.getChainDominance()

      this.cacheService.set(cacheKey, dominance, 15 * 60 * 1000) // 15 minutes cache
      return dominance
    } catch (error) {
      this.logger.error("Failed to get chain dominance:", error)
      throw new HttpException("Failed to get chain dominance", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
