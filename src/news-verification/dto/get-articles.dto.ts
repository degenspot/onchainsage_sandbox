import { IsString, IsUrl, IsOptional, IsEnum, IsUUID } from 'class-validator';
export class GetArticlesDto {
  @IsOptional()
  @IsEnum(['pending', 'verified', 'false', 'misleading', 'all'])
  status?: string = 'all';

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['newest', 'oldest', 'most_voted', 'controversial'])
  sortBy?: string = 'newest';
}