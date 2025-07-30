import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Wallet } from './wallet.entity';

export enum AlertType {
  HIGH_RISK_TOKEN = 'high_risk_token',
  LARGE_EXPOSURE = 'large_exposure',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  LIQUIDITY_RISK = 'liquidity_risk',
  CONCENTRATION_RISK = 'concentration_risk'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('risk_alerts')
export class RiskAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  walletId: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.riskAlerts)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column({
    type: 'enum',
    enum: AlertType
  })
  type: AlertType;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: RiskLevel
  })
  severity: RiskLevel;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isResolved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}