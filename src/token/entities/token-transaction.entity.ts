import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from "typeorm"
import { Token } from "./token.entity"

@Entity("token_transactions")
@Index(["token", "timestamp"])
@Index(["transactionHash"], { unique: true })
export class TokenTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(
    () => Token,
    (token) => token.transactions,
  )
  token: Token

  @Column()
  transactionHash: string

  @Column()
  fromAddress: string

  @Column()
  toAddress: string

  @Column({ type: "decimal", precision: 30, scale: 18 })
  amount: string

  @Column({ type: "decimal", precision: 20, scale: 8, nullable: true })
  valueUsd: string

  @Column()
  type: string // 'transfer', 'mint', 'burn', 'swap'

  @Column({ type: "bigint" })
  blockNumber: string

  @Column({ type: "timestamp" })
  timestamp: Date

  @Column({ type: "decimal", precision: 20, scale: 8, default: 0 })
  gasUsed: string

  @Column({ type: "decimal", precision: 20, scale: 8, default: 0 })
  gasPrice: string

  @CreateDateColumn()
  createdAt: Date
}
