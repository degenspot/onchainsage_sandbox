import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import { ArbitrageOpportunity } from "./arbitrage-opportunity.entity"

export enum ArbitrageEventStatus {
  EXECUTED = "executed",
  FAILED = "failed",
  SIMULATED = "simulated",
  EXPIRED = "expired",
}

@Entity("arbitrage_events")
@Index(["opportunity", "executedAt"])
@Index(["tokenPair"])
@Index(["executedProfitUSD"])
export class ArbitrageEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  tokenPair: string // e.g., "ETH/USDC"

  @Column()
  chain1: string

  @Column()
  dex1: string

  @Column()
  chain2: string

  @Column()
  dex2: string

  @Column("decimal", { precision: 20, scale: 8 })
  executedProfitUSD: number

  @Column({
    type: "enum",
    enum: ArbitrageEventStatus,
    default: ArbitrageEventStatus.SIMULATED,
  })
  status: ArbitrageEventStatus

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any>

  @ManyToOne(
    () => ArbitrageOpportunity,
    (opportunity) => opportunity.events,
    { onDelete: "SET NULL", nullable: true },
  )
  @JoinColumn({ name: "opportunityId" })
  opportunity: ArbitrageOpportunity

  @Column({ nullable: true })
  opportunityId: string

  @CreateDateColumn()
  executedAt: Date
}
