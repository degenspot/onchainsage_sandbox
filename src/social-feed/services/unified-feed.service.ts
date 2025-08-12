import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type UnifiedFeed, UnifiedFeedStatus } from "../entities/unified-feed.entity"
import type { FeedSource } from "../entities/feed-source.entity"

export interface CreateUnifiedFeedDto {
  userId: string
  name: string
  description?: string
  sourceIds: string[]
  filterSettings?: any
  sortSettings?: any
  isDefault?: boolean
}

export interface UpdateUnifiedFeedDto {
  name?: string
  description?: string
  sourceIds?: string[]
  filterSettings?: any
  sortSettings?: any
  isDefault?: boolean
  status?: UnifiedFeedStatus
}

@Injectable()
export class UnifiedFeedService {
  private readonly logger = new Logger(UnifiedFeedService.name)

  constructor(
    private readonly unifiedFeedRepository: Repository<UnifiedFeed>,
    private readonly feedSourceRepository: Repository<FeedSource>,
  ) {}

  async createUnifiedFeed(createDto: CreateUnifiedFeedDto): Promise<UnifiedFeed> {
    // Validate that all source IDs belong to the user
    await this.validateSourceOwnership(createDto.userId, createDto.sourceIds)

    // If this is set as default, unset other default feeds
    if (createDto.isDefault) {
      await this.unsetOtherDefaultFeeds(createDto.userId)
    }

    const unifiedFeed = this.unifiedFeedRepository.create({
      ...createDto,
      filterSettings: createDto.filterSettings || {},
      sortSettings: createDto.sortSettings || { sortBy: "publishedAt", sortOrder: "desc" },
    })

    const savedFeed = await this.unifiedFeedRepository.save(unifiedFeed)
    this.logger.log(`Created unified feed: ${savedFeed.id} for user: ${createDto.userId}`)

    return savedFeed
  }

  async updateUnifiedFeed(feedId: string, userId: string, updateDto: UpdateUnifiedFeedDto): Promise<UnifiedFeed> {
    const feed = await this.unifiedFeedRepository.findOne({
      where: { id: feedId, userId },
    })

    if (!feed) {
      throw new Error(`Unified feed not found: ${feedId}`)
    }

    // Validate source ownership if sourceIds are being updated
    if (updateDto.sourceIds) {
      await this.validateSourceOwnership(userId, updateDto.sourceIds)
    }

    // Handle default feed logic
    if (updateDto.isDefault && !feed.isDefault) {
      await this.unsetOtherDefaultFeeds(userId)
    }

    Object.assign(feed, updateDto)
    const updatedFeed = await this.unifiedFeedRepository.save(feed)

    this.logger.log(`Updated unified feed: ${feedId}`)
    return updatedFeed
  }

  async deleteUnifiedFeed(feedId: string, userId: string): Promise<void> {
    const result = await this.unifiedFeedRepository.delete({
      id: feedId,
      userId,
    })

    if (result.affected === 0) {
      throw new Error(`Unified feed not found: ${feedId}`)
    }

    this.logger.log(`Deleted unified feed: ${feedId}`)
  }

  async getUserFeeds(userId: string): Promise<UnifiedFeed[]> {
    return this.unifiedFeedRepository.find({
      where: { userId, status: UnifiedFeedStatus.ACTIVE },
      order: { isDefault: "DESC", createdAt: "DESC" },
    })
  }

  async getFeedById(feedId: string, userId: string): Promise<UnifiedFeed> {
    const feed = await this.unifiedFeedRepository.findOne({
      where: { id: feedId, userId },
    })

    if (!feed) {
      throw new Error(`Unified feed not found: ${feedId}`)
    }

    return feed
  }

  async getDefaultFeed(userId: string): Promise<UnifiedFeed | null> {
    return this.unifiedFeedRepository.findOne({
      where: { userId, isDefault: true, status: UnifiedFeedStatus.ACTIVE },
    })
  }

  async createDefaultFeedIfNotExists(userId: string): Promise<UnifiedFeed> {
    const existingDefault = await this.getDefaultFeed(userId)
    if (existingDefault) {
      return existingDefault
    }

    // Get all user's active sources
    const userSources = await this.feedSourceRepository.find({
      where: { userId },
      select: ["id"],
    })

    const defaultFeed = await this.createUnifiedFeed({
      userId,
      name: "My Feed",
      description: "Default aggregated feed from all your sources",
      sourceIds: userSources.map((source) => source.id),
      isDefault: true,
      filterSettings: {
        itemTypes: ["post", "article", "video", "image"],
      },
      sortSettings: {
        sortBy: "publishedAt",
        sortOrder: "desc",
      },
    })

    this.logger.log(`Created default feed for user: ${userId}`)
    return defaultFeed
  }

  async duplicateFeed(feedId: string, userId: string, newName: string): Promise<UnifiedFeed> {
    const originalFeed = await this.getFeedById(feedId, userId)

    const duplicatedFeed = await this.createUnifiedFeed({
      userId,
      name: newName,
      description: originalFeed.description,
      sourceIds: [...originalFeed.sourceIds],
      filterSettings: { ...originalFeed.filterSettings },
      sortSettings: { ...originalFeed.sortSettings },
      isDefault: false,
    })

    this.logger.log(`Duplicated feed ${feedId} to ${duplicatedFeed.id}`)
    return duplicatedFeed
  }

  async addSourcesToFeed(feedId: string, userId: string, sourceIds: string[]): Promise<UnifiedFeed> {
    const feed = await this.getFeedById(feedId, userId)
    await this.validateSourceOwnership(userId, sourceIds)

    const updatedSourceIds = [...new Set([...feed.sourceIds, ...sourceIds])]

    return this.updateUnifiedFeed(feedId, userId, { sourceIds: updatedSourceIds })
  }

  async removeSourcesFromFeed(feedId: string, userId: string, sourceIds: string[]): Promise<UnifiedFeed> {
    const feed = await this.getFeedById(feedId, userId)

    const updatedSourceIds = feed.sourceIds.filter((id) => !sourceIds.includes(id))

    return this.updateUnifiedFeed(feedId, userId, { sourceIds: updatedSourceIds })
  }

  private async validateSourceOwnership(userId: string, sourceIds: string[]): Promise<void> {
    const sources = await this.feedSourceRepository.find({
      where: { userId },
      select: ["id"],
    })

    const userSourceIds = sources.map((source) => source.id)
    const invalidSourceIds = sourceIds.filter((id) => !userSourceIds.includes(id))

    if (invalidSourceIds.length > 0) {
      throw new Error(`Invalid source IDs: ${invalidSourceIds.join(", ")}`)
    }
  }

  private async unsetOtherDefaultFeeds(userId: string): Promise<void> {
    await this.unifiedFeedRepository.update({ userId, isDefault: true }, { isDefault: false })
  }
}
