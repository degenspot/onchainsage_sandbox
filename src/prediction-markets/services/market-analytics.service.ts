import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PredictionMarket, MarketStatus, MarketType } from '../entities/prediction-market.entity';
import { MarketParticipant, StakeStatus } from '../entities/market-participant.entity';
import { MarketOutcome } from '../entities/market-outcome.entity';

@Injectable()
export class MarketAnalyticsService {
  private readonly logger = new Logger(MarketAnalyticsService.name);

  constructor(
    @InjectRepository(PredictionMarket)
    private predictionMarketRepository: Repository<PredictionMarket>,
    @InjectRepository(MarketParticipant)
    private marketParticipantRepository: Repository<MarketParticipant>,
    @InjectRepository(MarketOutcome)
    private marketOutcomeRepository: Repository<MarketOutcome>,
  ) {}

  async getGlobalAnalytics(): Promise<any> {
    const [
      totalMarkets,
      openMarkets,
      resolvedMarkets,
      totalParticipants,
      totalVolume,
      totalWinnings,
    ] = await Promise.all([
      this.predictionMarketRepository.count(),
      this.predictionMarketRepository.count({ where: { status: MarketStatus.OPEN } }),
      this.predictionMarketRepository.count({ where: { status: MarketStatus.RESOLVED } }),
      this.marketParticipantRepository.count(),
      this.predictionMarketRepository
        .createQueryBuilder('market')
        .select('SUM(market.totalVolume)', 'totalVolume')
        .getRawOne(),
      this.marketParticipantRepository
        .createQueryBuilder('participant')
        .select('SUM(participant.actualWinnings)', 'totalWinnings')
        .where('participant.stakeStatus = :status', { status: StakeStatus.CLAIMED })
        .getRawOne(),
    ]);

    return {
      totalMarkets,
      openMarkets,
      resolvedMarkets,
      totalParticipants,
      totalVolume: totalVolume?.totalVolume || 0,
      totalWinnings: totalWinnings?.totalWinnings || 0,
      averageMarketSize: totalMarkets > 0 ? (totalVolume?.totalVolume || 0) / totalMarkets : 0,
      averageParticipation: totalMarkets > 0 ? totalParticipants / totalMarkets : 0,
    };
  }

  async getMarketTypeAnalytics(): Promise<any> {
    const marketTypes = Object.values(MarketType);
    const analytics = {};

    for (const marketType of marketTypes) {
      const markets = await this.predictionMarketRepository.find({
        where: { marketType },
        relations: ['participants'],
      });

      const totalMarkets = markets.length;
      const totalVolume = markets.reduce((sum, m) => sum + Number(m.totalVolume), 0);
      const totalParticipants = markets.reduce((sum, m) => sum + m.participants.length, 0);
      const resolvedMarkets = markets.filter(m => m.status === MarketStatus.RESOLVED).length;

      analytics[marketType] = {
        totalMarkets,
        totalVolume,
        totalParticipants,
        resolvedMarkets,
        averageVolume: totalMarkets > 0 ? totalVolume / totalMarkets : 0,
        averageParticipants: totalMarkets > 0 ? totalParticipants / totalMarkets : 0,
        resolutionRate: totalMarkets > 0 ? (resolvedMarkets / totalMarkets) * 100 : 0,
      };
    }

    return analytics;
  }

  async getUserAnalytics(userId: string): Promise<any> {
    const participations = await this.marketParticipantRepository.find({
      where: { userId },
      relations: ['market'],
    });

    const totalParticipations = participations.length;
    const totalStaked = participations.reduce((sum, p) => sum + Number(p.amountStaked), 0);
    const totalWinnings = participations.reduce((sum, p) => sum + Number(p.actualWinnings), 0);
    const claimedParticipations = participations.filter(p => p.stakeStatus === StakeStatus.CLAIMED).length;
    const activeParticipations = participations.filter(p => p.stakeStatus === StakeStatus.ACTIVE).length;

    const winRate = claimedParticipations > 0 ? (claimedParticipations / totalParticipations) * 100 : 0;
    const roi = totalStaked > 0 ? ((totalWinnings - totalStaked) / totalStaked) * 100 : 0;

    return {
      totalParticipations,
      totalStaked,
      totalWinnings,
      claimedParticipations,
      activeParticipations,
      winRate,
      roi,
      averageStake: totalParticipations > 0 ? totalStaked / totalParticipations : 0,
      averageWinnings: claimedParticipations > 0 ? totalWinnings / claimedParticipations : 0,
    };
  }

  async getMarketTrends(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const markets = await this.predictionMarketRepository
      .createQueryBuilder('market')
      .where('market.createdAt >= :startDate', { startDate })
      .orderBy('market.createdAt', 'ASC')
      .getMany();

    const dailyStats = {};
    
    for (const market of markets) {
      const date = market.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          marketsCreated: 0,
          totalVolume: 0,
          totalParticipants: 0,
        };
      }
      
      dailyStats[date].marketsCreated++;
      dailyStats[date].totalVolume += Number(market.totalVolume);
    }

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  }

  async getTopMarkets(limit: number = 10): Promise<any[]> {
    return this.predictionMarketRepository
      .createQueryBuilder('market')
      .leftJoinAndSelect('market.outcomes', 'outcomes')
      .leftJoinAndSelect('market.participants', 'participants')
      .orderBy('market.totalVolume', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getTopParticipants(limit: number = 10): Promise<any[]> {
    return this.marketParticipantRepository
      .createQueryBuilder('participant')
      .select([
        'participant.userId',
        'COUNT(participant.id) as totalParticipations',
        'SUM(participant.amountStaked) as totalStaked',
        'SUM(participant.actualWinnings) as totalWinnings',
      ])
      .groupBy('participant.userId')
      .orderBy('totalWinnings', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getMarketAccuracyAnalytics(): Promise<any> {
    const resolvedMarkets = await this.predictionMarketRepository.find({
      where: { status: MarketStatus.RESOLVED },
      relations: ['outcomes', 'participants'],
    });

    let totalMarkets = resolvedMarkets.length;
    let marketsWithWinners = 0;
    let totalWinningsDistributed = 0;

    for (const market of resolvedMarkets) {
      const correctOutcome = market.outcomes.find(o => o.isCorrect);
      if (correctOutcome) {
        const winners = market.participants.filter(
          p => p.participationType === correctOutcome.outcomeType && p.stakeStatus === StakeStatus.CLAIMED,
        );
        
        if (winners.length > 0) {
          marketsWithWinners++;
          totalWinningsDistributed += winners.reduce((sum, w) => sum + Number(w.actualWinnings), 0);
        }
      }
    }

    return {
      totalResolvedMarkets: totalMarkets,
      marketsWithWinners,
      marketsWithoutWinners: totalMarkets - marketsWithWinners,
      winnerRate: totalMarkets > 0 ? (marketsWithWinners / totalMarkets) * 100 : 0,
      totalWinningsDistributed,
      averageWinningsPerMarket: marketsWithWinners > 0 ? totalWinningsDistributed / marketsWithWinners : 0,
    };
  }
} 