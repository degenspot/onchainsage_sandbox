import { IsString, IsOptional, IsDateString, IsArray, IsEnum } from "class-validator"
import { ProposalStatus, ProposalType } from "../entities/proposal.entity"

export class GovernanceAnalyticsQueryDto {
  @IsString()
  @IsOptional()
  protocol?: string

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsArray()
  @IsOptional()
  protocols?: string[]

  @IsEnum(ProposalStatus)
  @IsOptional()
  status?: ProposalStatus

  @IsEnum(ProposalType)
  @IsOptional()
  type?: ProposalType
}

export class VoterInfluenceDto {
  voter: string
  totalVotingPower: number
  proposalsVoted: number
  winRate: number
  averageVotingPower: number
  protocols: string[]
}

export class ProposalTrendDto {
  period: string
  totalProposals: number
  successRate: number
  averageParticipation: number
  topProtocols: Array<{ protocol: string; count: number }>
}

export class SentimentAnalysisDto {
  proposalId: string
  overallSentiment: number
  positiveComments: number
  negativeComments: number
  neutralComments: number
  sentimentTrend: Array<{ date: string; sentiment: number }>
}
