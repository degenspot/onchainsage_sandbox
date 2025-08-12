import { Injectable, Logger } from "@nestjs/common"
import type { EventEmitter2 } from "@nestjs/event-emitter"
import type { FeedItem } from "../entities/feed-item.entity"
import type { FeedSource } from "../entities/feed-source.entity"

export interface FeedUpdateEvent {
  type: "new_items" | "source_updated" | "sync_completed" | "sync_failed"
  userId: string
  sourceId?: string
  items?: FeedItem[]
  metadata?: any
}

export interface NotificationPreferences {
  userId: string
  enableRealTimeUpdates: boolean
  enableHighEngagementAlerts: boolean
  enableKeywordAlerts: boolean
  keywordAlerts: string[]
  minEngagementThreshold: number
  quietHours?: {
    start: string // HH:mm format
    end: string // HH:mm format
  }
}

@Injectable()
export class FeedNotificationService {
  private readonly logger = new Logger(FeedNotificationService.name)

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async notifyNewItems(userId: string, sourceId: string, items: FeedItem[]): Promise<void> {
    if (items.length === 0) return

    const event: FeedUpdateEvent = {
      type: "new_items",
      userId,
      sourceId,
      items,
      metadata: {
        count: items.length,
        timestamp: new Date(),
      },
    }

    this.eventEmitter.emit("feed.new_items", event)
    this.logger.debug(`Notified new items: ${items.length} items for user ${userId}`)

    // Check for high engagement items
    await this.checkHighEngagementItems(userId, items)

    // Check for keyword alerts
    await this.checkKeywordAlerts(userId, items)
  }

  async notifySourceUpdated(userId: string, source: FeedSource): Promise<void> {
    const event: FeedUpdateEvent = {
      type: "source_updated",
      userId,
      sourceId: source.id,
      metadata: {
        sourceName: source.displayName || source.accountHandle,
        platform: source.platform?.displayName,
        timestamp: new Date(),
      },
    }

    this.eventEmitter.emit("feed.source_updated", event)
    this.logger.debug(`Notified source updated: ${source.id} for user ${userId}`)
  }

  async notifySyncCompleted(userId: string, sourceId: string, itemsProcessed: number, newItems: number): Promise<void> {
    const event: FeedUpdateEvent = {
      type: "sync_completed",
      userId,
      sourceId,
      metadata: {
        itemsProcessed,
        newItems,
        timestamp: new Date(),
      },
    }

    this.eventEmitter.emit("feed.sync_completed", event)
    this.logger.debug(`Notified sync completed: ${sourceId} for user ${userId}`)
  }

  async notifySyncFailed(userId: string, sourceId: string, error: string): Promise<void> {
    const event: FeedUpdateEvent = {
      type: "sync_failed",
      userId,
      sourceId,
      metadata: {
        error,
        timestamp: new Date(),
      },
    }

    this.eventEmitter.emit("feed.sync_failed", event)
    this.logger.warn(`Notified sync failed: ${sourceId} for user ${userId} - ${error}`)
  }

  private async checkHighEngagementItems(userId: string, items: FeedItem[]): Promise<void> {
    const preferences = await this.getUserNotificationPreferences(userId)

    if (!preferences.enableHighEngagementAlerts) return

    const highEngagementItems = items.filter((item) => {
      const totalEngagement = item.likesCount + item.sharesCount + item.commentsCount
      return totalEngagement >= preferences.minEngagementThreshold
    })

    if (highEngagementItems.length > 0) {
      this.eventEmitter.emit("feed.high_engagement", {
        userId,
        items: highEngagementItems,
        threshold: preferences.minEngagementThreshold,
      })
    }
  }

  private async checkKeywordAlerts(userId: string, items: FeedItem[]): Promise<void> {
    const preferences = await this.getUserNotificationPreferences(userId)

    if (!preferences.enableKeywordAlerts || preferences.keywordAlerts.length === 0) return

    const matchingItems = items.filter((item) => {
      const content = item.content.toLowerCase()
      return preferences.keywordAlerts.some((keyword) => content.includes(keyword.toLowerCase()))
    })

    if (matchingItems.length > 0) {
      this.eventEmitter.emit("feed.keyword_alert", {
        userId,
        items: matchingItems,
        keywords: preferences.keywordAlerts,
      })
    }
  }

  private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    // This would typically come from a user preferences table
    // For now, return default preferences
    return {
      userId,
      enableRealTimeUpdates: true,
      enableHighEngagementAlerts: true,
      enableKeywordAlerts: false,
      keywordAlerts: [],
      minEngagementThreshold: 100,
    }
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours) return false

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    return currentTime >= preferences.quietHours.start && currentTime <= preferences.quietHours.end
  }
}
