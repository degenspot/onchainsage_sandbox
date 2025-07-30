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
import { TournamentParticipant } from './tournament-participant.entity';
import { TournamentRound } from './tournament-round.entity';

export enum PredictionStatus {
  PENDING = 'pending',
  CORRECT = 'correct',
  INCORRECT = 'incorrect',
  PARTIALLY_CORRECT = 'partially_correct',
}

export enum PredictionType {
  YES = 'yes',
  NO = 'no',
  NUMERIC = 'numeric',
  MULTIPLE_CHOICE = 'multiple_choice',
  CUSTOM = 'custom',
}

@Entity('tournament_predictions')
@Index(['tournamentId', 'participantId', 'roundId'])
@Index(['tournamentId', 'marketId'])
@Index(['status'])
export class TournamentPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tournamentId: string;

  @Column()
  participantId: string;

  @Column()
  roundId: string;

  @Column()
  marketId: string; // Reference to prediction market

  @Column({
    type: 'enum',
    enum: PredictionType,
  })
  predictionType: PredictionType;

  @Column()
  prediction: string; // The actual prediction made

  @Column('decimal', { precision: 20, scale: 8, nullable: true })
  confidence: number; // Confidence level (0-1)

  @Column('decimal', { precision: 20, scale: 8, nullable: true })
  stakeAmount: number; // Amount staked on this prediction

  @Column({
    type: 'enum',
    enum: PredictionStatus,
    default: PredictionStatus.PENDING,
  })
  status: PredictionStatus;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  score: number; // Score earned for this prediction

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  maxPossibleScore: number; // Maximum possible score for this prediction

  @Column({ nullable: true })
  resolvedAt: Date; // When the prediction was resolved

  @Column({ nullable: true })
  resolvedBy: string; // Who resolved the prediction

  @Column('text', { nullable: true })
  resolutionNotes: string; // Notes about the resolution

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional prediction data

  @ManyToOne(() => TournamentParticipant, (participant) => participant.id)
  @JoinColumn({ name: 'participantId' })
  participant: TournamentParticipant;

  @ManyToOne(() => TournamentRound, (round) => round.id)
  @JoinColumn({ name: 'roundId' })
  round: TournamentRound;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 