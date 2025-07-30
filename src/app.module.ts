import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AchievementsModule } from './achievements/achievements.module';
import { ChallengeModule } from './challenge/challenge.module';
import { PredictionMarketsModule } from './prediction-markets/prediction-markets.module';

@Module({
  imports: [AchievementsModule, ChallengeModule, PredictionMarketsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
