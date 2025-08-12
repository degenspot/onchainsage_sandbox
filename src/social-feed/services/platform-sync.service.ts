import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type FeedSource, FeedSourceStatus } from "../entities/feed-source.entity"
import type { FeedItem } from "../entities/feed-item.entity"
import type { SyncOptions, SyncResult } from "../interfaces/social-platform-integration.interface"

export interface SyncJobResult {
  sourceId: string
  success: boolean
  itemsProcessed: number
  newItems: number
  error?: string
  rateLimitHit?: boolean
}

@Injectable()
export class PlatformSyncService {
  private readonly logger = new Logger(PlatformSyncService.name)

  constructor(
    private readonly feedSourceRepository: Repository<FeedSource>,
    private readonly feedItemRepository: Repository<FeedItem>,
    private readonly platformRegistry,
  ) {}

  async syncFeedSource(sourceId: string, options: SyncOptions = {}): Promise<SyncJobResult> {
    const source = await this.feedSourceRepository.findOne({
      where: { id: sourceId },
      relations: ["platform"],
    })

    if (!source) {
      throw new Error(`Feed source not found: ${sourceId}`)
    }

    if (source.status !== FeedSourceStatus.ACTIVE) {
      this.logger.warn(`Skipping sync for inactive source: ${sourceId}`)
      return {
        sourceId,
        success: false,
        itemsProcessed: 0,
        newItems: 0,
        error: "Source is not active",
      }
    }

    const integration = this.platformRegistry.getIntegration(source.platform.name)
    if (!integration) {
      throw new Error(`No integration found for platform: ${source.platform.name}`)
    }

    try {
      // Update source status to indicate sync in progress
      await this.feedSourceRepository.update(sourceId, {
        status: FeedSourceStatus.ACTIVE,
        lastErrorMessage: null,
      })

      const credentials = {
        accessToken: source.authTokens?.accessToken,
        refreshToken: source.authTokens?.refreshToken,
        clientId: source.platform.authConfig?.clientId,
        clientSecret: source.platform.authConfig?.clientSecret,
      }

      // Get the most recent item to use as since_id
      const lastItem = await this.feedItemRepository.findOne({
        where: { sourceId },
        order: { publishedAt: "DESC" },
      })

      const syncOptions: SyncOptions = {
        ...options,
        maxItems: options.maxItems || source.syncSettings?.maxItemsPerSync || 100,
        sinceId: lastItem?.platformItemId,
        includeReplies: source.syncSettings?.includeReplies ?? false,
        includeRetweets: source.syncSettings?.includeRetweets ?? true,
      }

      const result = await integration.syncFeed(source, credentials, syncOptions)

      const newItems = await this.processSyncResult(result, source)

      // Update source with sync results
      await this.feedSourceRepository.update(sourceId, {
        lastSyncAt: new Date(),
        totalItemsCount: source.totalItemsCount + newItems,
        status: result.rateLimitRemaining === 0 ? FeedSourceStatus.RATE_LIMITED : FeedSourceStatus.ACTIVE,
      })

      this.logger.log(`Sync completed for source ${sourceId}: ${newItems} new items`)

      return {
        sourceId,
        success: true,
        itemsProcessed: result.items.length,
        newItems,
        rateLimitHit: result.rateLimitRemaining === 0,
      }
    } catch (error) {
      this.logger.error(`Sync failed for source ${sourceId}:`, error.message)

      await this.feedSourceRepository.update(sourceId, {
        status: FeedSourceStatus.ERROR,
        lastErrorMessage: error.message,
      })

      return {
        sourceId,
        success: false,
        itemsProcessed: 0,
        newItems: 0,
        error: error.message,
      }
    }
  }

  async syncAllActiveSources(userId?: string): Promise<SyncJobResult[]> {
    const whereCondition: any = {
      status: FeedSourceStatus.ACTIVE,
      "syncSettings.enabled": true,
    }

    if (userId) {
      whereCondition.userId = userId
    }

    const sources = await this.feedSourceRepository.find({
      where: whereCondition,
      relations: ["platform"],
    })

    this.logger.log(`Starting sync for ${sources.length} active sources`)

    const results = await Promise.allSettled(sources.map((source) => this.syncFeedSource(source.id)))

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value
      } else {
        return {
          sourceId: sources[index].id,
          success: false,
          itemsProcessed: 0,
          newItems: 0,
          error: result.reason?.message || "Unknown error",
        }
      }
    })
  }

  private async processSyncResult(result: SyncResult, source: FeedSource): Promise<number> {
    let newItemsCount = 0

    for (const itemData of result.items) {
      try {
        // Check if item already exists
        const existingItem = await this.feedItemRepository.findOne({
          where: {
            platformItemId: itemData.platformItemId,
            sourceId: source.id,
          },
        })

        if (existingItem) {
          // Update existing item with new metrics
          await this.feedItemRepository.update(existingItem.id, {
            likesCount: itemData.likesCount,
            sharesCount: itemData.sharesCount,
            commentsCount: itemData.commentsCount,
            viewsCount: itemData.viewsCount,
          })
        } else {
          // Create new item
          const feedItem = this.feedItemRepository.create({
            ...itemData,
            sourceId: source.id,
            userId: source.userId,
          })

          await this.feedItemRepository.save(feedItem)
          newItemsCount++
        }
      } catch (error) {
        this.logger.error(`Failed to process feed item:`, error.message)
      }
    }

    return newItemsCount
  }
}
