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

export enum ResolutionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISPUTED = 'disputed',
}

@Entity('market_resolutions')
@Index(['marketId'])
@Index(['resolutionStatus'])
export class MarketResolution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  marketId: string;

  @Column()
  resolvedBy: string; // User ID or oracle address that resolved the market

  @Column({ nullable: true })
  resolverAddress: string; // Blockchain address of resolver

  @Column()
  outcome: string; // The correct outcome (e.g., 'yes', 'no', or custom outcome)

  @Column('text')
  resolutionReason: string; // Explanation of why this outcome was chosen

  @Column({
    type: 'enum',
    enum: ResolutionStatus,
    default: ResolutionStatus.PENDING,
  })
  resolutionStatus: ResolutionStatus;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  totalWinningsDistributed: number; // Total winnings distributed to winners

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  platformFeesCollected: number; // Platform fees collected

  @Column({ nullable: true })
  oracleData: string; // Oracle data used for resolution (if applicable)

  @Column({ nullable: true })
  communityVoteResult: string; // Community vote result (if applicable)

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional resolution data

  @ManyToOne(() => PredictionMarket, (market) => market.resolutions)
  @JoinColumn({ name: 'marketId' })
  market: PredictionMarket;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 