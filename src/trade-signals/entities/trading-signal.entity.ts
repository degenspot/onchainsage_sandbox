import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('signal_parameters')
export class SignalParametersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('json')
  weights: any;

  @Column('json')
  thresholds: any;

  @Column('json')
  filters: any;

  @Column()
  timeframe: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('trading_signals')
@Index(['tokenAddress', 'timestamp'])
@Index(['signal', 'timestamp'])
export class TradingSignalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tokenAddress: string;

  @Column()
  tokenSymbol: string;

  @Column()
  signal: string;

  @Column('decimal', { precision: 5, scale: 2 })
  confidence: number;

  @Column('decimal', { precision: 18, scale: 8 })
  price: number;

  @Column('decimal', { precision: 5, scale: 2 })
  strength: number;

  @Column('json')
  components: any;

  @Column('json')
  reasoning: string[];

  @Column()
  parametersId: string;

  @Column()
  timestamp: Date;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('social_sentiment')
@Index(['tokenAddress', 'timestamp'])
export class SocialSentimentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tokenAddress: string;

  @Column()
  platform: string;

  @Column('decimal', { precision: 3, scale: 2 })
  sentiment: number;

  @Column('int')
  volume: number;

  @Column('decimal', { precision: 5, scale: 2 })
  influencerScore: number;

  @Column()
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('backtest_results')
export class BacktestResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parameterSetId: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column('int')
  totalTrades: number;

  @Column('decimal', { precision: 5, scale: 2 })
  winRate: number;

  @Column('decimal', { precision: 8, scale: 4 })
  totalReturn: number;

  @Column('decimal', { precision: 5, scale: 2 })
  maxDrawdown: number;

  @Column('decimal', { precision: 6, scale: 4 })
  sharpeRatio: number;

  @Column('decimal', { precision: 8, scale: 2 })
  avgHoldingTime: number;

  @Column('json')
  trades: any;

  @CreateDateColumn()
  createdAt: Date;
}