import { Controller, Get, Post, Body, Param, Query, Put } from "@nestjs/common"
import type { ProposalService } from "../services/proposal.service"
import type { VoteService } from "../services/vote.service"
import type { SentimentAnalysisService } from "../services/sentiment-analysis.service"
import type { AlertService } from "../services/alert.service"
import type { GovernanceAnalyticsService } from "../services/governance-analytics.service"
import type { CreateProposalDto } from "../dto/create-proposal.dto"
import type { CreateVoteDto } from "../dto/create-vote.dto"
import type { GovernanceAnalyticsQueryDto } from "../dto/governance-analytics.dto"
import type { ProposalStatus } from "../entities/proposal.entity"

@Controller("governance")
export class GovernanceController {
  constructor(
    private proposalService: ProposalService,
    private voteService: VoteService,
    private sentimentAnalysisService: SentimentAnalysisService,
    private alertService: AlertService,
    private analyticsService: GovernanceAnalyticsService,
  ) {}

  @Post("proposals")
  async createProposal(createProposalDto: CreateProposalDto) {
    const proposal = await this.proposalService.create(createProposalDto)

    // Check if it's high impact and create alert
    if (proposal.isHighImpact) {
      await this.alertService.createHighImpactProposalAlert(proposal)
    }

    return proposal
  }

  @Get('proposals')
  async getProposals(@Query() query: GovernanceAnalyticsQueryDto) {
    return this.proposalService.findAll(query);
  }

  @Get('proposals/:id')
  async getProposal(@Param('id') id: string) {
    return this.proposalService.findOne(id);
  }

  @Put("proposals/:id/status")
  async updateProposalStatus(@Param('id') id: string, @Body('status') status: ProposalStatus) {
    return this.proposalService.updateStatus(id, status)
  }

  @Post("votes")
  async createVote(createVoteDto: CreateVoteDto) {
    const vote = await this.voteService.create(createVoteDto)

    // Check for large vote alert
    if (vote.votingPower > 1000000) {
      const proposal = await this.proposalService.findOne(vote.proposalId)
      await this.alertService.createLargeVoteAlert(vote, proposal)
    }

    return vote
  }

  @Get('proposals/:id/votes')
  async getProposalVotes(@Param('id') id: string) {
    return this.voteService.findByProposal(id);
  }

  @Get('voters/:address')
  async getVoterHistory(@Param('address') address: string) {
    return this.voteService.findByVoter(address);
  }

  @Get('analytics/influential-voters')
  async getInfluentialVoters(@Query('limit') limit?: number) {
    return this.voteService.getInfluentialVoters(limit ? Number.parseInt(limit) : 50);
  }

  @Get('analytics/trends')
  async getProposalTrends(@Query() query: GovernanceAnalyticsQueryDto) {
    return this.proposalService.getProposalTrends(query);
  }

  @Get('analytics/comprehensive')
  async getComprehensiveAnalytics(@Query() query: GovernanceAnalyticsQueryDto) {
    return this.analyticsService.getComprehensiveAnalytics(query);
  }

  @Get("analytics/anomalies")
  async getAnomalies() {
    return this.analyticsService.detectAnomalies()
  }

  @Get('proposals/:id/sentiment')
  async getProposalSentiment(@Param('id') id: string) {
    return this.sentimentAnalysisService.analyzeProposalSentiment(id);
  }

  @Post("proposals/:id/discussions")
  async createDiscussion(
    @Param('id') id: string,
    @Body() body: { author: string; content: string; platform?: string },
  ) {
    return this.sentimentAnalysisService.createDiscussion(id, body.author, body.content, body.platform)
  }

  @Get('proposals/:id/discussions')
  async getProposalDiscussions(@Param('id') id: string) {
    return this.sentimentAnalysisService.getDiscussionsByProposal(id);
  }

  @Get("alerts")
  async getAlerts(@Query('protocol') protocol?: string, @Query('isRead') isRead?: string) {
    return this.alertService.getAlerts(protocol, isRead ? isRead === "true" : undefined)
  }

  @Put('alerts/:id/read')
  async markAlertAsRead(@Param('id') id: string) {
    return this.alertService.markAsRead(id);
  }

  @Get('alerts/unread-count')
  async getUnreadAlertCount(@Query('protocol') protocol?: string) {
    const count = await this.alertService.getUnreadCount(protocol);
    return { count };
  }
}
