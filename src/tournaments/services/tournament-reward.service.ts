import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TournamentReward, RewardType, RewardStatus } from '../entities/tournament-reward.entity';
import { Tournament } from '../entities/tournament.entity';
import { TournamentParticipant } from '../entities/tournament-participant.entity';

@Injectable()
export class TournamentRewardService {
  private readonly logger = new Logger(TournamentRewardService.name);

  constructor(
    @InjectRepository(TournamentReward)
    private tournamentRewardRepository: Repository<TournamentReward>,
    @InjectRepository(Tournament)
    private tournamentRepository: Repository<Tournament>,
    @InjectRepository(TournamentParticipant)
    private tournamentParticipantRepository: Repository<TournamentParticipant>,
  ) {}

  async generateRewards(tournamentId: string): Promise<TournamentReward[]> {
    this.logger.log(`Generating rewards for tournament ${tournamentId}`);

    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['participants'],
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID "${tournamentId}" not found`);
    }

    if (tournament.status !== 'completed') {
      throw new Error('Tournament must be completed to generate rewards');
    }

    const participants = await this.tournamentParticipantRepository.find({
      where: { tournamentId },
      order: { rank: 'ASC' },
    });

    const rewards = [];
    const prizeDistribution = tournament.prizeDistribution || {
      '1': 50, // 1st place: 50%
      '2': 30, // 2nd place: 30%
      '3': 20, // 3rd place: 20%
    };

    for (const participant of participants) {
      const rank = participant.rank;
      const distributionPercentage = prizeDistribution[rank.toString()];

      if (distributionPercentage && tournament.prizePool > 0) {
        const rewardAmount = (tournament.prizePool * distributionPercentage) / 100;

        const reward = this.tournamentRewardRepository.create({
          tournamentId,
          participantId: participant.id,
          rank,
          rewardType: RewardType.TOKENS,
          rewardName: `${rank === 1 ? 'Gold' : rank === 2 ? 'Silver' : 'Bronze'} Medal`,
          rewardDescription: `${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} Place Prize`,
          rewardAmount,
          rewardToken: 'USDC', // Default token
          rewardTokenSymbol: 'USDC',
          status: RewardStatus.PENDING,
        });

        rewards.push(reward);
      }

      // Generate additional rewards (badges, XP, etc.)
      if (rank <= 10) {
        const badgeReward = this.tournamentRewardRepository.create({
          tournamentId,
          participantId: participant.id,
          rank,
          rewardType: RewardType.BADGE,
          rewardName: `Top ${rank} Badge`,
          rewardDescription: `Achievement badge for finishing in top ${rank}`,
          rewardAmount: 1,
          status: RewardStatus.PENDING,
        });

        rewards.push(badgeReward);
      }

      // XP rewards for all participants
      const xpReward = this.tournamentRewardRepository.create({
        tournamentId,
        participantId: participant.id,
        rank,
        rewardType: RewardType.XP,
        rewardName: 'Tournament XP',
        rewardDescription: `Experience points earned from tournament participation`,
        rewardAmount: Math.max(100 - (rank - 1) * 5, 10), // More XP for higher ranks
        status: RewardStatus.PENDING,
      });

      rewards.push(xpReward);
    }

    return this.tournamentRewardRepository.save(rewards);
  }

  async distributeRewards(tournamentId: string): Promise<TournamentReward[]> {
    this.logger.log(`Distributing rewards for tournament ${tournamentId}`);

    const rewards = await this.tournamentRewardRepository.find({
      where: { tournamentId, status: RewardStatus.PENDING },
    });

    const distributedRewards = [];
    for (const reward of rewards) {
      try {
        // Simulate blockchain transaction
        const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        
        reward.status = RewardStatus.DISTRIBUTED;
        reward.distributedAt = new Date();
        reward.distributedBy = 'system';
        reward.transactionHash = transactionHash;
        reward.distributionNotes = `Automatically distributed on ${new Date().toISOString()}`;

        const savedReward = await this.tournamentRewardRepository.save(reward);
        distributedRewards.push(savedReward);

        this.logger.log(`Distributed reward ${reward.id} to participant ${reward.participantId}`);
      } catch (error) {
        this.logger.error(`Failed to distribute reward ${reward.id}: ${error.message}`);
        reward.status = RewardStatus.FAILED;
        await this.tournamentRewardRepository.save(reward);
      }
    }

    return distributedRewards;
  }

  async getTournamentRewards(tournamentId: string): Promise<TournamentReward[]> {
    return this.tournamentRewardRepository.find({
      where: { tournamentId },
      relations: ['tournament'],
      order: { rank: 'ASC' },
    });
  }

  async getParticipantRewards(tournamentId: string, participantId: string): Promise<TournamentReward[]> {
    return this.tournamentRewardRepository.find({
      where: { tournamentId, participantId },
      relations: ['tournament'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRewardsByType(tournamentId: string, rewardType: RewardType): Promise<TournamentReward[]> {
    return this.tournamentRewardRepository.find({
      where: { tournamentId, rewardType },
      relations: ['tournament'],
      order: { rank: 'ASC' },
    });
  }

  async getRewardsByStatus(tournamentId: string, status: RewardStatus): Promise<TournamentReward[]> {
    return this.tournamentRewardRepository.find({
      where: { tournamentId, status },
      relations: ['tournament'],
      order: { createdAt: 'DESC' },
    });
  }

  async approveReward(rewardId: string, approverId: string): Promise<TournamentReward> {
    const reward = await this.tournamentRewardRepository.findOne({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    reward.status = RewardStatus.APPROVED;
    return this.tournamentRewardRepository.save(reward);
  }

  async retryFailedReward(rewardId: string): Promise<TournamentReward> {
    const reward = await this.tournamentRewardRepository.findOne({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    if (reward.status !== RewardStatus.FAILED) {
      throw new Error('Reward is not in failed status');
    }

    // Retry distribution
    try {
      const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      reward.status = RewardStatus.DISTRIBUTED;
      reward.distributedAt = new Date();
      reward.distributedBy = 'system';
      reward.transactionHash = transactionHash;
      reward.distributionNotes = `Retry distribution on ${new Date().toISOString()}`;

      return this.tournamentRewardRepository.save(reward);
    } catch (error) {
      this.logger.error(`Failed to retry reward ${rewardId}: ${error.message}`);
      throw error;
    }
  }

  async getRewardStats(tournamentId: string): Promise<any> {
    const rewards = await this.getTournamentRewards(tournamentId);
    
    const totalRewards = rewards.length;
    const distributedRewards = rewards.filter(r => r.status === RewardStatus.DISTRIBUTED).length;
    const pendingRewards = rewards.filter(r => r.status === RewardStatus.PENDING).length;
    const failedRewards = rewards.filter(r => r.status === RewardStatus.FAILED).length;
    
    const totalValue = rewards.reduce((sum, r) => sum + r.rewardAmount, 0);
    const distributedValue = rewards
      .filter(r => r.status === RewardStatus.DISTRIBUTED)
      .reduce((sum, r) => sum + r.rewardAmount, 0);

    const rewardTypes = rewards.reduce((acc, r) => {
      acc[r.rewardType] = (acc[r.rewardType] || 0) + 1;
      return acc;
    }, {});

    return {
      tournamentId,
      totalRewards,
      distributedRewards,
      pendingRewards,
      failedRewards,
      totalValue,
      distributedValue,
      rewardTypes,
      distributionRate: totalRewards > 0 ? (distributedRewards / totalRewards) * 100 : 0,
    };
  }
} 