import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TournamentLeaderboard, LeaderboardType } from '../entities/tournament-leaderboard.entity';
import { TournamentParticipant } from '../entities/tournament-participant.entity';
import { TournamentRound } from '../entities/tournament-round.entity';

@Injectable()
export class TournamentLeaderboardService {
  private readonly logger = new Logger(TournamentLeaderboardService.name);

  constructor(
    @InjectRepository(TournamentLeaderboard)
    private tournamentLeaderboardRepository: Repository<TournamentLeaderboard>,
    @InjectRepository(TournamentParticipant)
    private tournamentParticipantRepository: Repository<TournamentParticipant>,
    @InjectRepository(TournamentRound)
    private tournamentRoundRepository: Repository<TournamentRound>,
  ) {}

  async generateOverallLeaderboard(tournamentId: string): Promise<TournamentLeaderboard[]> {
    this.logger.log(`Generating overall leaderboard for tournament ${tournamentId}`);

    const participants = await this.tournamentParticipantRepository.find({
      where: { tournamentId },
      order: { totalScore: 'DESC', accuracyRate: 'DESC' },
    });

    const leaderboards = [];
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const rank = i + 1;

      const leaderboard = this.tournamentLeaderboardRepository.create({
        tournamentId,
        participantId: participant.id,
        type: LeaderboardType.OVERALL,
        rank,
        previousRank: participant.previousRank,
        totalScore: participant.totalScore,
        roundScore: participant.currentRoundScore,
        correctPredictions: participant.correctPredictions,
        totalPredictions: participant.totalPredictions,
        accuracyRate: participant.accuracyRate,
        averageScore: participant.totalPredictions > 0 ? participant.totalScore / participant.totalPredictions : 0,
        bestScore: participant.totalScore, // This would need to be calculated from individual predictions
        consecutiveCorrect: 0, // This would need to be calculated
        longestStreak: 0, // This would need to be calculated
        scoreBreakdown: {
          totalScore: participant.totalScore,
          accuracyRate: participant.accuracyRate,
          correctPredictions: participant.correctPredictions,
        },
      });

      leaderboards.push(leaderboard);
    }

    return this.tournamentLeaderboardRepository.save(leaderboards);
  }

  async generateRoundLeaderboard(tournamentId: string, roundNumber: number): Promise<TournamentLeaderboard[]> {
    this.logger.log(`Generating round leaderboard for tournament ${tournamentId}, round ${roundNumber}`);

    const participants = await this.tournamentParticipantRepository.find({
      where: { tournamentId },
      order: { currentRoundScore: 'DESC', accuracyRate: 'DESC' },
    });

    const leaderboards = [];
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const rank = i + 1;

      const leaderboard = this.tournamentLeaderboardRepository.create({
        tournamentId,
        participantId: participant.id,
        type: LeaderboardType.ROUND,
        roundNumber,
        rank,
        previousRank: participant.previousRank,
        totalScore: participant.totalScore,
        roundScore: participant.currentRoundScore,
        correctPredictions: participant.correctPredictions,
        totalPredictions: participant.totalPredictions,
        accuracyRate: participant.accuracyRate,
        averageScore: participant.totalPredictions > 0 ? participant.totalScore / participant.totalPredictions : 0,
        bestScore: participant.totalScore,
        consecutiveCorrect: 0,
        longestStreak: 0,
        scoreBreakdown: {
          roundScore: participant.currentRoundScore,
          totalScore: participant.totalScore,
        },
      });

      leaderboards.push(leaderboard);
    }

    return this.tournamentLeaderboardRepository.save(leaderboards);
  }

  async getOverallLeaderboard(tournamentId: string, limit = 50): Promise<TournamentLeaderboard[]> {
    return this.tournamentLeaderboardRepository.find({
      where: { tournamentId, type: LeaderboardType.OVERALL },
      relations: ['tournament'],
      order: { rank: 'ASC' },
      take: limit,
    });
  }

  async getRoundLeaderboard(tournamentId: string, roundNumber: number, limit = 50): Promise<TournamentLeaderboard[]> {
    return this.tournamentLeaderboardRepository.find({
      where: { tournamentId, type: LeaderboardType.ROUND, roundNumber },
      relations: ['tournament'],
      order: { rank: 'ASC' },
      take: limit,
    });
  }

  async getParticipantRank(tournamentId: string, participantId: string): Promise<number> {
    const leaderboard = await this.tournamentLeaderboardRepository.findOne({
      where: { tournamentId, participantId, type: LeaderboardType.OVERALL },
    });

    return leaderboard ? leaderboard.rank : 0;
  }

  async getTopParticipants(tournamentId: string, limit = 10): Promise<TournamentLeaderboard[]> {
    return this.tournamentLeaderboardRepository.find({
      where: { tournamentId, type: LeaderboardType.OVERALL },
      relations: ['tournament'],
      order: { rank: 'ASC' },
      take: limit,
    });
  }

  async getLeaderboardHistory(tournamentId: string, type: LeaderboardType): Promise<TournamentLeaderboard[]> {
    return this.tournamentLeaderboardRepository.find({
      where: { tournamentId, type },
      relations: ['tournament'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateLeaderboardEntry(leaderboardId: string, updates: Partial<TournamentLeaderboard>): Promise<TournamentLeaderboard> {
    await this.tournamentLeaderboardRepository.update(leaderboardId, updates);
    return this.tournamentLeaderboardRepository.findOne({
      where: { id: leaderboardId },
    });
  }

  async getLeaderboardStats(tournamentId: string): Promise<any> {
    const overallLeaderboard = await this.getOverallLeaderboard(tournamentId);
    const roundLeaderboards = await this.tournamentLeaderboardRepository.find({
      where: { tournamentId, type: LeaderboardType.ROUND },
    });

    const totalParticipants = overallLeaderboard.length;
    const averageScore = overallLeaderboard.reduce((sum, lb) => sum + lb.totalScore, 0) / totalParticipants;
    const highestScore = Math.max(...overallLeaderboard.map(lb => lb.totalScore));
    const lowestScore = Math.min(...overallLeaderboard.map(lb => lb.totalScore));

    return {
      tournamentId,
      totalParticipants,
      averageScore,
      highestScore,
      lowestScore,
      roundCount: roundLeaderboards.length,
      leaderboardTypes: ['overall', 'round'],
    };
  }

  async getParticipantProgress(tournamentId: string, participantId: string): Promise<any> {
    const leaderboards = await this.tournamentLeaderboardRepository.find({
      where: { tournamentId, participantId },
      order: { createdAt: 'ASC' },
    });

    const progress = leaderboards.map(lb => ({
      type: lb.type,
      roundNumber: lb.roundNumber,
      rank: lb.rank,
      score: lb.totalScore,
      accuracy: lb.accuracyRate,
      timestamp: lb.createdAt,
    }));

    return {
      participantId,
      tournamentId,
      progress,
      currentRank: progress[progress.length - 1]?.rank || 0,
      bestRank: Math.min(...progress.map(p => p.rank)),
      worstRank: Math.max(...progress.map(p => p.rank)),
    };
  }
} 