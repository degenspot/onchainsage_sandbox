import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { UserPoints } from './entities/user-points.entity';
import { AchievementService } from './services/achievement.service';
import { NotificationService } from './services/notification.service';
import { AchievementController } from './controllers/achievement.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Achievement, UserAchievement, UserPoints]),
  ],
  controllers: [AchievementController],
  providers: [AchievementService, NotificationService],
  exports: [AchievementService],
})
export class AchievementsModule {}