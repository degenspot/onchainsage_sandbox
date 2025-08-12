import { Controller, Get, Post, Put, Delete, HttpException, HttpStatus, Logger } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger"
import type { Repository } from "typeorm"
import { FeedSource } from "../entities/feed-source.entity"
import type { PlatformSyncService } from "../services/platform-sync.service"
import type { FeedCacheService } from "../services/feed-cache.service"
import type { CreateFeedSourceDto, UpdateFeedSourceDto, SyncFeedSourceDto } from "../dto/feed-source.dto"
import { SyncResultDto, BulkSyncResultDto } from "../dto/response.dto"

@ApiTags("Feed Sources")
@Controller("social-feed/sources")
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // Uncomment when you have auth guards
export class FeedSourceController {
  private readonly logger = new Logger(FeedSourceController.name)

  constructor(
    private readonly feedSourceRepository: Repository<FeedSource>,
    private readonly platformSyncService: PlatformSyncService,
    private readonly feedCacheService: FeedCacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get user's feed sources" })
  @ApiResponse({ status: 200, description: "Feed sources retrieved successfully", type: [FeedSource] })
  async getFeedSources(req: any): Promise<FeedSource[]> {
    try {
      const userId = req.user?.id || "default-user"

      return this.feedSourceRepository.find({
        where: { userId },
        relations: ["platform"],
        order: { createdAt: "DESC" },
      })
    } catch (error) {
      this.logger.error("Failed to get feed sources:", error.message)
      throw new HttpException("Failed to retrieve feed sources", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get feed source by ID" })
  @ApiParam({ name: "id", description: "Feed source ID" })
  @ApiResponse({ status: 200, description: "Feed source retrieved successfully", type: FeedSource })
  async getFeedSourceById(id: string, req: any): Promise<FeedSource> {
    try {
      const userId = req.user?.id || "default-user"

      const source = await this.feedSourceRepository.findOne({
        where: { id, userId },
        relations: ["platform"],
      })

      if (!source) {
        throw new HttpException("Feed source not found", HttpStatus.NOT_FOUND)
      }

      return source
    } catch (error) {
      this.logger.error("Failed to get feed source:", error.message)
      throw new HttpException(error.message || "Failed to retrieve feed source", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post()
  @ApiOperation({ summary: "Create new feed source" })
  @ApiResponse({ status: 201, description: "Feed source created successfully", type: FeedSource })
  async createFeedSource(createDto: CreateFeedSourceDto, req: any): Promise<FeedSource> {
    try {
      const userId = req.user?.id || "default-user"

      // Check if source already exists
      const existingSource = await this.feedSourceRepository.findOne({
        where: {
          userId,
          platformId: createDto.platformId,
          accountId: createDto.accountId,
        },
      })

      if (existingSource) {
        throw new HttpException("Feed source already exists for this account", HttpStatus.CONFLICT)
      }

      const feedSource = this.feedSourceRepository.create({
        ...createDto,
        userId,
        syncSettings: {
          enabled: true,
          syncInterval: 60, // 1 hour
          maxItemsPerSync: 100,
          includeReplies: false,
          includeRetweets: true,
          ...createDto.syncSettings,
        },
      })

      const savedSource = await this.feedSourceRepository.save(feedSource)

      // Invalidate user cache
      await this.feedCacheService.invalidateUserCache(userId)

      this.logger.log(`Created feed source: ${savedSource.id} for user: ${userId}`)
      return savedSource
    } catch (error) {
      this.logger.error("Failed to create feed source:", error.message)
      throw new HttpException(error.message || "Failed to create feed source", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Put(":id")
  @ApiOperation({ summary: "Update feed source" })
  @ApiParam({ name: "id", description: "Feed source ID" })
  @ApiResponse({ status: 200, description: "Feed source updated successfully", type: FeedSource })
  async updateFeedSource(id: string, updateDto: UpdateFeedSourceDto, req: any): Promise<FeedSource> {
    try {
      const userId = req.user?.id || "default-user"

      const source = await this.feedSourceRepository.findOne({
        where: { id, userId },
      })

      if (!source) {
        throw new HttpException("Feed source not found", HttpStatus.NOT_FOUND)
      }

      Object.assign(source, updateDto)
      const updatedSource = await this.feedSourceRepository.save(source)

      // Invalidate caches
      await this.feedCacheService.invalidateUserCache(userId)
      await this.feedCacheService.invalidateSourceCache(id)

      this.logger.log(`Updated feed source: ${id}`)
      return updatedSource
    } catch (error) {
      this.logger.error("Failed to update feed source:", error.message)
      throw new HttpException(error.message || "Failed to update feed source", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete feed source" })
  @ApiParam({ name: "id", description: "Feed source ID" })
  @ApiResponse({ status: 200, description: "Feed source deleted successfully" })
  async deleteFeedSource(id: string, req: any): Promise<{ message: string }> {
    try {
      const userId = req.user?.id || "default-user"

      const result = await this.feedSourceRepository.delete({ id, userId })

      if (result.affected === 0) {
        throw new HttpException("Feed source not found", HttpStatus.NOT_FOUND)
      }

      // Invalidate caches
      await this.feedCacheService.invalidateUserCache(userId)
      await this.feedCacheService.invalidateSourceCache(id)

      this.logger.log(`Deleted feed source: ${id}`)
      return { message: "Feed source deleted successfully" }
    } catch (error) {
      this.logger.error("Failed to delete feed source:", error.message)
      throw new HttpException(error.message || "Failed to delete feed source", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post(":id/sync")
  @ApiOperation({ summary: "Sync feed source" })
  @ApiParam({ name: "id", description: "Feed source ID" })
  @ApiResponse({ status: 200, description: "Feed source synced successfully", type: SyncResultDto })
  async syncFeedSource(id: string, syncDto: SyncFeedSourceDto, req: any): Promise<SyncResultDto> {
    try {
      const userId = req.user?.id || "default-user"

      // Verify source ownership
      const source = await this.feedSourceRepository.findOne({
        where: { id, userId },
      })

      if (!source) {
        throw new HttpException("Feed source not found", HttpStatus.NOT_FOUND)
      }

      const result = await this.platformSyncService.syncFeedSource(id, {
        maxItems: syncDto.maxItems,
        includeReplies: syncDto.includeReplies,
        includeRetweets: syncDto.includeRetweets,
      })

      // Invalidate caches after successful sync
      if (result.success) {
        await this.feedCacheService.invalidateUserCache(userId)
        await this.feedCacheService.invalidateSourceCache(id)
      }

      return result
    } catch (error) {
      this.logger.error("Failed to sync feed source:", error.message)
      throw new HttpException(error.message || "Failed to sync feed source", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post("sync-all")
  @ApiOperation({ summary: "Sync all user's active feed sources" })
  @ApiResponse({ status: 200, description: "All sources synced", type: BulkSyncResultDto })
  async syncAllSources(req: any): Promise<BulkSyncResultDto> {
    try {
      const userId = req.user?.id || "default-user"

      const results = await this.platformSyncService.syncAllActiveSources(userId)

      const successfulSyncs = results.filter((r) => r.success).length
      const failedSyncs = results.length - successfulSyncs

      // Invalidate user cache after bulk sync
      await this.feedCacheService.invalidateUserCache(userId)

      return {
        results,
        totalSources: results.length,
        successfulSyncs,
        failedSyncs,
      }
    } catch (error) {
      this.logger.error("Failed to sync all sources:", error.message)
      throw new HttpException("Failed to sync all sources", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
