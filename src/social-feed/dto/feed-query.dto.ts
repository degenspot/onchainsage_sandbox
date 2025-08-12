import { IsOptional, IsString, IsArray, IsEnum, IsInt, IsDateString, Min, Max, IsBoolean } from "class-validator"
import { Transform, Type } from "class-transformer"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { FeedItemType } from "../entities/feed-item.entity"

export class FeedQueryDto {
  @ApiPropertyOptional({ description: "Array of source IDs to filter by" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
  sourceIds?: string[]

  @ApiPropertyOptional({ description: "Keywords to search for in content" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
  keywords?: string[]

  @ApiPropertyOptional({ description: "Keywords to exclude from content" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
  excludeKeywords?: string[]

  @ApiPropertyOptional({ enum: FeedItemType, isArray: true, description: "Types of feed items to include" })
  @IsOptional()
  @IsArray()
  @IsEnum(FeedItemType, { each: true })
  @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
  itemTypes?: FeedItemType[]

  @ApiPropertyOptional({ description: "Start date for date range filter (ISO string)" })
  @IsOptional()
  @IsDateString()
  fromDate?: string

  @ApiPropertyOptional({ description: "End date for date range filter (ISO string)" })
  @IsOptional()
  @IsDateString()
  toDate?: string

  @ApiPropertyOptional({ description: "Minimum number of likes", minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minLikes?: number

  @ApiPropertyOptional({ description: "Minimum number of shares", minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minShares?: number

  @ApiPropertyOptional({
    enum: ["publishedAt", "likesCount", "sharesCount", "createdAt"],
    description: "Field to sort by",
  })
  @IsOptional()
  @IsEnum(["publishedAt", "likesCount", "sharesCount", "createdAt"])
  sortBy?: "publishedAt" | "likesCount" | "sharesCount" | "createdAt"

  @ApiPropertyOptional({ enum: ["ASC", "DESC"], description: "Sort order" })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC"

  @ApiPropertyOptional({ description: "Number of items per page", minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50

  @ApiPropertyOptional({ description: "Number of items to skip", minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0

  @ApiPropertyOptional({ description: "Include feed metrics in response", default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  includeMetrics?: boolean = false
}
