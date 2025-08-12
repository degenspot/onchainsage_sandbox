import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm"
import { SocialPlatform } from "./social-platform.entity"
import { FeedItem } from "./feed-item.entity"

export enum FeedSourceStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ERROR = "error",
  RATE_LIMITED = "rate_limited",
}

@Entity("feed_sources")
export class FeedSource {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  userId: string // Reference to your user entity

  @Column()
  platformId: string

  @ManyToOne(
    () => SocialPlatform,
    (platform) => platform.feedSources,
  )
  @JoinColumn({ name: "platformId" })
  platform: SocialPlatform

  @Column()
  accountHandle: string // @username, page name, etc.

  @Column()
  accountId: string // Platform-specific account ID

  @Column({ nullable: true })
  displayName: string

  @Column({ nullable: true })
  avatarUrl: string

  @Column("json", { nullable: true })
  authTokens: {
    accessToken?: string
    refreshToken?: string
    expiresAt?: Date
  }

  @Column({
    type: "enum",
    enum: FeedSourceStatus,
    default: FeedSourceStatus.ACTIVE,
  })
  status: FeedSourceStatus

  @Column({ nullable: true })
  lastSyncAt: Date

  @Column({ nullable: true })
  lastErrorMessage: string

  @Column({ default: 0 })
  totalItemsCount: number

  @Column("json", { default: {} })
  syncSettings: {
    enabled: boolean
    syncInterval: number // minutes
    maxItemsPerSync: number
    includeReplies: boolean
    includeRetweets: boolean
  }

  @OneToMany(
    () => FeedItem,
    (feedItem) => feedItem.source,
  )
  feedItems: FeedItem[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
