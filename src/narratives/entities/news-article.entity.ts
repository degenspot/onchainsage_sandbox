import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("news_articles")
@Index(["source", "publishedAt"])
@Index(["sentimentScore"])
export class NewsArticle {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  @Index()
  externalId: string // e.g., article ID from news API

  @Column()
  title: string

  @Column("text")
  content: string

  @Column({ nullable: true })
  url: string

  @Column({ nullable: true })
  source: string

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  sentimentScore: number

  @Column("simple-array", { nullable: true })
  detectedNarratives: string[] // Names of narratives detected in this article

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any> // e.g., categories, tags

  @Column("timestamp")
  publishedAt: Date

  @CreateDateColumn()
  createdAt: Date
}
