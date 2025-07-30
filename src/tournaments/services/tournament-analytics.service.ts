import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../entities/tournament.entity';
import { TournamentParticipant } from '../entities/tournament-participant.entity';
import { TournamentPrediction } from '../entities/tournament-prediction.entity';
import { TournamentLeaderboard } from '../entities/tournament-leaderboard.entity';
import { TournamentReward } from '../entities/tournament-reward.entity';

@Injectable()
export class TournamentAnalyticsService {
  private readonly logger = new Logger(TournamentAnalyticsService.name);

  constructor(
    @InjectRepository(Tournament)
    private tournamentRepository: Repository<Tournament>,
    @InjectRepository(TournamentParticipant)
    private tournamentParticipantRepository: Repository<TournamentParticipant>,
    @InjectRepository(TournamentPrediction)
    private tournamentPredictionRepository: Repository<TournamentPrediction>,
    @InjectRepository(TournamentLeaderboard)
    private tournamentLeaderboardRepository: Repository<TournamentLeaderboard>,
    @InjectRepository(TournamentReward)
    private tournamentRewardRepository: Repository<TournamentReward>,
  ) {}

  async getTournamentAnalytics(tournamentId: string): Promise<any> {
    this.logger.log(`Getting analytics for tournament ${tournamentId}`);

    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['participants', 'rounds'],
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const participants = await this.tournamentParticipantRepository.find({
      where: { tournamentId },
    });

    const predictions = await this.tournamentPredictionRepository.find({
      where: { tournamentId },
    });

    const leaderboards = await this.tournamentLeaderboardRepository.find({
      where: { tournamentId },
    });

    const rewards = await this.tournamentRewardRepository.find({
      where: { tournamentId },
    });

    // Calculate basic statistics
    const totalParticipants = participants.length;
    const activeParticipants = participants.filter(p => p.status === 'active').length;
    const eliminatedParticipants = participants.filter(p => p.status === 'eliminated').length;
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.status === 'correct').length;
    const accuracyRate = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

    // Calculate score statistics
    const scores = participants.map(p => p.totalScore);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = Math.max(...scores, 0);
    const lowestScore = Math.min(...scores, 0);

    // Calculate participation trends
    const participationByRound = {};
    predictions.forEach(prediction => {
      const roundId = prediction.roundId;
      if (!participationByRound[roundId]) {
        participationByRound[roundId] = 0;
      }
      participationByRound[roundId]++;
    });

    // Calculate reward statistics
    const totalRewards = rewards.length;
    const distributedRewards = rewards.filter(r => r.status === 'distributed').length;
    const totalRewardValue = rewards.reduce((sum, r) => sum + r.rewardAmount, 0);

    return {
      tournamentId,
      tournament: {
        title: tournament.title,
        status: tournament.status,
        currentRound: tournament.currentRound,
        totalRounds: tournament.totalRounds,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
      },
      participants: {
        total: totalParticipants,
        active: activeParticipants,
        eliminated: eliminatedParticipants,
        participationRate: totalParticipants > 0 ? (activeParticipants / totalParticipants) * 100 : 0,
      },
      predictions: {
        total: totalPredictions,
        correct: correctPredictions,
        accuracyRate,
        averagePerParticipant: totalParticipants > 0 ? totalPredictions / totalParticipants : 0,
      },
      scores: {
        average: averageScore,
        highest: highestScore,
        lowest: lowestScore,
        range: highestScore - lowestScore,
      },
      participationByRound,
      rewards: {
        total: totalRewards,
        distributed: distributedRewards,
        totalValue: totalRewardValue,
        distributionRate: totalRewards > 0 ? (distributedRewards / totalRewards) * 100 : 0,
      },
      leaderboards: leaderboards.length,
    };
  }

  async getGlobalTournamentStats(): Promise<any> {
    this.logger.log('Getting global tournament statistics');

    const tournaments = await this.tournamentRepository.find();
    const participants = await this.tournamentParticipantRepository.find();
    const predictions = await this.tournamentPredictionRepository.find();
    const rewards = await this.tournamentRewardRepository.find();

    const totalTournaments = tournaments.length;
    const activeTournaments = tournaments.filter(t => t.status === 'active').length;
    const completedTournaments = tournaments.filter(t => t.status === 'completed').length;
    const totalParticipants = participants.length;
    const totalPredictions = predictions.length;
    const totalRewards = rewards.length;
    const totalRewardValue = rewards.reduce((sum, r) => sum + r.rewardAmount, 0);

    // Calculate tournament types distribution
    const tournamentTypes = tournaments.reduce((acc, t) => {
      acc[t.tournamentType] = (acc[t.tournamentType] || 0) + 1;
      return acc;
    }, {});

    // Calculate format distribution
    const tournamentFormats = tournaments.reduce((acc, t) => {
      acc[t.format] = (acc[t.format] || 0) + 1;
      return acc;
    }, {});

    return {
      totalTournaments,
      activeTournaments,
      completedTournaments,
      totalParticipants,
      totalPredictions,
      totalRewards,
      totalRewardValue,
      tournamentTypes,
      tournamentFormats,
      averageParticipantsPerTournament: totalTournaments > 0 ? totalParticipants / totalTournaments : 0,
      averagePredictionsPerTournament: totalTournaments > 0 ? totalPredictions / totalTournaments : 0,
    };
  }

  async getUserTournamentStats(userId: string): Promise<any> {
    this.logger.log(`Getting tournament statistics for user ${userId}`);

    const participations = await this.tournamentParticipantRepository.find({
      where: { userId },
      relations: ['tournament'],
    });

    const predictions = await this.tournamentPredictionRepository.find({
      where: { participantId: participations.map(p => p.id) },
    });

    const rewards = await this.tournamentRewardRepository.find({
      where: { participantId: participations.map(p => p.id) },
    });

    const totalTournaments = participations.length;
    const activeTournaments = participations.filter(p => p.status === 'active').length;
    const completedTournaments = participations.filter(p => p.tournament.status === 'completed').length;
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.status === 'correct').length;
    const accuracyRate = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
    const totalRewards = rewards.length;
    const totalRewardValue = rewards.reduce((sum, r) => sum + r.rewardAmount, 0);

    // Calculate best performance
    const bestRank = Math.min(...participations.map(p => p.rank).filter(r => r > 0));
    const highestScore = Math.max(...participations.map(p => p.totalScore));
    const averageScore = participations.length > 0 ? participations.reduce((sum, p) => sum + p.totalScore, 0) / participations.length : 0;

    return {
      userId,
      totalTournaments,
      activeTournaments,
      completedTournaments,
      totalPredictions,
      correctPredictions,
      accuracyRate,
      totalRewards,
      totalRewardValue,
      bestRank,
      highestScore,
      averageScore,
      participationRate: totalTournaments > 0 ? (activeTournaments / totalTournaments) * 100 : 0,
    };
  }

  async getTournamentTrends(days: number = 30): Promise<any> {
    this.logger.log(`Getting tournament trends for the last ${days} days`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tournaments = await this.tournamentRepository.find({
      where: {
        createdAt: { $gte: startDate },
      },
      order: { createdAt: 'ASC' },
    });

    const participants = await this.tournamentParticipantRepository.find({
      where: {
        createdAt: { $gte: startDate },
      },
    });

    const predictions = await this.tournamentPredictionRepository.find({
      where: {
        createdAt: { $gte: startDate },
      },
    });

    // Group by date
    const dailyStats = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyStats[dateKey] = {
        tournaments: 0,
        participants: 0,
        predictions: 0,
      };
    }

    // Count daily statistics
    tournaments.forEach(tournament => {
      const dateKey = tournament.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].tournaments++;
      }
    });

    participants.forEach(participant => {
      const dateKey = participant.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].participants++;
      }
    });

    predictions.forEach(prediction => {
      const dateKey = prediction.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].predictions++;
      }
    });

    return {
      period: `${days} days`,
      dailyStats,
      totalTournaments: tournaments.length,
      totalParticipants: participants.length,
      totalPredictions: predictions.length,
    };
  }

  async getTopPerformers(limit: number = 10): Promise<any> {
    this.logger.log(`Getting top ${limit} performers`);

    const participants = await this.tournamentParticipantRepository.find({
      relations: ['tournament'],
      order: { totalScore: 'DESC', accuracyRate: 'DESC' },
      take: limit,
    });

    return participants.map(p => ({
      userId: p.userId,
      tournamentId: p.tournamentId,
      tournamentTitle: p.tournament.title,
      rank: p.rank,
      totalScore: p.totalScore,
      accuracyRate: p.accuracyRate,
      correctPredictions: p.correctPredictions,
      totalPredictions: p.totalPredictions,
    }));
  }

  async getTournamentComparison(tournamentIds: string[]): Promise<any> {
    this.logger.log(`Comparing tournaments: ${tournamentIds.join(', ')}`);

    const tournaments = await this.tournamentRepository.find({
      where: { id: { $in: tournamentIds } },
      relations: ['participants'],
    });

    const comparison = tournaments.map(tournament => {
      const participants = tournament.participants || [];
      const totalParticipants = participants.length;
      const averageScore = participants.length > 0 ? participants.reduce((sum, p) => sum + p.totalScore, 0) / participants.length : 0;
      const highestScore = Math.max(...participants.map(p => p.totalScore), 0);

      return {
        tournamentId: tournament.id,
        title: tournament.title,
        status: tournament.status,
        totalParticipants,
        averageScore,
        highestScore,
        currentRound: tournament.currentRound,
        totalRounds: tournament.totalRounds,
      };
    });

    return comparison;
  }
} 