import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReputationService } from '../reputation/reputation.service';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    private reputationService: ReputationService,
  ) {}

  async createPost(createPostDto: CreatePostDto, author: User): Promise<Post> {
    const post = this.postRepository.create({
      ...createPostDto,
      author,
    });
    
    const savedPost = await this.postRepository.save(post);
    
    // Update reputation for creating a post
    await this.reputationService.updateUserReputation(author.id, 'POST_CREATED');
    
    return savedPost;
  }

  async findAllPosts(): Promise<Post[]> {
    const posts = await this.postRepository.find({
      relations: ['author', 'author.reputationScore', 'author.badges', 'comments'],
      order: { createdAt: 'DESC' },
    });

    // Sort by reputation-influenced visibility
    return posts.sort((a, b) => {
      const aReputation = a.author.reputationScore?.totalScore || 0;
      const bReputation = b.author.reputationScore?.totalScore || 0;
      
      // Posts from higher reputation users get slight boost
      const aScore = a.votes + (aReputation / 100);
      const bScore = b.votes + (bReputation / 100);
      
      return bScore - aScore;
    });
  }

  async findOnePost(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'author.reputationScore', 'author.badges', 'comments', 'comments.author', 'comments.author.reputationScore', 'comments.author.badges'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async createComment(postId: number, createCommentDto: CreateCommentDto, author: User): Promise<Comment> {
    const post = await this.findOnePost(postId);
    
    const comment = this.commentRepository.create({
      ...createCommentDto,
      post,
      author,
    });
    
    const savedComment = await this.commentRepository.save(comment);
    
    // Update reputation for creating a comment
    await this.reputationService.updateUserReputation(author.id, 'COMMENT_CREATED');
    
    return savedComment;
  }

  async votePost(postId: number, userId: number, voteType: 'up' | 'down'): Promise<Post> {
    const post = await this.findOnePost(postId);
    
    const voteValue = voteType === 'up' ? 1 : -1;
    post.votes += voteValue;
    
    const updatedPost = await this.postRepository.save(post);
    
    // Update reputation for the post author
    const reputationAction = voteType === 'up' ? 'POST_UPVOTED' : 'POST_DOWNVOTED';
    await this.reputationService.updateUserReputation(post.author.id, reputationAction);
    
    return updatedPost;
  }

  async deletePost(id: number, user: User): Promise<void> {
    const post = await this.findOnePost(id);
    
    // Check if user owns the post or has moderation privileges
    const userReputationScore = await this.reputationService.getUserReputation(user.id);
    const canModerate = userReputationScore.totalScore >= 1000; // Reputation threshold for moderation
    
    if (post.author.id !== user.id && !canModerate && user.role !== 'moderator' && user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own posts or need moderation privileges');
    }
    
    await this.postRepository.remove(post);
  }
}