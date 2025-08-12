import { Controller, Get, Param, HttpException, HttpStatus, Logger } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger"
import type { TokenAnalyticsService } from "../services/analytics/token-analytics.service"
import type { CacheService } from "../services/analytics/cache.service"
import {
  type CompareTokensDto,
  type TopPerformersDto,
  TokenComparisonResponseDto,
  ChainAnalyticsResponseDto,
  TokenMetricsResponseDto,
} from "../dto/analytics.dto"

@ApiTags("Analytics")
@Controller("api/analytics")
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name)

  constructor(
    private tokenAnalyticsService: TokenAnalyticsService,
    private cacheService: CacheService,
  ) {}

  @Get("compare")
  @ApiOperation({ summary: "Compare two tokens across metrics" })
  @ApiResponse({ status: 200, description: "Token comparison", type: TokenComparisonResponseDto })
  @ApiResponse({ status: 404, description: "One or both tokens not found" })
  async compareTokens(compareDto: CompareTokensDto): Promise<TokenComparisonResponseDto> {
    try {
      const comparison = await this.tokenAnalyticsService.compareTokens(compareDto.tokenAId, compareDto.tokenBId)

      if (!comparison) {
        throw new HttpException("One or both tokens not found", HttpStatus.NOT_FOUND)
      }

      return comparison
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      this.logger.error("Failed to compare tokens:", error)
      throw new HttpException("Failed to compare tokens", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get("top-performers")
  @ApiOperation({ summary: "Get top performing tokens" })
  @ApiResponse({ status: 200, description: "Top performing tokens", type: [TokenMetricsResponseDto] })
  async getTopPerformers(queryDto: TopPerformersDto): Promise<TokenMetricsResponseDto[]> {
    try {
      const cacheKey = `top_performers_${JSON.stringify(queryDto)}`
      const cached = this.cacheService.getFilteredTokens(cacheKey)

      if (cached) {
        return cached
      }

      const topPerformers = await this.tokenAnalyticsService.getTopPerformers(
        queryDto.chainId,
        queryDto.timeframe,
        queryDto.limit,
      )

      this.cacheService.cacheFilteredTokens(cacheKey, topPerformers)
      return topPerformers
    } catch (error) {
      this.logger.error("Failed to get top performers:", error)
      throw new HttpException("Failed to get top performers", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get("top-losers")
  @ApiOperation({ summary: "Get worst performing tokens" })
  @ApiResponse({ status: 200, description: "Worst performing tokens", type: [TokenMetricsResponseDto] })
  async getTopLosers(queryDto: TopPerformersDto): Promise<TokenMetricsResponseDto[]> {
    try {
      const cacheKey = `top_losers_${JSON.stringify(queryDto)}`
      const cached = this.cacheService.getFilteredTokens(cacheKey)

      if (cached) {
        return cached
      }

      const topLosers = await this.tokenAnalyticsService.getTopLosers(
        queryDto.chainId,
        queryDto.timeframe,
        queryDto.limit,
      )

      this.cacheService.cacheFilteredTokens(cacheKey, topLosers)
      return topLosers
    } catch (error) {
      this.logger.error("Failed to get top losers:", error)
      throw new HttpException("Failed to get top losers", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get("most-active")
  @ApiOperation({ summary: "Get most active tokens by volume" })
  @ApiResponse({ status: 200, description: "Most active tokens", type: [TokenMetricsResponseDto] })
  async getMostActive(queryDto: TopPerformersDto): Promise<TokenMetricsResponseDto[]> {
    try {
      const cacheKey = `most_active_${JSON.stringify(queryDto)}`
      const cached = this.cacheService.getFilteredTokens(cacheKey)

      if (cached) {
        return cached
      }

      const mostActive = await this.tokenAnalyticsService.getMostActiveTokens(queryDto.chainId, queryDto.limit)

      this.cacheService.cacheFilteredTokens(cacheKey, mostActive)
      return mostActive
    } catch (error) {
      this.logger.error("Failed to get most active tokens:", error)
      throw new HttpException("Failed to get most active tokens", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get("chains/:chainId")
  @ApiOperation({ summary: "Get analytics for a specific blockchain" })
  @ApiParam({ name: "chainId", description: "Blockchain chain ID" })
  @ApiResponse({ status: 200, description: "Chain analytics", type: ChainAnalyticsResponseDto })
  @ApiResponse({ status: 404, description: "Chain not found" })
  async getChainAnalytics(@Param("chainId") chainId: string): Promise<ChainAnalyticsResponseDto> {
    try {
      const cached = this.cacheService.getChainAnalytics(chainId)
      if (cached) {
        return cached
      }

      const analytics = await this.tokenAnalyticsService.getChainAnalytics(chainId)

      if (!analytics) {
        throw new HttpException("Chain not found", HttpStatus.NOT_FOUND)
      }

      this.cacheService.cacheChainAnalytics(chainId, analytics)
      return analytics
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      this.logger.error(`Failed to get chain analytics for ${chainId}:`, error)
      throw new HttpException("Failed to get chain analytics", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
