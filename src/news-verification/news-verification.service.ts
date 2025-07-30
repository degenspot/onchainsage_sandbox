import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsArticle } from './entities/news-article.entity';
import { Vote } from './entities/vote.entity';
import { User } from './entities/user.entity';
import { BlockchainService } from './blockchain.service';
import { CreateArticleDto, VoteDto } from './dto/create-article.dto';
import { GetArticlesDto } from './dto/get-articles.dto';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsArticle)
    private articleRepository: Repository<NewsArticle>,
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private blockchainService: BlockchainService
  ) {}

  async submitArticle(createArticleDto: CreateArticleDto, userId: string): Promise<NewsArticle> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for duplicate articles by URL
    const existingArticle = await this.articleRepository.findOne({
      where: { sourceUrl: createArticleDto.sourceUrl }
    });

    if (existingArticle) {
      throw new ConflictException('Article from this source already exists');
    }

    const article = this.articleRepository.create({
      ...createArticleDto,
      submittedBy: user
    });

    const savedArticle = await this.articleRepository.save(article);

    // Log submission on blockchain
    try {
      const txHash = await this.blockchainService.logArticleSubmission(
        savedArticle.id,
        userId,
        createArticleDto.sourceUrl
      );
      savedArticle.blockchainTxHash = txHash;
      await this.articleRepository.save(savedArticle);
    } catch (error) {
      console.error('Blockchain logging failed:', error);
    }

    return savedArticle;
  }

  async voteOnArticle(voteDto: VoteDto, userId: string): Promise<{ success: boolean; newScore: number }> {
    const article = await this.articleRepository.findOne({ where: { id: voteDto.articleId } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already voted
    const existingVote = await this.voteRepository.findOne({
      where: { userId, articleId: voteDto.articleId }
    });

    if (existingVote) {
      if (existingVote.voteType === voteDto.voteType) {
        throw new BadRequestException('You have already cast this vote');
      }
      // Change vote
      await this.updateVoteCount(article, existingVote.voteType, 'remove');
      existingVote.voteType = voteDto.voteType;
      await this.voteRepository.save(existingVote);
    } else {
      // New vote
      const vote = this.voteRepository.create({
        ...voteDto,
        userId,
        articleId: voteDto.articleId,
        user,
        article
      });
      await this.voteRepository.save(vote);
    }

    // Update article vote counts
    await this.updateVoteCount(article, voteDto.voteType, 'add');
    await this.updateVerificationStatus(article);

    // Log vote on blockchain
    try {
      const txHash = await this.blockchainService.logVote(
        voteDto.articleId,
        userId,
        voteDto.voteType
      );
      // Could store this txHash in vote record if needed
    } catch (error) {
      console.error('Blockchain vote logging failed:', error);
    }

    const updatedArticle = await this.articleRepository.findOne({ where: { id: voteDto.articleId } });
    if (!updatedArticle) {
      throw new NotFoundException('Article not found after voting');
    }
    return { success: true, newScore: updatedArticle.verificationScore };
  }

  private async updateVoteCount(article: NewsArticle, voteType: 'up' | 'down', action: 'add' | 'remove'): Promise<void> {
    const increment = action === 'add' ? 1 : -1;
    
    if (voteType === 'up') {
      article.upvotes += increment;
      article.verificationScore += increment;
    } else {
      article.downvotes += increment;
      article.verificationScore -= increment;
    }
    
    article.totalVotes = article.upvotes + article.downvotes;
    await this.articleRepository.save(article);
  }

  private async updateVerificationStatus(article: NewsArticle): Promise<void> {
    const VERIFICATION_THRESHOLD = 10;
    const FALSE_NEWS_THRESHOLD = -5;
    const MISLEADING_THRESHOLD = -3;

    if (article.verificationScore >= VERIFICATION_THRESHOLD && article.totalVotes >= 5) {
      article.verificationStatus = 'verified';
    } else if (article.verificationScore <= FALSE_NEWS_THRESHOLD) {
      article.verificationStatus = 'false';
    } else if (article.verificationScore <= MISLEADING_THRESHOLD) {
      article.verificationStatus = 'misleading';
    }

    await this.articleRepository.save(article);

    // Log status change on blockchain
    if (article.verificationStatus !== 'pending') {
      try {
        await this.blockchainService.logVerificationStatusChange(
          article.id,
          article.verificationStatus,
          article.verificationScore
        );
      } catch (error) {
        console.error('Blockchain status logging failed:', error);
      }
    }
  }

  async getArticles(query: GetArticlesDto): Promise<{ articles: NewsArticle[]; total: number; hasMore: boolean }> {
    const { status, page = 1, limit = 10, sortBy } = query;
    const skip = (page - 1) * limit;

    let queryBuilder = this.articleRepository.createQueryBuilder('article')
      .leftJoinAndSelect('article.submittedBy', 'user')
      .leftJoinAndSelect('article.votes', 'votes');

    // Filter by status
    if (status && status !== 'all') {
      queryBuilder = queryBuilder.where('article.verificationStatus = :status', { status });
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        queryBuilder = queryBuilder.orderBy('article.createdAt', 'DESC');
        break;
      case 'oldest':
        queryBuilder = queryBuilder.orderBy('article.createdAt', 'ASC');
        break;
      case 'most_voted':
        queryBuilder = queryBuilder.orderBy('article.totalVotes', 'DESC');
        break;
      case 'controversial':
        queryBuilder = queryBuilder.orderBy('ABS(article.verificationScore)', 'ASC')
          .addOrderBy('article.totalVotes', 'DESC');
        break;
      default:
        queryBuilder = queryBuilder.orderBy('article.createdAt', 'DESC');
    }

    const [articles, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      articles,
      total,
      hasMore: total > skip + articles.length
    };
  }

  async getArticleById(id: string): Promise<NewsArticle> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['submittedBy', 'votes', 'votes.user']
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }
}
