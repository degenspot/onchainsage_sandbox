import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomAlertsService } from './custom-alerts.service';
import { CustomAlert } from './entities/custom-alert.entity';
import { AlertHistory } from './entities/alert-history.entity';
import { AlertConfiguration } from './entities/alert-configuration.entity';
import { CreateAlertDto } from './dto';

describe('CustomAlertsService', () => {
  let service: CustomAlertsService;
  let mockCustomAlertRepository: any;
  let mockAlertHistoryRepository: any;
  let mockAlertConfigurationRepository: any;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomAlertsService,
        {
          provide: getRepositoryToken(CustomAlert),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(AlertHistory),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(AlertConfiguration),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CustomAlertsService>(CustomAlertsService);
    mockCustomAlertRepository = module.get(getRepositoryToken(CustomAlert));
    mockAlertHistoryRepository = module.get(getRepositoryToken(AlertHistory));
    mockAlertConfigurationRepository = module.get(getRepositoryToken(AlertConfiguration));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAlert', () => {
    it('should create a new alert', async () => {
      const userId = 'test-user-id';
      const createAlertDto: CreateAlertDto = {
        name: 'Test Alert',
        description: 'Test Description',
        alertType: 'price',
        condition: 'above',
        parameters: {
          symbol: 'BTC',
          threshold: 50000,
        },
        notificationChannels: ['email'],
        notificationConfig: {
          email: 'test@example.com',
        },
      };

      const mockAlert = {
        id: 'alert-id',
        ...createAlertDto,
        userId,
        status: 'active',
        isEnabled: true,
        triggerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomAlertRepository.create.mockReturnValue(mockAlert);
      mockCustomAlertRepository.save.mockResolvedValue(mockAlert);

      const result = await service.createAlert(userId, createAlertDto);

      expect(result).toEqual(mockAlert);
      expect(mockCustomAlertRepository.create).toHaveBeenCalledWith({
        ...createAlertDto,
        userId,
        sharedId: null,
      });
      expect(mockCustomAlertRepository.save).toHaveBeenCalledWith(mockAlert);
    });
  });

  describe('getUserAlerts', () => {
    it('should return user alerts', async () => {
      const userId = 'test-user-id';
      const mockAlerts = [
        {
          id: 'alert-1',
          name: 'Alert 1',
          userId,
        },
        {
          id: 'alert-2',
          name: 'Alert 2',
          userId,
        },
      ];

      mockCustomAlertRepository.find.mockResolvedValue(mockAlerts);

      const result = await service.getUserAlerts(userId);

      expect(result).toEqual(mockAlerts);
      expect(mockCustomAlertRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by status when provided', async () => {
      const userId = 'test-user-id';
      const status = 'active';

      await service.getUserAlerts(userId, status);

      expect(mockCustomAlertRepository.find).toHaveBeenCalledWith({
        where: { userId, status },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getAlertById', () => {
    it('should return alert if found', async () => {
      const userId = 'test-user-id';
      const alertId = 'alert-id';
      const mockAlert = {
        id: alertId,
        name: 'Test Alert',
        userId,
      };

      mockCustomAlertRepository.findOne.mockResolvedValue(mockAlert);

      const result = await service.getAlertById(userId, alertId);

      expect(result).toEqual(mockAlert);
    });

    it('should throw NotFoundException if alert not found', async () => {
      const userId = 'test-user-id';
      const alertId = 'alert-id';

      mockCustomAlertRepository.findOne.mockResolvedValue(null);

      await expect(service.getAlertById(userId, alertId)).rejects.toThrow('Alert not found');
    });
  });
}); 