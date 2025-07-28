import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("tokens")
export class Token {
  @PrimaryColumn()
  symbol: string // e.g., "BTC", "ETH", "SOL"

  @Column()
  name: string // e.g., "Bitcoin", "Ethereum", "Solana"

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  currentQualityScore: number // Composite score from 0 to 100

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
