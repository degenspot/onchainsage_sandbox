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
export class TwitterIntegrationService extends BasePlatformIntegration {
  readonly platformName = "twitter"
  readonly platformId = "twitter"
  private readonly baseUrl = "https://api.twitter.com/2"

  constructor(httpService: HttpService) {
    super(httpService)
  }

  async validateCredentials(credentials: SocialPlatformCredentials): Promise<boolean> {
    try {
      await this.makeAuthenticatedRequest(`${this.baseUrl}/users/me`, credentials)
      return true
    } catch (error) {
      this.logger.error("Twitter credentials validation failed:", error.message)
      return false
    }
  }

  async refreshToken(credentials: SocialPlatformCredentials): Promise<SocialPlatformCredentials> {
    if (!credentials.refreshToken) {
      throw new Error("No refresh token available")
    }

    try {
      const response = await this.httpService.axiosRef.post("https://api.twitter.com/2/oauth2/token", {
        grant_type: "refresh_token",
        refresh_token: credentials.refreshToken,
        client_id: credentials.clientId,
      })

      return {
        ...credentials,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || credentials.refreshToken,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      }
    } catch (error) {
      this.logger.error("Twitter token refresh failed:", error.message)
      throw error
    }
  }

  async getUserInfo(credentials: SocialPlatformCredentials, userId?: string): Promise<PlatformUserInfo> {
    const endpoint = userId ? `${this.baseUrl}/users/${userId}` : `${this.baseUrl}/users/me`
    const params = {
      "user.fields": "id,username,name,profile_image_url,public_metrics,verified",
    }

    try {
      const response = await this.makeAuthenticatedRequest(endpoint, credentials, { params })
      const user = response.data

      return {
        id: user.id,
        handle: user.username,
        displayName: user.name,
        avatarUrl: user.profile_image_url,
        followersCount: user.public_metrics?.followers_count,
        followingCount: user.public_metrics?.following_count,
        verified: user.verified,
      }
    } catch (error) {
      this.logger.error("Failed to get Twitter user info:", error.message)
      throw error
    }
  }

  async syncFeed(
    source: FeedSource,
    credentials: SocialPlatformCredentials,
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    const params: any = {
      "tweet.fields": "id,text,created_at,public_metrics,referenced_tweets,attachments,entities,author_id",
      "user.fields": "id,username,name,profile_image_url",
      "media.fields": "type,url,preview_image_url,width,height,duration_ms",
      expansions: "author_id,attachments.media_keys,referenced_tweets.id",
      max_results: Math.min(options.maxItems || 100, 100),
    }

    if (options.sinceId) {
      params.since_id = options.sinceId
    }

    if (!options.includeRetweets) {
      params.exclude = "retweets"
    }

    if (!options.includeReplies) {
      params.exclude = params.exclude ? `${params.exclude},replies` : "replies"
    }

    try {
      const endpoint = `${this.baseUrl}/users/${source.accountId}/tweets`
      const response = await this.makeAuthenticatedRequest(endpoint, credentials, { params })

      const items = response.data?.map((tweet: any) => this.transformToFeedItem(tweet, source)) || []

      return {
        items,
        nextPageToken: response.meta?.next_token,
        hasMore: !!response.meta?.next_token,
        rateLimitRemaining: Number.parseInt(response.headers?.["x-rate-limit-remaining"] || "0"),
        rateLimitResetAt: response.headers?.["x-rate-limit-reset"]
          ? new Date(Number.parseInt(response.headers["x-rate-limit-reset"]) * 1000)
          : undefined,
      }
    } catch (error) {
      this.handleRateLimit(error)
      this.logger.error("Twitter feed sync failed:", error.message)
      throw error
    }
  }

  async getRateLimitStatus(credentials: SocialPlatformCredentials): Promise<{
    remaining: number
    resetAt: Date
    limit: number
  }> {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/users/me`, credentials, { method: "HEAD" })

      return {
        remaining: Number.parseInt(response.headers["x-rate-limit-remaining"] || "0"),
        resetAt: new Date(Number.parseInt(response.headers["x-rate-limit-reset"]) * 1000),
        limit: Number.parseInt(response.headers["x-rate-limit-limit"] || "0"),
      }
    } catch (error) {
      this.logger.error("Failed to get Twitter rate limit status:", error.message)
      throw error
    }
  }

  transformToFeedItem(rawData: any, source: FeedSource): Partial<FeedItem> {
    const tweet = rawData
    const author = rawData.author || {}

    return {
      platformItemId: tweet.id,
      sourceId: source.id,
      userId: source.userId,
      type: this.determineTwitterItemType(tweet),
      content: tweet.text || "",
      authorHandle: author.username || source.accountHandle,
      authorName: author.name || source.displayName || "",
      authorAvatarUrl: author.profile_image_url,
      publishedAt: new Date(tweet.created_at),
      likesCount: tweet.public_metrics?.like_count || 0,
      sharesCount: tweet.public_metrics?.retweet_count || 0,
      commentsCount: tweet.public_metrics?.reply_count || 0,
      viewsCount: tweet.public_metrics?.impression_count || 0,
      hashtags: this.extractHashtags(tweet.text || ""),
      mentions: this.extractMentions(tweet.text || ""),
      originalUrl: `https://twitter.com/${author.username}/status/${tweet.id}`,
      media: this.extractTwitterMedia(tweet.attachments, rawData.includes?.media),
      links: this.extractTwitterLinks(tweet.entities?.urls),
      rawData: tweet,
    }
  }

  protected buildAuthHeaders(credentials: SocialPlatformCredentials): Record<string, string> {
    return {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Content-Type": "application/json",
    }
  }

  private determineTwitterItemType(tweet: any): FeedItemType {
    if (tweet.referenced_tweets) {
      const refType = tweet.referenced_tweets[0]?.type
      if (refType === "retweeted") return FeedItemType.RETWEET
      if (refType === "replied_to") return FeedItemType.REPLY
    }
    return FeedItemType.POST
  }

  private extractTwitterMedia(attachments: any, mediaIncludes: any[]): any[] {
    if (!attachments?.media_keys || !mediaIncludes) return []

    return attachments.media_keys
      .map((key: string) => {
        const media = mediaIncludes.find((m) => m.media_key === key)
        if (!media) return null

        return {
          type: media.type,
          url: media.url,
          thumbnailUrl: media.preview_image_url,
          width: media.width,
          height: media.height,
          duration: media.duration_ms,
        }
      })
      .filter(Boolean)
  }

  private extractTwitterLinks(urls: any[]): any[] {
    if (!urls) return []

    return urls.map((url) => ({
      url: url.expanded_url || url.url,
      title: url.title,
      description: url.description,
      imageUrl: url.images?.[0]?.url,
    }))
  }
}
