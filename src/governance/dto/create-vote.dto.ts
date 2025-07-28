import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsObject } from "class-validator"
import { VoteChoice } from "../entities/vote.entity"

export class CreateVoteDto {
  @IsString()
  voter: string

  @IsEnum(VoteChoice)
  choice: VoteChoice

  @IsNumber()
  votingPower: number

  @IsString()
  @IsOptional()
  reason?: string

  @IsDateString()
  timestamp: string

  @IsString()
  proposalId: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}
