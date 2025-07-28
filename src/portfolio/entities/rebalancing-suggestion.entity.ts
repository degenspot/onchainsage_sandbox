import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import { UserPortfolio } from "./user-portfolio.entity"

export enum SuggestionStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

export enum RebalancingActionType {
  BUY = "buy",
  SELL = "sell",
}

export interface RebalancingAction {
  type: RebalancingActionType
  symbol: string
  amountUSD: number // Amount in USD to buy/sell
  quantity?: number // Calculated quantity based on current price
  reason: string
}

@Entity("rebalancing_suggestions")
@Index(["portfolio", "suggestedAt"])
@Index(["status"])
export class RebalancingSuggestion {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("jsonb")
  actions: RebalancingAction[]

  @Column("decimal", { precision: 20, scale: 8 })
  estimatedImpactUSD: number // Estimated change in portfolio value or alignment

  @Column("text")
  reasoning: string // Detailed explanation for the suggestion

  @Column({
    type: "enum",
    enum: SuggestionStatus,
    default: SuggestionStatus.PENDING,
  })
  status: SuggestionStatus

  @Column({ nullable: true })
  acceptedAt: Date

  @ManyToOne(
    () => UserPortfolio,
    (portfolio) => portfolio.suggestions,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "portfolioId" })
  portfolio: UserPortfolio

  @Column()
  portfolioId: string

  @CreateDateColumn()
  suggestedAt: Date
}
