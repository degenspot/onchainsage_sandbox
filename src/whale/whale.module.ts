import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { WhaleTransaction } from "./entities/whale-transaction.entity"
import { BlockchainNode } from "./entities/blockchain-node.entity"
import { WhaleAlert } from "./entities/whale-alert.entity"
import { BlockchainMonitorService } from "./services/blockchain-monitor.service"
import { WhaleTransactionService } from "./services/whale-transaction.service"
import { WhaleAlertService } from "./services/whale-alert.service"
import { WhaleAnalyticsService } from "./services/whale-analytics.service"
import { WhaleController } from "./controllers/whale.controller"

@Module({
  imports: [TypeOrmModule.forFeature([WhaleTransaction, BlockchainNode, WhaleAlert])],
  controllers: [WhaleController],
  providers: [BlockchainMonitorService, WhaleTransactionService, WhaleAlertService, WhaleAnalyticsService],
  exports: [BlockchainMonitorService, WhaleTransactionService, WhaleAlertService, WhaleAnalyticsService],
})
export class WhaleModule {}
