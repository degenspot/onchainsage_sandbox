import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenMetricsEntity } from '../entities/token-risk.entity';
import { TokenDataService } from '../services/token-data.service';

@Injectable()
export class DataCollectionJob {
  private readonly logger = new Logger(DataCollectionJob.name);

  constructor(
    private readonly tokenDataService: TokenDataService,
    @InjectRepository(TokenMetricsEntity)
    private readonly metricsRepository: Repository<TokenMetricsEntity>,
  ) {}

  // Collect data every 15 minutes for historical analysis
  @Cron(CronExpression.EVERY_15_MINUTES)
  async collectHistoricalData(): Promise<void> {
    try {
      // Get list of tokens to collect data for (could be from config or database)
      const tokensToTrack = await this.getTokensToTrack();
      
      this.logger.log(`Collecting historical data for ${tokensToTrack.length} tokens`);

      const dataPromises = tokensToTrack.map(async (tokenAddress) => {
        try {
          const metrics = await this.tokenDataService.getCurrentMetrics(tokenAddress);
          return this.storeMetrics(metrics);
        } catch (error) {
          this.logger.error(`Failed to collect data for ${tokenAddress}:`, error);
          return null;
        }
      });

      await Promise.allSettled(dataPromises);
      this.logger.log('Historical data collection completed');
    } catch (error) {
      this.logger.error('Historical data collection failed:', error);
    }
  }

  // Clean old data every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanOldData(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days of data

      const result = await this.metricsRepository
        .createQueryBuilder()
        .delete()
        .where('timestamp < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(`Cleaned ${result.affected} old metric records`);
    } catch (error) {
      this.logger.error('Data cleanup failed:', error);
    }
  }

  private async getTokensToTrack(): Promise<string[]> {
    // return a sample list
    return [
      '0xa0b86a33e6c4c30c0cbdbce5e4f4e5f9b8e6e5e0', 
      '0xb1c73a69e4c2a30c0cbdbce5e4f4e5f9b8e6e5e1',
    ];
  }

  private async storeMetrics(metrics: any): Promise<void> {
    const entity = new TokenMetricsEntity();
    Object.assign(entity, metrics);
    await this.metricsRepository.save(entity);
  }
}