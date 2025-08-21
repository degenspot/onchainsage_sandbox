import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('token_risk_assessments')
@Index(['tokenAddress', 'timestamp'])
export class TokenRiskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tokenAddress: string;

  @Column('decimal', { precision: 5, scale: 2 })
  overallRiskScore: number;

  @Column()
  riskLevel: string;

  @Column('json')
  riskFactors: any;

  @Column('json')
  anomalies: string[];

  @Column('text')
  recommendation: string;

  @Column('decimal', { precision: 3, scale: 2 })
  confidence: number;

  @CreateDateColumn()
  timestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('token_metrics_history')
@Index(['tokenAddress', 'timestamp'])
export class TokenMetricsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tokenAddress: string;

  @Column('decimal', { precision: 18, scale: 8 })
  liquidity: number;

  @Column('decimal', { precision: 18, scale: 8 })
  volume24h: number;

  @Column('decimal', { precision: 10, scale: 4 })
  priceChange24h: number;

  @Column('int')
  holderCount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  topHolderPercentage: number;

  @Column('int')
  contractAge: number;

  @Column('int')
  transactionCount: number;

  @CreateDateColumn()
  timestamp: Date;
}
