import { Injectable, Logger } from "@nestjs/common"
import { type Repository, In } from "typeorm"
import { type FeedItem, FeedItemStatus } from "../entities/feed-item.entity"
import { type FeedSource, FeedSourceStatus } from "../entities/feed-source.entity"
import type { UnifiedFeed } from "../entities/unified-feed.entity"
import type { FeedItemRepository, FeedItemFilters, FeedItemSort } from "../repositories/feed-item.repository"

export interface AggregatedFeedOptions {
  userId: string
  sourceIds?: string[]
  filters?: FeedItemFilters
  sort?: FeedItemSort
  limit?: number
  offset?: number
  includeMetrics?: boolean
}

export interface AggregatedFeedResult {
  items: FeedItem[]
  totalCount: number
  hasMore: boolean
  sources: {
    id: string
    name: string
    platform: string
    itemCount: number
    lastSyncAt?: Date
  }[]
  appliedFilters: FeedItemFilters
  nextOffset?: number
}

export interface FeedMetrics {
  totalItems: number
  totalSources: number
  activeSources: number
  itemsByType: Record<string, number>
  itemsByPlatform: Record<string, number>
  engagementStats: {
    averageLikes: number
    averageShares: number
    averageComments: number
    topPerformingItem?: FeedItem
  }
  timeRange: {
    oldest: Date
    newest: Date
  }
}

@Injectable()
export class FeedAggregationService {
  private readonly logger = new Logger(FeedAggregationService.name)

  constructor(
    private readonly feedSourceRepository: Repository<FeedSource>,
    private readonly unifiedFeedRepository: Repository<UnifiedFeed>,
    private readonly feedItemRepository: FeedItemRepository,
  ) {}

  async getAggregatedFeed(options: AggregatedFeedOptions): Promise<AggregatedFeedResult> {
    const {
      userId,
      sourceIds,
      filters = {},
      sort = { sortBy: "publishedAt", sortOrder: "DESC" },
      limit = 50,
      offset = 0,
      includeMetrics = false,
    } = options

    // Build comprehensive filters
    const feedFilters: FeedItemFilters = {
      ...filters,
      userId,
      status: FeedItemStatus.ACTIVE,
    }

    // If specific sources are requested, use them; otherwise get all user's active sources
    if (sourceIds && sourceIds.length > 0) {
      feedFilters.sourceIds = sourceIds
    } else {
      const userSources = await this.getUserActiveSources(userId)
      feedFilters.sourceIds = userSources.map((source) => source.id)
    }

    // Get paginated feed items
    const [items, totalCount] = await this.feedItemRepository.findWithFilters(feedFilters, sort, limit, offset)

    // Get source information
    const sources = await this.getSourcesInfo(feedFilters.sourceIds || [])

    return {
      items,
      totalCount,
      hasMore: offset + items.length < totalCount,
      sources,
      appliedFilters: feedFilters,
      nextOffset: offset + items.length < totalCount ? offset + limit : undefined,
    }
  }

  async getUnifiedFeed(feedId: string, options: Partial<AggregatedFeedOptions> = {}): Promise<AggregatedFeedResult> {
    const unifiedFeed = await this.unifiedFeedRepository.findOne({
      where: { id: feedId },
    })

    if (!unifiedFeed) {
      throw new Error(`Unified feed not found: ${feedId}`)
    }

    const aggregationOptions: AggregatedFeedOptions = {
      userId: unifiedFeed.userId,
      sourceIds: unifiedFeed.sourceIds,
      filters: {
        ...options.filters,
        ...unifiedFeed.filterSettings,
      },
      sort: unifiedFeed.sortSettings || { sortBy: "publishedAt", sortOrder: "DESC" },
      ...options,
    }

    return this.getAggregatedFeed(aggregationOptions)
  }

  async getFeedMetrics(userId: string, sourceIds?: string[]): Promise<FeedMetrics> {
    const filters: FeedItemFilters = {
      userId,
      status: FeedItemStatus.ACTIVE,
    }

    if (sourceIds && sourceIds.length > 0) {
      filters.sourceIds = sourceIds
    } else {
      const userSources = await this.getUserActiveSources(userId)
      filters.sourceIds = userSources.map((source) => source.id)
    }

    const [items] = await this.feedItemRepository.findWithFilters(filters, { sortBy: "publishedAt", sortOrder: "DESC" })

    const sources = await this.getSourcesInfo(filters.sourceIds || [])
    const activeSources = sources.filter((source) => source.itemCount > 0)

    // Calculate metrics
    const itemsByType = this.groupItemsByField(items, "type")
    const itemsByPlatform = this.groupItemsByPlatform(items, sources)
    const engagementStats = this.calculateEngagementStats(items)
    const timeRange = this.calculateTimeRange(items)

    return {
      totalItems: items.length,
      totalSources: sources.length,
      activeSources: activeSources.length,
      itemsByType,
      itemsByPlatform,
      engagementStats,
      timeRange,
    }
  }

  async searchFeed(
    userId: string,
    query: string,
    options: Partial<AggregatedFeedOptions> = {},
  ): Promise<AggregatedFeedResult> {
    const searchFilters: FeedItemFilters = {
      ...options.filters,
      keywords: [query],
    }

    return this.getAggregatedFeed({
      userId,
      filters: searchFilters,
      ...options,
    })
  }

  async getTrendingContent(
    userId: string,
    timeframe: "1h" | "6h" | "24h" | "7d" = "24h",
    options: Partial<AggregatedFeedOptions> = {},
  ): Promise<AggregatedFeedResult> {
    const timeframeHours = {
      "1h": 1,
      "6h": 6,
      "24h": 24,
      "7d": 168,
    }

    const fromDate = new Date(Date.now() - timeframeHours[timeframe] * 60 * 60 * 1000)

    const trendingFilters: FeedItemFilters = {
      ...options.filters,
      dateRange: {
        from: fromDate,
        to: new Date(),
      },
      minLikes: 1, // Only include content with engagement
    }

    const trendingSort: FeedItemSort = {
      sortBy: "likesCount",
      sortOrder: "DESC",
    }

    return this.getAggregatedFeed({
      userId,
      filters: trendingFilters,
      sort: trendingSort,
      limit: options.limit || 25,
      ...options,
    })
  }

  async getPersonalizedFeed(
    userId: string,
    options: Partial<AggregatedFeedOptions> = {},
  ): Promise<AggregatedFeedResult> {
    // Get user's interaction history and preferences
    const userPreferences = await this.getUserPreferences(userId)

    // Apply personalization filters
    const personalizedFilters: FeedItemFilters = {
      ...options.filters,
      keywords: userPreferences.preferredKeywords,
      excludeKeywords: userPreferences.excludedKeywords,
      itemTypes: userPreferences.preferredTypes,
    }

    // Use engagement-based sorting with recency boost
    const personalizedSort: FeedItemSort = {
      sortBy: "publishedAt", // We'll implement custom scoring later
      sortOrder: "DESC",
    }

    const result = await this.getAggregatedFeed({
      userId,
      filters: personalizedFilters,
      sort: personalizedSort,
      ...options,
    })

    // Apply personalization scoring
    result.items = this.applyPersonalizationScoring(result.items, userPreferences)

    return result
  }

  private async getUserActiveSources(userId: string): Promise<FeedSource[]> {
    return this.feedSourceRepository.find({
      where: {
        userId,
        status: FeedSourceStatus.ACTIVE,
      },
      relations: ["platform"],
    })
  }

  private async getSourcesInfo(sourceIds: string[]): Promise<AggregatedFeedResult["sources"]> {
    if (sourceIds.length === 0) return []

    const sources = await this.feedSourceRepository.find({
      where: { id: In(sourceIds) },
      relations: ["platform"],
    })

    return Promise.all(
      sources.map(async (source) => {
        const itemCount = await this.feedItemRepository.count({
          where: {
            sourceId: source.id,
            status: FeedItemStatus.ACTIVE,
          },
        })

        return {
          id: source.id,
          name: source.displayName || source.accountHandle,
          platform: source.platform.displayName,
          itemCount,
          lastSyncAt: source.lastSyncAt,
        }
      }),
    )
  }

  private groupItemsByField(items: FeedItem[], field: keyof FeedItem): Record<string, number> {
    return items.reduce(
      (acc, item) => {
        const value = String(item[field])
        acc[value] = (acc[value] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }

  private groupItemsByPlatform(items: FeedItem[], sources: AggregatedFeedResult["sources"]): Record<string, number> {
    const sourceIdToPlatform = sources.reduce(
      (acc, source) => {
        acc[source.id] = source.platform
        return acc
      },
      {} as Record<string, string>,
    )

    return items.reduce(
      (acc, item) => {
        const platform = sourceIdToPlatform[item.sourceId] || "Unknown"
        acc[platform] = (acc[platform] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }

  private calculateEngagementStats(items: FeedItem[]): FeedMetrics["engagementStats"] {
    if (items.length === 0) {
      return {
        averageLikes: 0,
        averageShares: 0,
        averageComments: 0,
      }
    }

    const totalLikes = items.reduce((sum, item) => sum + item.likesCount, 0)
    const totalShares = items.reduce((sum, item) => sum + item.sharesCount, 0)
    const totalComments = items.reduce((sum, item) => sum + item.commentsCount, 0)

    const topPerformingItem = items.reduce((top, item) => {
      const itemScore = item.likesCount + item.sharesCount + item.commentsCount
      const topScore = top.likesCount + top.sharesCount + top.commentsCount
      return itemScore > topScore ? item : top
    }, items[0])

    return {
      averageLikes: Math.round(totalLikes / items.length),
      averageShares: Math.round(totalShares / items.length),
      averageComments: Math.round(totalComments / items.length),
      topPerformingItem,
    }
  }

  private calculateTimeRange(items: FeedItem[]): FeedMetrics["timeRange"] {
    if (items.length === 0) {
      const now = new Date()
      return { oldest: now, newest: now }
    }

    const dates = items.map((item) => item.publishedAt).sort((a, b) => a.getTime() - b.getTime())

    return {
      oldest: dates[0],
      newest: dates[dates.length - 1],
    }
  }

  private async getUserPreferences(userId: string): Promise<{
    preferredKeywords: string[]
    excludedKeywords: string[]
    preferredTypes: string[]
  }> {
    // This would typically come from a user preferences table
    // For now, return default preferences
    return {
      preferredKeywords: [],
      excludedKeywords: ["spam", "advertisement"],
      preferredTypes: ["post", "article", "video"],
    }
  }

  private applyPersonalizationScoring(items: FeedItem[], preferences: any): FeedItem[] {
    // Simple scoring algorithm - in production, this would be more sophisticated
    return items.sort((a, b) => {
      const scoreA = this.calculatePersonalizationScore(a, preferences)
      const scoreB = this.calculatePersonalizationScore(b, preferences)
      return scoreB - scoreA
    })
  }

  private calculatePersonalizationScore(item: FeedItem, preferences: any): number {
    let score = 0

    // Recency boost (newer content gets higher score)
    const hoursOld = (Date.now() - item.publishedAt.getTime()) / (1000 * 60 * 60)
    score += Math.max(0, 100 - hoursOld) // Max 100 points for very recent content

    // Engagement boost
    score += item.likesCount * 0.1
    score += item.sharesCount * 0.2
    score += item.commentsCount * 0.15

    // Content type preference
    if (preferences.preferredTypes.includes(item.type)) {
      score += 50
    }

    // Keyword matching
    const content = item.content.toLowerCase()
    preferences.preferredKeywords.forEach((keyword: string) => {
      if (content.includes(keyword.toLowerCase())) {
        score += 25
      }
    })

    return score
  }
}
