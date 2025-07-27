import { IsString, IsObject, IsDateString, IsOptional } from 'class-validator';

export class TestSignalDto {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}