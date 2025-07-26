import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReputationService } from './reputation.service';
import { ReputationRule } from './entities/reputation-rule.entity';
import { ReputationScore } from './entities/reputation-score.entity';
import { Badge } from './entities/badge.entity';

describe('ReputationService', () => {
  let service: ReputationService;
  let ruleRepository: jest.Mocked<Repository<ReputationRule>>;
  let scoreRepository: jest.Mocked<Repository<ReputationScore>>;
  let badgeRepository: jest.Mocked<Repository<Badge>>;

  beforeEach(async () => {
    const mockRuleRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockScoreRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const mockBadgeRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReputationService,
        { provide: getRepositoryToken(ReputationRule), useValue: mockRuleRepository },
        { provide: getRepositoryToken(ReputationScore), useValue: mockScoreRepository },
        { provide: getRepositoryToken(Badge), useValue: mockBadgeRepository },
      ],
    }).compile();

    service = module.get<ReputationService>(ReputationService);
    ruleRepository = module.get(getRepositoryToken(ReputationRule));
    scoreRepository = module.get(getRepositoryToken(ReputationScore));
    badgeRepository = module.get(getRepositoryToken(Badge));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserReputation', () => {
    it('should return existing reputation score', async () => {
      const score = { id: 1, totalScore: 100 };
      scoreRepository.findOne.mockResolvedValue(score as any);

      const result = await service.getUserReputation(1);

      expect(result).toEqual(score);
    });

    it('should create new reputation score if not exists', async () => {
      const newScore = { user: { id: 1 }, totalScore: 0 };
      scoreRepository.findOne.mockResolvedValue(null);
      scoreRepository.create.mockReturnValue(newScore as any);
      scoreRepository.save.mockResolvedValue(newScore as any);

      const result = await service.getUserReputation(1);

      expect(scoreRepository.create).toHaveBeenCalled();
      expect(scoreRepository.save).toHaveBeenCalledWith(newScore);
    });
  });

  describe('updateUserReputation', () => {
    it('should update reputation based on rule', async () => {
      const rule = { action: 'POST_CREATED', points: 10 };
      const score = { id: 1, totalScore: 100, postScore: 50 };

      ruleRepository.findOne.mockResolvedValue(rule as any);
      scoreRepository.findOne.mockResolvedValue(score as any);
      scoreRepository.save.mockResolvedValue({ ...score, totalScore: 110, postScore: 60 } as any);
      badgeRepository.findOne.mockResolvedValue(null);

      const result = await service.updateUserReputation(1, 'POST_CREATED');

      expect(ruleRepository.findOne).toHaveBeenCalledWith({ where: { action: 'POST_CREATED' } });
      expect(scoreRepository.save).toHaveBeenCalled();
    });

    it('should return unchanged score if rule not found', async () => {
      const score = { id: 1, totalScore: 100 };

      ruleRepository.findOne.mockResolvedValue(null);
      scoreRepository.findOne.mockResolvedValue(score as any);

      const result = await service.updateUserReputation(1, 'INVALID_ACTION');

      expect(result).toEqual(score);
    });
  });

  describe('getLeaderboard', () => {
    it('should return top users by reputation', async () => {
      const scores = [
        { id: 1, totalScore: 1000 },
        { id: 2, totalScore: 800 },
      ];

      scoreRepository.find.mockResolvedValue(scores as any);

      const result = await service.getLeaderboard(2);

      expect(scoreRepository.find).toHaveBeenCalledWith({
        relations: ['user', 'user.badges'],
        order: { totalScore: 'DESC' },
        take: 2,
      });
      expect(result).toEqual(scores);
    });
  });
});
