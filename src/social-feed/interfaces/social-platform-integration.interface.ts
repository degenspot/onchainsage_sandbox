import type { FeedItem } from "../entities/feed-item.entity"
import type { FeedSource } from "../entities/feed-source.entity"

export interface SocialPlatformCredentials {
  accessToken?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  apiKey?: string
  expiresAt?: Date
}

export interface SyncOptions {
  maxItems?: number
  sinceId?: string
  sinceDate?: Date
  includeReplies?: boolean
  includeRetweets?: boolean
}

export interface SyncResult {
  items: Partial<FeedItem>[]
  nextPageToken?: string
  hasMore: boolean
  rateLimitRemaining?: number
  rateLimitResetAt?: Date
}

export interface PlatformUserInfo {
  id: string
  handle: string
  displayName: string
  avatarUrl?: string
  followersCount?: number
  followingCount?: number
  verified?: boolean
}

export interface ISocialPlatformIntegration {
  readonly platformName: string
  readonly platformId: string

  // Authentication
  validateCredentials(credentials: SocialPlatformCredentials): Promise<boolean>
  refreshToken(credentials: SocialPlatformCredentials): Promise<SocialPlatformCredentials>

  // User info
  getUserInfo(credentials: SocialPlatformCredentials, userId?: string): Promise<PlatformUserInfo>

  // Feed sync
  syncFeed(source: FeedSource, credentials: SocialPlatformCredentials, options?: SyncOptions): Promise<SyncResult>

  // Rate limiting
  getRateLimitStatus(credentials: SocialPlatformCredentials): Promise<{
    remaining: number
    resetAt: Date
    limit: number
  }>

  // Data transformation
  transformToFeedItem(rawData: any, source: FeedSource): Partial<FeedItem>
}
