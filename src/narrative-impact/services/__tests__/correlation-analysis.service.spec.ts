import { Test, TestingModule } from '@nestjs/testing';
import { CorrelationAnalysisService } from '../correlation-analysis.service';
import { NarrativeDataPoint, PriceDataPoint } from '../../dto/correlation-response.dto';

describe('CorrelationAnalysisService', () => {
  let service: CorrelationAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorrelationAnalysisService],
    }).compile();

    service = module.get<CorrelationAnalysisService>(CorrelationAnalysisService);
  });

  describe('calculatePearsonCorrelation', () => {
    it('should return 1 for perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      
      const result = service.calculatePearsonCorrelation(x, y);
      
      expect(result).toBeCloseTo(1, 5);
    });

    it('should return -1 for perfect negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      
      const result = service.calculatePearsonCorrelation(x, y);
      
      expect(result).toBeCloseTo(-1, 5);
    });

    it('should return 0 for no correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [3, 1, 4, 1, 5]; // Pi digits, should be random
      
      const result = service.calculatePearsonCorrelation(x, y);
      
      expect(Math.abs(result)).toBeLessThan(0.5); // Should be close to 0
    });

    it('should handle empty arrays', () => {
      const result = service.calculatePearsonCorrelation([], []);
      expect(result).toBe(0);
    });

    it('should handle arrays of different lengths', () => {
      const result = service.calculatePearsonCorrelation([1, 2, 3], [1, 2]);
      expect(result).toBe(0);
    });
  });

  describe('calculateSpearmanCorrelation', () => {
    it('should calculate rank correlation correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 6, 7, 8, 7]; // Monotonic but not linear
      
      const result = service.calculateSpearmanCorrelation(x, y);
      
      expect(result).toBeGreaterThan(0.5); // Should show positive correlation
    });

    it('should handle tied ranks', () => {
      const x = [1, 2, 2, 3, 4];
      const y = [1, 2, 2, 3, 4];
      
      const result = service.calculateSpearmanCorrelation(x, y);
      
      expect(result).toBeCloseTo(1, 3);
    });
  });

  describe('calculateCorrelationMetrics', () => {
    let mockNarrativeData: NarrativeDataPoint[];
    let mockPriceData: PriceDataPoint[];

    beforeEach(() => {
      const baseTime = new Date('2024-01-01T00:00:00Z');
      
      mockNarrativeData = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(baseTime.getTime() + i * 60 * 60 * 1000), // Hourly data
        sentiment: 0.5 + (i * 0.1), // Increasing sentiment
        volume: 100 + (i * 10),
        reach: 1000 + (i * 100),
        engagementRate: 0.05 + (i * 0.01)
      }));

      mockPriceData = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(baseTime.getTime() + i * 60 * 60 * 1000),
        price: 100 + (i * 2), // Increasing price
        volume: 1000000 + (i * 100000),
        marketCap: 1000000000 + (i * 10000000),
        priceChange: i * 2 // Positive price changes
      }));
    });

    it('should calculate correlation metrics for aligned data', () => {
      const result = service.calculateCorrelationMetrics(mockNarrativeData, mockPriceData);

      expect(result.pearsonCorrelation).toBeGreaterThan(0.8); // Strong positive correlation
      expect(result.spearmanCorrelation).toBeGreaterThan(0.8);
      expect(result.pValue).toBeLessThan(0.05); // Statistically significant
      expect(result.strength).toBe('very_strong');
      expect(result.confidenceInterval).toHaveLength(2);
      expect(result.confidenceInterval[0]).toBeLessThan(result.confidenceInterval[1]);
    });

    it('should handle misaligned timestamps', () => {
      // Offset price data by 30 minutes
      const offsetPriceData = mockPriceData.map(point => ({
        ...point,
        timestamp: new Date(point.timestamp.getTime() + 30 * 60 * 1000)
      }));

      const result = service.calculateCorrelationMetrics(mockNarrativeData, offsetPriceData);

      expect(result.pearsonCorrelation).toBeGreaterThan(0.8); // Should still align within tolerance
    });

    it('should return weak correlation for random data', () => {
      const randomPriceData = mockPriceData.map(point => ({
        ...point,
        priceChange: Math.random() * 10 - 5 // Random price changes
      }));

      const result = service.calculateCorrelationMetrics(mockNarrativeData, randomPriceData);

      expect(Math.abs(result.pearsonCorrelation)).toBeLessThan(0.5);
      expect(['very_weak', 'weak', 'moderate']).toContain(result.strength);
    });
  });
});
