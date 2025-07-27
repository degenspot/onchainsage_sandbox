import { IsString, IsEnum, IsObject, IsArray, IsOptional } from 'class-validator';
import { ComponentType } from '../entities/signal-component.entity';

export class CreateSignalComponentDto {
  @IsEnum(ComponentType)
  type: ComponentType;

  @IsString()
  name: string;

  @IsObject()
  config: Record<string, any>;

  @IsObject()
  position: { x: number; y: number };

  @IsOptional()
  @IsArray()
  connections?: string[];
}