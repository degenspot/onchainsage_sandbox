import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from "typeorm"
import { FeedSource } from "./feed-source.entity"

export enum FeedItemType {
  POST = "post",
  RETWEET = "retweet",
  REPLY = "reply",
  STORY = "story",
  VIDEO = "video",
  IMAGE = "image",
  ARTICLE = "article",
}

export enum FeedItemStatus {
  ACTIVE = "active",
  HIDDEN = "hidden",
  DELETED = "deleted",
  FLAGGED = "flagged",
}

@Entity("feed_items")
@Index(["sourceId", "publishedAt"])
@Index(["userId", "publishedAt"])
@Index(["platformItemId", "sourceId"], { unique: true })
export class FeedItem {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  userId: string // Reference to your user entity

  @Column()
  sourceId: string

  @ManyToOne(
    () => FeedSource,
    (source) => source.feedItems,
  )
  @JoinColumn({ name: "sourceId" })
  source: FeedSource

  @Column()
  platformItemId: string // Original ID from the platform

  @Column({
    type: "enum",
    enum: FeedItemType,
    default: FeedItemType.POST,
  })
  type: FeedItemType

  @Column("text")
  content: string

  @Column({ nullable: true })
  title: string

  @Column("text", { nullable: true })
  excerpt: string

  @Column()
  authorHandle: string

  @Column()
  authorName: string

  @Column({ nullable: true })
  authorAvatarUrl: string

  @Column("json", { nullable: true })
  media: {
    type: "image" | "video" | "gif"
    url: string
    thumbnailUrl?: string
    width?: number
    height?: number
    duration?: number
  }[]

  @Column("json", { nullable: true })
  links: {
    url: string
    title?: string
    description?: string
    imageUrl?: string
  }[]

  @Column({ nullable: true })
  originalUrl: string

  @Column()
  publishedAt: Date

  @Column({ default: 0 })
  likesCount: number

  @Column({ default: 0 })
  sharesCount: number

  @Column({ default: 0 })
  commentsCount: number

  @Column({ default: 0 })
  viewsCount: number

  @Column("json", { nullable: true })
  hashtags: string[]

  @Column("json", { nullable: true })
  mentions: string[]

  @Column({
    type: "enum",
    enum: FeedItemStatus,
    default: FeedItemStatus.ACTIVE,
  })
  status: FeedItemStatus

  @Column("json", { nullable: true })
  rawData: any // Store original platform data

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
