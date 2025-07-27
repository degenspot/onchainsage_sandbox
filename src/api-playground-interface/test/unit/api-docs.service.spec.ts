mport { Test, TestingModule } from '@nestjs/testing';
import { ApiDocsService } from '../../src/api-docs/api-docs.service';

describe('ApiDocsService', () => {
  let service: ApiDocsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiDocsService],
    }).compile();

    service = module.get<ApiDocsService>(ApiDocsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all endpoints', async () => {
    const endpoints = await service.getAllEndpoints();
    expect(Array.isArray(endpoints)).toBe(true);
    expect(endpoints.length).toBeGreaterThan(0);
  });

  it('should search endpoints by query', async () => {
    const results = await service.searchEndpoints('blockchain');
    expect(Array.isArray(results)).toBe(true);
    results.forEach(endpoint => {
      expect(
        endpoint.title.toLowerCase().includes('blockchain') ||
        endpoint.description.toLowerCase().includes('blockchain') ||
        endpoint.category.toLowerCase().includes('blockchain')
      ).toBe(true);
    });
  });

  it('should get endpoint by id', async () => {
    const endpoint = await service.getEndpoint('blockchain-info');
    expect(endpoint).toBeDefined();
    expect(endpoint.id).toBe('blockchain-info');
  });

  it('should throw error for non-existent endpoint', async () => {
    await expect(service.getEndpoint('non-existent')).rejects.toThrow('Endpoint not found');
  });

  it('should get endpoints by category', async () => {
    const endpoints = await service.getEndpointsByCategory('blockchain');
    expect(Array.isArray(endpoints)).toBe(true);
    endpoints.forEach(endpoint => {
      expect(endpoint.category).toBe('blockchain');
    });
  });
});