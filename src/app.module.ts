import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AchievementsModule } from './achievements/achievements.module';
import { ChallengeModule } from './challenge/challenge.module';
import { PredictionMarketsModule } from './prediction-markets/prediction-markets.module';

@Module({
  imports: [AchievementsModule, ChallengeModule, PredictionMarketsModule],
import { WalletModule } from './wallet/wallet.module';
import { NewsVerificationModule } from './news-verification/news-verification.module';

@Module({
  imports: [AchievementsModule, ChallengeModule, WalletModule, NewsVerificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
