import { IsEnum, IsUUID, IsOptional, IsString } from "class-validator";
import { FlagReason } from "../entities/tag-flag.entity";

export class FlagTagDto {
  @IsUUID()
  tagId: string;

  @IsEnum(FlagReason)
  reason: FlagReason;

  @IsOptional()
  @IsString()
  description?: string;
}
