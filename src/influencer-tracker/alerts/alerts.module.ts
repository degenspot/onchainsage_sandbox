import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { Alert } from '../entities/alert.entity';
import { MentionsModule } from '../mentions/mentions.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert]),
    MentionsModule,
    MarketDataModule,
    WebsocketModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}