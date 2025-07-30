import { IsString, IsEthereumAddress, IsOptional } from 'class-validator';

export class ConnectWalletDto {
  @IsEthereumAddress()
  address: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  message?: string;
}