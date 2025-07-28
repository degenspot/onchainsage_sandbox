import { IsString, IsOptional, IsDateString, IsNumberString } from "class-validator"

export class TokenQualityScoreQueryDto {
  @IsString()
  @IsOptional()
  tokenSymbol?: string

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsNumberString()
  @IsOptional()
  limit?: string
}
