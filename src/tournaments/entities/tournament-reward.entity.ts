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
import { Tournament } from './tournament.entity';

export enum RewardType {
  TOKENS = 'tokens',
  NFT = 'nft',
  BADGE = 'badge',
  XP = 'xp',
  CUSTOM = 'custom',
}

export enum RewardStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DISTRIBUTED = 'distributed',
  FAILED = 'failed',
}

@Entity('tournament_rewards')
@Index(['tournamentId', 'participantId'])
@Index(['tournamentId', 'rank'])
@Index(['status'])
export class TournamentReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tournamentId: string;

  @Column()
  participantId: string;

  @Column('int')
  rank: number; // Final tournament rank

  @Column({
    type: 'enum',
    enum: RewardType,
  })
  rewardType: RewardType;

  @Column()
  rewardName: string; // Name of the reward

  @Column('text')
  rewardDescription: string; // Description of the reward

  @Column('decimal', { precision: 20, scale: 8 })
  rewardAmount: number; // Amount of the reward

  @Column({ nullable: true })
  rewardToken: string; // Token address for token rewards

  @Column({ nullable: true })
  rewardTokenSymbol: string; // Token symbol

  @Column({
    type: 'enum',
    enum: RewardStatus,
    default: RewardStatus.PENDING,
  })
  status: RewardStatus;

  @Column({ nullable: true })
  distributedAt: Date; // When the reward was distributed

  @Column({ nullable: true })
  distributedBy: string; // Who distributed the reward

  @Column({ nullable: true })
  transactionHash: string; // Blockchain transaction hash

  @Column('text', { nullable: true })
  distributionNotes: string; // Notes about the distribution

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional reward data

  @ManyToOne(() => Tournament, (tournament) => tournament.rewards)
  @JoinColumn({ name: 'tournamentId' })
  tournament: Tournament;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 