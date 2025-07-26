import { Test, TestingModule } from '@nestjs/testing';
import { ChallengeController } from './challenge.controller';
import { CreateChallengeDto, ChallengeType } from './dto/create-challenge.dto';
import { Challenge } from './entities/challenge.entity';
import { ChallengeService } from './providers/challenge.service';

describe('ChallengeController', () => {
  let controller: ChallengeController;
  let service: ChallengeService;

  const mockChallenge: Challenge = {
    id: '1',
    title: 'Test Challenge',
    description: 'Test Description',
    type: 'trading',
    startDate: new Date('2025-08-01T09:00:00Z'),
    endDate: new Date('2025-08-10T09:00:00Z'),
    // Add any other required properties here
  } as Challenge;

  const mockChallengeService = {
    createChallenge: jest.fn().mockImplementation((dto: CreateChallengeDto) => ({
      ...dto,
      id: '1',
    })),
    findOne: jest.fn().mockResolvedValue(mockChallenge),
    findAll: jest.fn().mockResolvedValue([mockChallenge]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChallengeController],
      providers: [
        {
          provide: ChallengeService,
          useValue: mockChallengeService,
        },
      ],
    }).compile();

    controller = module.get<ChallengeController>(ChallengeController);
    service = module.get<ChallengeService>(ChallengeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should create a challenge', async () => {
      const dto: CreateChallengeDto = {
        title: 'Test Challenge',
        description: 'Test Description',
        type: ChallengeType.TRADING,
        startDate: new Date('2025-08-01T09:00:00Z'),
        endDate: new Date('2025-08-10T09:00:00Z'),
      };

      const result = await controller.createChallenge(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ ...dto, id: '1' });
    });
  });

  describe('findOne()', () => {
    it('should return a single challenge', async () => {
      const result = await controller.leaderboard('1');
      expect(service.findActive).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockChallenge);
    });
  });

  describe('findAll()', () => {
    it('should return all challenges', async () => {
      const result = await controller.getAllChallenges();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockChallenge]);
    });
  });
});