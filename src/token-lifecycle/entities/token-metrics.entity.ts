import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

@Entity('token_metrics')
export class TokenMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tokenId: string;

  @ManyToOne(() => Token, token => token.metrics)
  @JoinColumn({ name: 'tokenId' })
  token: Token;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  price: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  volume: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  marketCap: number;

  @Column({ type: 'int' })
  holders: number;

  @Column({ type: 'int' })
  transactions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  volatility: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  liquidityScore: number;

  @Column({ type: 'int' })
  socialMentions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  sentimentScore: number;

  @Column({ type: 'int' })
  githubActivity: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}