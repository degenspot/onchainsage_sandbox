import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

export enum NarrativeStatus {
  EMERGING = "emerging",
  TRENDING = "trending",
  DECLINING = "declining",
  STABLE = "stable",
}

@Entity("narratives")
@Index(["name", "protocol"])
@Index(["trendScore"])
@Index(["lastDetectedAt"])
export class Narrative {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  @Index()
  name: string

  @Column("text", { nullable: true })
  description: string

  @Column("simple-array", { nullable: true })
  associatedTokens: string[]

  @Column("simple-array", { nullable: true })
  keywords: string[]

  @Column("decimal", { precision: 5, scale: 2, default: 0 })
  sentimentScore: number // Average sentiment of related content (-1 to 1)

  @Column("decimal", { precision: 10, scale: 4, default: 0 })
  trendScore: number // Score indicating how much it's trending

  @Column({
    type: "enum",
    enum: NarrativeStatus,
    default: NarrativeStatus.EMERGING,
  })
  status: NarrativeStatus

  @Column("jsonb", { nullable: true })
  predictionData: Record<string, any> // ML model prediction data

  @Column("timestamp")
  lastDetectedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
