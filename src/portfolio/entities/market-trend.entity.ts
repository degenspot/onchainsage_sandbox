import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

export enum TrendType {
  BULLISH = "bullish",
  BEARISH = "bearish",
  NEUTRAL = "neutral",
}

@Entity("market_trends")
@Index(["assetSymbol", "timestamp"])
@Index(["sector", "timestamp"])
export class MarketTrend {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ nullable: true })
  assetSymbol: string // e.g., "BTC", "ETH"

  @Column({ nullable: true })
  sector: string // e.g., "DeFi", "NFTs", "Layer1"

  @Column({
    type: "enum",
    enum: TrendType,
  })
  trendType: TrendType

  @Column("decimal", { precision: 5, scale: 2 })
  strength: number // e.g., 0.8 for strong bullish, -0.7 for strong bearish

  @Column("text", { nullable: true })
  description: string

  @CreateDateColumn()
  timestamp: Date
}
