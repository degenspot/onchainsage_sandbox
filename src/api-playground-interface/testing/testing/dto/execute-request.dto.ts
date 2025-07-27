import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsIn } from 'class-validator';

export class ExecuteRequestDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty({ enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] })
  @IsIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
  method: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  queryParams?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  pathParams?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  body?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiKey?: string;
}