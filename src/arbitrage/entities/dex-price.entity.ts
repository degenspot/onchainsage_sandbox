import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("dex_prices")
@Index(["tokenSymbol", "chain", "dex"])
@Index(["timestamp"])
export class DexPrice {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  tokenSymbol: string // e.g., "ETH", "USDC"

  @Column()
  chain: string // e.g., "ethereum", "polygon"

  @Column()
  dex: string // e.g., "uniswap_v3", "quickswap"

  @Column("decimal", { precision: 20, scale: 8 })
  price: number

  @Column("decimal", { precision: 20, scale: 8, nullable: true })
  liquidity: number // Optional: depth of the market

  @CreateDateColumn()
  timestamp: Date
}
