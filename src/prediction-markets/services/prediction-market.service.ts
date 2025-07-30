import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PredictionMarket, MarketStatus, MarketType } from '../entities/prediction-market.entity';
import { MarketOutcome, OutcomeType } from '../entities/market-outcome.entity';
import { CreateMarketDto } from '../dto/create-market.dto';

@Injectable()
export class PredictionMarketService {
  private readonly logger = new Logger(PredictionMarketService.name);

  constructor(
    @InjectRepository(PredictionMarket)
    private predictionMarketRepository: Repository<PredictionMarket>,
    @InjectRepository(MarketOutcome)
    private marketOutcomeRepository: Repository<MarketOutcome>,
  ) {}

  async createMarket(createMarketDto: CreateMarketDto, userId: string): Promise<PredictionMarket> {
    this.logger.log(`Creating new prediction market: ${createMarketDto.title}`);

    // Validate market dates
    const startDate = new Date(createMarketDto.startDate);
    const endDate = new Date(createMarketDto.endDate);
    const now = new Date();

    if (startDate <= now) {
      throw new BadRequestException('Market start date must be in the future');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('Market end date must be after start date');
    }

    // Validate market type specific fields
    if (createMarketDto.marketType === MarketType.TOKEN_PRICE) {
      if (!createMarketDto.tokenSymbol || !createMarketDto.targetPrice) {
        throw new BadRequestException('Token price markets require token symbol and target price');
      }
    }

    // Create the market
    const market = this.predictionMarketRepository.create({
      ...createMarketDto,
      creatorId: userId,
      startDate,
      endDate,
      totalStaked: 0,
      totalVolume: 0,
      platformFeePercentage: createMarketDto.platformFeePercentage || 2.5,
      status: MarketStatus.OPEN,
    });

    const savedMarket = await this.predictionMarketRepository.save(market);

    // Create default outcomes (YES/NO)
    const yesOutcome = this.marketOutcomeRepository.create({
      marketId: savedMarket.id,
      outcomeType: OutcomeType.YES,
      description: 'Yes',
      totalStaked: 0,
      percentageStaked: 0,
      isCorrect: false,
      isResolved: false,
    });

    const noOutcome = this.marketOutcomeRepository.create({
      marketId: savedMarket.id,
      outcomeType: OutcomeType.NO,
      description: 'No',
      totalStaked: 0,
      percentageStaked: 0,
      isCorrect: false,
      isResolved: false,
    });

    await this.marketOutcomeRepository.save([yesOutcome, noOutcome]);

    this.logger.log(`Created prediction market with ID: ${savedMarket.id}`);
    return savedMarket;
  }

  async getAllMarkets(
    status?: MarketStatus,
    marketType?: MarketType,
    page = 1,
    limit = 20,
  ): Promise<{ markets: PredictionMarket[]; total: number }> {
    const queryBuilder = this.predictionMarketRepository
      .createQueryBuilder('market')
      .leftJoinAndSelect('market.outcomes', 'outcomes')
      .leftJoinAndSelect('market.participants', 'participants');

    if (status) {
      queryBuilder.andWhere('market.status = :status', { status });
    }

    if (marketType) {
      queryBuilder.andWhere('market.marketType = :marketType', { marketType });
    }

    queryBuilder.orderBy('market.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const markets = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { markets, total };
  }

  async getMarketById(id: string): Promise<PredictionMarket> {
    const market = await this.predictionMarketRepository.findOne({
      where: { id },
      relations: ['outcomes', 'participants', 'resolutions'],
    });

    if (!market) {
      throw new NotFoundException(`Prediction market with ID "${id}" not found`);
    }

    return market;
  }

  async getMarketsByCreator(creatorId: string): Promise<PredictionMarket[]> {
    return this.predictionMarketRepository.find({
      where: { creatorId },
      relations: ['outcomes'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOpenMarkets(): Promise<PredictionMarket[]> {
    const now = new Date();
    return this.predictionMarketRepository.find({
      where: {
        status: MarketStatus.OPEN,
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      relations: ['outcomes'],
      order: { endDate: 'ASC' },
    });
  }

  async updateMarketStatus(id: string, status: MarketStatus): Promise<PredictionMarket> {
    const market = await this.getMarketById(id);
    market.status = status;
    
    if (status === MarketStatus.RESOLVED) {
      market.resolutionDate = new Date();
    }

    return this.predictionMarketRepository.save(market);
  }

  async getMarketAnalytics(id: string): Promise<any> {
    const market = await this.getMarketById(id);
    
    const totalParticipants = market.participants.length;
    const totalStaked = market.totalStaked;
    const yesStaked = market.outcomes.find(o => o.outcomeType === OutcomeType.YES)?.totalStaked || 0;
    const noStaked = market.outcomes.find(o => o.outcomeType === OutcomeType.NO)?.totalStaked || 0;
    
    const yesPercentage = totalStaked > 0 ? (yesStaked / totalStaked) * 100 : 0;
    const noPercentage = totalStaked > 0 ? (noStaked / totalStaked) * 100 : 0;

    return {
      marketId: id,
      totalParticipants,
      totalStaked,
      yesStaked,
      noStaked,
      yesPercentage,
      noPercentage,
      marketStatus: market.status,
      timeRemaining: market.endDate.getTime() - new Date().getTime(),
    };
  }

  async searchMarkets(query: string): Promise<PredictionMarket[]> {
    return this.predictionMarketRepository
      .createQueryBuilder('market')
      .leftJoinAndSelect('market.outcomes', 'outcomes')
      .where('market.title ILIKE :query OR market.description ILIKE :query', {
        query: `%${query}%`,
      })
      .orderBy('market.createdAt', 'DESC')
      .getMany();
  }
} 