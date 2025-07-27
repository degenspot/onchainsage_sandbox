import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NarrativeDataRepository } from '../repositories/narrative-data.repository';
import { PriceDataRepository } from '../repositories/price-data.repository';
import { NarrativeDataSource, PriceDataSource } from '../interfaces/data-source.interface';

@Injectable()
export class DataIngestionService {
  private readonly logger = new Logger(DataIngestionService.name);

  constructor(
    private readonly narrativeDataRepository: NarrativeDataRepository,
    private readonly priceDataRepository: PriceDataRepository,
    private readonly narrativeDataSource: NarrativeDataSource,
    private readonly priceDataSource: PriceDataSource,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async ingestHourlyData(): Promise<void> {
    this.logger.log('Starting hourly data ingestion');
    
    try {
      const tokens = ['BTC', 'ETH', 'ADA', 'SOL']; // Configure as needed
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      await Promise.all([
        this.ingestNarrativeData(tokens, oneHourAgo, now),
        this.ingestPriceData(tokens, oneHourAgo, now),
      ]);

      this.logger.log('Hourly data ingestion completed successfully');
    } catch (error) {
      this.logger.error('Error during hourly data ingestion', error);
    }
  }

  private async ingestNarrativeData(
    tokens: string[],
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    for (const token of tokens) {
      try {
        const narrativeData = await this.narrativeDataSource.fetchNarrativeData(
          [], // hashtags - configure as needed
          [], // topics - configure as needed
          startDate,
          endDate,
          '1h'
        );

        for (const [identifier, dataPoints] of narrativeData) {
          const createDtos = dataPoints.map(point => ({
            tokenSymbol: token,
            identifier,
            type: identifier.startsWith('#') ? 'hashtag' as const : 'topic' as const,
            timestamp: point.timestamp,
            sentiment: point.sentiment,
            volume: point.volume,
            reach: point.reach,
            engagementRate: point.engagementRate,
          }));

          await this.narrativeDataRepository.bulkCreate(createDtos);
        }

        this.logger.log(`Ingested narrative data for ${token}: ${narrativeData.size} identifiers`);
      } catch (error) {
        this.logger.error(`Error ingesting narrative data for ${token}`, error);
      }
    }
  }

  private async ingestPriceData(
    tokens: string[],
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    for (const token of tokens) {
      try {
        const priceData = await this.priceDataSource.fetchPriceData(
          token,
          startDate,
          endDate,
          '1h'
        );

        const createDtos = priceData.map(point => ({
          tokenSymbol: token,
          timestamp: point.timestamp,
          price: point.price,
          volume: point.volume,
          marketCap: point.marketCap,
          priceChange: point.priceChange,
          interval: '1h',
        }));

        await this.priceDataRepository.bulkCreate(createDtos);
        this.logger.log(`Ingested price data for ${token}: ${priceData.length} data points`);
      } catch (error) {
        this.logger.error(`Error ingesting price data for ${token}`, error);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldData(): Promise<void> {
    this.logger.log('Starting cleanup of old data');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days of data

      await Promise.all([
        this.narrativeDataRepository.deleteOldData(cutoffDate),
        this.priceDataRepository.deleteOldData(cutoffDate),
      ]);

      this.logger.log('Old data cleanup completed successfully');
    } catch (error) {
      this.logger.error('Error during data cleanup', error);
    }
  }
}