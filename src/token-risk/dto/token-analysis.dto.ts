import { IsEthereumAddress, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class TokenAnalysisDto {
  @IsEthereumAddress()
  tokenAddress: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  riskThreshold?: number = 70;
}

export class BulkAnalysisDto {
  @IsEthereumAddress({ each: true })
  tokenAddresses: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  riskThreshold?: number = 70;
}