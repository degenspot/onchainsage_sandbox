import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { FeedSource } from "./feed-source.entity"

@Entity("social_platforms")
export class SocialPlatform {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  name: string

  @Column()
  displayName: string

  @Column({ nullable: true })
  description: string

  @Column()
  apiBaseUrl: string

  @Column({ default: true })
  isActive: boolean

  @Column("json", { nullable: true })
  authConfig: {
    clientId?: string
    clientSecret?: string
    scopes?: string[]
    authUrl?: string
    tokenUrl?: string
  }

  @Column("json", { nullable: true })
  rateLimit: {
    requestsPerHour: number
    requestsPerDay: number
  }

  @OneToMany(
    () => FeedSource,
    (feedSource) => feedSource.platform,
  )
  feedSources: FeedSource[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
