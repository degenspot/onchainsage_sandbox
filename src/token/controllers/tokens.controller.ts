import { Controller, Get, Post, Param, Query, Body, HttpException, HttpStatus, Logger } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger"
import type { TokenAnalyticsService } from "../services/analytics/token-analytics.service"
import type { BlockchainDataService } from "../services/blockchain/blockchain-data.service"
import type { CacheService } from "../services/analytics/cache.service"
import {
  type SearchTokensDto,
  type AddTokenDto,
  TokenResponseDto,
  TokenMetricsResponseDto,
  type GetHistoricalDataDto,
  HistoricalDataResponseDto,
} from "../dto/token.dto"
import type { Repository } from "typeorm"
import type { Token } from "../entities/token.entity"

@ApiTags("Tokens")
@Controller("api/tokens")
export class TokensController {
  private readonly logger = new Logger(TokensController.name)

  constructor(
    private tokenAnalyticsService: TokenAnalyticsService,
    private blockchainDataService: BlockchainDataService,
    private cacheService: CacheService,
    private tokenRepository: Repository<Token>, // Moved @InjectRepository decorator above the constructor
  ) {}

  @Get()
  @ApiOperation({ summary: "Search and filter tokens" })
  @ApiResponse({ status: 200, description: "List of tokens", type: [TokenMetricsResponseDto] })
  async searchTokens(@Query() searchDto: SearchTokensDto): Promise<TokenMetricsResponseDto[]> {
    try {
      // Create cache key from search parameters
      const cacheKey = `search_${JSON.stringify(searchDto)}`
      const cached = this.cacheService.getFilteredTokens(cacheKey)
      
      if (cached) {
        return cached
      }

      const filters = {
        chainIds: searchDto.chainIds,
        minMarketCap: searchDto.minMarketCap,
        maxMarketCap: searchDto.maxMarketCap,
        minVolume24h: searchDto.minVolume24h,
        maxVolume24h: searchDto.maxVolume24h,
        minHolders: searchDto.minHolders,
        maxHolders: searchDto.maxHolders,
        sortBy: searchDto.sortBy,
        sortOrder: searchDto.sortOrder,
        limit: searchDto.limit || 20,
        offset: searchDto.offset || 0,
      }

      let tokens = await this.tokenAnalyticsService.getFilteredTokens(filters)

      // Apply text search if query provided
      if (searchDto.query) {
        const query = searchDto.query.toLowerCase()
        tokens = tokens.filter(
          (token) =>
            token.name.toLowerCase().includes(query) || 
            token.symbol.toLowerCase().includes(query)
        )
      }

      this.cacheService.cacheFilteredTokens(cacheKey, tokens)
      return tokens
    } catch (error) {
      this.logger.error("Failed to search tokens:", error)
      throw new HttpException("Failed to search tokens", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get token details by ID" })
  @ApiParam({ name: "id", description: "Token ID" })
  @ApiResponse({ status: 200, description: "Token details", type: TokenResponseDto })
  @ApiResponse({ status: 404, description: "Token not found" })
  async getToken(@Param("id") id: string): Promise<TokenResponseDto> {
    try {
      const token = await this.tokenRepository.findOne({
        where: { id },
        relations: ["blockchain"],
      })

      if (!token) {
        throw new HttpException("Token not found", HttpStatus.NOT_FOUND)
      }

      return {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        contractAddress: token.contractAddress,
        decimals: token.decimals,
        description: token.description,
        logoUrl: token.logoUrl,
        websiteUrl: token.websiteUrl,
        totalSupply: token.totalSupply,
        circulatingSupply: token.circulatingSupply,
        blockchain: {
          id: token.blockchain.id,
          name: token.blockchain.name,
          chainId: token.blockchain.chainId,
          type: token.blockchain.type,
        },
        isActive: token.isActive,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt,
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      this.logger.error(`Failed to get token ${id}:`, error)
      throw new HttpException("Failed to get token", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get(":id/metrics")
  @ApiOperation({ summary: "Get token analytics and metrics" })
  @ApiParam({ name: "id", description: "Token ID" })
  @ApiResponse({ status: 200, description: "Token metrics", type: TokenMetricsResponseDto })
  @ApiResponse({ status: 404, description: "Token not found" })
  async getTokenMetrics(@Param("id") id: string): Promise<TokenMetricsResponseDto> {
    try {
      // Check cache first
      const cached = this.cacheService.getTokenMetrics(id)
      if (cached) {
        return cached
      }

      const metrics = await this.tokenAnalyticsService.getTokenMetrics(id)

      if (!metrics) {
        throw new HttpException("Token metrics not found", HttpStatus.NOT_FOUND)
      }

      this.cacheService.cacheTokenMetrics(id, metrics)
      return metrics
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      this.logger.error(`Failed to get token metrics for ${id}:`, error)
      throw new HttpException("Failed to get token metrics", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get(":id/historical")
  @ApiOperation({ summary: "Get historical price and volume data" })
  @ApiParam({ name: "id", description: "Token ID" })
  @ApiResponse({ status: 200, description: "Historical data", type: [HistoricalDataResponseDto] })
  async getHistoricalData(
    @Param("id") id: string,
    @Query() queryDto: GetHistoricalDataDto,
  ): Promise<HistoricalDataResponseDto[]> {
    try {
      const data = await this.tokenAnalyticsService.getHistoricalData(id, queryDto.days)
      return data
    } catch (error) {
      this.logger.error(`Failed to get historical data for token ${id}:`, error)
      throw new HttpException("Failed to get historical data", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post()
  @ApiOperation({ summary: "Add a new token to track" })
  @ApiResponse({ status: 201, description: "Token added successfully", type: TokenResponseDto })
  @ApiResponse({ status: 400, description: "Invalid token data" })
  async addToken(@Body() addTokenDto: AddTokenDto): Promise<TokenResponseDto> {
    try {
      const token = await this.blockchainDataService.syncTokenData(
        addTokenDto.chainId,
        addTokenDto.contractAddress,
      )

      return {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        contractAddress: token.contractAddress,
        decimals: token.decimals,
        description: token.description,
        logoUrl: token.logoUrl,
        websiteUrl: token.websiteUrl,
        totalSupply: token.totalSupply,
        circulatingSupply: token.circulatingSupply,
        blockchain: {
          id: token.blockchain.id,
          name: token.blockchain.name,
          chainId: token.blockchain.chainId,
          type: token.blockchain.type,
        },
        isActive: token.isActive,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt,
      }
    } catch (error) {
      this.logger.error("Failed to add token:", error)
      throw new HttpException("Failed to add token", HttpStatus.BAD_REQUEST)
    }
  }

  @Post(":id/refresh")
  @ApiOperation({ summary: "Force refresh token data" })
  @ApiParam({ name: "id", description: "Token ID" })
  @ApiResponse({ status: 200, description: "Token data refreshed successfully" })
  async refreshToken(@Param("id") id: string): Promise<{ message: string }> {
    try {
      // Clear cache for this token
      this.cacheService.delete(`token_metrics_${id}`)

      // Force update token data
      await this.blockchainDataService.syncTokenAnalytics(id)

      return { message: "Token data refreshed successfully" }
    } catch (error) {
      this.logger.error(`Failed to refresh token ${id}:`, error)
      throw new HttpException("Failed to refresh token data", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
