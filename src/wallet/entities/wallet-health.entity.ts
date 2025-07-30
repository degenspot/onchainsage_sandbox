import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Wallet } from './wallet.entity';

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('wallet_health')
export class WalletHealth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  walletId: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.healthHistory)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column('decimal', { precision: 5, scale: 2 })
  overallScore: number; // 0-100

  @Column('decimal', { precision: 5, scale: 2 })
  exposureScore: number;

  @Column('decimal', { precision: 5, scale: 2 })
  diversificationScore: number;

  @Column('decimal', { precision: 5, scale: 2 })
  liquidityScore: number;

  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.LOW
  })
  riskLevel: RiskLevel;

  @Column('decimal', { precision: 18, scale: 8 })
  totalValue: number;

  @Column('json')
  tokenBreakdown: {
    symbol: string;
    balance: string;
    value: number;
    percentage: number;
    riskScore: number;
    isSuspicious: boolean;
  }[];

  @Column('json')
  recommendations: {
    type: string;
    severity: string;
    message: string;
    action: string;
  }[];

  @CreateDateColumn()
  timestamp: Date;
}