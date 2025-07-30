import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PredictionMarket, MarketStatus, ResolutionType } from '../entities/prediction-market.entity';
import { MarketOutcome, OutcomeType } from '../entities/market-outcome.entity';
import { MarketResolution, ResolutionStatus } from '../entities/market-resolution.entity';
import { MarketParticipant, StakeStatus } from '../entities/market-participant.entity';
import { ResolveMarketDto } from '../dto/resolve-market.dto';

@Injectable()
export class MarketResolutionService {
  private readonly logger = new Logger(MarketResolutionService.name);

  constructor(
    @InjectRepository(PredictionMarket)
    private predictionMarketRepository: Repository<PredictionMarket>,
    @InjectRepository(MarketOutcome)
    private marketOutcomeRepository: Repository<MarketOutcome>,
    @InjectRepository(MarketResolution)
    private marketResolutionRepository: Repository<MarketResolution>,
    @InjectRepository(MarketParticipant)
    private marketParticipantRepository: Repository<MarketParticipant>,
  ) {}

  async resolveMarket(resolveMarketDto: ResolveMarketDto, resolverId: string): Promise<MarketResolution> {
    this.logger.log(`Resolving market ${resolveMarketDto.marketId} by ${resolverId}`);

    const market = await this.predictionMarketRepository.findOne({
      where: { id: resolveMarketDto.marketId },
      relations: ['outcomes', 'participants'],
    });

    if (!market) {
      throw new NotFoundException(`Market with ID "${resolveMarketDto.marketId}" not found`);
    }

    if (market.status !== MarketStatus.OPEN) {
      throw new BadRequestException('Market is not open for resolution');
    }

    const now = new Date();
    if (now < market.endDate) {
      throw new BadRequestException('Market has not ended yet');
    }

    // Create resolution record
    const resolution = this.marketResolutionRepository.create({
      marketId: resolveMarketDto.marketId,
      resolvedBy: resolverId,
      outcome: resolveMarketDto.outcome,
      resolutionReason: resolveMarketDto.resolutionReason,
      oracleData: resolveMarketDto.oracleData,
      communityVoteResult: resolveMarketDto.communityVoteResult,
      resolutionStatus: ResolutionStatus.PENDING,
      metadata: resolveMarketDto.metadata,
    });

    const savedResolution = await this.marketResolutionRepository.save(resolution);

    // Update market outcomes
    await this.updateMarketOutcomes(resolveMarketDto.marketId, resolveMarketDto.outcome);

    // Update market status
    await this.predictionMarketRepository.update(resolveMarketDto.marketId, {
      status: MarketStatus.RESOLVED,
      resolutionDate: new Date(),
      resolvedBy: resolverId,
    });

    // Distribute winnings
    await this.distributeWinnings(resolveMarketDto.marketId);

    this.logger.log(`Market ${resolveMarketDto.marketId} resolved successfully`);
    return savedResolution;
  }

  async autoResolveTokenPriceMarkets(): Promise<void> {
    this.logger.log('Auto-resolving token price markets...');

    const markets = await this.predictionMarketRepository.find({
      where: {
        marketType: MarketType.TOKEN_PRICE,
        status: MarketStatus.OPEN,
        endDate: { $lte: new Date() },
      },
      relations: ['outcomes'],
    });

    for (const market of markets) {
      try {
        // Get current token price from external API
        const currentPrice = await this.getCurrentTokenPrice(market.tokenSymbol);
        
        // Determine outcome based on target price
        const outcome = currentPrice >= market.targetPrice ? 'yes' : 'no';
        
        await this.resolveMarket({
          marketId: market.id,
          outcome,
          resolutionReason: `Auto-resolved: ${market.tokenSymbol} current price is $${currentPrice}, target was $${market.targetPrice}`,
        }, 'system');
      } catch (error) {
        this.logger.error(`Failed to auto-resolve market ${market.id}: ${error.message}`);
      }
    }
  }

  async approveResolution(resolutionId: string, approverId: string): Promise<MarketResolution> {
    const resolution = await this.marketResolutionRepository.findOne({
      where: { id: resolutionId },
      relations: ['market'],
    });

    if (!resolution) {
      throw new NotFoundException('Resolution not found');
    }

    resolution.resolutionStatus = ResolutionStatus.APPROVED;
    return this.marketResolutionRepository.save(resolution);
  }

  async rejectResolution(resolutionId: string, rejectorId: string, reason: string): Promise<MarketResolution> {
    const resolution = await this.marketResolutionRepository.findOne({
      where: { id: resolutionId },
      relations: ['market'],
    });

    if (!resolution) {
      throw new NotFoundException('Resolution not found');
    }

    resolution.resolutionStatus = ResolutionStatus.REJECTED;
    resolution.metadata = { ...resolution.metadata, rejectionReason: reason, rejectedBy: rejectorId };
    return this.marketResolutionRepository.save(resolution);
  }

  async getMarketResolution(marketId: string): Promise<MarketResolution | null> {
    return this.marketResolutionRepository.findOne({
      where: { marketId },
      relations: ['market'],
    });
  }

  async getResolutionsByStatus(status: ResolutionStatus): Promise<MarketResolution[]> {
    return this.marketResolutionRepository.find({
      where: { resolutionStatus: status },
      relations: ['market'],
      order: { createdAt: 'DESC' },
    });
  }

  private async updateMarketOutcomes(marketId: string, correctOutcome: string): Promise<void> {
    const outcomes = await this.marketOutcomeRepository.find({
      where: { marketId },
    });

    for (const outcome of outcomes) {
      const isCorrect = outcome.outcomeType === correctOutcome;
      await this.marketOutcomeRepository.update(outcome.id, {
        isCorrect,
        isResolved: true,
      });
    }
  }

  private async distributeWinnings(marketId: string): Promise<void> {
    const market = await this.predictionMarketRepository.findOne({
      where: { id: marketId },
      relations: ['outcomes', 'participants'],
    });

    if (!market) return;

    const totalStaked = market.totalStaked;
    const platformFee = (totalStaked * market.platformFeePercentage) / 100;
    const prizePool = totalStaked - platformFee;

    const correctOutcome = market.outcomes.find(o => o.isCorrect);
    if (!correctOutcome) return;

    const winningParticipants = market.participants.filter(
      p => p.participationType === correctOutcome.outcomeType && p.stakeStatus === StakeStatus.ACTIVE,
    );

    if (winningParticipants.length === 0) return;

    const totalWinningStake = winningParticipants.reduce((sum, p) => sum + Number(p.amountStaked), 0);

    // Distribute winnings proportionally
    for (const participant of winningParticipants) {
      const stakeProportion = participant.amountStaked / totalWinningStake;
      const winnings = prizePool * stakeProportion;
      
      participant.actualWinnings = winnings;
      participant.stakeStatus = StakeStatus.CLAIMED;
      participant.claimedAt = new Date();
      
      await this.marketParticipantRepository.save(participant);
    }

    // Update resolution with distribution info
    const resolution = await this.marketResolutionRepository.findOne({
      where: { marketId },
    });

    if (resolution) {
      resolution.totalWinningsDistributed = prizePool;
      resolution.platformFeesCollected = platformFee;
      await this.marketResolutionRepository.save(resolution);
    }

    this.logger.log(`Distributed $${prizePool} in winnings for market ${marketId}`);
  }

  private async getCurrentTokenPrice(tokenSymbol: string): Promise<number> {
    // This would integrate with a price oracle or API
    // For now, return a mock price
    const mockPrices = {
      'BTC': 45000,
      'ETH': 3000,
      'USDC': 1,
      'SOL': 100,
    };
    
    return mockPrices[tokenSymbol] || 100;
  }
} 