import { Test, TestingModule } from '@nestjs/testing';
import { NarrativeCorrelationController } from '../narrative-correlation.controller';
import { NarrativeCorrelationService } from '../services/narrative-correlation.service';
import { CorrelationQueryDto, CorrelationAnalysisResponse } from '../dto/correlation-response.dto';

describe('NarrativeCorrelationController', () => {
  let controller: NarrativeCorrelationController;
  let mockService: jest.Mocked<NarrativeCorrelationService>;

  beforeEach(async () => {
    mockService = {
      analyzeCorrelations: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NarrativeCorrelationController],
      providers: [
        {
          provide: NarrativeCorrelationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<NarrativeCorrelationController>(NarrativeCorrelationController);
  });

  describe('analyzeCorrelations', () => {
    it('should return correlation analysis', async () => {
      const mockQuery: CorrelationQueryDto = {
        tokenSymbol: 'BTC',
        hashtags: ['#bitcoin'],
        interval: '1d',
        minCorrelation: 0.1,
      };

      const mockResponse: CorrelationAnalysisResponse = {
        tokenSymbol: 'BTC',
        analysisTimeframe: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        priceData: [],
        narrativeCorrelations: [],
        identifiedPatterns: [],
        overallMarketCorrelation: 0.3,
        analysisMetadata: {
          totalDataPoints: 100,
          correlationsFound: 5,
          strongCorrelations: 2,
          lastUpdated: new Date(),
        },
      };

      mockService.analyzeCorrelations.mockResolvedValue(mockResponse);

      const result = await controller.analyzeCorrelations(mockQuery);

      expect(result).toEqual(mockResponse);
      expect(mockService.analyzeCorrelations).toHaveBeenCalledWith(mockQuery);
    });
  });

    describe('getTradingPatterns', () => {
        it('should return trading patterns', async () => {
            const mockQuery: CorrelationQueryDto = {
                tokenSymbol: 'ETH',
                topics: ['DeFi'],
                interval: '4h',
                minCorrelation: 0.2,
            };

            const mockAnalysis: CorrelationAnalysisResponse = {
                tokenSymbol: 'ETH',
                analysisTimeframe: {
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-01-31'),
                },
                priceData: [],
                narrativeCorrelations: [],
                identifiedPatterns: [
                    {
                        patternType: 'price_spike_after_sentiment',
                        description: 'DeFi sentiment spikes followed by price increases',
                        confidence: 0.85,
                        avgTimeDelay: 6,
                        avgPriceImpact: 8.5,
                        occurrences: 15,
                    },
                ],
                overallMarketCorrelation: 0.4,
                analysisMetadata: {
                    totalDataPoints: 200,
                    correlationsFound: 8,
                    strongCorrelations: 3,
                    lastUpdated: new Date(),
                },
            };

            mockService.analyzeCorrelations.mockResolvedValue(mockAnalysis);

            const result = await controller.getTradingPatterns(mockQuery);

            expect(result).toEqual({
                tokenSymbol: 'ETH',
                patterns: mockAnalysis.identifiedPatterns,
                metadata: mockAnalysis.analysisMetadata,
            });
        });
    });
    describe('getInsights', () => {
    it('should return actionable insights', async () => {
      const mockQuery: CorrelationQueryDto = {
        tokenSymbol: 'BTC',
        hashtags: ['#bitcoin'],
        interval: '1d',
        minCorrelation: 0.3,
      };

      const mockAnalysis: CorrelationAnalysisResponse = {
        tokenSymbol: 'BTC',
        analysisTimeframe: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        priceData: [],
        narrativeCorrelations: [
          {
            identifier: '#bitcoin',
            type: 'hashtag',
            displayName: '#bitcoin',
            correlationMetrics: {
              pearsonCorrelation: 0.75,
              spearmanCorrelation: 0.72,
              pValue: 0.01,
              confidenceInterval: [0.6, 0.85],
              strength: 'strong',
            },
            narrativeData: [],
            totalMentions: 10000,
            averageSentiment: 0.65,
            peakInfluenceDate: new Date('2024-01-15'),
          },
        ],
        identifiedPatterns: [
          {
            patternType: 'price_spike_after_sentiment',
            description: 'Bitcoin sentiment spikes followed by price increases',
            confidence: 0.9,
            avgTimeDelay: 4,
            avgPriceImpact: 12.3,
            occurrences: 8,
          },
        ],
        overallMarketCorrelation: 0.55,
        analysisMetadata: {
          totalDataPoints: 150,
          correlationsFound: 1,
          strongCorrelations: 1,
          lastUpdated: new Date(),
        },
      };

      mockService.analyzeCorrelations.mockResolvedValue(mockAnalysis);

      const result = await controller.getInsights(mockQuery);

      expect(result.tokenSymbol).toBe('BTC');
      expect(result.keyFindings.strongestCorrelation).toEqual(mockAnalysis.narrativeCorrelations[0]);
      expect(result.keyFindings.totalStrongCorrelations).toBe(1);
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.riskFactors).toBeDefined();
    });

    it('should generate appropriate recommendations for positive correlations', async () => {
      const mockAnalysis: CorrelationAnalysisResponse = {
        tokenSymbol: 'BTC',
        analysisTimeframe: { startDate: new Date(), endDate: new Date() },
        priceData: [],
        narrativeCorrelations: [
          {
            identifier: '#bitcoin',
            type: 'hashtag',
            displayName: '#bitcoin',
            correlationMetrics: {
              pearsonCorrelation: 0.8, // Strong positive correlation
              spearmanCorrelation: 0.75,
              pValue: 0.001,
              confidenceInterval: [0.7, 0.9],
              strength: 'very_strong',
            },
            narrativeData: [],
            totalMentions: 5000,
            averageSentiment: 0.7,
            peakInfluenceDate: new Date(),
          },
        ],
        identifiedPatterns: [
          {
            patternType: 'price_spike_after_sentiment',
            description: 'Test pattern',
            confidence: 0.85,
            avgTimeDelay: 3.5,
            avgPriceImpact: 7.2,
            occurrences: 10,
          },
        ],
        overallMarketCorrelation: 0.6,
        analysisMetadata: {
          totalDataPoints: 200,
          correlationsFound: 1,
          strongCorrelations: 1,
          lastUpdated: new Date(),
        },
      };

      mockService.analyzeCorrelations.mockResolvedValue(mockAnalysis);

      const result = await controller.getInsights({
        tokenSymbol: 'BTC',
        minCorrelation: 0.1,
        interval: '1d',
      });

      expect(result.recommendations).toContain(
        expect.stringContaining('Monitor #bitcoin sentiment - positive sentiment historically correlates with price increases')
      );
      expect(result.recommendations).toContain(
        expect.stringContaining('Consider positions when sentiment spikes occur')
      );
    });

    it('should identify risk factors appropriately', async () => {
      const mockAnalysis: CorrelationAnalysisResponse = {
        tokenSymbol: 'BTC',
        analysisTimeframe: { startDate: new Date(), endDate: new Date() },
        priceData: [],
        narrativeCorrelations: [
          {
            identifier: '#bitcoin',
            type: 'hashtag',
            displayName: '#bitcoin',
            correlationMetrics: {
              pearsonCorrelation: 0.2, // Weak correlation
              spearmanCorrelation: 0.15,
              pValue: 0.3,
              confidenceInterval: [0.1, 0.3],
              strength: 'weak',
            },
            narrativeData: [],
            totalMentions: 1000,
            averageSentiment: 0.5,
            peakInfluenceDate: new Date(),
          },
        ],
        identifiedPatterns: [
          {
            patternType: 'price_spike_after_sentiment',
            description: 'High volatility pattern',
            confidence: 0.7,
            avgTimeDelay: 2,
            avgPriceImpact: 25, // High volatility
            occurrences: 5,
          },
        ],
        overallMarketCorrelation: 0.1,
        analysisMetadata: {
          totalDataPoints: 50, // Limited data
          correlationsFound: 1,
          strongCorrelations: 0,
          lastUpdated: new Date(),
        },
      };

      mockService.analyzeCorrelations.mockResolvedValue(mockAnalysis);

      const result = await controller.getInsights({
        tokenSymbol: 'BTC',
        minCorrelation: 0.1,
        interval: '1d',
      });

      expect(result.riskFactors).toContain('Limited historical data - correlations may not be statistically significant');
      expect(result.riskFactors).toContain('High volatility patterns detected - significant price swings possible');
      expect(result.riskFactors).toContain('Most correlations are weak - narrative impact may be limited');
    });
  });
});