import { IsString, IsOptional, IsArray, IsObject, IsBoolean, IsEnum } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { UnifiedFeedStatus } from "../entities/unified-feed.entity"

export class CreateUnifiedFeedDto {
  @ApiProperty({ description: "Name of the unified feed" })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: "Description of the unified feed" })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: "Array of source IDs to include in the feed" })
  @IsArray()
  @IsString({ each: true })
  sourceIds: string[]

  @ApiPropertyOptional({ description: "Filter settings for the feed" })
  @IsOptional()
  @IsObject()
  filterSettings?: {
    keywords?: string[]
    excludeKeywords?: string[]
    itemTypes?: string[]
    dateRange?: {
      from: Date
      to: Date
    }
    minLikes?: number
    minShares?: number
  }

  @ApiPropertyOptional({ description: "Sort settings for the feed" })
  @IsOptional()
  @IsObject()
  sortSettings?: {
    sortBy: "publishedAt" | "likesCount" | "sharesCount" | "relevance"
    sortOrder: "asc" | "desc"
  }

  @ApiPropertyOptional({ description: "Set as default feed", default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false
}

export class UpdateUnifiedFeedDto {
  @ApiPropertyOptional({ description: "Name of the unified feed" })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: "Description of the unified feed" })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: "Array of source IDs to include in the feed" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceIds?: string[]

  @ApiPropertyOptional({ description: "Filter settings for the feed" })
  @IsOptional()
  @IsObject()
  filterSettings?: {
    keywords?: string[]
    excludeKeywords?: string[]
    itemTypes?: string[]
    dateRange?: {
      from: Date
      to: Date
    }
    minLikes?: number
    minShares?: number
  }

  @ApiPropertyOptional({ description: "Sort settings for the feed" })
  @IsOptional()
  @IsObject()
  sortSettings?: {
    sortBy: "publishedAt" | "likesCount" | "sharesCount" | "relevance"
    sortOrder: "asc" | "desc"
  }

  @ApiPropertyOptional({ description: "Set as default feed" })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @ApiPropertyOptional({ enum: UnifiedFeedStatus, description: "Feed status" })
  @IsOptional()
  @IsEnum(UnifiedFeedStatus)
  status?: UnifiedFeedStatus
}

export class DuplicateFeedDto {
  @ApiProperty({ description: "Name for the duplicated feed" })
  @IsString()
  name: string
}
