import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm"
import { ArbitrageAlert } from "./arbitrage-alert.entity"
import { ArbitrageEvent } from "./arbitrage-event.entity"

@Entity("arbitrage_opportunities")
@Index(["tokenPair", "chain1", "dex1", "chain2", "dex2"])
@Index(["detectedAt"])
@Index(["isActive"])
export class ArbitrageOpportunity {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  tokenPair: string // e.g., "ETH/USDC"

  @Column()
  chain1: string // e.g., "ethereum"

  @Column()
  dex1: string // e.g., "uniswap_v3"

  @Column("decimal", { precision: 20, scale: 8 })
  price1: number

  @Column()
  chain2: string // e.g., "polygon"

  @Column()
  dex2: string // e.g., "quickswap"

  @Column("decimal", { precision: 20, scale: 8 })
  price2: number

  @Column("decimal", { precision: 5, scale: 2 })
  priceDifferencePercentage: number // e.g., 0.5 for 0.5%

  @Column("decimal", { precision: 20, scale: 8, nullable: true })
  potentialProfitUSD: number

  @Column({ default: true })
  isActive: boolean // True if opportunity is still considered active/open

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any>

  @OneToMany(
    () => ArbitrageAlert,
    (alert) => alert.opportunity,
  )
  alerts: ArbitrageAlert[]

  @OneToMany(
    () => ArbitrageEvent,
    (event) => event.opportunity,
  )
  events: ArbitrageEvent[]

  @CreateDateColumn()
  detectedAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
