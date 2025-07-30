import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsController } from './news-verification.controller';
import { NewsArticle } from './entities/news-article.entity';
import { Vote } from './entities/vote.entity';
import { User } from './entities/user.entity';
import { NewsService } from './news-verification.service';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NewsArticle, Vote, User])
  ],
  controllers: [NewsController],
  providers: [NewsService, BlockchainService],
  exports: [NewsService]
})
export class NewsModule {}