import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from "typeorm"
import { Token } from "./token.entity"

@Entity("token_analytics")
@Index(["token", "timestamp"])
export class TokenAnalytics {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(
    () => Token,
    (token) => token.analytics,
  )
  token: Token

  @Column({ type: "decimal", precision: 20, scale: 8, default: 0 })
  price: string

  @Column({ type: "decimal", precision: 20, scale: 8, default: 0 })
  volume24h: string

  @Column({ type: "decimal", precision: 20, scale: 8, default: 0 })
  marketCap: string

  @Column({ type: "decimal", precision: 20, scale: 8, default: 0 })
  liquidity: string

  @Column({ type: "int", default: 0 })
  holderCount: number

  @Column({ type: "decimal", precision: 10, scale: 4, default: 0 })
  priceChange24h: string

  @Column({ type: "decimal", precision: 10, scale: 4, default: 0 })
  volumeChange24h: string

  @Column({ type: "timestamp" })
  timestamp: Date

  @CreateDateColumn()
  createdAt: Date
}
