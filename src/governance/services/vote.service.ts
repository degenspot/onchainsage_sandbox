import { Injectable } from "@nestjs/common"
import type { Repository } from "typeorm"
import { type Vote, VoteChoice } from "../entities/vote.entity"
import type { CreateVoteDto } from "../dto/create-vote.dto"
import type { VoterInfluenceDto } from "../dto/governance-analytics.dto"

@Injectable()
export class VoteService {
  private voteRepository: Repository<Vote>

  constructor(voteRepository: Repository<Vote>) {
    this.voteRepository = voteRepository
  }

  async create(createVoteDto: CreateVoteDto): Promise<Vote> {
    const vote = this.voteRepository.create({
      ...createVoteDto,
      timestamp: new Date(createVoteDto.timestamp),
    })
    return this.voteRepository.save(vote)
  }

  async findByProposal(proposalId: string): Promise<Vote[]> {
    return this.voteRepository.find({
      where: { proposalId },
      relations: ["proposal"],
      order: { votingPower: "DESC" },
    })
  }

  async findByVoter(voter: string): Promise<Vote[]> {
    return this.voteRepository.find({
      where: { voter },
      relations: ["proposal"],
      order: { timestamp: "DESC" },
    })
  }

  async getInfluentialVoters(limit = 50): Promise<VoterInfluenceDto[]> {
    const results = await this.voteRepository
      .createQueryBuilder("vote")
      .select([
        "vote.voter as voter",
        "SUM(vote.votingPower) as totalVotingPower",
        "COUNT(DISTINCT vote.proposalId) as proposalsVoted",
        "AVG(vote.votingPower) as averageVotingPower",
        "COUNT(DISTINCT proposal.protocol) as protocolCount",
      ])
      .leftJoin("vote.proposal", "proposal")
      .groupBy("vote.voter")
      .orderBy("totalVotingPower", "DESC")
      .limit(limit)
      .getRawMany()

    // Calculate win rate for each voter
    const votersWithWinRate = await Promise.all(
      results.map(async (result) => {
        const winRate = await this.calculateVoterWinRate(result.voter)
        const protocols = await this.getVoterProtocols(result.voter)

        return {
          voter: result.voter,
          totalVotingPower: Number.parseFloat(result.totalVotingPower),
          proposalsVoted: Number.parseInt(result.proposalsVoted),
          winRate,
          averageVotingPower: Number.parseFloat(result.averageVotingPower),
          protocols,
        }
      }),
    )

    return votersWithWinRate
  }

  private async calculateVoterWinRate(voter: string): Promise<number> {
    const votes = await this.voteRepository.find({
      where: { voter },
      relations: ["proposal"],
    })

    if (votes.length === 0) return 0

    const winningVotes = votes.filter((vote) => {
      const proposal = vote.proposal
      if (proposal.status !== "succeeded" && proposal.status !== "defeated") {
        return false
      }

      const isWinning =
        (vote.choice === VoteChoice.FOR && proposal.forVotes > proposal.againstVotes) ||
        (vote.choice === VoteChoice.AGAINST && proposal.againstVotes > proposal.forVotes)

      return isWinning
    })

    return winningVotes.length / votes.length
  }

  private async getVoterProtocols(voter: string): Promise<string[]> {
    const results = await this.voteRepository
      .createQueryBuilder("vote")
      .select("DISTINCT proposal.protocol", "protocol")
      .leftJoin("vote.proposal", "proposal")
      .where("vote.voter = :voter", { voter })
      .getRawMany()

    return results.map((r) => r.protocol)
  }

  async getLargeVotes(threshold = 1000000): Promise<Vote[]> {
    return this.voteRepository.find({
      where: {
        votingPower: threshold,
      },
      relations: ["proposal"],
      order: { votingPower: "DESC" },
    })
  }

  async getVotesByChoice(proposalId: string): Promise<Record<VoteChoice, Vote[]>> {
    const votes = await this.findByProposal(proposalId)

    return {
      [VoteChoice.FOR]: votes.filter((v) => v.choice === VoteChoice.FOR),
      [VoteChoice.AGAINST]: votes.filter((v) => v.choice === VoteChoice.AGAINST),
      [VoteChoice.ABSTAIN]: votes.filter((v) => v.choice === VoteChoice.ABSTAIN),
    }
  }
}
