import { Test, TestingModule } from '@nestjs/testing';
import { PatternDetectionService } from '../pattern-detection.service';
import { NarrativeDataPoint, PriceDataPoint } from '../../dto/correlation-response.dto';

describe('PatternDetectionService', () => {
  let service: PatternDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatternDetectionService],
    }).compile();

    service = module.get<PatternDetectionService>(PatternDetectionService);
  });

  describe('detectTradingPatterns', () => {
    let mockNarrativeData: Map<string, NarrativeDataPoint[]>;
    let mockPriceData: PriceDataPoint[];

    beforeEach(() => {
      const baseTime = new Date('2024-01-01T00:00:00Z');
      
      // Create narrative data with sentiment spikes
      const narrativePoints: NarrativeDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(baseTime.getTime() + i * 60 * 60 * 1000),
        sentiment: i === 5 || i === 15 ? 0.9 : 0.3, // Spikes at hours 5 and 15
        volume: i === 5 || i === 15 ? 1000 : 100,
        reach: 5000,
        engagementRate: 0.05
      }));

      // Create price data with increases after sentiment spikes
      mockPriceData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(baseTime.getTime() + i * 60 * 60 * 1000),
        price: 100 + (i === 7 || i === 17 ? 5 : 0), // Price increases 2 hours after sentiment spikes
        volume: 1000000,
        marketCap: 1000000000,
        priceChange: i === 7 || i === 17 ? 5 : 0
      }));

      mockNarrativeData = new Map([['#bitcoin', narrativePoints]]);
    });

    it('should detect sentiment-price spike patterns', () => {
      const patterns = service.detectTradingPatterns(mockNarrativeData, mockPriceData);

      const sentimentPattern = patterns.find(p => p.patternType === 'price_spike_after_sentiment');
      
      expect(sentimentPattern).toBeDefined();
      expect(sentimentPattern!.confidence).toBeGreaterThan(0.6);
      expect(sentimentPattern!.avgTimeDelay).toBeCloseTo(2, 1); // 2 hours delay
      expect(sentimentPattern!.avgPriceImpact).toBeCloseTo(5, 1); // 5% price increase
      expect(sentimentPattern!.occurrences).toBe(2);
    });

    it('should detect volume correlations', () => {
      // Modify data to have correlated volumes
      const correlatedNarrative = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 60 * 60 * 1000),
        sentiment: 0.5,
        volume: 100 + i * 50, // Increasing narrative volume
        reach: 5000,
        engagementRate: 0.05
      }));

      const correlatedPrice = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 60 * 60 * 1000),
        price: 100,
        volume: 1000000 + i * 500000, // Increasing trading volume
        marketCap: 1000000000,
        priceChange: 0
      }));

      const correlatedData = new Map([['#ethereum', correlatedNarrative]]);
      const patterns = service.detectTradingPatterns(correlatedData, correlatedPrice);

      const volumePattern = patterns.find(p => p.patternType === 'volume_correlation');
      
      expect(volumePattern).toBeDefined();
      expect(volumePattern!.confidence).toBeGreaterThan(0.5);
    });

    it('should filter out low-confidence patterns', () => {
      // Create random data that should not produce strong patterns
      const randomNarrative = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 60 * 60 * 1000),
        sentiment: Math.random(),
        volume: Math.random() * 1000,
        reach: 5000,
        engagementRate: 0.05
      }));

      const randomPrice = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 60 * 60 * 1000),
        price: 100 + Math.random() * 10,
        volume: 1000000 + Math.random() * 500000,
        marketCap: 1000000000,
        priceChange: Math.random() * 10 - 5
      }));

      const randomData = new Map([['#random', randomNarrative]]);
      const patterns = service.detectTradingPatterns(randomData, randomPrice);

      // Should return few or no high-confidence patterns
      expect(patterns.length).toBeLessThan(3);
      patterns.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThanOrEqual(0.6);
      });
    });
  });
});
