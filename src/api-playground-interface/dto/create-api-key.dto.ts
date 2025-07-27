import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  permissions?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiresInDays?: number;

  @ApiProperty({ required: false, default: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  rateLimitPerHour?: number;
}