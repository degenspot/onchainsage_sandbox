import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ApiUsage } from './entities/api-usage.entity';
import { UsageStatsDto } from './dto/usage-stats.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ApiUsage)
    private apiUsageRepository: Repository<ApiUsage>,
  ) {}

  async logApiUsage(data: {
    apiKey: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    userAgent?: string;
    ipAddress?: string;
    errorMessage?: string;
  }): Promise<void> {
    const usage = this.apiUsageRepository.create(data);
    await this.apiUsageRepository.save(usage);
  }

  async getOverviewStats(): Promise<UsageStatsDto> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalRequests, requestsLast30Days, requestsToday, requestsYesterday] = await Promise.all([
      this.apiUsageRepository.count(),
      this.apiUsageRepository.count({
        where: { timestamp: Between(thirtyDaysAgo, now) }
      }),
      this.apiUsageRepository.count({
        where: { timestamp: Between(new Date(now.toDateString()), now) }
      }),
      this.apiUsageRepository.count({
        where: { timestamp: Between(new Date(yesterday.toDateString()), new Date(now.toDateString())) }
      })
    ]);

    const avgResponseTime = await this.apiUsageRepository
      .createQueryBuilder('usage')
      .select('AVG(usage.responseTime)', 'avg')
      .where('usage.timestamp >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getRawOne();

    const errorRate = await this.apiUsageRepository
      .createQueryBuilder('usage')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN usage.statusCode >= 400 THEN 1 ELSE 0 END)', 'errors')
      .where('usage.timestamp >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getRawOne();

    return {
      totalRequests,
      requestsLast30Days,
      requestsToday,
      requestsYesterday,
      avgResponseTime: parseFloat(avgResponseTime.avg) || 0,
      errorRate: errorRate.total > 0 ? (errorRate.errors / errorRate.total) * 100 : 0,
      growthRate: requestsYesterday > 0 ? ((requestsToday - requestsYesterday) / requestsYesterday) * 100 : 0
    };
  }

  async getApiKeyStats(apiKey: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.apiUsageRepository
      .createQueryBuilder('usage')
      .select([
        'COUNT(*) as totalRequests',
        'AVG(usage.responseTime) as avgResponseTime',
        'MIN(usage.responseTime) as minResponseTime',
        'MAX(usage.responseTime) as maxResponseTime',
        'COUNT(CASE WHEN usage.statusCode >= 400 THEN 1 END) as errorCount'
      ])
      .where('usage.apiKey = :apiKey', { apiKey })
      .andWhere('usage.timestamp >= :startDate', { startDate })
      .getRawOne();

    const endpointBreakdown = await this.apiUsageRepository
      .createQueryBuilder('usage')
      .select(['usage.endpoint', 'usage.method', 'COUNT(*) as count'])
      .where('usage.apiKey = :apiKey', { apiKey })
      .andWhere('usage.timestamp >= :startDate', { startDate })
      .groupBy('usage.endpoint, usage.method')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      ...stats,
      errorRate: stats.totalRequests > 0 ? (stats.errorCount / stats.totalRequests) * 100 : 0,
      endpointBreakdown
    };
  }

  async getEndpointStats(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.apiUsageRepository
      .createQueryBuilder('usage')
      .select([
        'usage.endpoint',
        'usage.method',
        'COUNT(*) as requestCount',
        'AVG(usage.responseTime) as avgResponseTime',
        'COUNT(CASE WHEN usage.statusCode >= 400 THEN 1 END) as errorCount'
      ])
      .where('usage.timestamp >= :startDate', { startDate })
      .groupBy('usage.endpoint, usage.method')
      .orderBy('requestCount', 'DESC')
      .getRawMany();
  }

  async getPerformanceMetrics(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.apiUsageRepository
      .createQueryBuilder('usage')
      .select([
        'AVG(usage.responseTime) as avgResponseTime',
        'MIN(usage.responseTime) as minResponseTime',
        'MAX(usage.responseTime) as maxResponseTime',
        'PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY usage.responseTime) as p95ResponseTime',
        'PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY usage.responseTime) as p99ResponseTime'
      ])
      .where('usage.timestamp >= :startDate', { startDate })
      .getRawOne();

    const slowestEndpoints = await this.apiUsageRepository
      .createQueryBuilder('usage')
      .select([
        'usage.endpoint',
        'usage.method',
        'AVG(usage.responseTime) as avgResponseTime',
        'COUNT(*) as requestCount'
      ])
      .where('usage.timestamp >= :startDate', { startDate })
      .groupBy('usage.endpoint, usage.method')
      .orderBy('avgResponseTime', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      ...metrics,
      slowestEndpoints
    };
  }

  async getErrorStats(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const errorsByStatus = await this.apiUsageRepository
      .createQueryBuilder('usage')
      .select(['usage.statusCode', 'COUNT(*) as count'])
      .where('usage.statusCode >= 400')
      .andWhere('usage.timestamp >= :startDate', { startDate })
      .groupBy('usage.statusCode')
      .orderBy('count', 'DESC')
      .getRawMany();

    const errorsByEndpoint = await this.apiUsageRepository
      .createQueryBuilder('usage')
      .select([
        'usage.endpoint',
        'usage.method',
        'COUNT(*) as errorCount',
        'usage.statusCode'
      ])
      .where('usage.statusCode >= 400')
      .andWhere('usage.timestamp >= :startDate', { startDate })
      .groupBy('usage.endpoint, usage.method, usage.statusCode')
      .orderBy('errorCount', 'DESC')
      .limit(20)
      .getRawMany();

    return {
      errorsByStatus,
      errorsByEndpoint
    };
  }

  async getTrends(days: number, interval: 'hour' | 'day' | 'week') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let dateFormat: string;
    switch (interval) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
    }

    return this.apiUsageRepository
      .createQueryBuilder('usage')
      .select([
        `DATE_FORMAT(usage.timestamp, '${dateFormat}') as period`,
        'COUNT(*) as requestCount',
        'AVG(usage.responseTime) as avgResponseTime',
        'COUNT(CASE WHEN usage.statusCode >= 400 THEN 1 END) as errorCount'
      ])
      .where('usage.timestamp >= :startDate', { startDate })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();
  }
}
