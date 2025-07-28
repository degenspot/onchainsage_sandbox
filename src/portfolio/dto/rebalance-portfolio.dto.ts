import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { RebalancingActionType } from "../entities/rebalancing-suggestion.entity"

export class RebalancingActionDto {
  @IsEnum(RebalancingActionType)
  type: RebalancingActionType

  @IsString()
  symbol: string

  @IsNumber()
  amountUSD: number // Amount in USD to buy/sell
}

export class RebalancePortfolioDto {
  @IsString()
  portfolioId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RebalancingActionDto)
  actions: RebalancingActionDto[]

  @IsString()
  @IsOptional()
  suggestionId?: string // If rebalancing based on a suggestion
}

export class SimulateRebalanceDto {
  @IsString()
  portfolioId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RebalancingActionDto)
  actions: RebalancingActionDto[]

  @IsString()
  @IsOptional()
  notes?: string
}
