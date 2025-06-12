import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WhaleMonitoringService } from './whale-monitoring.service';
import { WhaleMonitoringController } from './whale-monitoring.controller';
import { WhaleMonitoringGateway } from './whale-monitoring.gateway';
import { WhaleTransaction } from './entities/whale-transaction.entity';
import { WhaleWallet } from './entities/whale-wallet.entity';
import { NotificationService } from './notification.service';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhaleTransaction, WhaleWallet]),
    ScheduleModule.forRoot(),
  ],
  controllers: [WhaleMonitoringController],
  providers: [
    WhaleMonitoringService,
    WhaleMonitoringGateway,
    NotificationService,
    BlockchainService,
  ],
  exports: [WhaleMonitoringService],
})
export class WhaleMonitoringModule {}
