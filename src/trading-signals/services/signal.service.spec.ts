import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignalService } from './signal.service';
import { Signal, SignalStatus } from '../entities/signal.entity';
import { SignalComponent, ComponentType } from '../entities/signal-component.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SignalService', () => {
  let service: SignalService;
  let signalRepository: Repository<Signal>;
  let componentRepository: Repository<SignalComponent>;

  const mockSignal = {
    id: '1',
    name: 'Test Signal',
    description: 'Test Description',
    configuration: {},
    layout: {},
    status: SignalStatus.DRAFT,
    isPublic: false,
    creatorId: 'user1',
    components: [],
  };

  const mockComponent = {
    id: '1',
    type: ComponentType.INDICATOR,
    name: 'RSI',
    config: { period: 14 },
    position: { x: 100, y: 200 },
    signalId: '1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignalService,
        {
          provide: getRepositoryToken(Signal),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SignalComponent),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SignalService>(SignalService);
    signalRepository = module.get<Repository<Signal>>(getRepositoryToken(Signal));
    componentRepository = module.get<Repository<SignalComponent>>(getRepositoryToken(SignalComponent));
  });

  describe('create', () => {
    it('should create a new signal', async () => {
      const createSignalDto = {
        name: 'Test Signal',
        description: 'Test Description',
        configuration: {},
        layout: {},
      };

      jest.spyOn(signalRepository, 'create').mockReturnValue(mockSignal as Signal);
      jest.spyOn(signalRepository, 'save').mockResolvedValue(mockSignal as Signal);

      const result = await service.create(createSignalDto, 'user1');

      expect(signalRepository.create).toHaveBeenCalledWith({
        ...createSignalDto,
        creatorId: 'user1',
      });
      expect(signalRepository.save).toHaveBeenCalledWith(mockSignal);
      expect(result).toEqual(mockSignal);
    });
  });

  describe('findOne', () => {
    it('should return a signal if found', async () => {
      jest.spyOn(signalRepository, 'findOne').mockResolvedValue(mockSignal as Signal);

      const result = await service.findOne('1');

      expect(signalRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['creator', 'components', 'tests'],
      });
      expect(result).toEqual(mockSignal);
    });

    it('should throw NotFoundException if signal not found', async () => {
      jest.spyOn(signalRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a signal if user is the creator', async () => {
      const updateDto = { name: 'Updated Signal' };
      const updatedSignal = { ...mockSignal, ...updateDto };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockSignal as Signal);
      jest.spyOn(signalRepository, 'save').mockResolvedValue(updatedSignal as Signal);

      const result = await service.update('1', updateDto, 'user1');

      expect(signalRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Signal');
    });

    it('should throw BadRequestException if user is not the creator', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSignal as Signal);

      await expect(service.update('1', {}, 'user2')).rejects.toThrow(BadRequestException);
    });
  });

  describe('addComponent', () => {
    it('should add a component to a signal', async () => {
      const componentDto = {
        type: ComponentType.INDICATOR,
        name: 'RSI',
        config: { period: 14 },
        position: { x: 100, y: 200 },
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockSignal as Signal);
      jest.spyOn(componentRepository, 'create').mockReturnValue(mockComponent as SignalComponent);
      jest.spyOn(componentRepository, 'save').mockResolvedValue(mockComponent as SignalComponent);

      const result = await service.addComponent('1', componentDto, 'user1');

      expect(componentRepository.create).toHaveBeenCalledWith({
        ...componentDto,
        signalId: '1',
      });
      expect(componentRepository.save).toHaveBeenCalledWith(mockComponent);
      expect(result).toEqual(mockComponent);
    });

    it('should throw BadRequestException if user is not the creator', async () => {
      const componentDto = {
        type: ComponentType.INDICATOR,
        name: 'RSI',
        config: { period: 14 },
        position: { x: 100, y: 200 },
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockSignal as Signal);

      await expect(service.addComponent('1', componentDto, 'user2')).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateSignal', () => {
    it('should return validation errors for incomplete signal', async () => {
      const signalWithoutComponents = {
        ...mockSignal,
        components: [],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(signalWithoutComponents as Signal);

      const result = await service.validateSignal('1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Signal must have at least one data source');
      expect(result.errors).toContain('Signal must have at least one condition');
      expect(result.errors).toContain('Signal must have at least one action');
    });

    it('should return valid for complete signal', async () => {
      const completeSignal = {
        ...mockSignal,
        components: [
          { type: ComponentType.DATA_SOURCE, connections: [] },
          { type: ComponentType.CONDITION, connections: [] },
          { type: ComponentType.ACTION, connections: [] },
        ],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(completeSignal as Signal);

      const result = await service.validateSignal('1');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
