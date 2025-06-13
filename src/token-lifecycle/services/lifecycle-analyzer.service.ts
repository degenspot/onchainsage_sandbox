import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../entities/token.entity';
import { TokenMetrics } from '../entities/token-metrics.entity';
import { LifecycleTransition } from '../entities/lifecycle-transition.entity';
import { TokenLifecycleStage } from '../enums/lifecycle-stage.enum';

@Injectable()
export class LifecycleAnalyzerService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(TokenMetrics)
    private metricsRepository: Repository<TokenMetrics>,
    @InjectRepository(LifecycleTransition)
    private transitionRepository: Repository<LifecycleTransition>
  ) {}

  async analyzeTokenStage(tokenId: string): Promise<{ stage: TokenLifecycleStage; confidence: number }> {
    const token = await this.tokenRepository.findOne({ where: { id: tokenId } });
    if (!token) throw new Error('Token not found');

    const recentMetrics = await this.metricsRepository.find({
      where: { tokenId },
      order: { timestamp: 'DESC' },
      take: 30 // Last 30 data points
    });

    if (recentMetrics.length === 0) {
      return { stage: TokenLifecycleStage.LAUNCH, confidence: 0.5 };
    }

    const analysis = this.performStageAnalysis(token, recentMetrics);
    return analysis;
  }

  private performStageAnalysis(token: Token, metrics: TokenMetrics[]): { stage: TokenLifecycleStage; confidence: number } {
    const latest = metrics[0];
    const daysSinceLaunch = Math.floor((Date.now() - new Date(token.launchDate).getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate key indicators
    const priceGrowth = this.calculatePriceGrowth(metrics);
    const volumeStability = this.calculateVolumeStability(metrics);
    const holderGrowth = this.calculateHolderGrowth(metrics);
    const volatilityTrend = this.calculateVolatilityTrend(metrics);
    
    let stage: TokenLifecycleStage;
    let confidence: number;

    // Stage determination logic
    if (daysSinceLaunch < 30) {
      stage = TokenLifecycleStage.LAUNCH;
      confidence = 0.9;
    } else if (daysSinceLaunch < 90 && priceGrowth > 100 && holderGrowth > 50) {
      stage = TokenLifecycleStage.EARLY_GROWTH;
      confidence = 0.8;
    } else if (priceGrowth > 500 && volumeStability > 0.7 && holderGrowth > 100) {
      stage = TokenLifecycleStage.EXPANSION;
      confidence = 0.85;
    } else if (volatilityTrend < 0.3 && volumeStability > 0.8 && daysSinceLaunch > 365) {
      stage = TokenLifecycleStage.MATURITY;
      confidence = 0.75;
    } else if (priceGrowth < -50 && holderGrowth < -20) {
      stage = TokenLifecycleStage.DECLINE;
      confidence = 0.7;
    } else if (token.currentStage === TokenLifecycleStage.DECLINE && priceGrowth > 20) {
      stage = TokenLifecycleStage.RECOVERY;
      confidence = 0.6;
    } else if (latest.volume < 1000 && latest.transactions < 10) {
      stage = TokenLifecycleStage.OBSOLETE;
      confidence = 0.8;
    } else {
      stage = token.currentStage; // Keep current stage if uncertain
      confidence = 0.4;
    }

    return { stage, confidence };
  }

  private calculatePriceGrowth(metrics: TokenMetrics[]): number {
    if (metrics.length < 2) return 0;
    const latest = metrics[0].price;
    const oldest = metrics[metrics.length - 1].price;
    return ((latest - oldest) / oldest) * 100;
  }

  private calculateVolumeStability(metrics: TokenMetrics[]): number {
    if (metrics.length < 7) return 0;
    const volumes = metrics.slice(0, 7).map(m => m.volume);
    const avg = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avg, 2), 0) / volumes.length;
    const cv = Math.sqrt(variance) / avg; // Coefficient of variation
    return Math.max(0, 1 - cv); // Stability score (lower CV = higher stability)
  }

  private calculateHolderGrowth(metrics: TokenMetrics[]): number {
    if (metrics.length < 2) return 0;
    const latest = metrics[0].holders;
    const oldest = metrics[metrics.length - 1].holders;
    return ((latest - oldest) / oldest) * 100;
  }

  private calculateVolatilityTrend(metrics: TokenMetrics[]): number {
    if (metrics.length < 7) return 0;
    const volatilities = metrics.slice(0, 7).map(m => m.volatility);
    return volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
  }
}
