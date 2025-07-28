import { IsString, IsNumber, IsEnum, IsOptional, IsObject } from "class-validator"
import { ArbitrageEventStatus } from "../entities/arbitrage-event.entity"

export class CreateArbitrageEventDto {
  @IsString()
  tokenPair: string

  @IsString()
  chain1: string

  @IsString()
  dex1: string

  @IsString()
  chain2: string

  @IsString()
  dex2: string

  @IsNumber()
  executedProfitUSD: number

  @IsEnum(ArbitrageEventStatus)
  @IsOptional()
  status?: ArbitrageEventStatus

  @IsString()
  @IsOptional()
  opportunityId?: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}
