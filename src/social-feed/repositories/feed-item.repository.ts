import { Injectable } from "@nestjs/common"
import { Repository, type DataSource, type SelectQueryBuilder } from "typeorm"
import { FeedItem, FeedItemStatus, type FeedItemType } from "../entities/feed-item.entity"

export interface FeedItemFilters {
  userId?: string
  sourceIds?: string[]
  itemTypes?: FeedItemType[]
  status?: FeedItemStatus
  keywords?: string[]
  excludeKeywords?: string[]
  dateRange?: {
    from: Date
    to: Date
  }
  minLikes?: number
  minShares?: number
}

export interface FeedItemSort {
  sortBy: "publishedAt" | "likesCount" | "sharesCount" | "createdAt"
  sortOrder: "ASC" | "DESC"
}

@Injectable()
export class FeedItemRepository extends Repository<FeedItem> {
  constructor(private dataSource: DataSource) {
    super(FeedItem, dataSource.createEntityManager())
  }

  async findWithFilters(
    filters: FeedItemFilters,
    sort: FeedItemSort = { sortBy: "publishedAt", sortOrder: "DESC" },
    limit = 50,
    offset = 0,
  ): Promise<[FeedItem[], number]> {
    const queryBuilder = this.createQueryBuilder("feedItem")
      .leftJoinAndSelect("feedItem.source", "source")
      .leftJoinAndSelect("source.platform", "platform")

    this.applyFilters(queryBuilder, filters)
    this.applySort(queryBuilder, sort)

    return queryBuilder.take(limit).skip(offset).getManyAndCount()
  }

  async findByPlatformItemId(platformItemId: string, sourceId: string): Promise<FeedItem | null> {
    return this.findOne({
      where: {
        platformItemId,
        sourceId,
      },
    })
  }

  async findRecentBySource(sourceId: string, limit = 100): Promise<FeedItem[]> {
    return this.find({
      where: {
        sourceId,
        status: FeedItemStatus.ACTIVE,
      },
      order: {
        publishedAt: "DESC",
      },
      take: limit,
    })
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<FeedItem>, filters: FeedItemFilters): void {
    if (filters.userId) {
      queryBuilder.andWhere("feedItem.userId = :userId", { userId: filters.userId })
    }

    if (filters.sourceIds && filters.sourceIds.length > 0) {
      queryBuilder.andWhere("feedItem.sourceId IN (:...sourceIds)", { sourceIds: filters.sourceIds })
    }

    if (filters.itemTypes && filters.itemTypes.length > 0) {
      queryBuilder.andWhere("feedItem.type IN (:...itemTypes)", { itemTypes: filters.itemTypes })
    }

    if (filters.status) {
      queryBuilder.andWhere("feedItem.status = :status", { status: filters.status })
    }

    if (filters.keywords && filters.keywords.length > 0) {
      const keywordConditions = filters.keywords
        .map((_, index) => `feedItem.content ILIKE :keyword${index}`)
        .join(" OR ")
      queryBuilder.andWhere(
        `(${keywordConditions})`,
        filters.keywords.reduce((params, keyword, index) => {
          params[`keyword${index}`] = `%${keyword}%`
          return params
        }, {}),
      )
    }

    if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
      const excludeConditions = filters.excludeKeywords
        .map((_, index) => `feedItem.content NOT ILIKE :excludeKeyword${index}`)
        .join(" AND ")
      queryBuilder.andWhere(
        `(${excludeConditions})`,
        filters.excludeKeywords.reduce((params, keyword, index) => {
          params[`excludeKeyword${index}`] = `%${keyword}%`
          return params
        }, {}),
      )
    }

    if (filters.dateRange) {
      if (filters.dateRange.from) {
        queryBuilder.andWhere("feedItem.publishedAt >= :fromDate", { fromDate: filters.dateRange.from })
      }
      if (filters.dateRange.to) {
        queryBuilder.andWhere("feedItem.publishedAt <= :toDate", { toDate: filters.dateRange.to })
      }
    }

    if (filters.minLikes !== undefined) {
      queryBuilder.andWhere("feedItem.likesCount >= :minLikes", { minLikes: filters.minLikes })
    }

    if (filters.minShares !== undefined) {
      queryBuilder.andWhere("feedItem.sharesCount >= :minShares", { minShares: filters.minShares })
    }
  }

  private applySort(queryBuilder: SelectQueryBuilder<FeedItem>, sort: FeedItemSort): void {
    queryBuilder.orderBy(`feedItem.${sort.sortBy}`, sort.sortOrder)
  }
}
