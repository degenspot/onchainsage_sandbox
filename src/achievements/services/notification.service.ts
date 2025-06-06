import { Injectable } from '@nestjs/common';
import { Achievement } from '../entities/achievement.entity';

@Injectable()
export class NotificationService {
  async sendAchievementNotification(userId: string, achievement: Achievement): Promise<void> {    
    const notification = {
      userId,
      type: 'achievement_unlocked',
      title: 'Achievement Unlocked!',
      message: `Congratulations! You've earned the "${achievement.name}" achievement.`,
      data: {
        achievementId: achievement.id,
        achievementName: achievement.name,
        pointsAwarded: achievement.pointsReward,
        rarity: achievement.rarity,
      },
      createdAt: new Date(),
    };
    
    console.log('Achievement notification sent:', notification);
  }
}
