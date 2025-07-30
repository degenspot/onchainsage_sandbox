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

export enum ParticipantStatus {
  REGISTERED = 'registered',
  APPROVED = 'approved',
  ACTIVE = 'active',
  ELIMINATED = 'eliminated',
  DISQUALIFIED = 'disqualified',
  WITHDRAWN = 'withdrawn',
}

@Entity('tournament_participants')
@Index(['tournamentId', 'userId'])
@Index(['tournamentId', 'status'])
@Index(['userId'])
export class TournamentParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tournamentId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userAddress: string; // Blockchain address

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.REGISTERED,
  })
  status: ParticipantStatus;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  totalScore: number; // Total tournament score

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  currentRoundScore: number; // Score for current round

  @Column('int', { default: 0 })
  correctPredictions: number; // Number of correct predictions

  @Column('int', { default: 0 })
  totalPredictions: number; // Total number of predictions made

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  accuracyRate: number; // Prediction accuracy percentage

  @Column('int', { default: 0 })
  rank: number; // Current tournament rank

  @Column('int', { default: 0 })
  previousRank: number; // Previous round rank

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  entryFeePaid: number; // Entry fee amount paid

  @Column({ nullable: true })
  entryFeeTransactionHash: string; // Blockchain transaction hash

  @Column({ nullable: true })
  approvedBy: string; // User who approved the participant

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  eliminatedAt: Date;

  @Column({ nullable: true })
  eliminationRound: number; // Round when eliminated

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional participant data

  @ManyToOne(() => Tournament, (tournament) => tournament.participants)
  @JoinColumn({ name: 'tournamentId' })
  tournament: Tournament;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 