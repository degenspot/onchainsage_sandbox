import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"
import { Token } from "./token.entity"

@Entity("token_holders")
@Index(["token", "address"], { unique: true })
export class TokenHolder {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(
    () => Token,
    (token) => token.holders,
  )
  token: Token

  @Column()
  address: string

  @Column({ type: "decimal", precision: 30, scale: 18 })
  balance: string

  @Column({ type: "decimal", precision: 10, scale: 6, default: 0 })
  percentage: string

  @Column({ type: "timestamp", nullable: true })
  firstTransactionAt: Date

  @Column({ type: "timestamp", nullable: true })
  lastTransactionAt: Date

  @Column({ type: "int", default: 0 })
  transactionCount: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
