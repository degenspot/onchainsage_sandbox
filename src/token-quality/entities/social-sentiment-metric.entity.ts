import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

export enum SocialSource {
  TWITTER = "twitter",
  REDDIT = "reddit",
  TELEGRAM = "telegram",
  FORUM = "forum",
}

@Entity("social_sentiment_metrics")
@Index(["tokenSymbol", "timestamp"])
@Index(["source", "timestamp"])
export class SocialSentimentMetric {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  tokenSymbol: string

  @Column("decimal", { precision: 5, scale: 2 })
  sentimentScore: number // -1 (very negative) to 1 (very positive)

  @Column("int")
  mentionCount: number // Number of mentions in the period

  @Column({ type: "enum", enum: SocialSource })
  source: SocialSource

  @CreateDateColumn()
  timestamp: Date
}
