import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

export enum AlertType {
  HIGH_IMPACT_PROPOSAL = "high_impact_proposal",
  LARGE_VOTE = "large_vote",
  CLOSE_VOTE = "close_vote",
  UNUSUAL_ACTIVITY = "unusual_activity",
  SENTIMENT_SHIFT = "sentiment_shift",
}

export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

@Entity("governance_alerts")
@Index(["type", "severity"])
@Index(["protocol"])
@Index(["createdAt"])
export class GovernanceAlert {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({
    type: "enum",
    enum: AlertType,
  })
  type: AlertType

  @Column({
    type: "enum",
    enum: AlertSeverity,
  })
  severity: AlertSeverity

  @Column()
  @Index()
  protocol: string

  @Column()
  title: string

  @Column("text")
  description: string

  @Column("jsonb")
  data: Record<string, any>

  @Column({ default: false })
  isRead: boolean

  @CreateDateColumn()
  createdAt: Date
}
