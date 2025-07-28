import { IsString, IsEnum, IsDateString, IsOptional, IsNumber, IsObject, IsBoolean } from "class-validator"
import { ProposalStatus, ProposalType } from "../entities/proposal.entity"

export class CreateProposalDto {
  @IsString()
  proposalId: string

  @IsString()
  protocol: string

  @IsString()
  title: string

  @IsString()
  description: string

  @IsString()
  proposer: string

  @IsEnum(ProposalStatus)
  @IsOptional()
  status?: ProposalStatus

  @IsEnum(ProposalType)
  @IsOptional()
  type?: ProposalType

  @IsDateString()
  startTime: string

  @IsDateString()
  endTime: string

  @IsNumber()
  @IsOptional()
  forVotes?: number

  @IsNumber()
  @IsOptional()
  againstVotes?: number

  @IsNumber()
  @IsOptional()
  abstainVotes?: number

  @IsNumber()
  @IsOptional()
  quorum?: number

  @IsNumber()
  @IsOptional()
  totalVotingPower?: number

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>

  @IsNumber()
  @IsOptional()
  sentimentScore?: number

  @IsBoolean()
  @IsOptional()
  isHighImpact?: boolean
}
