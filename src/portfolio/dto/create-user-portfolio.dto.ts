import { IsString, IsEnum, IsOptional, IsObject, IsBoolean } from "class-validator"
import { RiskProfile } from "../entities/user-portfolio.entity"

export class CreateUserPortfolioDto {
  @IsString()
  userId: string

  @IsString()
  @IsOptional()
  walletAddress?: string

  @IsEnum(RiskProfile)
  @IsOptional()
  riskProfile?: RiskProfile

  @IsObject()
  @IsOptional()
  targetAllocation?: Record<string, number>

  @IsBoolean()
  @IsOptional()
  autoRebalanceEnabled?: boolean
}

export class UpdateUserPortfolioDto {
  @IsString()
  @IsOptional()
  walletAddress?: string

  @IsEnum(RiskProfile)
  @IsOptional()
  riskProfile?: RiskProfile

  @IsObject()
  @IsOptional()
  targetAllocation?: Record<string, number>

  @IsBoolean()
  @IsOptional()
  autoRebalanceEnabled?: boolean
}
