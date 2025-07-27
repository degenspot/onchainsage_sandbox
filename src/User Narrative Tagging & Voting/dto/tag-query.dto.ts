import { IsOptional, IsString, IsNumber, Min, IsEnum } from "class-validator";
import { Transform, Type } from "class-transformer";
import { TagStatus } from "../entities/tag.entity";

export class TagQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  narrativeId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(TagStatus)
  status?: TagStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: "score" | "createdAt" | "upvotes" = "score";

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC" = "DESC";
}
