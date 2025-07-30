import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PredictionMarket } from './prediction-market.entity';

export enum OutcomeType {
  YES = 'yes',
  NO = 'no',
  CUSTOM = 'custom',
}

@Entity('market_outcomes')
@Index(['marketId', 'outcomeType'])
@Index(['isCorrect'])
export class MarketOutcome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  marketId: string;

  @Column({
    type: 'enum',
    enum: OutcomeType,
  })
  outcomeType: OutcomeType;

  @Column()
  description: string; // Human-readable description of the outcome

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  totalStaked: number; // Total amount staked on this outcome

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  percentageStaked: number; // Percentage of total market stake

  @Column({ default: false })
  isCorrect: boolean; // Whether this outcome was correct

  @Column({ default: false })
  isResolved: boolean; // Whether this outcome has been resolved

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional outcome data

  @ManyToOne(() => PredictionMarket, (market) => market.outcomes)
  @JoinColumn({ name: 'marketId' })
  market: PredictionMarket;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 