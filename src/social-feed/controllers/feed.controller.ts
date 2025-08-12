import { Controller, Get, HttpException, HttpStatus, Logger } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger"
import type { FeedAggregationService } from "../services/feed-aggregation.service"
import type { FeedCacheService } from "../services/feed-cache.service"
import type { FeedQueryDto } from "../dto/feed-query.dto"
import { AggregatedFeedResponseDto } from "../dto/response.dto"

@ApiTags("Feed")
@Controller("social-feed/feed")
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // Uncomment when you have auth guards
export class FeedController {
  private readonly logger = new Logger(FeedController.name)

  constructor(
    private readonly feedAggregationService: FeedAggregationService,
    private readonly feedCacheService: FeedCacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get aggregated feed" })
  @ApiResponse({ status: 200, description: "Aggregated feed retrieved successfully", type: AggregatedFeedResponseDto })
  async getAggregatedFeed(query: FeedQueryDto, req: any): Promise<AggregatedFeedResponseDto> {
    try {
      const userId = req.user?.id || "default-user" // Replace with actual user ID from auth

      // Build aggregation options
      const options = {
        userId,
        sourceIds: query.sourceIds,
        filters: {
          keywords: query.keywords,
          excludeKeywords: query.excludeKeywords,
          itemTypes: query.itemTypes,
          dateRange:
            query.fromDate && query.toDate
              ? {
                  from: new Date(query.fromDate),
                  to: new Date(query.toDate),
                }
              : undefined,
          minLikes: query.minLikes,
          minShares: query.minShares,
        },
        sort: {
          sortBy: query.sortBy || "publishedAt",
          sortOrder: query.sortOrder || "DESC",
        },
        limit: query.limit,
        offset: query.offset,
        includeMetrics: query.includeMetrics,
      }

      // Check cache first
      const cacheKey = this.feedCacheService.generateFeedCacheKey(options)
      let result = await this.feedCacheService.getCachedFeed(cacheKey)

      if (!result) {
        result = await this.feedAggregationService.getAggregatedFeed(options)
        await this.feedCacheService.setCachedFeed(cacheKey, result)
      }

      // Get metrics if requested
      let metrics
      if (query.includeMetrics) {
        metrics = await this.feedAggregationService.getFeedMetrics(userId, options.sourceIds)
      }

      return {
        items: result.items,
        pagination: {
          totalCount: result.totalCount,
          limit: query.limit || 50,
          offset: query.offset || 0,
          hasMore: result.hasMore,
          nextOffset: result.nextOffset,
        },
        sources: result.sources,
        metrics,
      }
    } catch (error) {
      this.logger.error("Failed to get aggregated feed:", error.message)
      throw new HttpException("Failed to retrieve feed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get("search")
  @ApiOperation({ summary: "Search feed content" })
  @ApiResponse({ status: 200, description: "Search results retrieved successfully", type: AggregatedFeedResponseDto })
  async searchFeed(query: string, filters: FeedQueryDto, req: any): Promise<AggregatedFeedResponseDto> {
    try {
      const userId = req.user?.id || "default-user"

      if (!query || query.trim().length === 0) {
        throw new HttpException("Search query is required", HttpStatus.BAD_REQUEST)
      }

      const options = {
        sourceIds: filters.sourceIds,
        filters: {
          itemTypes: filters.itemTypes,
          dateRange:
            filters.fromDate && filters.toDate
              ? {
                  from: new Date(filters.fromDate),
                  to: new Date(filters.toDate),
                }
              : undefined,
          minLikes: filters.minLikes,
          minShares: filters.minShares,
        },
        sort: {
          sortBy: filters.sortBy || "publishedAt",
          sortOrder: filters.sortOrder || "DESC",
        },
        limit: filters.limit,
        offset: filters.offset,
      }

      const result = await this.feedAggregationService.searchFeed(userId, query, options)

      return {
        items: result.items,
        pagination: {
          totalCount: result.totalCount,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          hasMore: result.hasMore,
          nextOffset: result.nextOffset,
        },
        sources: result.sources,
      }
    } catch (error) {
      this.logger.error("Failed to search feed:", error.message)
      throw new HttpException(error.message || "Failed to search feed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get("trending/:timeframe")
  @ApiOperation({ summary: "Get trending content" })
  @ApiParam({ name: "timeframe", enum: ["1h", "6h", "24h", "7d"], description: "Timeframe for trending content" })
  @ApiResponse({ status: 200, description: "Trending content retrieved successfully", type: AggregatedFeedResponseDto })
  async getTrendingContent(
    timeframe: "1h" | "6h" | "24h" | "7d",
    filters: FeedQueryDto,
    req: any,
  ): Promise<AggregatedFeedResponseDto> {
    try {
      const userId = req.user?.id || "default-user"

      const options = {
        sourceIds: filters.sourceIds,
        filters: {
          itemTypes: filters.itemTypes,
          minLikes: filters.minLikes,
          minShares: filters.minShares,
        },
        limit: filters.limit || 25,
        offset: filters.offset,
      }

      // Check cache first
      const cacheKey = this.feedCacheService.generateTrendingCacheKey(userId, timeframe, options)
      let result = await this.feedCacheService.getCachedFeed(cacheKey)

      if (!result) {
        result = await this.feedAggregationService.getTrendingContent(userId, timeframe, options)
        await this.feedCacheService.setCachedFeed(cacheKey, result, this.feedCacheService.getTrendingTTL())
      }

      return {
        items: result.items,
        pagination: {
          totalCount: result.totalCount,
          limit: filters.limit || 25,
          offset: filters.offset || 0,
          hasMore: result.hasMore,
          nextOffset: result.nextOffset,
        },
        sources: result.sources,
      }
    } catch (error) {
      this.logger.error("Failed to get trending content:", error.message)
      throw new HttpException("Failed to retrieve trending content", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get("personalized")
  @ApiOperation({ summary: "Get personalized feed" })
  @ApiResponse({
    status: 200,
    description: "Personalized feed retrieved successfully",
    type: AggregatedFeedResponseDto,
  })
  async getPersonalizedFeed(filters: FeedQueryDto, req: any): Promise<AggregatedFeedResponseDto> {
    try {
      const userId = req.user?.id || "default-user"

      const options = {
        sourceIds: filters.sourceIds,
        filters: {
          itemTypes: filters.itemTypes,
          dateRange:
            filters.fromDate && filters.toDate
              ? {
                  from: new Date(filters.fromDate),
                  to: new Date(filters.toDate),
                }
              : undefined,
        },
        limit: filters.limit,
        offset: filters.offset,
      }

      // Check cache first
      const cacheKey = this.feedCacheService.generatePersonalizedCacheKey(userId, options)
      let result = await this.feedCacheService.getCachedFeed(cacheKey)

      if (!result) {
        result = await this.feedAggregationService.getPersonalizedFeed(userId, options)
        await this.feedCacheService.setCachedFeed(cacheKey, result, this.feedCacheService.getPersonalizedTTL())
      }

      return {
        items: result.items,
        pagination: {
          totalCount: result.totalCount,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          hasMore: result.hasMore,
          nextOffset: result.nextOffset,
        },
        sources: result.sources,
      }
    } catch (error) {
      this.logger.error("Failed to get personalized feed:", error.message)
      throw new HttpException("Failed to retrieve personalized feed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
