import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChallengeParticipantService } from './challenge-participant-service';
import { ChallengeParticipant } from '../entities/participant.entity';

describe('ChallengeParticipantService', () => {
  let service: ChallengeParticipantService;
  let repo: Repository<ChallengeParticipant>;

  const mockParticipant = {
    id: 'participant-id',
    progress: 0,
    isWinner: false,
    joinedAt: new Date(),
    challenge: { id: 'challenge-id' },
    user: { id: 'user-id' },
  } as ChallengeParticipant;

  const mockRepo = {
    create: jest.fn().mockReturnValue(mockParticipant),
    save: jest.fn().mockResolvedValue(mockParticipant),
    find: jest.fn().mockResolvedValue([mockParticipant]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeParticipantService,
        {
          provide: getRepositoryToken(ChallengeParticipant),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ChallengeParticipantService>(ChallengeParticipantService);
    repo = module.get(getRepositoryToken(ChallengeParticipant));
  });

  afterEach(() => jest.clearAllMocks());

  describe('joinChallenge', () => {
    it('should create and save a new participant', async () => {
      const result = await service.joinChallenge('challenge-id', 'user-id');
      expect(repo.create).toHaveBeenCalledWith({
        challenge: { id: 'challenge-id' },
        user: { id: 'user-id' },
      });
      expect(repo.save).toHaveBeenCalledWith(mockParticipant);
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('findByChallenge', () => {
    it('should return participants of a challenge', async () => {
      const result = await service.getLeaderboard('challenge-id');
      expect(repo.find).toHaveBeenCalledWith({
        where: { challenge: { id: 'challenge-id' } },
        relations: ['challenge', 'user'],
      });
      expect(result).toEqual([mockParticipant]);
    });
  });
});