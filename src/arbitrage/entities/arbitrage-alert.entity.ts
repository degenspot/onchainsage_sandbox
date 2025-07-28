import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import { ArbitrageOpportunity } from "./arbitrage-opportunity.entity"

export enum ArbitrageAlertType {
  PRICE_DISCREPANCY = "price_discrepancy",
  HIGH_PROFIT_OPPORTUNITY = "high_profit_opportunity",
  OPPORTUNITY_EXPIRED = "opportunity_expired",
}

export enum ArbitrageAlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

@Entity("arbitrage_alerts")
@Index(["type", "severity"])
@Index(["createdAt"])
@Index(["isRead"])
export class ArbitrageAlert {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({
    type: "enum",
    enum: ArbitrageAlertType,
  })
  type: ArbitrageAlertType

  @Column({
    type: "enum",
    enum: ArbitrageAlertSeverity,
  })
  severity: ArbitrageAlertSeverity

  @Column()
  title: string

  @Column("text")
  description: string

  @Column("jsonb")
  data: Record<string, any>

  @Column({ default: false })
  isRead: boolean

  @ManyToOne(
    () => ArbitrageOpportunity,
    (opportunity) => opportunity.alerts,
    { onDelete: "SET NULL", nullable: true },
  )
  @JoinColumn({ name: "opportunityId" })
  opportunity: ArbitrageOpportunity

  @Column({ nullable: true })
  opportunityId: string

  @CreateDateColumn()
  createdAt: Date
}
