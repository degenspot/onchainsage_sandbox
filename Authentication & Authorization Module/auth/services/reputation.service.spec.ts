import { Test, TestingModule } from '@nestjs/testing';
import { ReputationService } from './reputation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'Authentication & Authorization Module/users/entities/user.entity';
import { ReputationRule } from 'Authentication & Authorization Module/auth/entities/reputationRulle.entity';
import { Repository } from 'typeorm';

describe('ReputationService', () => {
  let service: ReputationService;
  let userRepo: Repository<User>;
  let ruleRepo: Repository<ReputationRule>;

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockRuleRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReputationService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(ReputationRule),
          useValue: mockRuleRepo,
        },
      ],
    }).compile();

    service = module.get<ReputationService>(ReputationService);
    userRepo = module.get(getRepositoryToken(User));
    ruleRepo = module.get(getRepositoryToken(ReputationRule));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateReputation', () => {
    it('should throw an error if user is not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.calculateReputation('user-123')).rejects.toThrow('User with id user-123 not found.');
    });

    it('should calculate reputation score based on posts and comments', async () => {
      const mockUser = {
        id: 'user-123',
        posts: [{}, {}, {}],
        comments: [{}],
        reputationScore: 0,
        reputationBadge: '',
      };

      const mockRules = [
        { type: 'community', points: 10, active: true },
      ];

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockRuleRepo.find.mockResolvedValue(mockRules);
      mockUserRepo.save.mockResolvedValue({
        ...mockUser,
        reputationScore: 40,
        reputationBadge: 'silver',
      });

      const result = await service.calculateReputation('user-123');

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['posts', 'comments'],
      });

      expect(mockRuleRepo.find).toHaveBeenCalledWith({ where: { active: true } });
      expect(result.reputationScore).toBe(40);
      expect(result.reputationBadge).toBe('silver');
    });

    it('should assign gold badge for score > 100', async () => {
      const mockUser = {
        id: 'user-456',
        posts: Array(6),
        comments: Array(6),
        reputationScore: 0,
        reputationBadge: '',
      };

      const mockRules = [
        { type: 'community', points: 10, active: true },
      ];

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockRuleRepo.find.mockResolvedValue(mockRules);
      mockUserRepo.save.mockResolvedValue({
        ...mockUser,
        reputationScore: 120,
        reputationBadge: 'gold',
      });

      const result = await service.calculateReputation('user-456');

      expect(result.reputationScore).toBe(120);
      expect(result.reputationBadge).toBe('gold');
    });
  });
});