import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NewsService } from './news-verification.service';
import { CreateArticleDto, VoteDto } from './dto/create-article.dto';
import { NewsArticle } from './entities/news-article.entity';
import { GetArticlesDto } from './dto/get-articles.dto';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post('submit')

  async submitArticle(@Body() createArticleDto: CreateArticleDto, @Request() req): Promise<NewsArticle> {
    return this.newsService.submitArticle(createArticleDto, req.user.id);
  }

  @Post('vote')

  async voteOnArticle(@Body() voteDto: VoteDto, @Request() req): Promise<{ success: boolean; newScore: number }> {
    return this.newsService.voteOnArticle(voteDto, req.user.id);
  }

  @Get()
  async getArticles(@Query() query: GetArticlesDto): Promise<{ articles: NewsArticle[]; total: number; hasMore: boolean }> {
    return this.newsService.getArticles(query);
  }

  @Get('verified')
  async getVerifiedArticles(@Query() query: GetArticlesDto): Promise<{ articles: NewsArticle[]; total: number; hasMore: boolean }> {
    query.status = 'verified';
    return this.newsService.getArticles(query);
  }

  @Get('flagged')
  async getFlaggedArticles(@Query() query: GetArticlesDto): Promise<{ articles: NewsArticle[]; total: number; hasMore: boolean }> {
    const falseNews = await this.newsService.getArticles({ ...query, status: 'false' });
    const misleading = await this.newsService.getArticles({ ...query, status: 'misleading' });
    
    return {
      articles: [...falseNews.articles, ...misleading.articles],
      total: falseNews.total + misleading.total,
      hasMore: falseNews.hasMore || misleading.hasMore
    };
  }

  @Get(':id')
  async getArticleById(@Param('id') id: string): Promise<NewsArticle> {
    return this.newsService.getArticleById(id);
  }
}