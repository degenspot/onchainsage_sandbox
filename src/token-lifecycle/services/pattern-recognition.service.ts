import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../entities/token.entity';
import { TokenMetrics } from '../entities/token-metrics.entity';
import { PatternRecognition } from '../entities/pattern-recognition.entity';
import { SuccessPattern, TokenCategory } from '../enums/lifecycle-stage.enum';

@Injectable()
export class PatternRecognitionService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(TokenMetrics)
    private metricsRepository: Repository<TokenMetrics>,
    @InjectRepository(PatternRecognition)
    private patternRepository: Repository<PatternRecognition>
  ) {}

  async identifySuccessPatterns(): Promise<PatternRecognition[]> {
    const tokens = await this.tokenRepository.find({
      relations: ['metrics', 'transitions']
    });

    const patterns: Map<string, any> = new Map();

    for (const token of tokens) {
      const pattern = await this.analyzeTokenPattern(token);
      if (pattern) {
        const key = `${pattern.pattern}-${pattern.category}`;
        if (!patterns.has(key)) {
          patterns.set(key, {
            pattern: pattern.pattern,
            category: pattern.category,
            tokens: [],
            characteristics: {},
            keyMetrics: {}
          });
        }
        patterns.get(key).tokens.push(token);
      }
    }

    const results: PatternRecognition[] = [];
    for (const [key, data] of patterns) {
      if (data.tokens.length >= 5) { // Minimum sample size for pattern recognition
        const patternData = await this.calculatePatternCharacteristics(data.tokens);
        const patternEntity = new PatternRecognition();
        patternEntity.pattern = data.pattern;
        patternEntity.category = data.category;
        patternEntity.characteristics = patternData.characteristics;
        patternEntity.successRate = patternData.successRate;
        patternEntity.sampleSize = data.tokens.length;
        patternEntity.keyMetrics = patternData.keyMetrics;
        
        results.push(await this.patternRepository.save(patternEntity));
      }
    }

    return results;
  }

  private async analyzeTokenPattern(token: Token): Promise<{ pattern: SuccessPattern; category: TokenCategory } | null> {
    const metrics = await this.metricsRepository.find({
      where: { tokenId: token.id },
      order: { timestamp: 'ASC' }
    });

    if (metrics.length < 30) return null; // Need sufficient data

    const earlyMetrics = metrics.slice(0, 10);
    const laterMetrics = metrics.slice(-10);
    
    const priceGrowth = this.calculateTotalPriceGrowth(earlyMetrics, laterMetrics);
    const volumePattern = this.analyzeVolumePattern(metrics);
    const holderGrowth = this.calculateHolderGrowthPattern(metrics);
    const socialActivity = this.analyzeSocialActivity(metrics);

    let pattern: SuccessPattern;

    if (priceGrowth > 1000 && volumePattern.includes('spike')) {
      pattern = SuccessPattern.VIRAL_GROWTH;
    } else if (priceGrowth > 200 && priceGrowth < 500 && volumePattern.includes('steady')) {
      pattern = SuccessPattern.STEADY_ADOPTION;
    } else if (volumePattern.includes('institutional') && priceGrowth > 100) {
      pattern = SuccessPattern.INSTITUTIONAL_BACKING;
    } else if (socialActivity > 80 && holderGrowth > 100) {
      pattern = SuccessPattern.COMMUNITY_DRIVEN;
    } else if (token.category === TokenCategory.UTILITY && priceGrowth > 50) {
      pattern = SuccessPattern.UTILITY_BASED;
    } else if (priceGrowth > 2000 && volumePattern.includes('bubble')) {
      pattern = SuccessPattern.SPECULATIVE_BUBBLE;
    } else {
      return null;
    }

    return { pattern, category: token.category };
  }

  private calculateTotalPriceGrowth(early: TokenMetrics[], later: TokenMetrics[]): number {
    const earlyAvg = early.reduce((sum, m) => sum + m.price, 0) / early.length;
    const laterAvg = later.reduce((sum, m) => sum + m.price, 0) / later.length;
    return ((laterAvg - earlyAvg) / earlyAvg) * 100;
  }

  private analyzeVolumePattern(metrics: TokenMetrics[]): string[] {
    const volumes = metrics.map(m => m.volume);
    const avg = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const maxVolume = Math.max(...volumes);
    
    const patterns: string[] = [];
    
    if (maxVolume > avg * 10) patterns.push('spike');
    if (volumes.filter(v => v > avg * 0.8).length > volumes.length * 0.7) patterns.push('steady');
    if (volumes.slice(-10).every(v => v > avg * 2)) patterns.push('institutional');
    if (maxVolume > avg * 50) patterns.push('bubble');
    
    return patterns;
  }

  private calculateHolderGrowthPattern(metrics: TokenMetrics[]): number {
    if (metrics.length < 2) return 0;
    const first = metrics[0].holders;
    const last = metrics[metrics.length - 1].holders;
    return ((last - first) / first) * 100;
  }

  private analyzeSocialActivity(metrics: TokenMetrics[]): number {
    const socialScores = metrics.map(m => m.socialMentions + m.sentimentScore * 10);
    return socialScores.reduce((a, b) => a + b, 0) / socialScores.length;
  }

  private async calculatePatternCharacteristics(tokens: Token[]): Promise<{
    characteristics: Record<string, any>;
    successRate: number;
    keyMetrics: Record<string, any>;
  }> {
    // Calculate aggregate characteristics across all tokens in this pattern
    const characteristics = {
      avgLaunchToGrowth: 0,
      avgPriceGrowth: 0,
      avgHolderGrowth: 0,
      commonFactors: []
    };

    const keyMetrics = {
      avgVolume: 0,
      avgMarketCap: 0,
      avgVolatility: 0
    };

    // Success rate calculation (simplified - could be more sophisticated)
    const successfulTokens = tokens.filter(t => t.currentPrice > t.initialPrice * 2).length;
    const successRate = (successfulTokens / tokens.length) * 100;

    return { characteristics, successRate, keyMetrics };
  }
}