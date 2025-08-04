import { Test, TestingModule } from '@nestjs/testing';
import { AchievementController } from './achievement.controller';
import { AchievementService } from '../services/achievement.service';
import { NftService } from '../services/nft.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Nft } from '../entities/nft.entity';
import { Repository } from 'typeorm';

describe('AchievementController (NFTs)', () => {
  let controller: AchievementController;
  let nftRepository: Repository<Nft>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AchievementController],
      providers: [
        { provide: AchievementService, useValue: {} },
        { provide: NftService, useValue: {} },
        { provide: getRepositoryToken(Nft), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AchievementController>(AchievementController);
    nftRepository = module.get(getRepositoryToken(Nft));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return user NFTs', async () => {
    const userId = 'user-1';
    const mockNfts = [{ id: 'nft-1', userId }];
    (nftRepository.find as jest.Mock).mockResolvedValue(mockNfts);
    const result = await controller.getUserNfts(userId);
    expect(result).toEqual(mockNfts);
  });

  it('should showcase an NFT', async () => {
    const req = { user: { id: 'user-1' } };
    const nft = { id: 'nft-1', userId: 'user-1', isShowcased: false };
    (nftRepository.findOne as jest.Mock).mockResolvedValue(nft);
    (nftRepository.save as jest.Mock).mockResolvedValue({ ...nft, isShowcased: true });
    const result = await controller.showcaseNft('nft-1', req);
    expect(result).toEqual({ message: 'NFT showcased' });
  });

  it('should set an NFT for trade', async () => {
    const req = { user: { id: 'user-1' } };
    const nft = { id: 'nft-1', userId: 'user-1', isForTrade: false };
    (nftRepository.findOne as jest.Mock).mockResolvedValue(nft);
    (nftRepository.save as jest.Mock).mockResolvedValue({ ...nft, isForTrade: true });
    const result = await controller.setNftForTrade('nft-1', req);
    expect(result).toEqual({ message: 'NFT set for trade' });
  });
});