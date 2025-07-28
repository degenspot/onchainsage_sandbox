import { IsString, IsNumber } from "class-validator"

export class AddPortfolioAssetDto {
  @IsString()
  symbol: string

  @IsNumber()
  quantity: number

  @IsNumber()
  currentPriceUSD: number

  @IsNumber()
  averageCostUSD: number
}
