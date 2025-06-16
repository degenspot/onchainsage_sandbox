import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Strategy } from './strategy.entity';

@Entity('backtest_results')
export class BacktestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('date')
  startDate: Date;

  @Column('date')
  endDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  initialCapital: number;

  @Column('decimal', { precision: 15, scale: 2 })
  finalValue: number;

  @Column('decimal', { precision: 5, scale: 4 })
  totalReturn: number;

  @Column('decimal', { precision: 5, scale: 4 })
  annualizedReturn: number;

  @Column('decimal', { precision: 5, scale: 4 })
  volatility: number;

  @Column('decimal', { precision: 5, scale: 4 })
  sharpeRatio: number;

  @Column('decimal', { precision: 5, scale: 4 })
  maxDrawdown: number;

  @Column('int')
  totalTrades: number;

  @Column('decimal', { precision: 5, scale: 4 })
  winRate: number;

  @Column('jsonb')
  tradeHistory: any[];

  @Column('jsonb')
  performanceMetrics: Record<string, any>;

  @ManyToOne(() => Strategy, strategy => strategy.backtestResults)
  strategy: Strategy;

  @CreateDateColumn()
  createdAt: Date;
}