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

export enum ParticipationType {
  YES = 'yes',
  NO = 'no',
  ABSTAIN = 'abstain',
}

export enum StakeStatus {
  ACTIVE = 'active',
  CLAIMED = 'claimed',
  FORFEITED = 'forfeited',
}

@Entity('market_participants')
@Index(['marketId', 'userId'])
@Index(['marketId', 'participationType'])
@Index(['stakeStatus'])
export class MarketParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  marketId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userAddress: string; // Blockchain address

  @Column({
    type: 'enum',
    enum: ParticipationType,
  })
  participationType: ParticipationType;

  @Column('decimal', { precision: 20, scale: 8 })
  amountStaked: number; // Amount staked in the prediction

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  potentialWinnings: number; // Calculated potential winnings

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  actualWinnings: number; // Actual winnings after resolution

  @Column({
    type: 'enum',
    enum: StakeStatus,
    default: StakeStatus.ACTIVE,
  })
  stakeStatus: StakeStatus;

  @Column({ nullable: true })
  claimedAt: Date;

  @Column({ nullable: true })
  transactionHash: string; // Blockchain transaction hash

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional participant data

  @ManyToOne(() => PredictionMarket, (market) => market.participants)
  @JoinColumn({ name: 'marketId' })
  market: PredictionMarket;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 