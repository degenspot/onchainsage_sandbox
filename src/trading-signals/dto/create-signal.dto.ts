import { IsString, IsOptional, IsObject, IsBoolean, IsEnum } from 'class-validator';
import { SignalStatus } from '../entities/signal.entity';

export class CreateSignalDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  configuration: Record<string, any>;

  @IsObject()
  layout: Record<string, any>;

  @IsOptional()
  @IsEnum(SignalStatus)
  status?: SignalStatus;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}