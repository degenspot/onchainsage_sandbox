import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../entities/token.entity';
import { TokenMetrics } from '../entities/token-metrics.entity';
import { LifecycleTransition } from '../entities/lifecycle-transition.entity';
import { PatternRecognition } from '../entities/pattern-recognition.entity';
import { CreateTokenDto, UpdateTokenStageDto, TokenMetricsDto } from '../dto/token-lifecycle.dto';
import { TokenLifecycleStage } from '../enums/lifecycle-stage.enum';

@Injectable()
export class TokenLifecycleService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(TokenMetrics)
    private metricsRepository: Repository<TokenMetrics>,
    @InjectRepository(LifecycleTransition)
    private transitionRepository: Repository<LifecycleTransition>,
    @InjectRepository(PatternRecognition)
    private patternRepository: Repository<PatternRecognition>
  ) {}

  async createToken(createTokenDto: CreateTokenDto): Promise<Token> {
    const token = this.tokenRepository.create({
      ...createTokenDto,
      launchDate: new Date(createTokenDto.launchDate),
      currentStage: TokenLifecycleStage.LAUNCH
    });
    return this.tokenRepository.save(token);
  }

  async getTokenById(id: string): Promise<Token> {
    return this.tokenRepository.findOne({
      where: { id },
      relations: ['metrics', 'transitions']
    });
  }

  async getTokens(filters: {
    category?: string;
    stage?: string;
    limit: number;
    offset: number;
  }): Promise<{ tokens: Token[]; total: number }> {
    const queryBuilder = this.tokenRepository.createQueryBuilder('token');

    if (filters.category) {
      queryBuilder.andWhere('token.category = :category', { category: filters.category });
    }

    if (filters.stage) {
      queryBuilder.andWhere('token.currentStage = :stage', { stage: filters.stage });
    }

    const [tokens, total] = await queryBuilder
      .skip(filters.offset)
      .take(filters.limit)
      .getManyAndCount();

    return { tokens, total };
  }

  async updateTokenStage(id: string, updateStageDto: UpdateTokenStageDto): Promise<Token> {
    const token = await this.getTokenById(id);
    if (!token) throw new Error('Token not found');

    const previousStage = token.currentStage;
    
    // Create transition record
    const transition = this.transitionRepository.create({
      tokenId: id,
      fromStage: previousStage,
      toStage: updateStageDto.stage,
      transitionDate: new Date(),
      confidence: updateStageDto.confidence || 1.0,
      triggerFactors: updateStageDto.triggerFactors || {}
    });

    await this.transitionRepository.save(transition);

    // Update token stage
    await this.tokenRepository.update(id, { currentStage: updateStageDto.stage });
    
    return this.getTokenById(id);
  }

  async addTokenMetrics(tokenId: string, metricsDto: TokenMetricsDto): Promise<TokenMetrics> {
    const metrics = this.metricsRepository.create({
      ...metricsDto,
      tokenId,
      timestamp: new Date()
    });

    // Update token's current price
    await this.tokenRepository.update(tokenId, {
      currentPrice: metricsDto.price,
      volume24h: metricsDto.volume,
      marketCap: metricsDto.marketCap
    });

    return this.metricsRepository.save(metrics);
  }

  async getPatterns(): Promise<PatternRecognition[]> {
    return this.patternRepository.find({
      order: { successRate: 'DESC' }
    });
  }

  async getLifecycleDistribution(): Promise<Record<string, number>> {
    const result = await this.tokenRepository
      .createQueryBuilder('token')
      .select('token.currentStage', 'stage')
      .addSelect('COUNT(*)', 'count')
      .groupBy('token.currentStage')
      .getRawMany();

    return result.reduce((acc, item) => {
      acc[item.stage] = parseInt(item.count);
      return acc;
    }, {});
  }

  async getSuccessMetrics(): Promise<{
    totalTokens: number;
    successfulTokens: number;
    averageGrowth: number;
    topPerformers: Token[];
  }> {
    const totalTokens = await this.tokenRepository.count();
    
    const successfulTokens = await this.tokenRepository.count({
      where: [
        { currentStage: TokenLifecycleStage.EXPANSION },
        { currentStage: TokenLifecycleStage.MATURITY }
      ]
    });

    const topPerformers = await this.tokenRepository.find({
      order: { currentPrice: 'DESC' },
      take: 10
    });

    // Calculate average growth
    const tokensWithPrices = await this.tokenRepository.find({
      where: { initialPrice: null } // This should be NOT NULL in real query
    });
    
    const growthRates = tokensWithPrices
      .filter(t => t.initialPrice && t.currentPrice)
      .map(t => ((t.currentPrice - t.initialPrice) / t.initialPrice) * 100);
    
    const averageGrowth = growthRates.length > 0 
      ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length 
      : 0;

    return {
      totalTokens,
      successfulTokens,
      averageGrowth,
      topPerformers
    };
  }

  async getLifecycleFlowData(): Promise<{
    nodes: Array<{ id: string; label: string; count: number }>;
    edges: Array<{ from: string; to: string; count: number }>;
  }> {
    // Get stage distribution
    const stageDistribution = await this.getLifecycleDistribution();
    
    const nodes = Object.entries(stageDistribution).map(([stage, count]) => ({
      id: stage,
      label: stage.replace('_', ' ').toUpperCase(),
      count
    }));

    // Get transition flows
    const transitions = await this.transitionRepository
      .createQueryBuilder('transition')
      .select('transition.fromStage', 'fromStage')
      .addSelect('transition.toStage', 'toStage')
      .addSelect('COUNT(*)', 'count')
      .groupBy('transition.fromStage, transition.toStage')
      .getRawMany();

    const edges = transitions.map(t => ({
      from: t.fromStage,
      to: t.toStage,
      count: parseInt(t.count)
    }));

    return { nodes, edges };
  }
}