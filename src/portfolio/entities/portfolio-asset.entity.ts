import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm"
import { UserPortfolio } from "./user-portfolio.entity"

@Entity("portfolio_assets")
@Index(["portfolio", "symbol"])
@Index(["symbol"])
export class PortfolioAsset {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  symbol: string // e.g., "BTC", "ETH", "USDC"

  @Column("decimal", { precision: 20, scale: 8 })
  quantity: number

  @Column("decimal", { precision: 20, scale: 8 })
  currentPriceUSD: number

  @Column("decimal", { precision: 20, scale: 8 })
  valueUSD: number

  @Column("decimal", { precision: 20, scale: 8, nullable: true })
  averageCostUSD: number

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  profitLossPercentage: number

  @ManyToOne(
    () => UserPortfolio,
    (portfolio) => portfolio.assets,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "portfolioId" })
  portfolio: UserPortfolio

  @Column()
  portfolioId: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
