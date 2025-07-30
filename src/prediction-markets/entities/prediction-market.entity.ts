import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { MarketParticipant } from './market-participant.entity';
import { MarketOutcome } from './market-outcome.entity';
import { MarketResolution } from './market-resolution.entity';

export enum MarketStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

export enum MarketType {
  TOKEN_PRICE = 'token_price',
  EVENT_OUTCOME = 'event_outcome',
  TIMELINE_EVENT = 'timeline_event',
}

export enum ResolutionType {
  MANUAL = 'manual',
  ORACLE = 'oracle',
  COMMUNITY_VOTE = 'community_vote',
}

@Entity('prediction_markets')
@Index(['status', 'endDate'])
@Index(['marketType', 'tokenSymbol'])
@Index(['creatorId'])
export class PredictionMarket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: MarketType,
  })
  marketType: MarketType;

  @Column({
    type: 'enum',
    enum: MarketStatus,
    default: MarketStatus.OPEN,
  })
  status: MarketStatus;

  @Column({
    type: 'enum',
    enum: ResolutionType,
  })
  resolutionType: ResolutionType;

  @Column({ nullable: true })
  tokenSymbol: string; // For token price markets

  @Column({ nullable: true })
  targetPrice: number; // For token price markets

  @Column({ nullable: true })
  priceThreshold: number; // Price threshold for resolution

  @Column({ nullable: true })
  eventDescription: string; // For event outcome markets

  @Column({ nullable: true })
  outcomeCriteria: string; // Clear criteria for outcome resolution

  @Column()
  creatorId: string; // User who created the market

  @Column({ nullable: true })
  creatorAddress: string; // Blockchain address of creator

  @Column('decimal', { precision: 20, scale: 8 })
  totalStaked: number; // Total amount staked in the market

  @Column('decimal', { precision: 20, scale: 8 })
  totalVolume: number; // Total trading volume

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  platformFeePercentage: number; // Platform fee (e.g., 2.5%)

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ nullable: true })
  resolutionDate: Date;

  @Column({ nullable: true })
  resolvedBy: string; // User or oracle that resolved the market

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional market data

  @OneToMany(() => MarketParticipant, (participant) => participant.market)
  participants: MarketParticipant[];

  @OneToMany(() => MarketOutcome, (outcome) => outcome.market)
  outcomes: MarketOutcome[];

  @OneToMany(() => MarketResolution, (resolution) => resolution.market)
  resolutions: MarketResolution[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 