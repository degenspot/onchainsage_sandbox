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

export enum RoundStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  PREDICTION_PHASE = 'prediction_phase',
  RESOLUTION_PHASE = 'resolution_phase',
  COMPLETED = 'completed',
}

@Entity('tournament_rounds')
@Index(['tournamentId', 'roundNumber'])
@Index(['tournamentId', 'status'])
export class TournamentRound {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tournamentId: string;

  @Column('int')
  roundNumber: number; // Round number (1, 2, 3, etc.)

  @Column()
  title: string; // Round title

  @Column('text')
  description: string; // Round description

  @Column({
    type: 'enum',
    enum: RoundStatus,
    default: RoundStatus.UPCOMING,
  })
  status: RoundStatus;

  @Column()
  startDate: Date; // When the round starts

  @Column()
  endDate: Date; // When the round ends

  @Column({ nullable: true })
  predictionDeadline: Date; // Deadline for predictions

  @Column({ nullable: true })
  resolutionDate: Date; // When round is resolved

  @Column('int', { default: 0 })
  totalParticipants: number; // Number of participants in this round

  @Column('int', { default: 0 })
  activeParticipants: number; // Number of active participants

  @Column('int', { default: 0 })
  eliminatedParticipants: number; // Number of eliminated participants

  @Column('jsonb', { nullable: true })
  predictionMarkets: string[]; // Array of prediction market IDs for this round

  @Column('jsonb', { nullable: true })
  scoringRules: Record<string, any>; // Round-specific scoring rules

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional round data

  @ManyToOne(() => Tournament, (tournament) => tournament.rounds)
  @JoinColumn({ name: 'tournamentId' })
  tournament: Tournament;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 