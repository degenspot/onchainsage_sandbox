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

export enum LeaderboardType {
  OVERALL = 'overall',
  ROUND = 'round',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

@Entity('tournament_leaderboards')
@Index(['tournamentId', 'type'])
@Index(['tournamentId', 'roundNumber'])
@Index(['participantId'])
export class TournamentLeaderboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tournamentId: string;

  @Column()
  participantId: string;

  @Column({
    type: 'enum',
    enum: LeaderboardType,
  })
  type: LeaderboardType;

  @Column('int', { nullable: true })
  roundNumber: number; // For round-specific leaderboards

  @Column('int')
  rank: number; // Current rank

  @Column('int')
  previousRank: number; // Previous rank

  @Column('decimal', { precision: 20, scale: 8 })
  totalScore: number; // Total score

  @Column('decimal', { precision: 20, scale: 8 })
  roundScore: number; // Score for current round

  @Column('int')
  correctPredictions: number; // Number of correct predictions

  @Column('int')
  totalPredictions: number; // Total number of predictions

  @Column('decimal', { precision: 5, scale: 2 })
  accuracyRate: number; // Prediction accuracy percentage

  @Column('decimal', { precision: 20, scale: 8 })
  averageScore: number; // Average score per prediction

  @Column('decimal', { precision: 20, scale: 8 })
  bestScore: number; // Best single prediction score

  @Column('int')
  consecutiveCorrect: number; // Consecutive correct predictions

  @Column('int')
  longestStreak: number; // Longest streak of correct predictions

  @Column('jsonb', { nullable: true })
  scoreBreakdown: Record<string, number>; // Detailed score breakdown

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional leaderboard data

  @ManyToOne(() => Tournament, (tournament) => tournament.leaderboards)
  @JoinColumn({ name: 'tournamentId' })
  tournament: Tournament;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 