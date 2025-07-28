import { Injectable } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type GovernanceAlert, AlertType, AlertSeverity } from "../entities/governance-alert.entity"
import type { Proposal } from "../entities/proposal.entity"
import type { Vote } from "../entities/vote.entity"

@Injectable()
export class AlertService {
  private alertRepository: Repository<GovernanceAlert>

  constructor(alertRepository: Repository<GovernanceAlert>) {
    this.alertRepository = alertRepository
  }

  async createHighImpactProposalAlert(proposal: Proposal): Promise<GovernanceAlert> {
    const alert = this.alertRepository.create({
      type: AlertType.HIGH_IMPACT_PROPOSAL,
      severity: AlertSeverity.HIGH,
      protocol: proposal.protocol,
      title: `High Impact Proposal: ${proposal.title}`,
      description: `A high-impact governance proposal has been created in ${proposal.protocol}`,
      data: {
        proposalId: proposal.id,
        proposer: proposal.proposer,
        endTime: proposal.endTime,
      },
    })

    return this.alertRepository.save(alert)
  }

  async createLargeVoteAlert(vote: Vote, proposal: Proposal): Promise<GovernanceAlert> {
    const alert = this.alertRepository.create({
      type: AlertType.LARGE_VOTE,
      severity: AlertSeverity.MEDIUM,
      protocol: proposal.protocol,
      title: `Large Vote Cast: ${vote.votingPower.toLocaleString()} tokens`,
      description: `A large vote has been cast on proposal "${proposal.title}"`,
      data: {
        proposalId: proposal.id,
        voter: vote.voter,
        votingPower: vote.votingPower,
        choice: vote.choice,
      },
    })

    return this.alertRepository.save(alert)
  }

  async createCloseVoteAlert(proposal: Proposal): Promise<GovernanceAlert> {
    const totalVotes = proposal.forVotes + proposal.againstVotes
    const margin = Math.abs(proposal.forVotes - proposal.againstVotes) / totalVotes

    if (margin < 0.05) {
      // Less than 5% margin
      const alert = this.alertRepository.create({
        type: AlertType.CLOSE_VOTE,
        severity: AlertSeverity.HIGH,
        protocol: proposal.protocol,
        title: `Close Vote: ${proposal.title}`,
        description: `Proposal has a very close vote margin (${(margin * 100).toFixed(1)}%)`,
        data: {
          proposalId: proposal.id,
          forVotes: proposal.forVotes,
          againstVotes: proposal.againstVotes,
          margin: margin,
        },
      })

      return this.alertRepository.save(alert)
    }

    return null
  }

  async createSentimentShiftAlert(
    proposalId: string,
    protocol: string,
    oldSentiment: number,
    newSentiment: number,
  ): Promise<GovernanceAlert> {
    const shift = Math.abs(newSentiment - oldSentiment)

    if (shift > 0.3) {
      // Significant sentiment shift
      const alert = this.alertRepository.create({
        type: AlertType.SENTIMENT_SHIFT,
        severity: shift > 0.5 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
        protocol,
        title: `Sentiment Shift Detected`,
        description: `Significant sentiment change detected in proposal discussions`,
        data: {
          proposalId,
          oldSentiment,
          newSentiment,
          shift,
        },
      })

      return this.alertRepository.save(alert)
    }

    return null
  }

  async getAlerts(protocol?: string, isRead?: boolean): Promise<GovernanceAlert[]> {
    const where: any = {}
    if (protocol) where.protocol = protocol
    if (isRead !== undefined) where.isRead = isRead

    return this.alertRepository.find({
      where,
      order: { createdAt: "DESC" },
    })
  }

  async markAsRead(id: string): Promise<GovernanceAlert> {
    await this.alertRepository.update(id, { isRead: true })
    return this.alertRepository.findOne({ where: { id } })
  }

  async getUnreadCount(protocol?: string): Promise<number> {
    const where: any = { isRead: false }
    if (protocol) where.protocol = protocol

    return this.alertRepository.count({ where })
  }
}
