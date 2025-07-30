import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AchievementsModule } from './achievements/achievements.module';
import { ChallengeModule } from './challenge/challenge.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [AchievementsModule, ChallengeModule, WalletModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
