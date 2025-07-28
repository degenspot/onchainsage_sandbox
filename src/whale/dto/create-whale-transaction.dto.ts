import { IsString, IsNumber, IsBoolean, IsOptional, IsObject, IsDateString } from "class-validator"

export class CreateWhaleTransactionDto {
  @IsString()
  transactionHash: string

  @IsString()
  blockchain: string

  @IsString()
  fromAddress: string

  @IsString()
  toAddress: string

  @IsString()
  assetSymbol: string

  @IsNumber()
  amount: number

  @IsNumber()
  amountUSD: number

  @IsBoolean()
  @IsOptional()
  isWhaleTransaction?: boolean

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>

  @IsDateString()
  @IsOptional()
  timestamp?: string
}
