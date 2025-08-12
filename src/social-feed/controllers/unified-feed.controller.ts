import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger"
import type { UnifiedFeedService } from "../services/unified-feed.service"
import type { FeedAggregationService } from "../services/feed-aggregation.service"
import type { FeedCacheService } from "../services/feed-cache.service"
import type { CreateUnifiedFeedDto, UpdateUnifiedFeedDto, DuplicateFeedDto } from "../dto/unified-feed.dto"
import type { FeedQueryDto } from "../dto/feed-query.dto"
import { AggregatedFeedResponseDto } from "../dto/response.dto"
import { UnifiedFeed } from "../entities/unified-feed.entity"

@ApiTags("Unified Feeds")
@Controller("social-feed/unified-feeds")
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // Uncomment when you have auth guards
export class UnifiedFeedController {
  private readonly logger = new Logger(UnifiedFeedController.name)

  constructor(
    private readonly unifiedFeedService: UnifiedFeedService,
    private readonly feedAggregationService: FeedAggregationService,
    private readonly feedCacheService: FeedCacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get user's unified feeds" })
  @ApiResponse({ status: 200, description: "Unified feeds retrieved successfully", type: [UnifiedFeed] })
  async getUnifiedFeeds(req: any): Promise<UnifiedFeed[]> {
    try {
      const userId = req.user?.id || "default-user"
      return this.unifiedFeedService.getUserFeeds(userId)
    } catch (error) {
      this.logger.error("Failed to get unified feeds:", error.message)
      throw new HttpException("Failed to retrieve unified feeds", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get unified feed by ID" })
  @ApiParam({ name: "id", description: "Unified feed ID" })
  @ApiResponse({ status: 200, description: "Unified feed retrieved successfully", type: UnifiedFeed })
  async getUnifiedFeedById(@Param("id") id: string, req: any): Promise<UnifiedFeed> {
    try {
      const userId = req.user?.id || "default-user"
      return this.unifiedFeedService.getFeedById(id, userId)
    } catch (error) {
      this.logger.error("Failed to get unified feed:", error.message)
      throw new HttpException(error.message || "Failed to retrieve unified feed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get(":id/content")
  @ApiOperation({ summary: "Get unified feed content" })
  @ApiParam({ name: "id", description: "Unified feed ID" })
  @ApiResponse({
    status: 200,
    description: "Unified feed content retrieved successfully",
    type: AggregatedFeedResponseDto,
  })
  async getUnifiedFeedContent(
    @Param("id") id: string,
    @Query() query: FeedQueryDto,
    req: any,
  ): Promise<AggregatedFeedResponseDto> {
    try {
      const userId = req.user?.id || "default-user"

      const options = {
        limit: query.limit,
        offset: query.offset,
        includeMetrics: query.includeMetrics,
      }

      // Check cache first
      const cacheKey = this.feedCacheService.generateUnifiedFeedCacheKey(id, options)
      let result = await this.feedCacheService.getCachedFeed(cacheKey)

      if (!result) {
        result = await this.feedAggregationService.getUnifiedFeed(id, options)
        await this.feedCacheService.setCachedFeed(cacheKey, result)
      }

      // Get metrics if requested
      let metrics
      if (query.includeMetrics) {
        metrics = await this.feedAggregationService.getFeedMetrics(
          userId,
          result.sources.map((s) => s.id),
        )
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
      this.logger.error("Failed to get unified feed content:", error.message)
      throw new HttpException(
        error.message || "Failed to retrieve unified feed content",
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post()
  @ApiOperation({ summary: "Create unified feed" })
  @ApiResponse({ status: 201, description: "Unified feed created successfully", type: UnifiedFeed })
  async createUnifiedFeed(@Body() createDto: CreateUnifiedFeedDto, req: any): Promise<UnifiedFeed> {
    try {
      const userId = req.user?.id || "default-user"

      const feed = await this.unifiedFeedService.createUnifiedFeed({
        ...createDto,
        userId,
      })

      // Invalidate user cache
      await this.feedCacheService.invalidateUserCache(userId)

      return feed
    } catch (error) {
      this.logger.error("Failed to create unified feed:", error.message)
      throw new HttpException(error.message || "Failed to create unified feed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Put(":id")
  @ApiOperation({ summary: "Update unified feed" })
  @ApiParam({ name: "id", description: "Unified feed ID" })
  @ApiResponse({ status: 200, description: "Unified feed updated successfully", type: UnifiedFeed })
  async updateUnifiedFeed(
    @Param("id") id: string,
    @Body() updateDto: UpdateUnifiedFeedDto,
    req: any,
  ): Promise<UnifiedFeed> {
    try {
      const userId = req.user?.id || "default-user"

      const feed = await this.unifiedFeedService.updateUnifiedFeed(id, userId, updateDto)

      // Invalidate caches
      await this.feedCacheService.invalidateUserCache(userId)

      return feed
    } catch (error) {
      this.logger.error("Failed to update unified feed:", error.message)
      throw new HttpException(error.message || "Failed to update unified feed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete unified feed" })
  @ApiParam({ name: "id", description: "Unified feed ID" })
  @ApiResponse({ status: 200, description: "Unified feed deleted successfully" })
  async deleteUnifiedFeed(@Param("id") id: string, req: any): Promise<{ message: string }> {
    try {
      const userId = req.user?.id || "default-user"

      await this.unifiedFeedService.deleteUnifiedFeed(id, userId)

      // Invalidate user cache
      await this.feedCacheService.invalidateUserCache(userId)

      return { message: "Unified feed deleted successfully" }
    } catch (error) {
      this.logger.error("Failed to delete unified feed:", error.message)
      throw new HttpException(error.message || "Failed to delete unified feed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post(":id/duplicate")
  @ApiOperation({ summary: "Duplicate unified feed" })
  @ApiParam({ name: "id", description: "Unified feed ID to duplicate" })
  @ApiResponse({ status: 201, description: "Unified feed duplicated successfully", type: UnifiedFeed })
  async duplicateUnifiedFeed(
    @Param("id") id: string,
    @Body() duplicateDto: DuplicateFeedDto,
    req: any,
  ): Promise<UnifiedFeed> {
    try {
      const userId = req.user?.id || "default-user"

      const feed = await this.unifiedFeedService.duplicateFeed(id, userId, duplicateDto.name)

      // Invalidate user cache
      await this.feedCacheService.invalidateUserCache(userId)

      return feed
    } catch (error) {
      this.logger.error("Failed to duplicate unified feed:", error.message)
      throw new HttpException(error.message || "Failed to duplicate unified feed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post(":id/sources")
  @ApiOperation({ summary: "Add sources to unified feed" })
  @ApiParam({ name: "id", description: "Unified feed ID" })
  @ApiResponse({ status: 200, description: "Sources added successfully", type: UnifiedFeed })
  async addSourcesToFeed(
    @Param("id") id: string,
    @Body("sourceIds") sourceIds: string[],
    req: any,
  ): Promise<UnifiedFeed> {
    try {
      const userId = req.user?.id || "default-user"

      const feed = await this.unifiedFeedService.addSourcesToFeed(id, userId, sourceIds)

      // Invalidate user cache
      await this.feedCacheService.invalidateUserCache(userId)

      return feed
    } catch (error) {
      this.logger.error("Failed to add sources to feed:", error.message)
      throw new HttpException(error.message || "Failed to add sources to feed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Delete(":id/sources")
  @ApiOperation({ summary: "Remove sources from unified feed" })
  @ApiParam({ name: "id", description: "Unified feed ID" })
  @ApiResponse({ status: 200, description: "Sources removed successfully", type: UnifiedFeed })
  async removeSourcesFromFeed(
    @Param("id") id: string,
    @Body("sourceIds") sourceIds: string[],
    req: any,
  ): Promise<UnifiedFeed> {
    try {
      const userId = req.user?.id || "default-user"

      const feed = await this.unifiedFeedService.removeSourcesFromFeed(id, userId, sourceIds)

      // Invalidate user cache
      await this.feedCacheService.invalidateUserCache(userId)

      return feed
    } catch (error) {
      this.logger.error("Failed to remove sources from feed:", error.message)
      throw new HttpException(error.message || "Failed to remove sources from feed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
