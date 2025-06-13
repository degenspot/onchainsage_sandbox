import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../entities/token.entity';
import { TokenMetrics } from '../entities/token-metrics.entity';
import { PatternRecognition } from '../entities/pattern-recognition.entity';

@Injectable()
export class PredictiveModelingService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(TokenMetrics)
    private metricsRepository: Repository<TokenMetrics>,
    @InjectRepository(PatternRecognition)
    private patternRepository: Repository<PatternRecognition>
  ) {}

  async predictTokenSuccess(tokenId: string): Promise<{
    successProbability: number;
    predictedPattern: string;
    confidenceScore: number;
    riskFactors: string[];
  }> {
    const token = await this.tokenRepository.findOne({ where: { id: tokenId } });
    if (!token) throw new Error('Token not found');

    const metrics = await this.metricsRepository.find({
      where: { tokenId },
      order: { timestamp: 'DESC' },
      take: 30
    });

    const patterns = await this.patternRepository.find({
      where: { category: token.category }
    });

    // Feature extraction
    const features = this.extractFeatures(token, metrics);
    
    // Pattern matching
    const bestMatch = this.findBestPatternMatch(features, patterns);
    
    // Risk assessment
    const riskFactors = this.assessRiskFactors(features);
    
    // Success probability calculation
    const successProbability = this.calculateSuccessProbability(features, bestMatch);
    
    return {
      successProbability,
      predictedPattern: bestMatch ? bestMatch.pattern : 'unknown',
      confidenceScore: bestMatch ? bestMatch.confidence : 0.3,
      riskFactors
    };
  }

  private extractFeatures(token: Token, metrics: TokenMetrics[]): Record<string, number> {
    if (metrics.length === 0) return {};

    const latest = metrics[0];
    const daysSinceLaunch = Math.floor((Date.now() - new Date(token.launchDate).getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      daysSinceLaunch,
      currentPrice: latest.price,
      priceGrowth: token.initialPrice ? ((latest.price - token.initialPrice) / token.initialPrice) * 100 : 0,
      volumeToMarketCap: latest.volume / latest.marketCap,
      holderGrowthRate: this.calculateHolderGrowthRate(metrics),
      volatility: latest.volatility,
      liquidityScore: latest.liquidityScore,
      socialSentiment: latest.sentimentScore,
      githubActivity: latest.githubActivity,
      transactionVelocity: this.calculateTransactionVelocity(metrics)
    };
  }

  private calculateHolderGrowthRate(metrics: TokenMetrics[]): number {
    if (metrics.length < 7) return 0;
    const recent = metrics.slice(0, 7);
    const older = metrics.slice(7, 14);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.holders, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.holders, 0) / older.length;
    
    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  }

  private calculateTransactionVelocity(metrics: TokenMetrics[]): number {
    if (metrics.length < 2) return 0;
    const recent = metrics.slice(0, 5);
    return recent.reduce((sum, m) => sum + m.transactions, 0) / recent.length;
  }

  private findBestPatternMatch(features: Record<string, number>, patterns: PatternRecognition[]): { pattern: string; confidence: number } | null {
    let bestMatch = null;
    let highestScore = 0;

    for (const pattern of patterns) {
      const score = this.calculatePatternMatchScore(features, pattern);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = { pattern: pattern.pattern, confidence: score };
      }
    }

    return bestMatch;
  }

  private calculatePatternMatchScore(features: Record<string, number>, pattern: PatternRecognition): number {
    // Simplified pattern matching - in production, use ML algorithms
    let score = 0;
    const weights = {
      priceGrowth: 0.3,
      volumeToMarketCap: 0.2,
      socialSentiment: 0.2,
      holderGrowthRate: 0.3
    };

    // Compare features against pattern characteristics
    Object.keys(weights).forEach(key => {
      if (features[key] !== undefined) {
        const normalized = Math.min(features[key] / 100, 1); // Normalize to 0-1
        score += normalized * weights[key];
      }
    });

    return Math.min(score, 1);
  }

  private assessRiskFactors(features: Record<string, number>): string[] {
    const risks: string[] = [];

    if (features.volatility > 80) risks.push('High volatility');
    if (features.liquidityScore < 30) risks.push('Low liquidity');
    if (features.socialSentiment < 20) risks.push('Negative sentiment');
    if (features.holderGrowthRate < -10) risks.push('Declining user base');
    if (features.githubActivity < 5) risks.push('Low development activity');
    if (features.volumeToMarketCap < 0.01) risks.push('Low trading activity');

    return risks;
  }

  private calculateSuccessProbability(features: Record<string, number>, bestMatch: { pattern: string; confidence: number } | null): number {
    let baseProbability = 0.5;

    // Adjust based on features
    if (features.priceGrowth > 50) baseProbability += 0.2;
    if (features.holderGrowthRate > 20) baseProbability += 0.15;
    if (features.socialSentiment > 60) baseProbability += 0.1;
    if (features.liquidityScore > 70) baseProbability += 0.1;
    if (features.githubActivity > 20) baseProbability += 0.05;

    // Adjust based on pattern match
    if (bestMatch && bestMatch.confidence > 0.7) {
      baseProbability += 0.1;
    }

    return Math.min(Math.max(baseProbability, 0), 1);
  }
}