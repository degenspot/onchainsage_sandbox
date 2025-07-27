import { Test, TestingModule } from '@nestjs/testing';
import { NarrativeCorrelationService } from '../narrative-correlation.service';
import { CorrelationAnalysisService } from '../correlation-analysis.service';
import { PatternDetectionService } from '../pattern-detection.service';
import { NarrativeDataSource, PriceDataSource } from '../../interfaces/data-source.interface';
import { CorrelationQueryDto } from '../../dto/correlation-response.dto';

describe('NarrativeCorrelationService', () => {
  let service: NarrativeCorrelationService;
  let mockNarrativeDataSource: jest.Mocked<NarrativeDataSource>;
  let mockPriceDataSource: jest.Mocked<PriceDataSource>;
  let correlationAnalysisService: CorrelationAnalysisService;
  let patternDetectionService: PatternDetectionService;

  beforeEach(async () => {
    mockNarrativeDataSource = {
      fetchNarrativeData: jest.fn(),
    };

    mockPriceDataSource = {
      fetchPriceData: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NarrativeCorrelationService,
        CorrelationAnalysisService,
        PatternDetectionService,
        {
          provide: 'NarrativeDataSource',
          useValue: mockNarrativeDataSource,
        },
        {
          provide: 'PriceDataSource',
          useValue: mockPriceDataSource,
        },
      ],
    }).compile();

    service = module.get<NarrativeCorrelationService>(NarrativeCorrelationService);
    correlationAnalysisService = module.get<CorrelationAnalysisService>(CorrelationAnalysisService);
    patternDetectionService = module.get<PatternDetectionService>(PatternDetectionService);
  });

  describe('analyzeCorrelations', () => {
    let mockQuery: CorrelationQueryDto;

    beforeEach(() => {
      mockQuery = {
        tokenSymbol: 'BTC',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        hashtags: ['#bitcoin', '#crypto'],
        topics: ['adoption', 'regulation'],
        interval: '1d',
        minCorrelation: 0.1,
      };

      const mockNarrativeData = new Map([
        ['#bitcoin', [
          {
            timestamp: new Date('2024-01-01'),
            sentiment: 0.8,
            volume: 1000,
            reach: 50000,
            engagementRate: 0.1,
          },
          {
            timestamp: new Date('2024-01-02'),
            sentiment: 0.6,
            volume: 800,
            reach: 40000,
            engagementRate: 0.08,
          },
        ]],
      ]);

      const mockPriceData = [
        {
          timestamp: new Date('2024-01-01'),
          price: 45000,
          volume: 1000000000,
          marketCap: 900000000000,
          priceChange: 2.5,
        },
        {
          timestamp: new Date('2024-01-02'),
          price: 44000,
          volume: 950000000,
          marketCap: 880000000000,
          priceChange: -2.2,
        },
      ];

      mockNarrativeDataSource.fetchNarrativeData.mockResolvedValue(mockNarrativeData);
      mockPriceDataSource.fetchPriceData.mockResolvedValue(mockPriceData);
    });

    it('should successfully analyze correlations', async () => {
      const result = await service.analyzeCorrelations(mockQuery);

      expect(result).toBeDefined();
      expect(result.tokenSymbol).toBe('BTC');
      expect(result.priceData).toHaveLength(2);
      expect(result.narrativeCorrelations).toBeDefined();
      expect(result.identifiedPatterns).toBeDefined();
      expect(result.analysisMetadata).toBeDefined();
      expect(result.analysisMetadata.totalDataPoints).toBe(2);
    });

    it('should filter correlations by minimum threshold', async () => {
      mockQuery.minCorrelation = 0.9; // Very high threshold

      const result = await service.analyzeCorrelations(mockQuery);

      // Should have fewer correlations due to high threshold
      expect(result.narrativeCorrelations.length).toBeLessThanOrEqual(1);
    });

    it('should handle empty narrative data', async () => {
      mockNarrativeDataSource.fetchNarrativeData.mockResolvedValue(new Map());

      const result = await service.analyzeCorrelations(mockQuery);

      expect(result.narrativeCorrelations).toHaveLength(0);
      expect(result.overallMarketCorrelation).toBe(0);
    });

    it('should handle empty price data', async () => {
      mockPriceDataSource.fetchPriceData.mockResolvedValue([]);

      const result = await service.analyzeCorrelations(mockQuery);

      expect(result.priceData).toHaveLength(0);
      expect(result.narrativeCorrelations).toHaveLength(0);
    });

    it('should sort correlations by strength', async () => {
      // Add multiple narratives with different correlation strengths
      const mockNarrativeData = new Map([
        ['#bitcoin', [
          { timestamp: new Date('2024-01-01'), sentiment: 0.9, volume: 1000, reach: 50000, engagementRate: 0.1 },
          { timestamp: new Date('2024-01-02'), sentiment: 0.8, volume: 900, reach: 45000, engagementRate: 0.09 },
        ]],
        ['#ethereum', [
          { timestamp: new Date('2024-01-01'), sentiment: 0.1, volume: 500, reach: 25000, engagementRate: 0.05 },
          { timestamp: new Date('2024-01-02'), sentiment: 0.2, volume: 600, reach: 30000, engagementRate: 0.06 },
        ]],
      ]);

      mockNarrativeDataSource.fetchNarrativeData.mockResolvedValue(mockNarrativeData);

      const result = await service.analyzeCorrelations(mockQuery);

      if (result.narrativeCorrelations.length > 1) {
        // Should be sorted by absolute correlation strength (descending)
        for (let i = 0; i < result.narrativeCorrelations.length - 1; i++) {
          const current = Math.abs(result.narrativeCorrelations[i].correlationMetrics.pearsonCorrelation);
          const next = Math.abs(result.narrativeCorrelations[i + 1].correlationMetrics.pearsonCorrelation);
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    it('should handle data source errors gracefully', async () => {
      mockNarrativeDataSource.fetchNarrativeData.mockRejectedValue(new Error('API Error'));

      await expect(service.analyzeCorrelations(mockQuery)).rejects.toThrow('API Error');
    });

    it('should use default date range when not provided', async () => {
      const queryWithoutDates = { ...mockQuery };
      delete queryWithoutDates.startDate;
      delete queryWithoutDates.endDate;

      await service.analyzeCorrelations(queryWithoutDates);

      expect(mockNarrativeDataSource.fetchNarrativeData).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        expect.any(Date), // Should be ~30 days ago
        expect.any(Date), // Should be now
        '1d'
      );

      const calls = mockNarrativeDataSource.fetchNarrativeData.mock.calls[0];
      const startDate = calls[2] as Date;
      const endDate = calls[3] as Date;
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      
      expect(daysDiff).toBeCloseTo(30, 1); // Should be approximately 30 days
    });
  });
});
