import { Test, TestingModule } from '@nestjs/testing';
import { PlatformSyncService, SyncJobResult } from './platform-sync.service';
import { FeedSourceStatus } from '../entities/feed-source.entity';
import type { Repository } from 'typeorm';

describe('PlatformSyncService', () => {
  let service: PlatformSyncService;
  let feedSourceRepository: jest.Mocked<Repository<any>>;
  let feedItemRepository: jest.Mocked<Repository<any>>;
  let platformRegistry: any;

  beforeEach(async () => {
    feedSourceRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    feedItemRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as any;

    platformRegistry = {
      getIntegration: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformSyncService,
        { provide: 'FeedSourceRepository', useValue: feedSourceRepository },
        { provide: 'FeedItemRepository', useValue: feedItemRepository },
        { provide: 'PlatformRegistry', useValue: platformRegistry },
      ],
    })
      .overrideProvider(PlatformSyncService)
      .useValue(new PlatformSyncService(feedSourceRepository, feedItemRepository, platformRegistry))
      .compile();

    service = module.get<PlatformSyncService>(PlatformSyncService);
  });

  describe('syncFeedSource', () => {
    it('should throw if feed source not found', async () => {
      feedSourceRepository.findOne.mockResolvedValue(null);

      await expect(service.syncFeedSource('123')).rejects.toThrow('Feed source not found: 123');
    });

    it('should return error if source is inactive', async () => {
      feedSourceRepository.findOne.mockResolvedValue({
        id: '123',
        status: FeedSourceStatus.INACTIVE,
      });

      const result = await service.syncFeedSource('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Source is not active');
    });

    it('should sync successfully and return correct result', async () => {
      const sourceMock = {
        id: '123',
        status: FeedSourceStatus.ACTIVE,
        platform: { name: 'twitter', authConfig: {} },
        authTokens: {},
        syncSettings: {},
        totalItemsCount: 0,
      };
      const lastItemMock = { platformItemId: 'abc' };
      const syncResultMock = {
        items: [{ platformItemId: 'new1', likesCount: 0 }],
        rateLimitRemaining: 10,
      };

      feedSourceRepository.findOne.mockResolvedValueOnce(sourceMock);
      feedItemRepository.findOne.mockResolvedValueOnce(lastItemMock);
      platformRegistry.getIntegration.mockReturnValue({
        syncFeed: jest.fn().mockResolvedValue(syncResultMock),
      });

      feedItemRepository.findOne.mockResolvedValueOnce(null); // No existing item
      feedItemRepository.create.mockReturnValue({ id: 'item1' });
      feedItemRepository.save.mockResolvedValue({});

      const result = await service.syncFeedSource('123');

      expect(result.success).toBe(true);
      expect(result.itemsProcessed).toBe(1);
      expect(result.newItems).toBe(1);
    });

    it('should handle errors during sync', async () => {
      const sourceMock = {
        id: '123',
        status: FeedSourceStatus.ACTIVE,
        platform: { name: 'twitter', authConfig: {} },
      };

      feedSourceRepository.findOne.mockResolvedValue(sourceMock);
      platformRegistry.getIntegration.mockReturnValue({
        syncFeed: jest.fn().mockRejectedValue(new Error('API down')),
      });

      const result = await service.syncFeedSource('123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API down');
    });
  });

  describe('syncAllActiveSources', () => {
    it('should sync all active sources', async () => {
      const sourcesMock = [
        { id: '1', status: FeedSourceStatus.ACTIVE, platform: { name: 'twitter' } },
        { id: '2', status: FeedSourceStatus.ACTIVE, platform: { name: 'facebook' } },
      ];

      feedSourceRepository.find.mockResolvedValue(sourcesMock);
      jest.spyOn(service, 'syncFeedSource').mockResolvedValue({
        sourceId: '1',
        success: true,
        itemsProcessed: 2,
        newItems: 1,
      } as SyncJobResult);

      const results = await service.syncAllActiveSources();

      expect(results.length).toBe(2);
      expect(service.syncFeedSource).toHaveBeenCalledTimes(2);
    });
  });
});
