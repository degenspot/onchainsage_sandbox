import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingSignalsModule } from '../src/trading-signals/trading-signals.module';
import { Signal, SignalStatus } from '../src/trading-signals/entities/signal.entity';
import { SignalComponent, ComponentType } from '../src/trading-signals/entities/signal-component.entity';
import { SignalTest } from '../src/trading-signals/entities/signal-test.entity';

describe('TradingSignalsController (e2e)', () => {
  let app: INestApplication;
  let signalId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Signal, SignalComponent, SignalTest],
          synchronize: true,
        }),
        TradingSignalsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/signals (POST)', () => {
    it('should create a new signal', async () => {
      const createSignalDto = {
        name: 'Test Signal',
        description: 'Test Description',
        configuration: { timeframe: '1h' },
        layout: { nodes: [], edges: [] },
      };

      const response = await request(app.getHttpServer())
        .post('/signals')
        .send(createSignalDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Test Signal',
        description: 'Test Description',
        status: SignalStatus.DRAFT,
        isPublic: false,
      });

      signalId = response.body.id;
    });
  });

  describe('/signals (GET)', () => {
    beforeEach(async () => {
      // Create a test signal
      const response = await request(app.getHttpServer())
        .post('/signals')
        .send({
          name: 'Test Signal',
          description: 'Test Description',
          configuration: {},
          layout: {},
        });
      signalId = response.body.id;
    });

    it('should return all signals', async () => {
      const response = await request(app.getHttpServer())
        .get('/signals')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        name: 'Test Signal',
        description: 'Test Description',
      });
    });

    it('should filter signals by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/signals?status=draft')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe(SignalStatus.DRAFT);
    });
  });

  describe('/signals/:id/components (POST)', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/signals')
        .send({
          name: 'Test Signal',
          configuration: {},
          layout: {},
        });
      signalId = response.body.id;
    });

    it('should add a component to signal', async () => {
      const componentDto = {
        type: ComponentType.INDICATOR,
        name: 'RSI',
        config: { period: 14 },
        position: { x: 100, y: 200 },
      };

      const response = await request(app.getHttpServer())
        .post(`/signals/${signalId}/components`)
        .send(componentDto)
        .expect(201);

      expect(response.body).toMatchObject({
        type: ComponentType.INDICATOR,
        name: 'RSI',
        config: { period: 14 },
        position: { x: 100, y: 200 },
      });
    });
  });

  describe('/signals/:id/validate (GET)', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/signals')
        .send({
          name: 'Test Signal',
          configuration: {},
          layout: {},
        });
      signalId = response.body.id;
    });

    it('should validate signal and return errors for incomplete signal', async () => {
      const response = await request(app.getHttpServer())
        .get(`/signals/${signalId}/validate`)
        .expect(200);

      expect(response.body).toMatchObject({
        isValid: false,
        errors: expect.arrayContaining([
          'Signal must have at least one data source',
          'Signal must have at least one condition',
          'Signal must have at least one action',
        ]),
      });
    });
  });

  describe('/signals/:signalId/tests (POST)', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/signals')
        .send({
          name: 'Test Signal',
          configuration: {},
          layout: {},
        });
      signalId = response.body.id;
    });

    it('should create a test for signal', async () => {
      const testDto = {
        name: 'Backtest 1',
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-12-31T00:00:00Z',
        parameters: { commission: 0.001 },
      };

      const response = await request(app.getHttpServer())
        .post(`/signals/${signalId}/tests`)
        .send(testDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Backtest 1',
        status: 'running',
        parameters: expect.objectContaining({
          startDate: '2023-01-01T00:00:00Z',
          endDate: '2023-12-31T00:00:00Z',
          commission: 0.001,
        }),
      });
    });
  });
});
