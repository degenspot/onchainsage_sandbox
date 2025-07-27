import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('correlation_analysis')
@Index(['tokenSymbol', 'identifier', 'analysisDate'])
export class CorrelationAnalysisEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  tokenSymbol: string;

  @Column({ type: 'varchar', length: 100 })
  identifier: string;

  @Column({ type: 'enum', enum: ['hashtag', 'topic'] })
  narrativeType: 'hashtag' | 'topic';

  @Column({ type: 'date' })
  analysisDate: Date;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 8, scale: 6 })
  pearsonCorrelation: number;

  @Column({ type: 'decimal', precision: 8, scale: 6 })
  spearmanCorrelation: number;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  pValue: number;

  @Column({ type: 'decimal', precision: 8, scale: 6 })
  confidenceIntervalLower: number;

  @Column({ type: 'decimal', precision: 8, scale: 6 })
  confidenceIntervalUpper: number;

  @Column({ type: 'enum', enum: ['very_weak', 'weak', 'moderate', 'strong', 'very_strong'] })
  strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';

  @Column({ type: 'int' })
  totalMentions: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  averageSentiment: number;

  @Column({ type: 'timestamp' })
  peakInfluenceDate: Date;

  @Column({ type: 'varchar', length: 5 })
  interval: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
