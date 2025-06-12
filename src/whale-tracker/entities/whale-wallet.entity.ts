import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { WhaleTransaction } from './whale-transaction.entity';

@Entity('whale_wallets')
export class WhaleWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  address: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  balance: number;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  totalVolume: number;

  @Column({ type: 'int', default: 0 })
  transactionCount: number;

  @Column({ type: 'float', default: 0 })
  impactScore: number;

  @Column({ type: 'json', nullable: true })
  labels: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastActivity: Date;

  @OneToMany(() => WhaleTransaction, transaction => transaction.wallet)
  transactions: WhaleTransaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
