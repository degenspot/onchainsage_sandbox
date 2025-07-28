import { Injectable } from "@nestjs/common"
import type { ProposalService } from "./proposal.service"
import type { VoteService } from "./vote.service"
import type { SentimentAnalysisService } from "./sentiment-analysis.service"
import type { AlertService } from "./alert.service"
import type { GovernanceAnalyticsQueryDto } from "../dto/governance-analytics.dto"

@Injectable()
export class GovernanceAnalyticsService {
  constructor(
    private proposalService: ProposalService,
    private voteService: VoteService,
    private sentimentAnalysisService: SentimentAnalysisService,
    private alertService: AlertService,
  ) {}

  async getComprehensiveAnalytics(query: GovernanceAnalyticsQueryDto) {
    const [proposals, trends, influentialVoters, highImpactProposals, activeProposals] = await Promise.all([
      this.proposalService.findAll(query),
      this.proposalService.getProposalTrends(query),
      this.voteService.getInfluentialVoters(20),
      this.proposalService.getHighImpactProposals(),
      this.proposalService.getActiveProposals(),
    ])

    // Get sentiment analysis for active proposals
    const activeSentiments = await Promise.all(
      activeProposals.map((proposal) => this.sentimentAnalysisService.analyzeProposalSentiment(proposal.id)),
    )

    return {
      summary: {
        totalProposals: proposals.length,
        activeProposals: activeProposals.length,
        highImpactProposals: highImpactProposals.length,
        topInfluentialVoters: influentialVoters.slice(0, 5),
      },
      trends,
      influentialVoters,
      highImpactProposals,
      activeProposals: activeProposals.map((proposal, index) => ({
        ...proposal,
        sentiment: activeSentiments[index],
      })),
      protocolBreakdown: this.getProtocolBreakdown(proposals),
    }
  }

  private getProtocolBreakdown(proposals: any[]) {
    const breakdown = new Map<string, any>()

    proposals.forEach((proposal) => {
      if (!breakdown.has(proposal.protocol)) {
        breakdown.set(proposal.protocol, {
          protocol: proposal.protocol,
          totalProposals: 0,
          activeProposals: 0,
          successRate: 0,
          totalVotes: 0,
        })
      }

      const stats = breakdown.get(proposal.protocol)
      stats.totalProposals++

      if (proposal.status === "active") {
        stats.activeProposals++
      }

      if (proposal.status === "succeeded") {
        stats.successRate++
      }

      stats.totalVotes += proposal.votes?.length || 0
    })

    // Calculate success rates
    breakdown.forEach((stats) => {
      stats.successRate = stats.totalProposals > 0 ? stats.successRate / stats.totalProposals : 0
    })

    return Array.from(breakdown.values()).sort((a, b) => b.totalProposals - a.totalProposals)
  }

  async detectAnomalies() {
    const [largeVotes, activeProposals] = await Promise.all([
      this.voteService.getLargeVotes(1000000), // 1M+ voting power
      this.proposalService.getActiveProposals(),
    ])

    const anomalies = {
      largeVotes: largeVotes.slice(0, 10),
      closeVotes: [],
      unusualActivity: [],
    }

    // Check for close votes
    for (const proposal of activeProposals) {
      const totalVotes = proposal.forVotes + proposal.againstVotes
      if (totalVotes > 0) {
        const margin = Math.abs(proposal.forVotes - proposal.againstVotes) / totalVotes
        if (margin < 0.1) {
          // Less than 10% margin
          anomalies.closeVotes.push({
            proposal,
            margin: margin * 100,
          })
        }
      }
    }

    return anomalies
  }
}
