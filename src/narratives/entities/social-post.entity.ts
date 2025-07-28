import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

export enum SocialPlatform {
  TWITTER = "twitter",
  REDDIT = "reddit",
  FORUM = "forum",
  OTHER = "other",
}

@Entity("social_posts")
@Index(["platform", "authorId"])
@Index(["timestamp"])
@Index(["sentimentScore"])
export class SocialPost {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  @Index()
  externalId: string // e.g., tweet ID, Reddit post ID

  @Column()
  @Index()
  authorId: string

  @Column("text")
  content: string

  @Column({
    type: "enum",
    enum: SocialPlatform,
  })
  platform: SocialPlatform

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  sentimentScore: number

  @Column("simple-array", { nullable: true })
  detectedNarratives: string[] // Names of narratives detected in this post

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any> // e.g., likes, retweets, comments

  @Column("timestamp")
  timestamp: Date

  @CreateDateColumn()
  createdAt: Date
}
