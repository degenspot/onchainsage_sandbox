import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { FeedItem } from "../entities/feed-item.entity"

export class PaginationMetaDto {
  @ApiProperty({ description: "Total number of items" })
  totalCount: number

  @ApiProperty({ description: "Number of items per page" })
  limit: number

  @ApiProperty({ description: "Number of items skipped" })
  offset: number

  @ApiProperty({ description: "Whether there are more items available" })
  hasMore: boolean

  @ApiPropertyOptional({ description: "Next offset for pagination" })
  nextOffset?: number
}

export class FeedSourceInfoDto {
  @ApiProperty({ description: "Source ID" })
  id: string

  @ApiProperty({ description: "Source name" })
  name: string

  @ApiProperty({ description: "Platform name" })
  platform: string

  @ApiProperty({ description: "Number of items from this source" })
  itemCount: number

  @ApiPropertyOptional({ description: "Last sync timestamp" })
  lastSyncAt?: Date
}

export class FeedMetricsDto {
  @ApiProperty({ description: "Total number of items" })
  totalItems: number

  @ApiProperty({ description: "Total number of sources" })
  totalSources: number

  @ApiProperty({ description: "Number of active sources" })
  activeSources: number

  @ApiProperty({ description: "Items grouped by type" })
  itemsByType: Record<string, number>

  @ApiProperty({ description: "Items grouped by platform" })
  itemsByPlatform: Record<string, number>

  @ApiProperty({ description: "Engagement statistics" })
  engagementStats: {
    averageLikes: number
    averageShares: number
    averageComments: number
    topPerformingItem?: FeedItem
  }

  @ApiProperty({ description: "Time range of feed items" })
  timeRange: {
    oldest: Date
    newest: Date
  }
}

export class AggregatedFeedResponseDto {
  @ApiProperty({ type: [FeedItem], description: "Feed items" })
  items: FeedItem[]

  @ApiProperty({ type: PaginationMetaDto, description: "Pagination metadata" })
  pagination: PaginationMetaDto

  @ApiProperty({ type: [FeedSourceInfoDto], description: "Information about sources" })
  sources: FeedSourceInfoDto[]

  @ApiPropertyOptional({ type: FeedMetricsDto, description: "Feed metrics (if requested)" })
  metrics?: FeedMetricsDto
}

export class SyncResultDto {
  @ApiProperty({ description: "Source ID that was synced" })
  sourceId: string

  @ApiProperty({ description: "Whether sync was successful" })
  success: boolean

  @ApiProperty({ description: "Number of items processed" })
  itemsProcessed: number

  @ApiProperty({ description: "Number of new items added" })
  newItems: number

  @ApiPropertyOptional({ description: "Error message if sync failed" })
  error?: string

  @ApiPropertyOptional({ description: "Whether rate limit was hit" })
  rateLimitHit?: boolean
}

export class BulkSyncResultDto {
  @ApiProperty({ type: [SyncResultDto], description: "Results for each source" })
  results: SyncResultDto[]

  @ApiProperty({ description: "Total number of sources synced" })
  totalSources: number

  @ApiProperty({ description: "Number of successful syncs" })
  successfulSyncs: number

  @ApiProperty({ description: "Number of failed syncs" })
  failedSyncs: number
}
