import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { WalletHealth } from './wallet-health.entity';
import { RiskAlert } from './risk-alert.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  address: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  ensName?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => WalletHealth, (health) => health.wallet)
  healthHistory: WalletHealth[];

  @OneToMany(() => RiskAlert, (alert) => alert.wallet)
  riskAlerts: RiskAlert[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}