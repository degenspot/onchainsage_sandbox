import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator"

export class CreateTokenDto {
  @IsString()
  @IsNotEmpty()
  symbol: string // e.g., "BTC", "ETH"

  @IsString()
  @IsNotEmpty()
  name: string // e.g., "Bitcoin", "Ethereum"
}

export class UpdateTokenDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsNumber()
  @IsOptional()
  currentQualityScore?: number
}
