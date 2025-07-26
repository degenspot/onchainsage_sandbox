import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReputationRule } from './entities/reputation-rule.entity';
import { ReputationScore } from './entities/reputation-score.entity';
import { Badge } from './entities/badge.entity';

@Injectable()
export class ReputationService implements OnModuleInit {
  constructor(
    @InjectRepository(ReputationRule)
    private ruleRepository: Repository<ReputationRule>,
    @InjectRepository(ReputationScore)
    private scoreRepository: Repository<ReputationScore>,
    @InjectRepository(Badge)
    private badgeRepository: Repository<Badge>,
  ) {}

  async onModuleInit() {
    await this.initializeDefaultRules();
  }

  private async initializeDefaultRules() {
    const existingRules = await this.ruleRepository.count();
    if (existingRules === 0) {
      const defaultRules = [
        { action: 'POST_CREATED', points: 10, description: 'Creating a new post' },
        { action: 'COMMENT_CREATED', points: 5, description: 'Creating a comment' },
        { action: 'POST_UPVOTED', points: 2, description: 'Post received an upvote' },
        { action: 'POST_DOWNVOTED', points: -1, description: 'Post received a downvote' },
        { action: 'DAILY_LOGIN', points: 1, description: 'Daily login bonus' },
        { action: 'PROFILE_COMPLETE', points: 50, description: 'Completing profile' },
      ];

      for (const rule of defaultRules) {
        await this.ruleRepository.save(this.ruleRepository.create(rule));
      }
    }
  }

  async getUserReputation(userId: number): Promise<ReputationScore> {
    let score = await this.scoreRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!score) {
      score = this.scoreRepository.create({
        user: { id: userId } as any,
        totalScore: 0,
        postScore: 0,
        commentScore: 0,
        voteScore: 0,
        onChainScore: 0,
      });
      score = await this.scoreRepository.save(score);
    }

    return score;
  }

  async updateUserReputation(userId: number, action: string, multiplier: number = 1): Promise<ReputationScore> {
    const rule = await this.ruleRepository.findOne({ where: { action } });
    if (!rule) {
      return this.getUserReputation(userId);
    }

    const score = await this.getUserReputation(userId);
    const points = rule.points * multiplier;
    
    score.totalScore += points;

    // Update specific score categories
    switch (action) {
      case 'POST_CREATED':
      case 'POST_UPVOTED':
      case 'POST_DOWNVOTED':
        score.postScore += points;
        break;
      case 'COMMENT_CREATED':
        score.commentScore += points;
        break;
      default:
        score.voteScore += points;
    }

    const updatedScore = await this.scoreRepository.save(score);
    await this.checkAndAwardBadges(userId, updatedScore.totalScore);
    
    return updatedScore;
  }

  private async checkAndAwardBadges(userId: number, totalScore: number) {
    const badgeThresholds = [
      { name: 'Newcomer', description: 'Welcome to the community!', threshold: 10, icon: '🌟' },
      { name: 'Contributor', description: 'Active community member', threshold: 100, icon: '🤝' },
      { name: 'Veteran', description: 'Experienced forum user', threshold: 500, icon: '🏆' },
      { name: 'Expert', description: 'Highly respected member', threshold: 1000, icon: '👑' },
      { name: 'Legend', description: 'Community legend', threshold: 2500, icon: '⭐' },
    ];

    for (const badge of badgeThresholds) {
      if (totalScore >= badge.threshold) {
        const existingBadge = await this.badgeRepository.findOne({
          where: { user: { id: userId }, name: badge.name },
        });

        if (!existingBadge) {
          await this.badgeRepository.save(this.badgeRepository.create({
            user: { id: userId } as any,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
          }));
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async updateOnChainReputation() {
    // This would integrate with blockchain APIs to fetch on-chain activity
    // For now, it's a placeholder that could be expanded with real blockchain integration
    console.log('Updating on-chain reputation scores...');
  }

  async getAllReputationRules(): Promise<ReputationRule[]> {
    return this.ruleRepository.find({ where: { isActive: true } });
  }

  async updateReputationRule(id: number, points: number): Promise<ReputationRule> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (rule) {
      rule.points = points;
      return this.ruleRepository.save(rule);
    }
    return null;
  }

  async getLeaderboard(limit: number = 10): Promise<ReputationScore[]> {
    return this.scoreRepository.find({
      relations: ['user', 'user.badges'],
      order: { totalScore: 'DESC' },
      take: limit,
    });
  }
}
