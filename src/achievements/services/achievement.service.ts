import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { UserPoints } from '../entities/user-points.entity';
import { CreateAchievementDto, AchievementCategory } from '../dto/achievement.dto';
import { NotificationService } from '../services/notification.service';
import { NftService } from './nft.service';
import { Nft } from '../entities/nft.entity';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(UserPoints)
    private userPointsRepository: Repository<UserPoints>,
    @InjectRepository(Nft)
    private nftRepository: Repository<Nft>,
    private notificationService: NotificationService,
    private nftService: NftService,
  ) {}

  async createAchievement(createAchievementDto: CreateAchievementDto): Promise<Achievement> {
    const achievement = this.achievementRepository.create({
      ...createAchievementDto,
      criteria: JSON.parse(createAchievementDto.criteria),
    });
    return this.achievementRepository.save(achievement);
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return this.achievementRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', rarity: 'ASC' },
    });
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.userAchievementRepository.find({
      where: { userId },
      relations: ['achievement'],
      order: { completedAt: 'DESC' },
    });
  }

  async getUserPoints(userId: string): Promise<UserPoints> {
    let userPoints = await this.userPointsRepository.findOne({
      where: { userId },
    });

    if (!userPoints) {
      userPoints = this.userPointsRepository.create({ userId });
      await this.userPointsRepository.save(userPoints);
    }

    return userPoints;
  }

  async updateUserProgress(userId: string, achievementId: string, progress: number): Promise<UserAchievement> {
    let userAchievement = await this.userAchievementRepository.findOne({
      where: { userId, achievementId },
      relations: ['achievement'],
    });

    if (!userAchievement) {
      const achievement = await this.achievementRepository.findOne({
        where: { id: achievementId },
      });
      
      if (!achievement) {
        throw new NotFoundException('Achievement not found');
      }

      userAchievement = this.userAchievementRepository.create({
        userId,
        achievementId,
        progress: 0,
        maxProgress: achievement.criteria.target || 1,
      });
    }

    userAchievement.progress = Math.min(progress, userAchievement.maxProgress);
    
    if (userAchievement.progress >= userAchievement.maxProgress && !userAchievement.isCompleted) {
      userAchievement.isCompleted = true;
      userAchievement.completedAt = new Date();
      
      // Award points
      await this.awardPoints(userId, userAchievement.achievement.pointsReward);
      
      // Mint NFT for achievement
      const achievement = userAchievement.achievement;
      const metadataUri = achievement.nftImage || achievement.iconUrl || '';
      const nftMintResult = await this.nftService.mintAchievementNft(userId, achievement.id, metadataUri);
      const nft = this.nftRepository.create({
        userId,
        achievementId: achievement.id,
        tokenId: nftMintResult.tokenId,
        contractAddress: nftMintResult.contractAddress,
        metadataUri: nftMintResult.metadataUri,
        isShowcased: false,
        isForTrade: false,
      });
      const savedNft = await this.nftRepository.save(nft);
      userAchievement.nftId = savedNft.id;
      // Send notification
      await this.notificationService.sendAchievementNotification(userId, achievement);
    }

    return this.userAchievementRepository.save(userAchievement);
  }

  async awardPoints(userId: string, points: number): Promise<UserPoints> {
    const userPoints = await this.getUserPoints(userId);
    userPoints.totalPoints += points;
    userPoints.lastActivityAt = new Date();
    return this.userPointsRepository.save(userPoints);
  }

  async getLeaderboard(limit: number = 10): Promise<UserPoints[]> {
    return this.userPointsRepository.find({
      order: { totalPoints: 'DESC' },
      take: limit,
    });
  }

  async checkPredictionAccuracy(userId: string, accuracy: number): Promise<void> {
    const achievements = await this.achievementRepository.find({
      where: { category: AchievementCategory.PREDICTION_ACCURACY, isActive: true },
    });

    for (const achievement of achievements) {
      if (accuracy >= achievement.criteria.minAccuracy) {
        await this.updateUserProgress(userId, achievement.id, 1);
      }
    }
  }

  async checkEngagementMilestone(userId: string, actionType: string): Promise<void> {
    const achievements = await this.achievementRepository.find({
      where: { category: AchievementCategory.ENGAGEMENT, isActive: true },
    });

    for (const achievement of achievements) {
      if (achievement.criteria.actionType === actionType) {
        const userAchievement = await this.userAchievementRepository.findOne({
          where: { userId, achievementId: achievement.id },
        });
        
        const currentProgress = userAchievement?.progress || 0;
        await this.updateUserProgress(userId, achievement.id, currentProgress + 1);
      }
    }
  }

  async updateStreak(userId: string, streakValue: number): Promise<void> {
    const userPoints = await this.getUserPoints(userId);
    userPoints.currentStreak = streakValue;
    userPoints.longestStreak = Math.max(userPoints.longestStreak, streakValue);
    await this.userPointsRepository.save(userPoints);

    // Check streak achievements
    const streakAchievements = await this.achievementRepository.find({
      where: { category: AchievementCategory.STREAK, isActive: true },
    });

    for (const achievement of streakAchievements) {
      if (streakValue >= achievement.criteria.targetStreak) {
        await this.updateUserProgress(userId, achievement.id, 1);
      }
    }
  }
}