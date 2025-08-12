import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

export enum UnifiedFeedStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
}

@Entity("unified_feeds")
@Index(["userId", "createdAt"])
export class UnifiedFeed {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  userId: string

  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Column("json")
  sourceIds: string[] // Array of FeedSource IDs

  @Column("json", { default: {} })
  filterSettings: {
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

  @Column("json", { default: {} })
  sortSettings: {
    sortBy: "publishedAt" | "likesCount" | "sharesCount" | "relevance"
    sortOrder: "asc" | "desc"
  }

  @Column({ default: true })
  isDefault: boolean

  @Column({
    type: "enum",
    enum: UnifiedFeedStatus,
    default: UnifiedFeedStatus.ACTIVE,
  })
  status: UnifiedFeedStatus

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
