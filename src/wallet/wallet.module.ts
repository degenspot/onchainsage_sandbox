import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletHealthService } from './wallet-health.service';
import { RiskAnalysisService } from './risk-analysis.service';
import { NotificationService } from './notification.service';
import { Wallet } from './entities/wallet.entity';
import { WalletHealth } from './entities/wallet-health.entity';
import { RiskAlert } from './entities/risk-alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletHealth, RiskAlert])],
  controllers: [WalletController],
  providers: [WalletService, WalletHealthService, RiskAnalysisService, NotificationService],
  exports: [WalletService, WalletHealthService],
})
export class WalletModule {}