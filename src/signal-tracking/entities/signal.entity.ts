import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SignalType, SignalStatus, TradingPair } from '../../../shared/enums/signal.enums';
import { SignalPerformance } from './signal-performance.entity';

@Entity('signals')
export class Signal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SignalType })
  type: SignalType;

  @Column({ type: 'enum', enum: TradingPair })
  tradingPair: TradingPair;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  entryPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  exitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  stopLoss: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  takeProfit: number;

  @Column({ type: 'enum', enum: SignalStatus, default: SignalStatus.ACTIVE })
  status: SignalStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  confidenceScore: number;

  @Column({ type: 'text', nullable: true })
  analysis: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @OneToMany(() => SignalPerformance, performance => performance.signal)
  performances: SignalPerformance[];
}