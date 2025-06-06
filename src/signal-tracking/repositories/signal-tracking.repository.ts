import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Signal } from '../entities/signal.entity';
import { SignalPerformance } from '../entities/signal-performance.entity';

@Injectable()
export class SignalTrackingRepository extends Repository<Signal> {
  constructor(private dataSource: DataSource) {
    super(Signal, dataSource.createEntityManager());
  }

  async findTopPerformingSignals(limit: number = 10): Promise<Signal[]> {
    return await this.createQueryBuilder('signal')
      .leftJoinAndSelect('signal.performances', 'performance')
      .where('signal.status = :status', { status: 'CLOSED' })
      .orderBy('performance.realizedPnlPercentage', 'DESC')
      .limit(limit)
      .getMany();
  }

  async findSignalsByconfidenceRange(
    minConfidence: number,
    maxConfidence: number,
  ): Promise<Signal[]> {
    return await this.createQueryBuilder('signal')
      .where('signal.confidenceScore BETWEEN :min AND :max', {
        min: minConfidence,
        max: maxConfidence,
      })
      .orderBy('signal.createdAt', 'DESC')
      .getMany();
  }

  async getPerformanceStatsByPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    return await this.dataSource
      .createQueryBuilder()
      .select([
        'COUNT(*) as totalSignals',
        'AVG(perf.realizedPnlPercentage) as avgReturn',
        'SUM(CASE WHEN perf.isWinning = true THEN 1 ELSE 0 END) as winningSignals',
        'MIN(perf.realizedPnlPercentage) as maxDrawdown',
        'MAX(perf.realizedPnlPercentage) as maxGain',
      ])
      .from(SignalPerformance, 'perf')
      .leftJoin('perf.signal', 'signal')
      .where('perf.calculatedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();
  }
}