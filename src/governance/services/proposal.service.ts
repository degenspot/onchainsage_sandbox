import { Injectable, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type Proposal, ProposalStatus } from "../entities/proposal.entity"
import type { CreateProposalDto } from "../dto/create-proposal.dto"
import type { GovernanceAnalyticsQueryDto, ProposalTrendDto } from "../dto/governance-analytics.dto"

@Injectable()
export class ProposalService {
  private proposalRepository: Repository<Proposal>

  constructor(proposalRepository: Repository<Proposal>) {
    this.proposalRepository = proposalRepository
  }

  async create(createProposalDto: CreateProposalDto): Promise<Proposal> {
    const proposal = this.proposalRepository.create({
      ...createProposalDto,
      startTime: new Date(createProposalDto.startTime),
      endTime: new Date(createProposalDto.endTime),
    })
    return this.proposalRepository.save(proposal)
  }

  async findAll(query: GovernanceAnalyticsQueryDto): Promise<Proposal[]> {
    const queryBuilder = this.proposalRepository.createQueryBuilder("proposal")

    if (query.protocol) {
      queryBuilder.andWhere("proposal.protocol = :protocol", { protocol: query.protocol })
    }

    if (query.protocols && query.protocols.length > 0) {
      queryBuilder.andWhere("proposal.protocol IN (:...protocols)", { protocols: query.protocols })
    }

    if (query.status) {
      queryBuilder.andWhere("proposal.status = :status", { status: query.status })
    }

    if (query.type) {
      queryBuilder.andWhere("proposal.type = :type", { type: query.type })
    }

    if (query.startDate && query.endDate) {
      queryBuilder.andWhere("proposal.createdAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      })
    }

    return queryBuilder
      .leftJoinAndSelect("proposal.votes", "votes")
      .leftJoinAndSelect("proposal.discussions", "discussions")
      .orderBy("proposal.createdAt", "DESC")
      .getMany()
  }

  async findOne(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ["votes", "discussions"],
    })

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${id} not found`)
    }

    return proposal
  }

  async findByProposalId(proposalId: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { proposalId },
      relations: ["votes", "discussions"],
    })

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${proposalId} not found`)
    }

    return proposal
  }

  async updateStatus(id: string, status: ProposalStatus): Promise<Proposal> {
    await this.proposalRepository.update(id, { status })
    return this.findOne(id)
  }

  async updateSentimentScore(id: string, sentimentScore: number): Promise<Proposal> {
    await this.proposalRepository.update(id, { sentimentScore })
    return this.findOne(id)
  }

  async markAsHighImpact(id: string): Promise<Proposal> {
    await this.proposalRepository.update(id, { isHighImpact: true })
    return this.findOne(id)
  }

  async getProposalTrends(query: GovernanceAnalyticsQueryDto): Promise<ProposalTrendDto[]> {
    const queryBuilder = this.proposalRepository.createQueryBuilder("proposal")

    if (query.protocols && query.protocols.length > 0) {
      queryBuilder.andWhere("proposal.protocol IN (:...protocols)", { protocols: query.protocols })
    }

    if (query.startDate && query.endDate) {
      queryBuilder.andWhere("proposal.createdAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      })
    }

    const results = await queryBuilder
      .select([
        "DATE_TRUNC('month', proposal.createdAt) as period",
        "COUNT(*) as totalProposals",
        "AVG(CASE WHEN proposal.status = :succeededStatus THEN 1.0 ELSE 0.0 END) as successRate",
        "AVG((proposal.forVotes + proposal.againstVotes + proposal.abstainVotes) / NULLIF(proposal.totalVotingPower, 0)) as averageParticipation",
      ])
      .setParameter("succeededStatus", ProposalStatus.SUCCEEDED)
      .groupBy("DATE_TRUNC('month', proposal.createdAt)")
      .orderBy("period", "ASC")
      .getRawMany()

    return results.map((result) => ({
      period: result.period,
      totalProposals: Number.parseInt(result.totalProposals),
      successRate: Number.parseFloat(result.successRate) || 0,
      averageParticipation: Number.parseFloat(result.averageParticipation) || 0,
      topProtocols: [], // This would require additional query
    }))
  }

  async getHighImpactProposals(): Promise<Proposal[]> {
    return this.proposalRepository.find({
      where: { isHighImpact: true },
      relations: ["votes", "discussions"],
      order: { createdAt: "DESC" },
    })
  }

  async getActiveProposals(): Promise<Proposal[]> {
    return this.proposalRepository.find({
      where: { status: ProposalStatus.ACTIVE },
      relations: ["votes"],
      order: { endTime: "ASC" },
    })
  }
}
