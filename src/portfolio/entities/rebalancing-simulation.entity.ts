import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import { UserPortfolio } from "./user-portfolio.entity"
import type { RebalancingAction } from "./rebalancing-suggestion.entity"

@Entity("rebalancing_simulations")
@Index(["portfolio", "simulatedAt"])
export class RebalancingSimulation {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("jsonb")
  initialPortfolioState: Record<string, any> // Snapshot of portfolio before simulation

  @Column("jsonb")
  simulatedActions: RebalancingAction[] // Actions applied in the simulation

  @Column("jsonb")
  finalPortfolioState: Record<string, any> // Portfolio state after simulation

  @Column("decimal", { precision: 20, scale: 8 })
  projectedProfitLossUSD: number // Projected P&L from the rebalance itself (e.g., fees, slippage)

  @Column("decimal", { precision: 5, scale: 2 })
  projectedTargetDeviation: number // How close to target allocation after rebalance

  @Column("text", { nullable: true })
  notes: string

  @ManyToOne(
    () => UserPortfolio,
    (portfolio) => portfolio.simulations,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "portfolioId" })
  portfolio: UserPortfolio

  @Column()
  portfolioId: string

  @CreateDateColumn()
  simulatedAt: Date
}
