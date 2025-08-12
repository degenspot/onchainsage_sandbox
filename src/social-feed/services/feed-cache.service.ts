import { Injectable, Logger } from "@nestjs/common"
import type { Cache } from "cache-manager"
import type { AggregatedFeedResult, AggregatedFeedOptions } from "./feed-aggregation.service"

@Injectable()
export class FeedCacheService {
  private readonly logger = new Logger("FeedCacheService")
  private readonly DEFAULT_TTL = 300 // 5 minutes
  private readonly TRENDING_TTL = 900 // 15 minutes
  private readonly PERSONALIZED_TTL = 180 // 3 minutes

  constructor(private cacheManager: Cache) {}

  async getCachedFeed(cacheKey: string): Promise<AggregatedFeedResult | null> {
    try {
      const cached = await this.cacheManager.get<AggregatedFeedResult>(cacheKey)
      if (cached) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`)
        return cached
      }
      return null
    } catch (error) {
      this.logger.error(`Cache get error for key ${cacheKey}:`, error.message)
      return null
    }
  }

  async setCachedFeed(
    cacheKey: string,
    feedResult: AggregatedFeedResult,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    try {
      await this.cacheManager.set(cacheKey, feedResult, ttl)
      this.logger.debug(`Cached feed with key: ${cacheKey}, TTL: ${ttl}s`)
    } catch (error) {
      this.logger.error(`Cache set error for key ${cacheKey}:`, error.message)
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    try {
      const patterns = [`feed:${userId}:*`, `unified:${userId}:*`, `trending:${userId}:*`, `personalized:${userId}:*`]

      for (const pattern of patterns) {
        await this.invalidateByPattern(pattern)
      }

      this.logger.log(`Invalidated cache for user: ${userId}`)
    } catch (error) {
      this.logger.error(`Cache invalidation error for user ${userId}:`, error.message)
    }
  }

  async invalidateSourceCache(sourceId: string): Promise<void> {
    try {
      await this.invalidateByPattern(`*:source:${sourceId}:*`)
      this.logger.log(`Invalidated cache for source: ${sourceId}`)
    } catch (error) {
      this.logger.error(`Cache invalidation error for source ${sourceId}:`, error.message)
    }
  }

  generateFeedCacheKey(options: AggregatedFeedOptions): string {
    const { userId, sourceIds = [], filters = {}, sort = {}, limit = 50, offset = 0 } = options

    const keyParts = [
      "feed",
      userId,
      sourceIds.sort().join(","),
      this.hashObject(filters),
      this.hashObject(sort),
      limit,
      offset,
    ]

    return keyParts.join(":")
  }

  generateUnifiedFeedCacheKey(feedId: string, options: Partial<AggregatedFeedOptions> = {}): string {
    const keyParts = ["unified", feedId, options.limit || 50, options.offset || 0]

    return keyParts.join(":")
  }

  generateTrendingCacheKey(userId: string, timeframe: string, options: Partial<AggregatedFeedOptions> = {}): string {
    const keyParts = ["trending", userId, timeframe, options.limit || 25, options.offset || 0]

    return keyParts.join(":")
  }

  generatePersonalizedCacheKey(userId: string, options: Partial<AggregatedFeedOptions> = {}): string {
    const keyParts = ["personalized", userId, options.limit || 50, options.offset || 0]

    return keyParts.join(":")
  }

  getTrendingTTL(): number {
    return this.TRENDING_TTL
  }

  getPersonalizedTTL(): number {
    return this.PERSONALIZED_TTL
  }

  private async invalidateByPattern(pattern: string): Promise<void> {
    // This implementation depends on your cache store
    // For Redis, you would use SCAN with pattern matching
    // For in-memory cache, you might need to track keys manually
    this.logger.debug(`Invalidating cache pattern: ${pattern}`)
  }

  private hashObject(obj: any): string {
    // Simple hash function for cache keys
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}
