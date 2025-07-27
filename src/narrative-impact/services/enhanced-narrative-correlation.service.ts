import { Injectable, Logger } from '@nestjs/common';
import { CorrelationQueryDto, CorrelationAnalysisResponse, NarrativeCorrelation } from '../dto/correlation-response.dto';
import { NarrativeDataRepository } from '../repositories/narrative-data.repository';
import { PriceDataRepository } from '../repositories/price-data.repository';
import { CorrelationAnalysisRepository } from '../repositories/correlation-analysis.repository';
import { TradingPatternRepository } from '../repositories/trading-pattern.repository';
import { CorrelationAnalysisService } from './correlation-analysis.service';
import { PatternDetectionService } from './pattern-detection.service';

@Injectable()
export class EnhancedNarrativeCorrelationService {
  private readonly logger = new Logger(EnhancedNarrativeCorrelationService.name);

  constructor(
    private readonly narrativeDataRepository: NarrativeDataRepository,
    private readonly priceDataRepository: PriceDataRepository,
    private readonly correlationAnalysisRepository: CorrelationAnalysisRepository,
    private readonly tradingPatternRepository: TradingPatternRepository,
    private readonly correlationAnalysisService: CorrelationAnalysisService,
    private readonly patternDetectionService: PatternDetectionService,
  ) {}

  async analyzeCorrelations(query: CorrelationQueryDto): Promise<CorrelationAnalysisResponse> {
    try {
      this.logger.log(`Starting correlation analysis for ${query.tokenSymbol}`);

      const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = query.endDate ? new Date(query.endDate) : new Date();

      // Fetch data from database
      const [narrativeEntities, priceEntities] = await Promise.all([
        this.narrativeDataRepository.findByTokenAndTimeRange(
          query.tokenSymbol,
          startDate,
          endDate,
          [...(query.hashtags || []), ...(query.topics || [])]
        ),
        this.priceDataRepository.findByTokenAndTimeRange(
          query.tokenSymbol,
          startDate,
          endDate,
          query.interval
        ),
      ]);

      // Convert entities to DTOs
      const narrativeData = this.groupNarrativeData(narrativeEntities);
      const priceData = priceEntities.map(entity => ({
        timestamp: entity.timestamp,
        price: entity.price,
        volume: entity.volume,
        marketCap: entity.marketCap,
        priceChange: entity.priceChange,
      }));

      // Analyze correlations
      const narrativeCorrelations: NarrativeCorrelation[] = [];
      
      for (const [identifier, data] of narrativeData) {
        const correlationMetrics = this.correlationAnalysisService.calculateCorrelationMetrics(data, priceData);
        
        if (Math.abs(correlationMetrics.pearsonCorrelation) >= query.minCorrelation) {
          const totalMentions = data.reduce((sum, point) => sum + point.volume, 0);
          const averageSentiment = data.reduce((sum, point) => sum + point.sentiment, 0) / data.length;
          const peakInfluenceDate = data.reduce((peak, current) => 
            current.reach > peak.reach ? current : peak
          ).timestamp;

          const correlation: NarrativeCorrelation = {
            identifier,
            type: identifier.startsWith('#') ? 'hashtag' : 'topic',
            displayName: identifier.startsWith('#') ? identifier : `#${identifier}`,
            correlationMetrics,
            narrativeData: data,
            totalMentions,
            averageSentiment,
            peakInfluenceDate
          };

          narrativeCorrelations.push(correlation);

          // Save correlation analysis to database
          await this.correlationAnalysisRepository.create({
            tokenSymbol: query.tokenSymbol,
            identifier,
            narrativeType: correlation.type,
            analysisDate: new Date(),
            startDate,
            endDate,
            pearsonCorrelation: correlationMetrics.pearsonCorrelation,
            spearmanCorrelation: correlationMetrics.spearmanCorrelation,
            pValue: correlationMetrics.pValue,
            confidenceIntervalLower: correlationMetrics.confidenceInterval[0],
            confidenceIntervalUpper: correlationMetrics.confidenceInterval[1],
            strength: correlationMetrics.strength,
            totalMentions,
            averageSentiment,
            peakInfluenceDate,
            interval: query.interval || '1d',
          });
        }
      }

      // Detect trading patterns
      const identifiedPatterns = this.patternDetectionService.detectTradingPatterns(narrativeData, priceData);

      // Save patterns to database
      for (const pattern of identifiedPatterns) {
        await this.tradingPatternRepository.create({
          tokenSymbol: query.tokenSymbol,
          identifier: 'general', // You might want to associate with specific narratives
          patternType: pattern.patternType,
          description: pattern.description,
          confidence: pattern.confidence,
          avgTimeDelay: pattern.avgTimeDelay,
          avgPriceImpact: pattern.avgPriceImpact,
          occurrences: pattern.occurrences,
          detectedDate: new Date(),
          analysisStartDate: startDate,
          analysisEndDate: endDate,
          interval: query.interval || '1d',
        });
      }

      // Calculate overall market correlation
      const allNarrativePoints = Array.from(narrativeData.values()).flat();
      const overallCorrelation = this.calculateOverallCorrelation(allNarrativePoints, priceData);

      const response: CorrelationAnalysisResponse = {
        tokenSymbol: query.tokenSymbol,
        analysisTimeframe: { startDate, endDate },
        priceData,
        narrativeCorrelations: narrativeCorrelations.sort((a, b) => 
          Math.abs(b.correlationMetrics.pearsonCorrelation) - Math.abs(a.correlationMetrics.pearsonCorrelation)
        ),
        identifiedPatterns,
        overallMarketCorrelation: overallCorrelation,
        analysisMetadata: {
          totalDataPoints: priceData.length,
          correlationsFound: narrativeCorrelations.length,
          strongCorrelations: narrativeCorrelations.filter(nc => 
            nc.correlationMetrics.strength === 'strong' || nc.correlationMetrics.strength === 'very_strong'
          ).length,
          lastUpdated: new Date()
        }
      };

      this.logger.log(`Analysis completed: found ${narrativeCorrelations.length} correlations and ${identifiedPatterns.length} patterns`);
      return response;

    } catch (error) {
      this.logger.error('Error during correlation analysis', error);
      throw error;
    }
  }

  private groupNarrativeData(entities: any[]): Map<string, any[]> {
    const grouped = new Map();
    
    for (const entity of entities) {
      if (!grouped.has(entity.identifier)) {
        grouped.set(entity.identifier, []);
      }
      
      grouped.get(entity.identifier).push({
        timestamp: entity.timestamp,
        sentiment: entity.sentiment,
        volume: entity.volume,
        reach: entity.reach,
        engagementRate: entity.engagementRate,
      });
    }
    
    return grouped;
  }

  private calculateOverallCorrelation(narrativeData: any[], priceData: any[]): number {
    if (narrativeData.length === 0 || priceData.length === 0) return 0;

    // Aggregate sentiment by timestamp
    const sentimentByTime = new Map<string, number[]>();
    
    for (const point of narrativeData) {
      const timeKey = point.timestamp.toISOString().substring(0, 13); // Hour precision
      if (!sentimentByTime.has(timeKey)) {
        sentimentByTime.set(timeKey, []);
      }
      sentimentByTime.get(timeKey)!.push(point.sentiment);
    }

    // Calculate average sentiment per time period
    const avgSentiments: number[] = [];
    const priceChanges: number[] = [];

    for (const price of priceData) {
      const timeKey = price.timestamp.toISOString().substring(0, 13);
      const sentiments = sentimentByTime.get(timeKey);
      
      if (sentiments && sentiments.length > 0) {
        const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
        avgSentiments.push(avgSentiment);
        priceChanges.push(price.priceChange);
      }
    }

    return this.correlationAnalysisService.calculatePearsonCorrelation(avgSentiments, priceChanges);
  }

  async getHistoricalCorrelations(tokenSymbol: string, days: number = 30) {
    const analysisDate = new Date();
    analysisDate.setDate(analysisDate.getDate() - days);
    
    return this.correlationAnalysisRepository.findByTokenAndDate(tokenSymbol, analysisDate);
  }

  async getStrongCorrelations(tokenSymbol: string) {
    return this.correlationAnalysisRepository.findStrongCorrelations(tokenSymbol, 'strong');
  }

  async getHighConfidencePatterns(tokenSymbol: string) {
    return this.tradingPatternRepository.findHighConfidencePatterns(tokenSymbol, 0.8);
  }
}
