import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { CommunityHealthController } from './controllers/community-health.controller';
import { CommunityHealthService } from './services/community-health.service';
import { DiscordService } from './services/discord.service';
import { TelegramService } from './services/telegram.service';
import { MetricsService } from './services/metrics.service';
import { AlertService } from './services/alert.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [CommunityHealthController],
  providers: [
    CommunityHealthService,
    DiscordService,
    TelegramService,
    MetricsService,
    AlertService,
  ],
  exports: [CommunityHealthService],
})
export class CommunityHealthModule {}