import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AchievementsModule } from './achievements/achievements.module';
import { ChallengeModule } from './challenge/challenge.module';

@Module({
  imports: [AchievementsModule, ChallengeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
