import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm"
import { PortfolioAsset } from "./portfolio-asset.entity"
import { RebalancingSuggestion } from "./rebalancing-suggestion.entity"
import { RebalancingSimulation } from "./rebalancing-simulation.entity"

export enum RiskProfile {
  CONSERVATIVE = "conservative",
  MODERATE = "moderate",
  AGGRESSIVE = "aggressive",
}

@Entity("user_portfolios")
@Index(["userId"])
@Index(["lastSyncedAt"])
export class UserPortfolio {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  userId: string // User ID from your authentication system

  @Column({ nullable: true })
  walletAddress: string // Primary wallet address for tracking

  @Column({
    type: "enum",
    enum: RiskProfile,
    default: RiskProfile.MODERATE,
  })
  riskProfile: RiskProfile

  @Column("jsonb", { nullable: true })
  targetAllocation: Record<string, number> // e.g., { "BTC": 0.5, "ETH": 0.3, "USDC": 0.2 }

  @Column("decimal", { precision: 20, scale: 8, default: 0 })
  totalValueUSD: number

  @Column("decimal", { precision: 20, scale: 8, default: 0 })
  totalProfitLossUSD: number

  @Column("decimal", { precision: 5, scale: 2, default: 0 })
  dailyProfitLossPercentage: number

  @Column({ default: false })
  autoRebalanceEnabled: boolean

  @Column({ nullable: true })
  lastSyncedAt: Date

  @OneToMany(
    () => PortfolioAsset,
    (asset) => asset.portfolio,
  )
  assets: PortfolioAsset[]

  @OneToMany(
    () => RebalancingSuggestion,
    (suggestion) => suggestion.portfolio,
  )
  suggestions: RebalancingSuggestion[]

  @OneToMany(
    () => RebalancingSimulation,
    (simulation) => simulation.portfolio,
  )
  simulations: RebalancingSimulation[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
