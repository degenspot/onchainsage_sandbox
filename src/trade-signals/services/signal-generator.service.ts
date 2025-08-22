import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TradingSignalEntity, SignalParametersEntity } from '../entities/trading-signal.entity';
import { SentimentAnalyzerService } from './sentiment-analyzer.service';
import { TechnicalAnalysisService } from './technical-analysis.service';
import { OnChainDataService } from './on-chain-data.service';
import { TradingSignal, SignalParameters, OnChainMetrics } from '../interfaces/trading-signal.interface';

@Injectable()
export class SignalGeneratorService {
  private readonly logger = new Logger(SignalGeneratorService.name);

  constructor(
    @InjectRepository(TradingSignalEntity)
    private readonly signalRepository: Repository<TradingSignalEntity>,
    @InjectRepository(SignalParametersEntity)
    private readonly parametersRepository: Repository<SignalParametersEntity>,
    private readonly sentimentAnalyzer: SentimentAnalyzerService,
    private readonly technicalAnalysis: TechnicalAnalysisService,
    private readonly onChainData: OnChainDataService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async generateSignal(tokenAddress: string, tokenSymbol: string, parametersId: string): Promise<TradingSignal> {
    try {
      // Get signal parameters
      const parameters = await this.getSignalParameters(parametersId);
      if (!parameters) {
        throw new Error(`Signal parameters not found: ${parametersId}`);
      }

      // Collect all data sources
      const [sentimentScore, onChainMetrics, technicalScore] = await Promise.all([
        this.sentimentAnalyzer.analyzeSentiment(tokenAddress, tokenSymbol),
        this.onChainData.getOnChainMetrics(tokenAddress),
        this.getTechnicalScore(tokenAddress),
      ]);

      // Apply filters
      if (!this.passesFilters(onChainMetrics, parameters.filters)) {
        return null; // Token doesn't meet minimum criteria
      }

      // Calculate component scores
      const components = {
        sentimentScore: this.normalizeSentiment(sentimentScore),
        technicalScore,
        onChainScore: this.calculateOnChainScore(onChainMetrics),
        volumeScore: this.calculateVolumeScore(onChainMetrics),
      };

      // Calculate weighted final score
      const finalScore = this.calculateWeightedScore(components, parameters.weights);

      // Determine signal type
      const signal = this.determineSignal(finalScore, parameters.thresholds);

      // Calculate confidence based on data quality and consensus
      const confidence = this.calculateConfidence(components, onChainMetrics);

      // Generate reasoning
      const reasoning = this.generateReasoning(components, signal, parameters);

      const tradingSignal: TradingSignal = {
        id: '', // Will be set after saving
        tokenAddress,
        tokenSymbol,
        signal,
        confidence,
        price: onChainMetrics.price,
        strength: finalScore,
        components,
        reasoning,
        parameters: parametersId,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + this.getSignalExpiryTime(parameters.timeframe)),
      };

      // Save signal to database
      const savedSignal = await this.saveSignal(tradingSignal);

      // Emit signal event for notifications
      this.eventEmitter.emit('trading.signal-generated', savedSignal);

      this.logger.log(`Generated ${signal} signal for ${tokenSymbol} with ${confidence}% confidence`);
      return savedSignal;
    } catch (error) {
      this.logger.error(`Signal generation failed for ${tokenSymbol}:`, error);
      throw error;
    }
  }

  async getActiveSignals(tokenAddress?: string, signal?: string): Promise<TradingSignal[]> {
    const query = this.signalRepository.createQueryBuilder('signal')
      .where('signal.expiresAt > :now', { now: new Date() });

    if (tokenAddress) {
      query.andWhere('signal.tokenAddress = :tokenAddress', { tokenAddress });
    }

    if (signal) {
      query.andWhere('signal.signal = :signal', { signal });
    }

    const entities = await query
      .orderBy('signal.timestamp', 'DESC')
      .getMany();

    return entities.map(entity => this.entityToSignal(entity));
  }

  async getSignalHistory(tokenAddress: string, limit: number = 100): Promise<TradingSignal[]> {
    const entities = await this.signalRepository.find({
      where: { tokenAddress },
      order: { timestamp: 'DESC' },
      take: limit,
    });

    return entities.map(entity => this.entityToSignal(entity));
  }

  private async getSignalParameters(parametersId: string): Promise<SignalParameters | null> {
    const entity = await this.parametersRepository.findOne({
      where: { id: parametersId, isActive: true },
    });

    if (!entity) return null;

    return {
      name: entity.name,
      description: entity.description,
      weights: entity.weights,
      thresholds: entity.thresholds,
      filters: entity.filters,
      timeframe: entity.timeframe as any,
    };
  }

  private async getTechnicalScore(tokenAddress: string): Promise<number> {
    try {
      const priceData = await this.onChainData.getPriceHistory(tokenAddress, 100);
      const indicators = await this.technicalAnalysis.calculateIndicators(priceData);
      const currentPrice = priceData[priceData.length - 1].close;
      return await this.technicalAnalysis.generateTechnicalScore(indicators, currentPrice);
    } catch (error) {
      this.logger.error(`Technical analysis failed for ${tokenAddress}:`, error);
      return 50; // Neutral score on error
    }
  }

  private passesFilters(metrics: OnChainMetrics, filters: any): boolean {
    return (
      metrics.volume24h >= filters.minVolume &&
      metrics.marketCap >= filters.minMarketCap &&
      metrics.liquidity >= filters.minLiquidity &&
      Math.abs(metrics.priceChange24h) <= filters.maxVolatility
    );
  }

  private normalizeSentiment(sentiment: number): number {
    // Convert sentiment from -1 to 1 range to 0 to 100 range
    return (sentiment + 1) * 50;
  }

  private calculateOnChainScore(metrics: OnChainMetrics): number {
    let score = 50; // Start neutral

    // Price change scoring
    if (metrics.priceChange24h > 10) score += 20;
    else if (metrics.priceChange24h > 5) score += 10;
    else if (metrics.priceChange24h < -10) score -= 20;
    else if (metrics.priceChange24h < -5) score -= 10;

    // Volume change scoring
    if (metrics.volumeChange24h > 50) score += 15;
    else if (metrics.volumeChange24h > 20) score += 10;
    else if (metrics.volumeChange24h < -30) score -= 15;

    // Transaction activity scoring
    if (metrics.transactions24h > 1000) score += 10;
    else if (metrics.transactions24h < 100) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateVolumeScore(metrics: OnChainMetrics): number {
    // Volume vs market cap ratio
    const volumeRatio = metrics.volume24h / metrics.marketCap;
    
    if (volumeRatio > 0.5) return 90; // Very high volume
    if (volumeRatio > 0.2) return 80;
    if (volumeRatio > 0.1) return 70;
    if (volumeRatio > 0.05) return 60;
    if (volumeRatio > 0.01) return 50;
    return 30; // Low volume
  }

  private calculateWeightedScore(components: any, weights: any): number {
    const totalWeight = Object.values(weights).reduce((sum: number, weight: number) => sum + weight, 0);
    
    if (totalWeight === 0) return 50;

    const weightedSum = 
      (components.sentimentScore * weights.sentiment) +
      (components.technicalScore * weights.technical) +
      (components.onChainScore * weights.onChain) +
      (components.volumeScore * weights.volume);

    return Math.round(weightedSum / totalWeight);
  }

  private determineSignal(score: number, thresholds: any): 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL' | 'HOLD' {
    if (score >= thresholds.strongBuy) return 'STRONG_BUY';
    if (score >= thresholds.buySignal) return 'BUY';
    if (score <= thresholds.strongSell) return 'STRONG_SELL';
    if (score <= thresholds.sellSignal) return 'SELL';
    return 'HOLD';
  }

  private calculateConfidence(components: any, metrics: OnChainMetrics): number {
    let confidence = 50;

    // Consensus between indicators increases confidence
    const scores = [components.sentimentScore, components.technicalScore, components.onChainScore];
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const consensus = Math.max(0, 100 - Math.sqrt(variance) * 2);
    
    confidence = (confidence + consensus) / 2;

    // Higher volume increases confidence
    if (metrics.volume24h > metrics.marketCap * 0.1) confidence += 15;
    else if (metrics.volume24h > metrics.marketCap * 0.05) confidence += 10;

    // More transactions increase confidence
    if (metrics.transactions24h > 500) confidence += 10;

    return Math.round(Math.max(0, Math.min(100, confidence)));
  }

  private generateReasoning(components: any, signal: string, parameters: SignalParameters): string[] {
    const reasoning: string[] = [];

    // Sentiment reasoning
    if (components.sentimentScore > 70) {
      reasoning.push('Strong positive social sentiment across platforms');
    } else if (components.sentimentScore < 30) {
      reasoning.push('Negative social sentiment detected');
    }

    // Technical reasoning
    if (components.technicalScore > 70) {
      reasoning.push('Technical indicators show bullish momentum');
    } else if (components.technicalScore < 30) {
      reasoning.push('Technical analysis indicates bearish trend');
    }

    // On-chain reasoning
    if (components.onChainScore > 70) {
      reasoning.push('Strong on-chain fundamentals and activity');
    } else if (components.onChainScore < 30) {
      reasoning.push('Weak on-chain metrics detected');
    }

    // Volume reasoning
    if (components.volumeScore > 80) {
      reasoning.push('Exceptional trading volume supports signal');
    } else if (components.volumeScore < 40) {
      reasoning.push('Low volume may limit price movement');
    }

    // Signal-specific reasoning
    if (signal.includes('STRONG')) {
      reasoning.push('Multiple indicators align for high-conviction signal');
    }

    return reasoning;
  }

  private getSignalExpiryTime(timeframe: string): number {
    const timeframes = {
      '1m': 2 * 60 * 1000,      // 2 minutes
      '5m': 10 * 60 * 1000,     // 10 minutes
      '15m': 30 * 60 * 1000,    // 30 minutes
      '1h': 2 * 60 * 60 * 1000, // 2 hours
      '4h': 8 * 60 * 60 * 1000, // 8 hours
      '1d': 24 * 60 * 60 * 1000, // 24 hours
    };
    return timeframes[timeframe] || 60 * 60 * 1000; // Default 1 hour
  }

  private async saveSignal(signal: TradingSignal): Promise<TradingSignal> {
    const entity = new TradingSignalEntity();
    entity.tokenAddress = signal.tokenAddress;
    entity.tokenSymbol = signal.tokenSymbol;
    entity.signal = signal.signal;
    entity.confidence = signal.confidence;
    entity.price = signal.price;
    entity.strength = signal.strength;
    entity.components = signal.components;
    entity.reasoning = signal.reasoning;
    entity.parametersId = signal.parameters;
    entity.timestamp = signal.timestamp;
    entity.expiresAt = signal.expiresAt;

    const saved = await this.signalRepository.save(entity);
    return { ...signal, id: saved.id };
  }

  private entityToSignal(entity: TradingSignalEntity): TradingSignal {
    return {
      id: entity.id,
      tokenAddress: entity.tokenAddress,
      tokenSymbol: entity.tokenSymbol,
      signal: entity.signal as any,
      confidence: Number(entity.confidence),
      price: Number(entity.price),
      strength: Number(entity.strength),
      components: entity.components,
      reasoning: entity.reasoning,
      parameters: entity.parametersId,
      timestamp: entity.timestamp,
      expiresAt: entity.expiresAt,
    };
  }
}