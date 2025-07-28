import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("social_sentiments")
@Index(["assetSymbol", "timestamp"])
@Index(["source", "timestamp"])
export class SocialSentiment {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  assetSymbol: string // e.g., "BTC", "ETH"

  @Column("decimal", { precision: 5, scale: 2 })
  sentimentScore: number // -1 (very negative) to 1 (very positive)

  @Column({ nullable: true })
  source: string // e.g., "twitter", "reddit", "news"

  @Column("text", { nullable: true })
  summary: string

  @CreateDateColumn()
  timestamp: Date
}
