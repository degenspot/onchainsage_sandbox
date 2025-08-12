import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm"
import { Blockchain } from "./blockchain.entity"
import { TokenAnalytics } from "./token-analytics.entity"
import { TokenTransaction } from "./token-transaction.entity"
import { TokenHolder } from "./token-holder.entity"

@Entity("tokens")
@Index(["blockchain", "contractAddress"], { unique: true })
export class Token {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  name: string

  @Column()
  symbol: string

  @Column()
  contractAddress: string

  @Column({ type: "int", default: 18 })
  decimals: number

  @Column({ type: "text", nullable: true })
  description: string

  @Column({ nullable: true })
  logoUrl: string

  @Column({ nullable: true })
  websiteUrl: string

  @Column({ type: "bigint", default: 0 })
  totalSupply: string

  @Column({ type: "bigint", default: 0 })
  circulatingSupply: string

  @ManyToOne(
    () => Blockchain,
    (blockchain) => blockchain.tokens,
  )
  blockchain: Blockchain

  @OneToMany(
    () => TokenAnalytics,
    (analytics) => analytics.token,
  )
  analytics: TokenAnalytics[]

  @OneToMany(
    () => TokenTransaction,
    (transaction) => transaction.token,
  )
  transactions: TokenTransaction[]

  @OneToMany(
    () => TokenHolder,
    (holder) => holder.token,
  )
  holders: TokenHolder[]

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
