import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignalTestService } from './signal-test.service';
import { SignalTest, TestStatus } from '../entities/signal-test.entity';
import { SignalService } from './signal.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SignalTestService', () => {
  let service: SignalTestService;
  let testRepository: Repository<SignalTest>;
  let signalService: SignalService;

  const mockSignal = {
    id: '1',
    name: 'Test Signal',
    creatorId: 'user1',
  };

  const mockTest = {
    id: '1',
    name: 'Backtest 1',
    signalId: '1',
    parameters: {
      startDate: '2023-01-01',
      endDate: '2023-12-31',
    },
    status: TestStatus.RUNNING,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignalTestService,
        {
          provide: getRepositoryToken(SignalTest),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: SignalService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SignalTestService>(SignalTestService);
    testRepository = module.get<Repository<SignalTest>>(getRepositoryToken(SignalTest));
    signalService = module.get<SignalService>(SignalService);
  });

  describe('createTest', () => {
    it('should create a test for signal owner', async () => {
      const testDto = {
        name: 'Backtest 1',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };

      jest.spyOn(signalService, 'findOne').mockResolvedValue(mockSignal as any);
      jest.spyOn(testRepository, 'create').mockReturnValue(mockTest as SignalTest);
      jest.spyOn(testRepository, 'save').mockResolvedValue(mockTest as SignalTest);

      const result = await service.createTest('1', testDto, 'user1');

      expect(signalService.findOne).toHaveBeenCalledWith('1');
      expect(testRepository.create).toHaveBeenCalledWith({
        ...testDto,
        signalId: '1',
        parameters: {
          startDate: '2023-01-01',
          endDate: '2023-12-31',
        },
      });
      expect(result).toEqual(mockTest);
    });

    it('should throw BadRequestException for non-owner', async () => {
      const testDto = {
        name: 'Backtest 1',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };

      jest.spyOn(signalService, 'findOne').mockResolvedValue(mockSignal as any);

      await expect(service.createTest('1', testDto, 'user2')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findTestsBySignal', () => {
    it('should return tests for a signal', async () => {
      jest.spyOn(testRepository, 'find').mockResolvedValue([mockTest] as SignalTest[]);

      const result = await service.findTestsBySignal('1');

      expect(testRepository.find).toHaveBeenCalledWith({
        where: { signalId: '1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockTest]);
    });
  });

  describe('findTest', () => {
    it('should return a test if found', async () => {
      jest.spyOn(testRepository, 'findOne').mockResolvedValue(mockTest as SignalTest);

      const result = await service.findTest('1');

      expect(testRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['signal'],
      });
      expect(result).toEqual(mockTest);
    });

    it('should throw NotFoundException if test not found', async () => {
      jest.spyOn(testRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findTest('1')).rejects.toThrow(NotFoundException);
    });
  });
});
