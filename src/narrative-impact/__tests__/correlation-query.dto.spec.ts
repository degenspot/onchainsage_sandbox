import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CorrelationQueryDto } from '../dto/correlation-response.dto';

describe('CorrelationQueryDto', () => {
  it('should validate a valid query', async () => {
    const queryData = {
      tokenSymbol: 'BTC',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      hashtags: ['#bitcoin', '#crypto'],
      topics: ['adoption'],
      interval: '1d',
      minCorrelation: 0.3,
    };

    const query = plainToClass(CorrelationQueryDto, queryData);
    const errors = await validate(query);

    expect(errors).toHaveLength(0);
  });

  it('should require tokenSymbol', async () => {
    const queryData = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    const query = plainToClass(CorrelationQueryDto, queryData);
    const errors = await validate(query);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('tokenSymbol');
  });

  it('should validate date strings', async () => {
    const queryData = {
      tokenSymbol: 'BTC',
      startDate: 'invalid-date',
      endDate: '2024-01-31',
    };

    const query = plainToClass(CorrelationQueryDto, queryData);
    const errors = await validate(query);

    expect(errors.length).toBeGreaterThan(0);
    const dateError = errors.find(e => e.property === 'startDate');
    expect(dateError).toBeDefined();
  });

  it('should validate minCorrelation range', async () => {
    const queryData = {
      tokenSymbol: 'BTC',
      minCorrelation: 1.5, // Invalid: > 1
    };

    const query = plainToClass(CorrelationQueryDto, queryData);
    const errors = await validate(query);

    expect(errors.length).toBeGreaterThan(0);
    const correlationError = errors.find(e => e.property === 'minCorrelation');
    expect(correlationError).toBeDefined();
  });

  it('should transform single hashtag to array', () => {
    const queryData = {
      tokenSymbol: 'BTC',
      hashtags: '#bitcoin', // Single string
    };

    const query = plainToClass(CorrelationQueryDto, queryData);
    
    expect(Array.isArray(query.hashtags)).toBe(true);
    expect(query.hashtags).toEqual(['#bitcoin']);
  });

  it('should set default values', () => {
    const queryData = {
      tokenSymbol: 'BTC',
    };

    const query = plainToClass(CorrelationQueryDto, queryData);
    
    expect(query.interval).toBe('1d');
    expect(query.minCorrelation).toBeCloseTo(0.1);
  });
});
