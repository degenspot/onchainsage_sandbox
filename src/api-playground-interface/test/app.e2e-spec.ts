import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApiKey } from '../src/api-keys/entities/api-key.entity';
import { Repository } from 'typeorm';

describe('API Testing Platform (e2e)', () => {
  let app: INestApplication;
  let apiKeyRepository: Repository<ApiKey>;
  let testApiKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    apiKeyRepository = moduleFixture.get<Repository<ApiKey>>(getRepositoryToken(ApiKey));
    
    await app.init();

    // Create a test API key
    const apiKey = apiKeyRepository.create({
      key: 'sk_test_12345',
      name: 'Test Key',
      description: 'Test API key for e2e tests',
      isActive: true,
      permissions: ['read', 'write'],
      rateLimitPerHour: 1000
    });
    
    await apiKeyRepository.save(apiKey);
    testApiKey = apiKey.key;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('API Documentation', () => {
    it('/api-docs (GET)', () => {
      return request(app.getHttpServer())
        .get('/api-docs')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('/api-docs/search (GET)', () => {
      return request(app.getHttpServer())
        .get('/api-docs/search?q=blockchain')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/api-docs/:id (GET)', () => {
      return request(app.getHttpServer())
        .get('/api-docs/blockchain-info')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('blockchain-info');
          expect(res.body.title).toBeDefined();
        });
    });
  });

  describe('API Keys Management', () => {
    it('/api-keys (POST)', () => {
      return request(app.getHttpServer())
        .post('/api-keys')
        .send({
          name: 'Test API Key',
          description: 'Created during e2e tests',
          permissions: ['read'],
          rateLimitPerHour: 500
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Test API Key');
          expect(res.body.key).toMatch(/^sk_/);
        });
    });

    it('/api-keys (GET)', () => {
      return request(app.getHttpServer())
        .get('/api-keys')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('/api-keys/:id/usage (GET)', async () => {
      const apiKeys = await apiKeyRepository.find();
      const apiKey = apiKeys[0];
      
      return request(app.getHttpServer())
        .get(`/api-keys/${apiKey.id}/usage`)
        .expect(200)
        .expect((res) => {
          expect(res.body.totalRequests).toBeDefined();
          expect(res.body.rateLimitPerHour).toBeDefined();
        });
    });
  });

  describe('API Testing', () => {
    it('/testing/execute (POST)', () => {
      return request(app.getHttpServer())
        .post('/testing/execute')
        .send({
          url: 'https://httpbin.org/get',
          method: 'GET',
          headers: {
            'User-Agent': 'OnChain-Sage-Labs-API-Tester'
          }
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBeDefined();
          expect(res.body.response).toBeDefined();
          expect(res.body.request).toBeDefined();
        });
    });

    it('/testing/validate (POST)', () => {
      return request(app.getHttpServer())
        .post('/testing/validate')
        .send({
          url: 'https://httpbin.org/post',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: { test: 'data' }
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.valid).toBe(true);
          expect(res.body.errors).toBeDefined();
        });
    });

    it('/testing/history (GET)', () => {
      return request(app.getHttpServer())
        .get('/testing/history')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Code Generation', () => {
    it('/code-generation/languages (GET)', () => {
      return request(app.getHttpServer())
        .get('/code-generation/languages')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].id).toBeDefined();
          expect(res.body[0].name).toBeDefined();
        });
    });

    it('/code-generation/generate/javascript (POST)', () => {
      return request(app.getHttpServer())
        .post('/code-generation/generate/javascript')
        .send({
          url: 'https://api.example.com/users',
          method: 'GET',
          headers: {
            'Authorization': 'Bearer token123'
          }
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.language).toBe('javascript');
          expect(res.body.code).toContain('fetch');
          expect(res.body.filename).toBeDefined();
        });
    });

    it('/code-generation/generate-all (POST)', () => {
      return request(app.getHttpServer())
        .post('/code-generation/generate-all')
        .send({
          url: 'https://api.example.com/data',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: { key: 'value' }
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.javascript).toBeDefined();
          expect(res.body.python).toBeDefined();
          expect(res.body.curl).toBeDefined();
          expect(res.body.php).toBeDefined();
        });
    });
  });

  describe('Analytics', () => {
    it('/analytics/overview (GET)', () => {
      return request(app.getHttpServer())
        .get('/analytics/overview')
        .expect(200)
        .expect((res) => {
          expect(res.body.totalRequests).toBeDefined();
          expect(res.body.requestsLast30Days).toBeDefined();
          expect(res.body.avgResponseTime).toBeDefined();
          expect(res.body.errorRate).toBeDefined();
        });
    });

    it('/analytics/endpoints (GET)', () => {
      return request(app.getHttpServer())
        .get('/analytics/endpoints?days=30')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/analytics/performance (GET)', () => {
      return request(app.getHttpServer())
        .get('/analytics/performance?days=7')
        .expect(200)
        .expect((res) => {
          expect(res.body.avgResponseTime).toBeDefined();
          expect(res.body.slowestEndpoints).toBeDefined();
        });
    });
  });

  describe('Rate Limiting', () => {
    it('/rate-limiting/visualization (GET)', () => {
      return request(app.getHttpServer())
        .get('/rate-limiting/visualization?days=7')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/rate-limiting/top-consumers (GET)', () => {
      return request(app.getHttpServer())
        .get('/rate-limiting/top-consumers?days=7&limit=5')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent API endpoint', () => {
      return request(app.getHttpServer())
        .get('/api-docs/non-existent-endpoint')
        .expect(404);
    });

    it('should return validation error for invalid request', () => {
      return request(app.getHttpServer())
        .post('/testing/execute')
        .send({
          url: 'invalid-url',
          method: 'INVALID_METHOD'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBeDefined();
        });
    });
  });
});