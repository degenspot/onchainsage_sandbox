import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeysService } from '../../src/api-keys/api-keys.service';
import { ApiKey } from '../../src/api-keys/entities/api-key.entity';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let repository: Repository<ApiKey>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: getRepositoryToken(ApiKey),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    repository = module.get<Repository<ApiKey>>(getRepositoryToken(ApiKey));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an API key', async () => {
    const createDto = {
      name: 'Test Key',
      description: 'Test description',
      permissions: ['read'],
      rateLimitPerHour: 1000,
    };

    const mockApiKey = {
      id: '123',
      key: 'sk_test123',
      name: 'Test Key',
      description: 'Test description',
      isActive: true,
      permissions: ['read'],
      rateLimitPerHour: 1000,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRepository.create.mockReturnValue(mockApiKey);
    mockRepository.save.mockResolvedValue(mockApiKey);

    const result = await service.create(createDto);

    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalledWith(mockApiKey);
    expect(result).toEqual(mockApiKey);
  });

  it('should find all API keys', async () => {
    const mockApiKeys = [
      { id: '1', name: 'Key 1' },
      { id: '2', name: 'Key 2' },
    ];

    mockRepository.find.mockResolvedValue(mockApiKeys);

    const result = await service.findAll();

    expect(mockRepository.find).toHaveBeenCalledWith({
      select: expect.any(Array)
    });
    expect(result).toEqual(mockApiKeys);
  });

  it('should find API key by key', async () => {
    const mockApiKey = { id: '1', key: 'sk_test123', isActive: true };
    mockRepository.findOne.mockResolvedValue(mockApiKey);

    const result = await service.findByKey('sk_test123');

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { key: 'sk_test123', isActive: true }
    });
    expect(result).toEqual(mockApiKey);
  });

  it('should regenerate API key', async () => {
    const mockApiKey = {
      id: '123',
      key: 'sk_old_key',
      name: 'Test Key',
      usageCount: 10,
    };

    const updatedApiKey = {
      ...mockApiKey,
      key: 'sk_new_key',
      usageCount: 0,
    };

    mockRepository.findOne.mockResolvedValue(mockApiKey);
    mockRepository.save.mockResolvedValue(updatedApiKey);

    const result = await service.regenerate('123');

    expect(result.key).not.toBe('sk_old_key');
    expect(result.usageCount).toBe(0);
  });
});