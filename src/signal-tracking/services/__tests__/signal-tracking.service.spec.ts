import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignalTrackingService } from '../signal-tracking.service';
import { Signal } from '../../entities/signal.entity';
import { SignalPerformance } from '../../entities/signal-performance.entity';
import { SignalType, TradingPair, SignalStatus } from '../../../../shared/enums/signal.enums';

describe('SignalTrackingService', () => {
  let service: SignalTrackingService;
  let signalRepository: Repository<Signal>;
  let performanceRepository: Repository<SignalPerformance>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignalTrackingService,
        {
          provide: getRepositoryToken(Signal),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(SignalPerformance),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<SignalTrackingService>(SignalTrackingService);
    signalRepository = module.get<Repository<Signal>>(getRepositoryToken(Signal));
    performanceRepository = module.get<Repository<SignalPerformance>>(getRepositoryToken(SignalPerformance));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSignal', () => {
    it('should create a new signal', async () => {
      const createSignalDto = {
        type: SignalType.BUY,
        tradingPair: TradingPair.BTCUSD,
        entryPrice: 50000,
        confidenceScore: 80,
      };

      const mockSignal = {
        id: 'uuid',
        ...createSignalDto,
        status: SignalStatus.ACTIVE,
      };

      jest.spyOn(signalRepository, 'create').mockReturnValue(mockSignal as Signal);
      jest.spyOn(signalRepository, 'save').mockResolvedValue(mockSignal as Signal);

      const result = await service.createSignal(createSignalDto);

      expect(signalRepository.create).toHaveBeenCalledWith({
        ...createSignalDto,
        status: SignalStatus.ACTIVE,
      });
      expect(result).toEqual(mockSignal);
    });
  });

  describe('updateSignalExit', () => {
    it('should update signal exit price and calculate performance', async () => {
      const signalId = 'test-uuid';
      const exitPrice = 55000;
      
      const mockSignal = {
        id: signalId,
        type: SignalType.BUY,
        entryPrice: 50000,
        confidenceScore: 80,
        status: SignalStatus.ACTIVE,
      } as Signal;

      jest.spyOn(service, 'findSignalById').mockResolvedValue(mockSignal);
      jest.spyOn(signalRepository, 'save').mockResolvedValue(mockSignal);
      jest.spyOn(performanceRepository, 'create').mockReturnValue({} as SignalPerformance);
      jest.spyOn(performanceRepository, 'save').mockResolvedValue({} as SignalPerformance);

      const result = await service.updateSignalExit(signalId, exitPrice);

      expect(mockSignal.exitPrice).toBe(exitPrice);
      expect(mockSignal.status).toBe(SignalStatus.CLOSED);
      expect(mockSignal.closedAt).toBeInstanceOf(Date);
    });
  });
});