import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTokenDto {
  @ApiProperty()
  @IsString()
  symbol: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contractAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coingeckoId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isTracked?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}
