import { IsString, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePriceDataDto {
  @ApiProperty({ description: 'Token symbol', example: 'BTC' })
  @IsString()
  tokenSymbol: string;

  @ApiProperty({ description: 'Timestamp of the price data' })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty({ description: 'Token price', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Trading volume', minimum: 0 })
  @IsNumber()
  @Min(0)
  volume: number;

  @ApiProperty({ description: 'Market capitalization', minimum: 0 })
  @IsNumber()
  @Min(0)
  marketCap: number;

  @ApiProperty({ description: 'Price change percentage' })
  @IsNumber()
  priceChange: number;

  @ApiProperty({ description: 'Time interval', example: '1d' })
  @IsString()
  interval: string;
}
