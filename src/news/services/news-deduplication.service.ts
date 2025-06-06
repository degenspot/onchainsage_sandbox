import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { NewsArticle } from '../entities/news-article.entity';
import { textSimilarity } from '../../../common/utils/text-similarity.util';

@Injectable()
export class NewsDeduplicationService {
  constructor(
    @InjectRepository(NewsArticle)
    private readonly newsRepository: Repository<NewsArticle>,
  ) {}

  async isDuplicate(content: string): Promise<boolean> {
    const contentHash = this.generateContentHash(content);
    
    // Check exact hash match
    const exactMatch = await this.newsRepository.findOne({
      where: { contentHash }
    });
    
    if (exactMatch) return true;

    // Check similarity with recent articles (last 24 hours)
    const recentArticles = await this.newsRepository
      .createQueryBuilder('article')
      .where('article.createdAt > :date', { 
        date: new Date(Date.now() - 24 * 60 * 60 * 1000) 
      })
      .select(['article.content', 'article.title'])
      .getMany();

    // Check for similar content
    for (const article of recentArticles) {
      const similarity = textSimilarity(content, article.content);
      if (similarity > 0.85) {
        return true;
      }
    }

    return false;
  }

  generateContentHash(content: string): string {
    return createHash('sha256')
      .update(content.toLowerCase().replace(/\s+/g, ' ').trim())
      .digest('hex');
  }
}