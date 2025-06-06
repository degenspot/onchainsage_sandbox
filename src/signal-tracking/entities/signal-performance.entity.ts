import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Signal } from './signal.entity';

@Entity('signal_performances')
@Index(['signalId', 'calculatedAt'])
export class SignalPerformance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Signal, signal => signal.performances)
  signal: Signal;

  @Column()
  signalId: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  realizedPnl: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  realizedPnlPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  unrealizedPnl: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  unrealizedPnlPercentage: number;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  accuracyScore: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maxDrawdown: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maxRunup: number;

  @Column({ type: 'boolean', default: false })
  isWinning: boolean;

  @CreateDateColumn()
  calculatedAt: Date;

  @Column({ type: 'json', nullable: true })
  metrics: Record<string, any>;
}