import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Prediction Markets (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/prediction-markets (POST)', () => {
    it('should create a new prediction market', () => {
      const createMarketDto = {
        title: 'Will BTC reach $50,000 by end of month?',
        description: 'Predict if Bitcoin will reach $50,000 USD by the end of this month',
        marketType: 'token_price',
        resolutionType: 'oracle',
        tokenSymbol: 'BTC',
        targetPrice: 50000,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        platformFeePercentage: 2.5,
      };

      return request(app.getHttpServer())
        .post('/prediction-markets')
        .send(createMarketDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe(createMarketDto.title);
          expect(res.body.marketType).toBe(createMarketDto.marketType);
          expect(res.body.status).toBe('open');
        });
    });

    it('should reject invalid market data', () => {
      const invalidMarketDto = {
        title: '',
        description: 'Invalid market',
        marketType: 'invalid_type',
        resolutionType: 'oracle',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z', // End date before start date
      };

      return request(app.getHttpServer())
        .post('/prediction-markets')
        .send(invalidMarketDto)
        .expect(400);
    });
  });

  describe('/prediction-markets (GET)', () => {
    it('should return all markets', () => {
      return request(app.getHttpServer())
        .get('/prediction-markets')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.markets || res.body)).toBe(true);
        });
    });

    it('should filter markets by status', () => {
      return request(app.getHttpServer())
        .get('/prediction-markets?status=open')
        .expect(200)
        .expect((res) => {
          const markets = res.body.markets || res.body;
          markets.forEach((market: any) => {
            expect(market.status).toBe('open');
          });
        });
    });
  });

  describe('/prediction-markets/:id/participate (POST)', () => {
    let marketId: string;

    beforeEach(async () => {
      // Create a test market first
      const createMarketDto = {
        title: 'Test Market for Participation',
        description: 'A test market for participation testing',
        marketType: 'event_outcome',
        resolutionType: 'manual',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      };

      const response = await request(app.getHttpServer())
        .post('/prediction-markets')
        .send(createMarketDto);

      marketId = response.body.id;
    });

    it('should allow participation in a market', () => {
      const participateDto = {
        participationType: 'yes',
        amountStaked: 100,
        userAddress: '0x1234567890123456789012345678901234567890',
      };

      return request(app.getHttpServer())
        .post(`/prediction-markets/${marketId}/participate`)
        .send(participateDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.marketId).toBe(marketId);
          expect(res.body.participationType).toBe(participateDto.participationType);
          expect(res.body.amountStaked).toBe(participateDto.amountStaked);
        });
    });

    it('should reject participation with invalid data', () => {
      const invalidParticipateDto = {
        participationType: 'invalid',
        amountStaked: -10,
      };

      return request(app.getHttpServer())
        .post(`/prediction-markets/${marketId}/participate`)
        .send(invalidParticipateDto)
        .expect(400);
    });
  });

  describe('/prediction-markets/analytics/global (GET)', () => {
    it('should return global analytics', () => {
      return request(app.getHttpServer())
        .get('/prediction-markets/analytics/global')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalMarkets');
          expect(res.body).toHaveProperty('openMarkets');
          expect(res.body).toHaveProperty('totalVolume');
          expect(res.body).toHaveProperty('totalWinnings');
        });
    });
  });

  describe('/prediction-markets/search (GET)', () => {
    it('should search markets by query', () => {
      return request(app.getHttpServer())
        .get('/prediction-markets/search?q=BTC')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/prediction-markets/:id (GET)', () => {
    let marketId: string;

    beforeEach(async () => {
      // Create a test market
      const createMarketDto = {
        title: 'Test Market for Details',
        description: 'A test market for getting details',
        marketType: 'event_outcome',
        resolutionType: 'manual',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      };

      const response = await request(app.getHttpServer())
        .post('/prediction-markets')
        .send(createMarketDto);

      marketId = response.body.id;
    });

    it('should return market details', () => {
      return request(app.getHttpServer())
        .get(`/prediction-markets/${marketId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(marketId);
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('description');
          expect(res.body).toHaveProperty('marketType');
        });
    });

    it('should return 404 for non-existent market', () => {
      return request(app.getHttpServer())
        .get('/prediction-markets/non-existent-id')
        .expect(404);
    });
  });
}); 