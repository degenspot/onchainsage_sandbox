import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TournamentsModule } from '../tournaments.module';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('Tournaments (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TournamentsModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../entities/*.entity.ts'],
          synchronize: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/tournaments (POST)', () => {
    it('should create a new tournament', () => {
      const createTournamentDto = {
        title: 'Test Tournament',
        description: 'A test tournament for e2e testing',
        tournamentType: 'daily',
        format: 'points_based',
        startDate: '2024-12-01T00:00:00Z',
        endDate: '2024-12-02T00:00:00Z',
        maxParticipants: 100,
        totalRounds: 5,
        entryFee: 10,
        isPublic: true,
        requiresApproval: false,
      };

      return request(app.getHttpServer())
        .post('/api/tournaments')
        .send(createTournamentDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe(createTournamentDto.title);
          expect(res.body.tournamentType).toBe(createTournamentDto.tournamentType);
          expect(res.body.format).toBe(createTournamentDto.format);
          expect(res.body.status).toBe('upcoming');
        });
    });

    it('should fail to create tournament with invalid dates', () => {
      const createTournamentDto = {
        title: 'Invalid Tournament',
        description: 'A tournament with invalid dates',
        tournamentType: 'daily',
        format: 'points_based',
        startDate: '2023-01-01T00:00:00Z', // Past date
        endDate: '2023-01-02T00:00:00Z',
        maxParticipants: 100,
        totalRounds: 5,
      };

      return request(app.getHttpServer())
        .post('/api/tournaments')
        .send(createTournamentDto)
        .expect(400);
    });

    it('should fail to create tournament with invalid format', () => {
      const createTournamentDto = {
        title: 'Invalid Tournament',
        description: 'A tournament with invalid format',
        tournamentType: 'daily',
        format: 'invalid_format',
        startDate: '2024-12-01T00:00:00Z',
        endDate: '2024-12-02T00:00:00Z',
        maxParticipants: 100,
        totalRounds: 5,
      };

      return request(app.getHttpServer())
        .post('/api/tournaments')
        .send(createTournamentDto)
        .expect(400);
    });
  });

  describe('/api/tournaments (GET)', () => {
    it('should get all tournaments', () => {
      return request(app.getHttpServer())
        .get('/api/tournaments')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.tournaments || res.body)).toBe(true);
        });
    });

    it('should get tournaments with filters', () => {
      return request(app.getHttpServer())
        .get('/api/tournaments?status=upcoming&tournamentType=daily')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.tournaments || res.body)).toBe(true);
        });
    });
  });

  describe('/api/tournaments/active (GET)', () => {
    it('should get active tournaments', () => {
      return request(app.getHttpServer())
        .get('/api/tournaments/active')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/tournaments/upcoming (GET)', () => {
    it('should get upcoming tournaments', () => {
      return request(app.getHttpServer())
        .get('/api/tournaments/upcoming')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/tournaments/:id (GET)', () => {
    it('should get tournament by ID', async () => {
      // First create a tournament
      const createResponse = await request(app.getHttpServer())
        .post('/api/tournaments')
        .send({
          title: 'Test Tournament for Get',
          description: 'A test tournament',
          tournamentType: 'daily',
          format: 'points_based',
          startDate: '2024-12-01T00:00:00Z',
          endDate: '2024-12-02T00:00:00Z',
          maxParticipants: 100,
          totalRounds: 5,
        })
        .expect(201);

      const tournamentId = createResponse.body.id;

      return request(app.getHttpServer())
        .get(`/api/tournaments/${tournamentId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(tournamentId);
          expect(res.body.title).toBe('Test Tournament for Get');
        });
    });

    it('should return 404 for non-existent tournament', () => {
      return request(app.getHttpServer())
        .get('/api/tournaments/non-existent-id')
        .expect(404);
    });
  });

  describe('/api/tournaments/join (POST)', () => {
    it('should join a tournament', async () => {
      // First create a tournament
      const createResponse = await request(app.getHttpServer())
        .post('/api/tournaments')
        .send({
          title: 'Test Tournament for Join',
          description: 'A test tournament',
          tournamentType: 'daily',
          format: 'points_based',
          startDate: '2024-12-01T00:00:00Z',
          endDate: '2024-12-02T00:00:00Z',
          maxParticipants: 100,
          totalRounds: 5,
        })
        .expect(201);

      const tournamentId = createResponse.body.id;

      return request(app.getHttpServer())
        .post('/api/tournaments/join')
        .send({
          tournamentId: tournamentId,
          userAddress: '0x1234567890123456789012345678901234567890',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.tournamentId).toBe(tournamentId);
          expect(res.body.status).toBe('approved');
        });
    });

    it('should fail to join non-existent tournament', () => {
      return request(app.getHttpServer())
        .post('/api/tournaments/join')
        .send({
          tournamentId: 'non-existent-id',
        })
        .expect(404);
    });
  });

  describe('/api/tournaments/submit-prediction (POST)', () => {
    it('should submit a prediction', async () => {
      // First create a tournament and join it
      const createResponse = await request(app.getHttpServer())
        .post('/api/tournaments')
        .send({
          title: 'Test Tournament for Prediction',
          description: 'A test tournament',
          tournamentType: 'daily',
          format: 'points_based',
          startDate: '2024-12-01T00:00:00Z',
          endDate: '2024-12-02T00:00:00Z',
          maxParticipants: 100,
          totalRounds: 5,
        })
        .expect(201);

      const tournamentId = createResponse.body.id;

      // Join the tournament
      await request(app.getHttpServer())
        .post('/api/tournaments/join')
        .send({
          tournamentId: tournamentId,
          userAddress: '0x1234567890123456789012345678901234567890',
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/api/tournaments/submit-prediction')
        .send({
          tournamentId: tournamentId,
          roundId: 'round-1',
          marketId: 'market-1',
          predictionType: 'yes',
          prediction: 'yes',
          confidence: 0.8,
          stakeAmount: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.tournamentId).toBe(tournamentId);
          expect(res.body.prediction).toBe('yes');
        });
    });

    it('should fail to submit prediction for non-existent tournament', () => {
      return request(app.getHttpServer())
        .post('/api/tournaments/submit-prediction')
        .send({
          tournamentId: 'non-existent-id',
          roundId: 'round-1',
          marketId: 'market-1',
          predictionType: 'yes',
          prediction: 'yes',
        })
        .expect(400);
    });
  });

  describe('/api/tournaments/:id/leaderboard (GET)', () => {
    it('should get tournament leaderboard', async () => {
      // First create a tournament
      const createResponse = await request(app.getHttpServer())
        .post('/api/tournaments')
        .send({
          title: 'Test Tournament for Leaderboard',
          description: 'A test tournament',
          tournamentType: 'daily',
          format: 'points_based',
          startDate: '2024-12-01T00:00:00Z',
          endDate: '2024-12-02T00:00:00Z',
          maxParticipants: 100,
          totalRounds: 5,
        })
        .expect(201);

      const tournamentId = createResponse.body.id;

      return request(app.getHttpServer())
        .get(`/api/tournaments/${tournamentId}/leaderboard`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/tournaments/:id/analytics (GET)', () => {
    it('should get tournament analytics', async () => {
      // First create a tournament
      const createResponse = await request(app.getHttpServer())
        .post('/api/tournaments')
        .send({
          title: 'Test Tournament for Analytics',
          description: 'A test tournament',
          tournamentType: 'daily',
          format: 'points_based',
          startDate: '2024-12-01T00:00:00Z',
          endDate: '2024-12-02T00:00:00Z',
          maxParticipants: 100,
          totalRounds: 5,
        })
        .expect(201);

      const tournamentId = createResponse.body.id;

      return request(app.getHttpServer())
        .get(`/api/tournaments/${tournamentId}/analytics`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tournamentId');
          expect(res.body).toHaveProperty('participants');
          expect(res.body).toHaveProperty('predictions');
          expect(res.body).toHaveProperty('scores');
        });
    });
  });

  describe('/api/tournaments/analytics/global (GET)', () => {
    it('should get global tournament statistics', () => {
      return request(app.getHttpServer())
        .get('/api/tournaments/analytics/global')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalTournaments');
          expect(res.body).toHaveProperty('totalParticipants');
          expect(res.body).toHaveProperty('totalPredictions');
          expect(res.body).toHaveProperty('totalRewards');
        });
    });
  });

  describe('/api/tournaments/analytics/top-performers (GET)', () => {
    it('should get top performers', () => {
      return request(app.getHttpServer())
        .get('/api/tournaments/analytics/top-performers?limit=10')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/tournaments/search (GET)', () => {
    it('should search tournaments', () => {
      return request(app.getHttpServer())
        .get('/api/tournaments/search?query=test')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/tournaments/:id/status (PUT)', () => {
    it('should update tournament status', async () => {
      // First create a tournament
      const createResponse = await request(app.getHttpServer())
        .post('/api/tournaments')
        .send({
          title: 'Test Tournament for Status Update',
          description: 'A test tournament',
          tournamentType: 'daily',
          format: 'points_based',
          startDate: '2024-12-01T00:00:00Z',
          endDate: '2024-12-02T00:00:00Z',
          maxParticipants: 100,
          totalRounds: 5,
        })
        .expect(201);

      const tournamentId = createResponse.body.id;

      return request(app.getHttpServer())
        .put(`/api/tournaments/${tournamentId}/status`)
        .send({ status: 'active' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('active');
        });
    });
  });

  describe('/api/tournaments/:id/advance-round (POST)', () => {
    it('should advance tournament round', async () => {
      // First create a tournament and activate it
      const createResponse = await request(app.getHttpServer())
        .post('/api/tournaments')
        .send({
          title: 'Test Tournament for Round Advancement',
          description: 'A test tournament',
          tournamentType: 'daily',
          format: 'points_based',
          startDate: '2024-12-01T00:00:00Z',
          endDate: '2024-12-02T00:00:00Z',
          maxParticipants: 100,
          totalRounds: 5,
        })
        .expect(201);

      const tournamentId = createResponse.body.id;

      // Activate the tournament
      await request(app.getHttpServer())
        .put(`/api/tournaments/${tournamentId}/status`)
        .send({ status: 'active' })
        .expect(200);

      return request(app.getHttpServer())
        .post(`/api/tournaments/${tournamentId}/advance-round`)
        .expect(200)
        .expect((res) => {
          expect(res.body.currentRound).toBe(2);
        });
    });
  });

  describe('/api/tournaments/:id/generate-rewards (POST)', () => {
    it('should generate tournament rewards', async () => {
      // First create a tournament and complete it
      const createResponse = await request(app.getHttpServer())
        .post('/api/tournaments')
        .send({
          title: 'Test Tournament for Rewards',
          description: 'A test tournament',
          tournamentType: 'daily',
          format: 'points_based',
          startDate: '2024-12-01T00:00:00Z',
          endDate: '2024-12-02T00:00:00Z',
          maxParticipants: 100,
          totalRounds: 5,
          prizePool: 1000,
        })
        .expect(201);

      const tournamentId = createResponse.body.id;

      // Complete the tournament
      await request(app.getHttpServer())
        .put(`/api/tournaments/${tournamentId}/status`)
        .send({ status: 'completed' })
        .expect(200);

      return request(app.getHttpServer())
        .post(`/api/tournaments/${tournamentId}/generate-rewards`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
}); 