import { Test, TestingModule } from '@nestjs/testing';
import { TestingService } from '../../src/testing/testing.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TestingService', () => {
  let service: TestingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestingService],
    }).compile();

    service = module.get<TestingService>(TestingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should execute a successful request', async () => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { success: true },
    };

    mockedAxios.mockResolvedValue(mockResponse);

    const executeDto = {
      url: 'https://httpbin.org/get',
      method: 'GET',
      headers: { 'User-Agent': 'Test' },
    };

    const result = await service.executeRequest(executeDto);

    expect(result.success).toBe(true);
    expect(result.response.status).toBe(200);
    expect(result.response.data).toEqual({ success: true });
  });

  it('should handle request errors', async () => {
    const mockError = {
      message: 'Network Error',
      response: {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        data: { error: 'Server error' },
      },
    };

    mockedAxios.mockRejectedValue(mockError);

    const executeDto = {
      url: 'https://httpbin.org/status/500',
      method: 'GET',
    };

    const result = await service.executeRequest(executeDto);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network Error');
    expect(result.response.status).toBe(500);
  });

  it('should validate request successfully', async () => {
    const validRequest = {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: { 'Authorization': 'Bearer token' },
    };

    const result = await service.validateRequest(validRequest);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect invalid URL', async () => {
    const invalidRequest = {
      url: 'invalid-url',
      method: 'GET',
    };

    const result = await service.validateRequest(invalidRequest);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid URL format');
  });

  it('should detect invalid HTTP method', async () => {
    const invalidRequest = {
      url: 'https://api.example.com/users',
      method: 'INVALID',
    };

    const result = await service.validateRequest(invalidRequest);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid HTTP method');
  });

  it('should build URL with path and query parameters', () => {
    const request = {
      url: 'https://api.example.com/users/{id}',
      method: 'GET',
      pathParams: { id: '123' },
      queryParams: { include: 'profile', limit: '10' },
    };

    const url = service['buildUrl'](request);

    expect(url).toBe('https://api.example.com/users/123?include=profile&limit=10');
  });
});