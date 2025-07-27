import { Test, TestingModule } from '@nestjs/testing';
import { SignalController } from './signal.controller';
import { SignalService } from '../services/signal.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SignalStatus } from '../entities/signal.entity';

describe('SignalController', () => {
  let controller: SignalController;
  let service: SignalService;

  const mockSignal = {
    id: '1',
    name: 'Test Signal',
    description: 'Test Description',
    configuration: {},
    layout: {},
    status: SignalStatus.DRAFT,
    isPublic: false,
    creatorId: 'user1',
  };

  const mockRequest = {
    user: { id: 'user1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignalController],
      providers: [
        {
          provide: SignalService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            addComponent: jest.fn(),
            removeComponent: jest.fn(),
            validateSignal: jest.fn(),
            shareSignal: jest.fn(),
            likeSignal: jest.fn(),
          },
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<SignalController>(SignalController);
    service = module.get<SignalService>(SignalService);
  });

  describe('create', () => {
    it('should create a signal', async () => {
      const createSignalDto = {
        name: 'Test Signal',
        description: 'Test Description',
        configuration: {},
        layout: {},
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockSignal as any);

      const result = await controller.create(createSignalDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createSignalDto, 'user1');
      expect(result).toEqual(mockSignal);
    });
  });

  describe('findAll', () => {
    it('should return all signals', async () => {
      const query = { status: SignalStatus.ACTIVE };
      jest.spyOn(service, 'findAll').mockResolvedValue([mockSignal] as any);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual([mockSignal]);
    });
  });

  describe('findOne', () => {
    it('should return a signal by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSignal as any);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockSignal);
    });
  });

  describe('update', () => {
    it('should update a signal', async () => {
      const updateDto = { name: 'Updated Signal' };
      const updatedSignal = { ...mockSignal, ...updateDto };

      jest.spyOn(service, 'update').mockResolvedValue(updatedSignal as any);

      const result = await controller.update('1', updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith('1', updateDto, 'user1');
      expect(result).toEqual(updatedSignal);
    });
  });

  describe('validateSignal', () => {
    it('should validate a signal', async () => {
      const validation = { isValid: true, errors: [] };
      jest.spyOn(service, 'validateSignal').mockResolvedValue(validation);

      const result = await controller.validateSignal('1');

      expect(service.validateSignal).toHaveBeenCalledWith('1');
      expect(result).toEqual(validation);
    });
  });
});