import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GovernanceController } from "./governance.controller";
import { GovernanceService } from "./governance.service";
import { BlockchainService } from "./blockchain.service";
import { Poll } from "./entities/poll.entity";
import { Vote } from "./entities/vote.entity";
import { GovernanceGateway } from "./governance.gateway";

@Module({
  imports: [TypeOrmModule.forFeature([Poll, Vote])],
  controllers: [GovernanceController],
  providers: [GovernanceService, BlockchainService, GovernanceGateway],
  exports: [GovernanceService],
})
export class GovernanceModule {}
