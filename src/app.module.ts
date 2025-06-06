import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AchievementsModule } from './achievements/achievements.module';

@Module({
  imports: [AchievementsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
