import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Proposal } from "./entities/proposal.entity"
import { Vote } from "./entities/vote.entity"
import { ProposalDiscussion } from "./entities/proposal-discussion.entity"
import { GovernanceAlert } from "./entities/governance-alert.entity"
import { ProposalService } from "./services/proposal.service"
import { VoteService } from "./services/vote.service"
import { SentimentAnalysisService } from "./services/sentiment-analysis.service"
import { AlertService } from "./services/alert.service"
import { GovernanceAnalyticsService } from "./services/governance-analytics.service"
import { GovernanceController } from "./controllers/governance.controller"

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, Vote, ProposalDiscussion, GovernanceAlert])],
  controllers: [GovernanceController],
  providers: [ProposalService, VoteService, SentimentAnalysisService, AlertService, GovernanceAnalyticsService],
  exports: [ProposalService, VoteService, SentimentAnalysisService, AlertService, GovernanceAnalyticsService],
})
export class GovernanceModule {}
