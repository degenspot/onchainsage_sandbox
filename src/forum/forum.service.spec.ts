import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ForumService } from './forum.service';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { ReputationService } from '../reputation/reputation.service';
import { User, UserRole } from '../users/entities/user.entity';

describe('ForumService', () => {
  let service: ForumService;
  let postRepository: jest.Mocked<Repository<Post>>;
  let commentRepository: jest.Mocked<Repository<Comment>>;
  let reputationService: jest.Mocked<ReputationService>;

  beforeEach(async () => {
    const mockPostRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const mockCommentRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockReputationService = {
      updateUserReputation: jest.fn(),
      getUserReputation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumService,
        { provide: getRepositoryToken(Post), useValue: mockPostRepository },
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepository },
        { provide: ReputationService, useValue: mockReputationService },
      ],
    }).compile();

    service = module.get<ForumService>(ForumService);
    postRepository = module.get(getRepositoryToken(Post));
    commentRepository = module.get(getRepositoryToken(Comment));
    reputationService = module.get(ReputationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a new post and update reputation', async () => {
      const createPostDto = { title: 'Test Post', content: 'Test content' };
      const author = { id: 1, walletAddress: '0x123' } as User;
      const post = { id: 1, ...createPostDto, author };

      postRepository.create.mockReturnValue(post as any);
      postRepository.save.mockResolvedValue(post as any);
      reputationService.updateUserReputation.mockResolvedValue({} as any);

      const result = await service.createPost(createPostDto, author);

      expect(postRepository.create).toHaveBeenCalledWith({ ...createPostDto, author });
      expect(postRepository.save).toHaveBeenCalledWith(post);
      expect(reputationService.updateUserReputation).toHaveBeenCalledWith(author.id, 'POST_CREATED');
      expect(result).toEqual(post);
    });
  });

  describe('findOnePost', () => {
    it('should throw NotFoundException when post not found', async () => {
      postRepository.findOne.mockResolvedValue(null);

      await expect(service.findOnePost(1)).rejects.toThrow(NotFoundException);
    });

    it('should return post when found', async () => {
      const post = { id: 1, title: 'Test Post' };
      postRepository.findOne.mockResolvedValue(post as any);

      const result = await service.findOnePost(1);

      expect(result).toEqual(post);
    });
  });

  describe('deletePost', () => {
    it('should throw ForbiddenException when user cannot delete post', async () => {
      const post = { id: 1, author: { id: 2 } };
      const user = { id: 1, role: UserRole.USER } as User;

      postRepository.findOne.mockResolvedValue(post as any);
      reputationService.getUserReputation.mockResolvedValue({ totalScore: 100 } as any);

      await expect(service.deletePost(1, user)).rejects.toThrow(ForbiddenException);
    });

    it('should allow post author to delete their own post', async () => {
      const post = { id: 1, author: { id: 1 } };
      const user = { id: 1, role: UserRole.USER } as User;

      postRepository.findOne.mockResolvedValue(post as any);
      postRepository.remove.mockResolvedValue({} as any);

      await service.deletePost(1, user);

      expect(postRepository.remove).toHaveBeenCalledWith(post);
    });

    it('should allow high reputation users to delete posts', async () => {
      const post = { id: 1, author: { id: 2 } };
      const user = { id: 1, role: UserRole.USER } as User;

      postRepository.findOne.mockResolvedValue(post as any);
      reputationService.getUserReputation.mockResolvedValue({ totalScore: 1500 } as any);
      postRepository.remove.mockResolvedValue({} as any);

      await service.deletePost(1, user);

      expect(postRepository.remove).toHaveBeenCalledWith(post);
    });
  });
});