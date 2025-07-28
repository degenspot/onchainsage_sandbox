import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("whale_transactions")
@Index(["blockchain", "timestamp"])
@Index(["fromAddress"])
@Index(["toAddress"])
@Index(["assetSymbol"])
@Index(["amountUSD"])
@Index(["isWhaleTransaction"])
export class WhaleTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  transactionHash: string

  @Column()
  blockchain: string // e.g., "ethereum", "polygon", "binance-smart-chain"

  @Column()
  fromAddress: string

  @Column()
  toAddress: string

  @Column()
  assetSymbol: string // e.g., "ETH", "USDT", "BTC"

  @Column("decimal", { precision: 20, scale: 8 })
  amount: number // Native token amount

  @Column("decimal", { precision: 20, scale: 8 })
  amountUSD: number // USD value of the transaction

  @Column({ default: false })
  isWhaleTransaction: boolean // Flag if it meets whale criteria

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any> // Additional transaction details

  @CreateDateColumn()
  timestamp: Date
}
