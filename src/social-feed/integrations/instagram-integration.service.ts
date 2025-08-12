import { Injectable } from "@nestjs/common"
import type { HttpService } from "@nestjs/axios"
import { BasePlatformIntegration } from "./base-platform-integration"
import type {
  SocialPlatformCredentials,
  SyncOptions,
  SyncResult,
  PlatformUserInfo,
} from "../interfaces/social-platform-integration.interface"
import type { FeedSource } from "../entities/feed-source.entity"
import { type FeedItem, FeedItemType } from "../entities/feed-item.entity"

@Injectable()
export class InstagramIntegrationService extends BasePlatformIntegration {
  readonly platformName = "instagram"
  readonly platformId = "instagram"
  private readonly baseUrl = "https://graph.instagram.com"

  constructor(httpService: HttpService) {
    super(httpService)
  }

  async validateCredentials(credentials: SocialPlatformCredentials): Promise<boolean> {
    try {
      await this.makeAuthenticatedRequest(`${this.baseUrl}/me`, credentials, {
        params: { fields: "id,username" },
      })
      return true
    } catch (error) {
      this.logger.error("Instagram credentials validation failed:", error.message)
      return false
    }
  }

  async refreshToken(credentials: SocialPlatformCredentials): Promise<SocialPlatformCredentials> {
    try {
      const response = await this.httpService.axiosRef.get(`${this.baseUrl}/refresh_access_token`, {
        params: {
          grant_type: "ig_refresh_token",
          access_token: credentials.accessToken,
        },
      })

      return {
        ...credentials,
        accessToken: response.data.access_token,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      }
    } catch (error) {
      this.logger.error("Instagram token refresh failed:", error.message)
      throw error
    }
  }

  async getUserInfo(credentials: SocialPlatformCredentials, userId?: string): Promise<PlatformUserInfo> {
    const endpoint = userId ? `${this.baseUrl}/${userId}` : `${this.baseUrl}/me`
    const params = {
      fields: "id,username,account_type,media_count,followers_count,follows_count",
    }

    try {
      const response = await this.makeAuthenticatedRequest(endpoint, credentials, { params })
      const user = response

      return {
        id: user.id,
        handle: user.username,
        displayName: user.username,
        followersCount: user.followers_count,
        followingCount: user.follows_count,
        verified: false, // Instagram Basic Display API doesn't provide verification status
      }
    } catch (error) {
      this.logger.error("Failed to get Instagram user info:", error.message)
      throw error
    }
  }

  async syncFeed(
    source: FeedSource,
    credentials: SocialPlatformCredentials,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    const params: any = {
      fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
      limit: Math.min(options.maxItems || 25, 25), // Instagram API limit
    }

    if (options.sinceDate) {
      params.since = Math.floor(options.sinceDate.getTime() / 1000)
    }

    try {
      const endpoint = `${this.baseUrl}/${source.accountId}/media`
      const response = await this.makeAuthenticatedRequest(endpoint, credentials, { params })

      const items = response.data?.map((post: any) => this.transformToFeedItem(post, source)) || []

      return {
        items,
        nextPageToken: response.paging?.next,
        hasMore: !!response.paging?.next,
      }
    } catch (error) {
      this.handleRateLimit(error)
      this.logger.error("Instagram feed sync failed:", error.message)
      throw error
    }
  }

  async getRateLimitStatus(credentials: SocialPlatformCredentials): Promise<{
    remaining: number
    resetAt: Date
    limit: number
  }> {
    // Instagram Basic Display API doesn't provide rate limit headers
    // Return default values based on known limits
    return {
      remaining: 200, // Instagram allows 200 requests per hour
      resetAt: new Date(Date.now() + 60 * 60 * 1000), // Reset in 1 hour
      limit: 200,
    }
  }

  transformToFeedItem(rawData: any, source: FeedSource): Partial<FeedItem> {
    const post = rawData

    return {
      platformItemId: post.id,
      sourceId: source.id,
      userId: source.userId,
      type: this.determineInstagramItemType(post.media_type),
      content: post.caption || "",
      title: this.extractInstagramTitle(post.caption),
      authorHandle: source.accountHandle,
      authorName: source.displayName || source.accountHandle,
      authorAvatarUrl: source.avatarUrl,
      publishedAt: new Date(post.timestamp),
      likesCount: post.like_count || 0,
      commentsCount: post.comments_count || 0,
      hashtags: this.extractHashtags(post.caption || ""),
      mentions: this.extractMentions(post.caption || ""),
      originalUrl: post.permalink,
      media: this.extractInstagramMedia(post),
      rawData: post,
    }
  }

  protected buildAuthHeaders(credentials: SocialPlatformCredentials): Record<string, string> {
    return {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Content-Type": "application/json",
    }
  }

  private determineInstagramItemType(mediaType: string): FeedItemType {
    switch (mediaType) {
      case "VIDEO":
        return FeedItemType.VIDEO
      case "IMAGE":
        return FeedItemType.IMAGE
      case "CAROUSEL_ALBUM":
        return FeedItemType.POST
      default:
        return FeedItemType.POST
    }
  }

  private extractInstagramTitle(caption: string): string | undefined {
    if (!caption) return undefined
    // Extract first line as title if it's short enough
    const firstLine = caption.split("\n")[0]
    return firstLine.length <= 100 ? firstLine : undefined
  }

  private extractInstagramMedia(post: any): any[] {
    const media = []

    if (post.media_url) {
      media.push({
        type: post.media_type?.toLowerCase() || "image",
        url: post.media_url,
        thumbnailUrl: post.thumbnail_url,
      })
    }

    return media
  }
}
