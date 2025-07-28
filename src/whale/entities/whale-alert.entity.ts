import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

export enum WhaleAlertType {
  LARGE_TRANSFER = "large_transfer",
  LIQUIDITY_SHIFT = "liquidity_shift",
  UNUSUAL_ACTIVITY = "unusual_activity",
  WHALE_DEPOSIT_CEX = "whale_deposit_cex",
  WHALE_WITHDRAW_CEX = "whale_withdraw_cex",
}

export enum WhaleAlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

@Entity("whale_alerts")
@Index(["type", "severity"])
@Index(["blockchain"])
@Index(["isRead"])
@Index(["createdAt"])
export class WhaleAlert {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({
    type: "enum",
    enum: WhaleAlertType,
  })
  type: WhaleAlertType

  @Column({
    type: "enum",
    enum: WhaleAlertSeverity,
  })
  severity: WhaleAlertSeverity

  @Column()
  blockchain: string

  @Column()
  title: string

  @Column("text")
  description: string

  @Column("jsonb")
  data: Record<string, any> // Contains relevant transaction/event data

  @Column({ default: false })
  isRead: boolean

  @CreateDateColumn()
  createdAt: Date
}
