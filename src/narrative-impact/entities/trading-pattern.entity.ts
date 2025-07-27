import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('trading_patterns')
@Index(['tokenSymbol', 'patternType', 'detectedDate'])
export class TradingPatternEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  tokenSymbol: string;

  @Column({ type: 'varchar', length: 100 })
  identifier: string;

  @Column({ type: 'enum', enum: ['price_spike_after_sentiment', 'price_drop_before_mentions', 'volume_correlation'] })
  patternType: 'price_spike_after_sentiment' | 'price_drop_before_mentions' | 'volume_correlation';

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  confidence: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  avgTimeDelay: number; // in hours

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  avgPriceImpact: number; // percentage

  @Column({ type: 'int' })
  occurrences: number;

  @Column({ type: 'date' })
  detectedDate: Date;

  @Column({ type: 'timestamp' })
  analysisStartDate: Date;

  @Column({ type: 'timestamp' })
  analysisEndDate: Date;

  @Column({ type: 'varchar', length: 5 })
  interval: string;

  @Column({ type: 'json', nullable: true })
  additionalMetrics: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}