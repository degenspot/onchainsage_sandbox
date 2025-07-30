import { IsString, IsUrl, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsUrl()
  sourceUrl: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}

export class VoteDto {
  @IsUUID()
  articleId: string;

  @IsEnum(['up', 'down'])
  voteType: 'up' | 'down';
}