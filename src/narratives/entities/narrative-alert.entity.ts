import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

export enum NarrativeAlertType {
  NEW_EMERGING_NARRATIVE = "new_emerging_narrative",
  NARRATIVE_TRENDING_UP = "narrative_trending_up",
  NARRATIVE_TRENDING_DOWN = "narrative_trending_down",
  SIGNIFICANT_SENTIMENT_SHIFT = "significant_sentiment_shift",
  TOKEN_ASSOCIATION_CHANGE = "token_association_change",
}

export enum NarrativeAlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

@Entity("narrative_alerts")
@Index(["type", "severity"])
@Index(["narrativeName"])
@Index(["createdAt"])
export class NarrativeAlert {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({
    type: "enum",
    enum: NarrativeAlertType,
  })
  type: NarrativeAlertType

  @Column({
    type: "enum",
    enum: NarrativeAlertSeverity,
  })
  severity: NarrativeAlertSeverity

  @Column()
  @Index()
  narrativeName: string

  @Column()
  title: string

  @Column("text")
  description: string

  @Column("jsonb")
  data: Record<string, any> // Contextual data for the alert

  @Column({ default: false })
  isRead: boolean

  @CreateDateColumn()
  createdAt: Date
}
