import { Injectable, Logger } from "@nestjs/common"
import type { TokenMetrics, ChainAnalytics } from "../../interfaces/analytics.interface"

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)
  private cache = new Map<string, CacheItem<any>>()

  // Default TTL: 5 minutes
  private readonly DEFAULT_TTL = 5 * 60 * 1000

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })

    this.logger.debug(`Cached data for key: ${key}`)
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.logger.debug(`Cache expired for key: ${key}`)
      return null
    }

    this.logger.debug(`Cache hit for key: ${key}`)
    return item.data as T
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.logger.debug(`Deleted cache for key: ${key}`)
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.logger.log("Cleared all cache")
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired cache items`)
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  // Specific cache methods for common data types
  cacheTokenMetrics(tokenId: string, metrics: TokenMetrics): void {
    this.set(`token_metrics_${tokenId}`, metrics, 2 * 60 * 1000) // 2 minutes TTL
  }

  getTokenMetrics(tokenId: string): TokenMetrics | null {
    return this.get<TokenMetrics>(`token_metrics_${tokenId}`)
  }

  cacheChainAnalytics(chainId: string, analytics: ChainAnalytics): void {
    this.set(`chain_analytics_${chainId}`, analytics, 10 * 60 * 1000) // 10 minutes TTL
  }

  getChainAnalytics(chainId: string): ChainAnalytics | null {
    return this.get<ChainAnalytics>(`chain_analytics_${chainId}`)
  }

  cacheFilteredTokens(filterHash: string, tokens: TokenMetrics[]): void {
    this.set(`filtered_tokens_${filterHash}`, tokens, 5 * 60 * 1000) // 5 minutes TTL
  }

  getFilteredTokens(filterHash: string): TokenMetrics[] | null {
    return this.get<TokenMetrics[]>(`filtered_tokens_${filterHash}`)
  }
}
