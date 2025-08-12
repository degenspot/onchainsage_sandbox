import { Injectable, Logger } from "@nestjs/common"
import type { HttpService } from "@nestjs/axios"
import type {
  ISocialPlatformIntegration,
  SocialPlatformCredentials,
} from "../interfaces/social-platform-integration.interface"
import { type FeedItem, FeedItemType } from "../entities/feed-item.entity"
import type { FeedSource } from "../entities/feed-source.entity"

@Injectable()
export abstract class BasePlatformIntegration implements ISocialPlatformIntegration {
  protected readonly logger = new Logger(this.constructor.name)

  constructor(protected readonly httpService: HttpService) {}

  abstract readonly platformName: string
  abstract readonly platformId: string

  abstract validateCredentials(credentials: SocialPlatformCredentials): Promise<boolean>
  abstract refreshToken(credentials: SocialPlatformCredentials): Promise<SocialPlatformCredentials>
  abstract getUserInfo(credentials: SocialPlatformCredentials, userId?: string): Promise<any>
  abstract syncFeed(source: FeedSource, credentials: SocialPlatformCredentials, options?: any): Promise<any>
  abstract getRateLimitStatus(credentials: SocialPlatformCredentials): Promise<any>
  abstract transformToFeedItem(rawData: any, source: FeedSource): Partial<FeedItem>

  protected extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g
    return text.match(hashtagRegex)?.map((tag) => tag.slice(1)) || []
  }

  protected extractMentions(text: string): string[] {
    const mentionRegex = /@[\w\u0590-\u05ff]+/g
    return text.match(mentionRegex)?.map((mention) => mention.slice(1)) || []
  }

  protected extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g
    return text.match(urlRegex) || []
  }

  protected determineItemType(rawData: any): FeedItemType {
    // Override in specific implementations
    return FeedItemType.POST
  }

  protected async makeAuthenticatedRequest(
    url: string,
    credentials: SocialPlatformCredentials,
    options: any = {},
  ): Promise<any> {
    try {
      const headers = this.buildAuthHeaders(credentials)
      const response = await this.httpService.axiosRef({
        url,
        headers,
        ...options,
      })

      return response.data
    } catch (error) {
      this.logger.error(`API request failed for ${this.platformName}:`, error.message)
      throw error
    }
  }

  protected abstract buildAuthHeaders(credentials: SocialPlatformCredentials): Record<string, string>

  protected handleRateLimit(error: any): void {
    if (error.response?.status === 429) {
      const resetTime = error.response.headers["x-rate-limit-reset"]
      this.logger.warn(`Rate limit exceeded for ${this.platformName}. Reset at: ${resetTime}`)
      throw new Error(`Rate limit exceeded. Try again at ${resetTime}`)
    }
  }
}
