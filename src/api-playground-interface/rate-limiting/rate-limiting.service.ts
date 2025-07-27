import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RateLimit } from './entities/rate-limit.entity';

@Injectable()
export class RateLimitingService {
  constructor(
    @InjectRepository(RateLimit)
    private rateLimitRepository: Repository<RateLimit>,
  ) {}

  async checkRateLimit(apiKey: string, limitPerHour: number): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    // Get or create rate limit record for current window
    let rateLimit = await this.rateLimitRepository.findOne({
      where: {
        apiKey,
        windowStart: Between(windowStart, now)
      }
    });

    if (!rateLimit) {
      // Create new rate limit window
      rateLimit = this.rateLimitRepository.create({
        apiKey,
        requestCount: 1,
        windowStart: new Date(Math.floor(now.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000)),
        windowEnd: new Date(Math.floor(now.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000) + (60 * 60 * 1000))
      });
      
      await this.rateLimitRepository.save(rateLimit);
      return true;
    }

    // Check if limit exceeded
    if (rateLimit.requestCount >= limitPerHour) {
      return false;
    }

    // Increment counter
    rateLimit.requestCount++;
    await this.rateLimitRepository.save(rateLimit);
    
    return true;
  }

  async getRateLimitInfo(apiKey: string) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000);

    const rateLimit = await this.rateLimitRepository.findOne({
      where: {
        apiKey,
        windowStart: Between(windowStart, now)
      }
    });

    if (!rateLimit) {
      return {
        requestCount: 0,
        windowStart: windowStart,
        windowEnd: new Date(windowStart.getTime() + 60 * 60 * 1000),
        resetTime: new Date(Math.ceil(now.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000))
      };
    }

    return {
      requestCount: rateLimit.requestCount,
      windowStart: rateLimit.windowStart,
      windowEnd: rateLimit.windowEnd,
      resetTime: rateLimit.windowEnd
    };
  }

  async getVisualizationData(apiKey?: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = this.rateLimitRepository
      .createQueryBuilder('rl')
      .select([
        'DATE(rl.windowStart) as date',
        'HOUR(rl.windowStart) as hour',
        'rl.apiKey',
        'SUM(rl.requestCount) as totalRequests'
      ])
      .where('rl.windowStart >= :startDate', { startDate })
      .groupBy('DATE(rl.windowStart), HOUR(rl.windowStart), rl.apiKey')
      .orderBy('rl.windowStart', 'ASC');

    if (apiKey) {
      query.andWhere('rl.apiKey = :apiKey', { apiKey });
    }

    return query.getRawMany();
  }

  async getTopConsumers(days: number = 7, limit: number = 10) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.rateLimitRepository
      .createQueryBuilder('rl')
      .select([
        'rl.apiKey',
        'SUM(rl.requestCount) as totalRequests',
        'COUNT(DISTINCT DATE(rl.windowStart)) as activeDays'
      ])
      .where('rl.windowStart >= :startDate', { startDate })
      .groupBy('rl.apiKey')
      .orderBy('totalRequests', 'DESC')
      .limit(limit)
      .getRawMany();
  }
}