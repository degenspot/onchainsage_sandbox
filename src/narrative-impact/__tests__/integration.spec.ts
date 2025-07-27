import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { NarrativeCorrelationModule } from '../narrative-correlation.module';
import { NarrativeDataSource, PriceDataSource } from '../interfaces/data-source.interface';

describe('NarrativeCorrelation Integration', () => {
  let app: INestApplication;
  let mockNarrativeDataSource: jest.Mocked<NarrativeDataSource>;
  let mockPriceDataSource: jest.Mocked<PriceDataSource>;

  beforeAll(async () => {
    mockNarrativeDataSource = {
      fetchNarrativeData: jest.fn(),
    };

    mockPriceDataSource = {
      fetchPriceData: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NarrativeCorrelationModule],
    })
      .overrideProvider('NarrativeDataSource')
      .useValue(mockNarrativeDataSource)
      .overrideProvider('PriceDataSource')
      .useValue(mockPriceDataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockNarrativeDataSource.fetchNarrativeData.mockResolvedValue(
      new Map([
        ['#bitcoin', [
          {
            timestamp: new Date('2024-01-01T12:00:00Z'),
            sentiment: 0.75,
            volume: 1500,
            reach: 75000,
            engagementRate: 0.12,
          },
        ]],
      ])
    );

    mockPriceDataSource.fetchPriceData.mockResolvedValue([
      {
        timestamp: new Date('2024-01-01T12:00:00Z'),
        price: 45000,
        volume: 2000000000,
        marketCap: 900000000000,
        priceChange: 3.2,
      },
    ]);
  });

  describe('GET /narrative-correlation/analyze', () => {
    it('should return correlation analysis', async () => {
      const response = await request(app.getHttpServer())
        .get('/narrative-correlation/analyze')
        .query({
          tokenSymbol: 'BTC',
          hashtags: '#bitcoin',
          interval: '1d',
          minCorrelation: 0.1,
        })
        .expect(200);

      expect(response.body).toHaveProperty('tokenSymbol', 'BTC');
      expect(response.body).toHaveProperty('priceData');
      expect(response.body).toHaveProperty('narrativeCorrelations');
      expect(response.body).toHaveProperty('identifiedPatterns');
      expect(response.body).toHaveProperty('analysisMetadata');
    });

    it('should validate required parameters', async () => {
      await request(app.getHttpServer())
        .get('/narrative-correlation/analyze')
        .query({
          // Missing tokenSymbol
          hashtags: '#bitcoin',
        })
        .expect(400);
    });

    it('should validate date format', async () => {
      await request(app.getHttpServer())
        .get('/narrative-correlation/analyze')
        .query({
          tokenSymbol: 'BTC',
          startDate: 'invalid-date',
        })
        .expect(400);
    });

    it('should handle data source errors', async () => {
      mockNarrativeDataSource.fetchNarrativeData.mockRejectedValue(
        new Error('External API Error')
      );

      await request(app.getHttpServer())
        .get('/narrative-correlation/analyze')
        .query({
          tokenSymbol: 'BTC',
          hashtags: '#bitcoin',
        })
        .expect(500);
    });
  });

  describe('GET /narrative-correlation/patterns', () => {
    it('should return trading patterns', async () => {
      const response = await request(app.getHttpServer())
        .get('/narrative-correlation/patterns')
        .query({
          tokenSymbol: 'ETH',
          topics: 'DeFi',
          interval: '4h',
        })
        .expect(200);

      expect(response.body).toHaveProperty('tokenSymbol', 'ETH');
      expect(response.body).toHaveProperty('patterns');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.patterns)).toBe(true);
    });
  });

  describe('GET /narrative-correlation/insights', () => {
    it('should return actionable insights', async () => {
      const response = await request(app.getHttpServer())
        .get('/narrative-correlation/insights')
        .query({
          tokenSymbol: 'BTC',
          hashtags: '#bitcoin',
          minCorrelation: 0.3,
        })
        .expect(200);

      expect(response.body).toHaveProperty('tokenSymbol', 'BTC');
      expect(response.body).toHaveProperty('keyFindings');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('riskFactors');
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(Array.isArray(response.body.riskFactors)).toBe(true);
    });

    it('should provide relevant recommendations based on data', async () => {
      // Setup strong positive correlation
      mockNarrativeDataSource.fetchNarrativeData.mockResolvedValue(
        new Map([
          ['#bitcoin', Array.from({ length: 10 }, (_, i) => ({
            timestamp: new Date(Date.now() + i * 60 * 60 * 1000),
            sentiment: 0.5 + i * 0.05, // Increasing sentiment
            volume: 1000 + i * 100,
            reach: 50000,
            engagementRate: 0.1,
          }))],
        ])
      );

      mockPriceDataSource.fetchPriceData.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          timestamp: new Date(Date.now() + i * 60 * 60 * 1000),
          price: 45000 + i * 1000, // Increasing price
          volume: 2000000000,
          marketCap: 900000000000,
          priceChange: i * 2, // Positive changes
        }))
      );

      const response = await request(app.getHttpServer())
        .get('/narrative-correlation/insights')
        .query({
          tokenSymbol: 'BTC',
          hashtags: '#bitcoin',
          minCorrelation: 0.1,
        })
        .expect(200);

      expect(response.body.recommendations.length).toBeGreaterThan(0);
      expect(response.body.recommendations.some((rec: string) => 
        rec.includes('Monitor #bitcoin sentiment')
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      mockNarrativeDataSource.fetchNarrativeData.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await request(app.getHttpServer())
        .get('/narrative-correlation/analyze')
        .query({
          tokenSymbol: 'BTC',
          hashtags: '#bitcoin',
        })
        .expect(500);
    });

    it('should handle malformed data responses', async () => {
      mockNarrativeDataSource.fetchNarrativeData.mockResolvedValue(
        new Map([
          ['#bitcoin', [
            {
              // Missing required fields
              timestamp: new Date(),
              sentiment: null,
            } as any,
          ]],
        ])
      );

      // Should still return a response, possibly with filtered data
      const response = await request(app.getHttpServer())
        .get('/narrative-correlation/analyze')
        .query({
          tokenSymbol: 'BTC',
          hashtags: '#bitcoin',
        });

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeNarrativeData = new Map([
        ['#bitcoin', Array.from({ length: 1000 }, (_, i) => ({
          timestamp: new Date(Date.now() + i * 60 * 60 * 1000),
          sentiment: Math.random() * 2 - 1,
          volume: Math.floor(Math.random() * 10000),
          reach: Math.floor(Math.random() * 100000),
          engagementRate: Math.random() * 0.2,
        }))],
      ]);

      const largePriceData = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 60 * 60 * 1000),
        price: 45000 + Math.random() * 10000,
        volume: Math.floor(Math.random() * 5000000000),
        marketCap: 900000000000,
        priceChange: Math.random() * 20 - 10,
      }));

      mockNarrativeDataSource.fetchNarrativeData.mockResolvedValue(largeNarrativeData);
      mockPriceDataSource.fetchPriceData.mockResolvedValue(largePriceData);

      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/narrative-correlation/analyze')
        .query({
          tokenSymbol: 'BTC',
          hashtags: '#bitcoin',
          minCorrelation: 0.1,
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(10000); // 10 seconds
    });
  });
});
