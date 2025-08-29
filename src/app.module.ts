import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AchievementsModule } from './achievements/achievements.module';
import { ChallengeModule } from './challenge/challenge.module';
import { PredictionMarketsModule } from './prediction-markets/prediction-markets.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { WalletModule } from './wallet/wallet.module';
import { NewsVerificationModule } from './news-verification/news-verification.module';
import { CustomAlertsModule } from './custom-alerts/custom-alerts.module';

@Module({
  imports: [
    AchievementsModule, 
    ChallengeModule, 
    PredictionMarketsModule, 
    TournamentsModule,
    WalletModule, 
    NewsVerificationModule,
    CustomAlertsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
