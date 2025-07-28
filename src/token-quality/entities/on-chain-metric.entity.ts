import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("on_chain_metrics")
@Index(["tokenSymbol", "timestamp"])
export class OnChainMetric {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  tokenSymbol: string

  @Column("decimal", { precision: 20, scale: 8 })
  volume24h: number // 24-hour trading volume

  @Column("bigint")
  activeHolders: string // Number of active unique addresses holding the token

  @Column("decimal", { precision: 20, scale: 8 })
  liquidity: number // Total liquidity in major DEXs/CEXs

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  priceUsd: number // Price at the time of metric collection

  @CreateDateColumn()
  timestamp: Date
}
