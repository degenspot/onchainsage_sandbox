import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PredictionMarket, MarketStatus } from '../entities/prediction-market.entity';
import { MarketParticipant, ParticipationType, StakeStatus } from '../entities/market-participant.entity';
import { MarketOutcome, OutcomeType } from '../entities/market-outcome.entity';
import { ParticipateMarketDto } from '../dto/participate-market.dto';

@Injectable()
export class MarketParticipationService {
  private readonly logger = new Logger(MarketParticipationService.name);

  constructor(
    @InjectRepository(MarketParticipant)
    private marketParticipantRepository: Repository<MarketParticipant>,
    @InjectRepository(PredictionMarket)
    private predictionMarketRepository: Repository<PredictionMarket>,
    @InjectRepository(MarketOutcome)
    private marketOutcomeRepository: Repository<MarketOutcome>,
  ) {}

  async participateInMarket(
    participateMarketDto: ParticipateMarketDto,
    userId: string,
  ): Promise<MarketParticipant> {
    this.logger.log(`User ${userId} participating in market ${participateMarketDto.marketId}`);

    // Check if market exists and is open
    const market = await this.predictionMarketRepository.findOne({
      where: { id: participateMarketDto.marketId },
      relations: ['outcomes'],
    });

    if (!market) {
      throw new NotFoundException(`Market with ID "${participateMarketDto.marketId}" not found`);
    }

    if (market.status !== MarketStatus.OPEN) {
      throw new BadRequestException('Market is not open for participation');
    }

    const now = new Date();
    if (now < market.startDate || now > market.endDate) {
      throw new BadRequestException('Market is not active for participation');
    }

    // Check if user already participated
    const existingParticipation = await this.marketParticipantRepository.findOne({
      where: {
        marketId: participateMarketDto.marketId,
        userId,
        participationType: participateMarketDto.participationType,
      },
    });

    if (existingParticipation) {
      throw new BadRequestException('User has already participated with this outcome');
    }

    // Create participation record
    const participation = this.marketParticipantRepository.create({
      marketId: participateMarketDto.marketId,
      userId,
      userAddress: participateMarketDto.userAddress,
      participationType: participateMarketDto.participationType,
      amountStaked: participateMarketDto.amountStaked,
      stakeStatus: StakeStatus.ACTIVE,
      metadata: participateMarketDto.metadata,
    });

    const savedParticipation = await this.marketParticipantRepository.save(participation);

    // Update market totals
    await this.updateMarketTotals(participateMarketDto.marketId);

    // Update outcome totals
    await this.updateOutcomeTotals(participateMarketDto.marketId);

    this.logger.log(`User ${userId} successfully participated in market ${participateMarketDto.marketId}`);
    return savedParticipation;
  }

  async getUserParticipations(userId: string): Promise<MarketParticipant[]> {
    return this.marketParticipantRepository.find({
      where: { userId },
      relations: ['market'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMarketParticipations(marketId: string): Promise<MarketParticipant[]> {
    return this.marketParticipantRepository.find({
      where: { marketId },
      relations: ['market'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserParticipationInMarket(marketId: string, userId: string): Promise<MarketParticipant | null> {
    return this.marketParticipantRepository.findOne({
      where: { marketId, userId },
      relations: ['market'],
    });
  }

  async claimWinnings(participationId: string, userId: string): Promise<MarketParticipant> {
    const participation = await this.marketParticipantRepository.findOne({
      where: { id: participationId, userId },
      relations: ['market'],
    });

    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    if (participation.stakeStatus !== StakeStatus.ACTIVE) {
      throw new BadRequestException('Winnings already claimed or forfeited');
    }

    if (participation.market.status !== MarketStatus.RESOLVED) {
      throw new BadRequestException('Market is not yet resolved');
    }

    // Check if user won
    const market = await this.predictionMarketRepository.findOne({
      where: { id: participation.marketId },
      relations: ['outcomes'],
    });

    const correctOutcome = market.outcomes.find(o => o.isCorrect);
    if (!correctOutcome) {
      throw new BadRequestException('Market outcome not yet determined');
    }

    const isWinner = participation.participationType === correctOutcome.outcomeType;
    
    if (isWinner) {
      participation.actualWinnings = participation.potentialWinnings;
      participation.stakeStatus = StakeStatus.CLAIMED;
      participation.claimedAt = new Date();
    } else {
      participation.stakeStatus = StakeStatus.FORFEITED;
    }

    return this.marketParticipantRepository.save(participation);
  }

  async calculatePotentialWinnings(marketId: string): Promise<void> {
    const market = await this.predictionMarketRepository.findOne({
      where: { id: marketId },
      relations: ['outcomes', 'participants'],
    });

    if (!market) return;

    const totalStaked = market.totalStaked;
    const platformFee = (totalStaked * market.platformFeePercentage) / 100;
    const prizePool = totalStaked - platformFee;

    // Calculate winnings for each participant
    for (const participant of market.participants) {
      if (participant.stakeStatus === StakeStatus.ACTIVE) {
        const outcome = market.outcomes.find(o => o.outcomeType === participant.participationType);
        if (outcome && outcome.totalStaked > 0) {
          // Calculate potential winnings based on stake proportion
          const stakeProportion = participant.amountStaked / outcome.totalStaked;
          participant.potentialWinnings = prizePool * stakeProportion;
          await this.marketParticipantRepository.save(participant);
        }
      }
    }
  }

  private async updateMarketTotals(marketId: string): Promise<void> {
    const participations = await this.marketParticipantRepository.find({
      where: { marketId, stakeStatus: StakeStatus.ACTIVE },
    });

    const totalStaked = participations.reduce((sum, p) => sum + Number(p.amountStaked), 0);
    const totalVolume = participations.reduce((sum, p) => sum + Number(p.amountStaked), 0);

    await this.predictionMarketRepository.update(marketId, {
      totalStaked,
      totalVolume,
    });
  }

  private async updateOutcomeTotals(marketId: string): Promise<void> {
    const participations = await this.marketParticipantRepository.find({
      where: { marketId, stakeStatus: StakeStatus.ACTIVE },
    });

    const outcomes = await this.marketOutcomeRepository.find({
      where: { marketId },
    });

    for (const outcome of outcomes) {
      const outcomeParticipations = participations.filter(
        p => p.participationType === outcome.outcomeType,
      );
      
      const totalStaked = outcomeParticipations.reduce((sum, p) => sum + Number(p.amountStaked), 0);
      const market = await this.predictionMarketRepository.findOne({ where: { id: marketId } });
      const percentageStaked = market.totalStaked > 0 ? (totalStaked / market.totalStaked) * 100 : 0;

      await this.marketOutcomeRepository.update(outcome.id, {
        totalStaked,
        percentageStaked,
      });
    }
  }
} 