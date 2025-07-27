import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { SignalStatus } from '../entities/signal.entity';

export class SignalQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SignalStatus)
  status?: SignalStatus;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  creatorId?: string;
}
