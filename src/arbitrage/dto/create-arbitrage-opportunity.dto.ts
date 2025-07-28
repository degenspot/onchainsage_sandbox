import { IsString, IsNumber, IsBoolean, IsOptional, IsObject } from "class-validator"

export class CreateArbitrageOpportunityDto {
  @IsString()
  tokenPair: string

  @IsString()
  chain1: string

  @IsString()
  dex1: string

  @IsNumber()
  price1: number

  @IsString()
  chain2: string

  @IsString()
  dex2: string

  @IsNumber()
  price2: number

  @IsNumber()
  priceDifferencePercentage: number

  @IsNumber()
  @IsOptional()
  potentialProfitUSD?: number

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}
