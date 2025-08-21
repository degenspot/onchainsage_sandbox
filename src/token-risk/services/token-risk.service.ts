import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenRiskEntity, TokenMetricsEntity } from '../entities/token-risk.entity';
import { MLRiskAnalyzerService } from './ml-risk-analyzer.service';
import { AlertService } from './alert.service';
import { TokenDataService } from './token-data.service';
import { RiskAssessment, TokenMetrics } from '../interfaces/token-risk.interface';

@Injectable()
export class TokenRiskService {
  private readonly logger = new Logger(TokenRiskService.name);

  constructor(
    @InjectRepository(TokenRiskEntity)
    private readonly riskRepository: Repository<TokenRiskEntity>,
    @InjectRepository(TokenMetricsEntity)
    private readonly metricsRepository: Repository<TokenMetricsEntity>,
    private readonly mlAnalyzer: MLRiskAnalyzerService,
    private readonly alertService: AlertService,
    private readonly tokenDataService: TokenDataService,
  ) {}

  async analyzeToken(tokenAddress: string, riskThreshold: number = 70): Promise<RiskAssessment> {
    try {
      // Fetch current token metrics
      const currentMetrics = await this.tokenDataService.getCurrentMetrics(tokenAddress);
      
      // Get historical data (last 30 data points)
      const historicalMetrics = await this.getHistoricalMetrics(tokenAddress, 30);
      
      // Perform ML analysis
      const assessment = await this.mlAnalyzer.analyzeToken(currentMetrics, historicalMetrics);
      
      // Save assessment
      await this.saveRiskAssessment(assessment);
      
      // Check if alert should be triggered
      if (assessment.overallRiskScore >= riskThreshold) {
        await this.alertService.triggerAlert(assessment);
      }
      
      return assessment;
    } catch (error) {
      this.logger.error(`Failed to analyze token ${tokenAddress}:`, error);
      throw error;
    }
  }

  async analyzeBulkTokens(tokenAddresses: string[], riskThreshold: number = 70): Promise<RiskAssessment[]> {
    const assessments: RiskAssessment[] = [];
    
    // Process tokens in batches to avoid overwhelming external APIs
    const batchSize = 5;
    for (let i = 0; i < tokenAddresses.length; i += batchSize) {
      const batch = tokenAddresses.slice(i, i + batchSize);
      const batchPromises = batch.map(address => 
        this.analyzeToken(address, riskThreshold).catch(error => {
          this.logger.error(`Failed to analyze ${address}:`, error);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      assessments.push(...batchResults.filter(result => result !== null));
      
      // Small delay between batches
      if (i + batchSize < tokenAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return assessments;
  }

  async getTokenRiskHistory(tokenAddress: string, limit: number = 50): Promise<TokenRiskEntity[]> {
    return this.riskRepository.find({
      where: { tokenAddress },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getHighRiskTokens(limit: number = 100): Promise<TokenRiskEntity[]> {
    return this.riskRepository.find({
      where: { riskLevel: 'HIGH' || 'CRITICAL' },
      order: { overallRiskScore: 'DESC', timestamp: 'DESC' },
      take: limit,
    });
  }

  private async getHistoricalMetrics(tokenAddress: string, limit: number): Promise<TokenMetrics[]> {
    const entities = await this.metricsRepository.find({
      where: { tokenAddress },
      order: { timestamp: 'DESC' },
      take: limit,
    });

    return entities.map(entity => ({
      tokenAddress: entity.tokenAddress,
      liquidity: Number(entity.liquidity),
      volume24h: Number(entity.volume24h),
      priceChange24h: Number(entity.priceChange24h),
      holderCount: entity.holderCount,
      topHolderPercentage: Number(entity.topHolderPercentage),
      contractAge: entity.contractAge,
      transactionCount: entity.transactionCount,
      timestamp: entity.timestamp,
    }));
  }

  private async saveRiskAssessment(assessment: RiskAssessment): Promise<void> {
    const entity = new TokenRiskEntity();
    entity.tokenAddress = assessment.tokenAddress;
    entity.overallRiskScore = assessment.overallRiskScore;
    entity.riskLevel = assessment.riskLevel;
    entity.riskFactors = assessment.riskFactors;
    entity.anomalies = assessment.anomalies;
    entity.recommendation = assessment.recommendation;
    entity.confidence = assessment.confidence;

    await this.riskRepository.save(entity);
  }
}