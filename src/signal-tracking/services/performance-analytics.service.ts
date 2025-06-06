import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignalPerformance } from '../entities/signal-performance.entity';
import { Signal } from '../entities/signal.entity';
import { PerformanceMetrics, SignalAnalytics, TransparencyReport } from '../../../shared/interfaces/analytics.interfaces';
import { PerformanceQueryDto } from '../dto/signal-performance.dto';

@Injectable()
export class PerformanceAnalyticsService {
  constructor(
    @InjectRepository(SignalPerformance)
    private performanceRepository: Repository<SignalPerformance>,
    @InjectRepository(Signal)
    private signalRepository: Repository<Signal>,
  ) {}

  async calculateOverallMetrics(query: PerformanceQueryDto): Promise<PerformanceMetrics> {
    const queryBuilder = this.performanceRepository
      .createQueryBuilder('perf')
      .leftJoin('perf.signal', 'signal');

    if (query.startDate) {
      queryBuilder.andWhere('perf.calculatedAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('perf.calculatedAt <= :endDate', { endDate: query.endDate });
    }

    if (query.tradingPair) {
      queryBuilder.andWhere('signal.tradingPair = :tradingPair', { tradingPair: query.tradingPair });
    }

    if (query.minConfidence) {
      queryBuilder.andWhere('signal.confidenceScore >= :minConfidence', { minConfidence: query.minConfidence });
    }

    const performances = await queryBuilder.getMany();

    return this.calculateMetricsFromPerformances(performances);
  }

  async getSignalAnalytics(query: PerformanceQueryDto): Promise<SignalAnalytics> {
    const overallMetrics = await this.calculateOverallMetrics(query);
    const byType = await this.getMetricsBySignalType(query);
    const byPair = await this.getMetricsByTradingPair(query);
    const confidenceAnalysis = await this.getConfidenceAnalysis(query);

    return {
      timeRange: `${query.startDate || 'inception'} to ${query.endDate || 'now'}`,
      performance: overallMetrics,
      byType,
      byPair,
      confidenceAnalysis,
    };
  }

  async generateTransparencyReport(period: string): Promise<TransparencyReport> {
    const endDate = new Date();
    const startDate = this.getStartDateForPeriod(period, endDate);
    
    const query: PerformanceQueryDto = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    const overallMetrics = await this.calculateOverallMetrics(query);
    const detailedAnalysis = await this.getSignalAnalytics(query);
    const validationSummary = await this.getValidationSummary(query);

    return {
      reportDate: new Date(),
      period,
      overallMetrics,
      detailedAnalysis,
      validationSummary,
    };
  }

  private calculateMetricsFromPerformances(performances: SignalPerformance[]): PerformanceMetrics {
    if (performances.length === 0) {
      return {
        totalSignals: 0,
        winRate: 0,
        avgReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        profitFactor: 0,
      };
    }

    const winningTrades = performances.filter(p => p.isWinning);
    const losingTrades = performances.filter(p => !p.isWinning);
    
    const totalReturn = performances.reduce((sum, p) => sum + p.realizedPnlPercentage, 0);
    const avgReturn = totalReturn / performances.length;
    
    const variance = performances.reduce((sum, p) => {
      return sum + Math.pow(p.realizedPnlPercentage - avgReturn, 2);
    }, 0) / performances.length;
    
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
    
    const grossProfit = winningTrades.reduce((sum, p) => sum + Math.abs(p.realizedPnl), 0);
    const grossLoss = losingTrades.reduce((sum, p) => sum + Math.abs(p.realizedPnl), 0);
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    return {
      totalSignals: performances.length,
      winRate: (winningTrades.length / performances.length) * 100,
      avgReturn,
      sharpeRatio,
      maxDrawdown: Math.min(...performances.map(p => p.realizedPnlPercentage)),
      profitFactor,
    };
  }

  private async getMetricsBySignalType(query: PerformanceQueryDto): Promise<Record<string, PerformanceMetrics>> {
    // Implementation for grouping by signal type
    // Similar to calculateOverallMetrics but grouped by signal.type
    return {};
  }

  private async getMetricsByTradingPair(query: PerformanceQueryDto): Promise<Record<string, PerformanceMetrics>> {
    // Implementation for grouping by trading pair
    // Similar to calculateOverallMetrics but grouped by signal.tradingPair
    return {};
  }

  private async getConfidenceAnalysis(query: PerformanceQueryDto): Promise<any> {
    // Implementation for confidence score analysis
    return {
      highConfidence: {} as PerformanceMetrics,
      mediumConfidence: {} as PerformanceMetrics,
      lowConfidence: {} as PerformanceMetrics,
    };
  }

  private async getValidationSummary(query: PerformanceQueryDto): Promise<any> {
    // Implementation for validation summary
    return {
      totalValidations: 0,
      approvedRate: 0,
      avgValidationScore: 0,
      validationsByType: {},
    };
  }

  private getStartDateForPeriod(period: string, endDate: Date): Date {
    const start = new Date(endDate);
    
    switch (period.toLowerCase()) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'yearly':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }
    
    return start;
  }
}