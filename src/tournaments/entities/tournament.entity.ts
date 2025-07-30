import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TournamentParticipant } from './tournament-participant.entity';
import { TournamentRound } from './tournament-round.entity';
import { TournamentLeaderboard } from './tournament-leaderboard.entity';
import { TournamentReward } from './tournament-reward.entity';

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TournamentType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal',
  CUSTOM = 'custom',
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS_SYSTEM = 'swiss_system',
  POINTS_BASED = 'points_based',
}

@Entity('tournaments')
@Index(['status', 'startDate'])
@Index(['tournamentType', 'format'])
@Index(['creatorId'])
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: TournamentType,
  })
  tournamentType: TournamentType;

  @Column({
    type: 'enum',
    enum: TournamentFormat,
  })
  format: TournamentFormat;

  @Column({
    type: 'enum',
    enum: TournamentStatus,
    default: TournamentStatus.UPCOMING,
  })
  status: TournamentStatus;

  @Column()
  creatorId: string; // User who created the tournament

  @Column({ nullable: true })
  creatorAddress: string; // Blockchain address of creator

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ nullable: true })
  registrationDeadline: Date;

  @Column('int')
  maxParticipants: number; // Maximum number of participants

  @Column('int', { default: 0 })
  currentParticipants: number; // Current number of participants

  @Column('int')
  totalRounds: number; // Total number of rounds in the tournament

  @Column('int', { default: 0 })
  currentRound: number; // Current round number

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  entryFee: number; // Entry fee in tokens

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  prizePool: number; // Total prize pool

  @Column('jsonb', { nullable: true })
  prizeDistribution: Record<string, number>; // Prize distribution percentages

  @Column('jsonb', { nullable: true })
  scoringRules: Record<string, any>; // Tournament scoring rules

  @Column('jsonb', { nullable: true })
  tournamentRules: Record<string, any>; // Tournament-specific rules

  @Column({ default: false })
  isPublic: boolean; // Whether tournament is public or private

  @Column({ default: false })
  requiresApproval: boolean; // Whether participants need approval

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional tournament data

  @OneToMany(() => TournamentParticipant, (participant) => participant.tournament)
  participants: TournamentParticipant[];

  @OneToMany(() => TournamentRound, (round) => round.tournament)
  rounds: TournamentRound[];

  @OneToMany(() => TournamentLeaderboard, (leaderboard) => leaderboard.tournament)
  leaderboards: TournamentLeaderboard[];

  @OneToMany(() => TournamentReward, (reward) => reward.tournament)
  rewards: TournamentReward[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 