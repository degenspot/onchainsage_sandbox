import { IsString, IsOptional, IsEnum, IsObject, IsBoolean, IsInt, Min, Max } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { FeedSourceStatus } from "../entities/feed-source.entity"

export class CreateFeedSourceDto {
  @ApiProperty({ description: "Platform ID (e.g., 'twitter', 'instagram')" })
  @IsString()
  platformId: string

  @ApiProperty({ description: "Account handle (e.g., '@username')" })
  @IsString()
  accountHandle: string

  @ApiProperty({ description: "Platform-specific account ID" })
  @IsString()
  accountId: string

  @ApiPropertyOptional({ description: "Display name for the source" })
  @IsOptional()
  @IsString()
  displayName?: string

  @ApiPropertyOptional({ description: "Avatar URL" })
  @IsOptional()
  @IsString()
  avatarUrl?: string

  @ApiPropertyOptional({ description: "Authentication tokens" })
  @IsOptional()
  @IsObject()
  authTokens?: {
    accessToken?: string
    refreshToken?: string
    expiresAt?: Date
  }

  @ApiPropertyOptional({ description: "Sync settings for the source" })
  @IsOptional()
  @IsObject()
  syncSettings?: {
    enabled: boolean
    syncInterval: number
    maxItemsPerSync: number
    includeReplies: boolean
    includeRetweets: boolean
  }
}

export class UpdateFeedSourceDto {
  @ApiPropertyOptional({ description: "Display name for the source" })
  @IsOptional()
  @IsString()
  displayName?: string

  @ApiPropertyOptional({ description: "Avatar URL" })
  @IsOptional()
  @IsString()
  avatarUrl?: string

  @ApiPropertyOptional({ enum: FeedSourceStatus, description: "Source status" })
  @IsOptional()
  @IsEnum(FeedSourceStatus)
  status?: FeedSourceStatus

  @ApiPropertyOptional({ description: "Sync settings for the source" })
  @IsOptional()
  @IsObject()
  syncSettings?: {
    enabled?: boolean
    syncInterval?: number
    maxItemsPerSync?: number
    includeReplies?: boolean
    includeRetweets?: boolean
  }
}

export class SyncFeedSourceDto {
  @ApiPropertyOptional({ description: "Maximum number of items to sync", minimum: 1, maximum: 200, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxItems?: number = 100

  @ApiPropertyOptional({ description: "Include replies in sync", default: false })
  @IsOptional()
  @IsBoolean()
  includeReplies?: boolean = false

  @ApiPropertyOptional({ description: "Include retweets/shares in sync", default: true })
  @IsOptional()
  @IsBoolean()
  includeRetweets?: boolean = true
}
