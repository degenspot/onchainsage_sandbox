import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("token_quality_scores")
@Index(["tokenSymbol", "timestamp"])
export class TokenQualityScore {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  tokenSymbol: string

  @Column("decimal", { precision: 5, scale: 2 })
  score: number // Composite quality score (0-100)

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  onChainScore: number // Sub-score for on-chain metrics

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  socialScore: number // Sub-score for social sentiment

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  devScore: number // Sub-score for developer activity

  @CreateDateColumn()
  timestamp: Date
}
