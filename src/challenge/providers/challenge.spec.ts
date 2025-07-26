import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChallengeService } from './challenge.service';
import { Challenge } from '../entities/challenge.entity';
import { CreateChallengeDto, ChallengeType } from '../dto/create-challenge.dto';
import { Repository } from 'typeorm';

describe('ChallengeService', () => {
  let service: ChallengeService;
  let repo: Repository<Challenge>;

  const mockChallenge: Challenge = {
    id: '1',
    title: 'Test Challenge',
    description: 'A test challenge',
    type: 'trading',
    startDate: new Date('2025-08-01T09:00:00Z'),
    endDate: new Date('2025-08-10T09:00:00Z'),
    isRewardDistributed: false, // ✅ Add this line
    participants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryBuilder: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockChallenge]),
  };

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest.fn().mockResolvedValue(mockChallenge),
    find: jest.fn().mockResolvedValue([mockChallenge]),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeService,
        {
          provide: getRepositoryToken(Challenge),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ChallengeService>(ChallengeService);
    repo = module.get(getRepositoryToken(Challenge));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create and save a new challenge', async () => {
      const dto: CreateChallengeDto = {
        title: 'Test Challenge',
        description: 'A test challenge',
        type: ChallengeType.TRADING,
        startDate: new Date('2025-08-01T09:00:00Z'),
        endDate: new Date('2025-08-10T09:00:00Z'),
      };

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining(dto));
      expect(result).toEqual(mockChallenge);
    });
  });

  describe('findAll', () => {
    it('should return all challenges with participants', async () => {
      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({ relations: ['participants'] });
      expect(result).toEqual([mockChallenge]);
    });
  });

  describe('findActive', () => {
    it('should return active challenges in date range', async () => {
      const result = await service.findActive();

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('challenge');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'challenge.participants',
        'participant',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'challenge.startDate <= :now',
        { now: expect.any(Date) },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'challenge.endDate >= :now',
        { now: expect.any(Date) },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual([mockChallenge]);
    });
  });
});
