import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenRiskService } from './token-risk.service';
import { TokenMetricsEntity } from '../entities/token-risk.entity';
import { TokenDataService } from './token-data.service';

@Injectable()
export class RealTimeMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealTimeMonitorService.name);
  private monitoredTokens: Set<string> = new Set();
  private isMonitoring = false;

  constructor(
    private readonly tokenRiskService: TokenRiskService,
    private readonly tokenDataService: TokenDataService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(TokenMetricsEntity)
    private readonly metricsRepository: Repository<TokenMetricsEntity>,
  ) {}

  onModuleInit() {
    this.startMonitoring();
  }

  onModuleDestroy() {
    this.stopMonitoring();
  }

  async addTokenToMonitoring(tokenAddress: string): Promise<void> {
    this.monitoredTokens.add(tokenAddress.toLowerCase());
    this.logger.log(`Added ${tokenAddress} to real-time monitoring`);
  }

  async removeTokenFromMonitoring(tokenAddress: string): Promise<void> {
    this.monitoredTokens.delete(tokenAddress.toLowerCase());
    this.logger.log(`Removed ${tokenAddress} from real-time monitoring`);
  }

  getMonitoredTokens(): string[] {
    return Array.from(this.monitoredTokens);
  }

  // Run every 2 minutes for high-frequency monitoring
  @Cron(CronExpression.EVERY_2_MINUTES)
  async performRealTimeAnalysis(): Promise<void> {
    if (!this.isMonitoring || this.monitoredTokens.size === 0) {
      return;
    }

    this.logger.log(`Analyzing ${this.monitoredTokens.size} monitored tokens`);

    const analysisPromises = Array.from(this.monitoredTokens).map(async (tokenAddress) => {
      try {
        // Fetch current metrics and store them
        const currentMetrics = await this.tokenDataService.getCurrentMetrics(tokenAddress);
        await this.storeMetrics(currentMetrics);

        // Perform risk analysis
        const assessment = await this.tokenRiskService.analyzeToken(tokenAddress, 60); // Lower threshold for monitoring

        // Emit real-time update event
        this.eventEmitter.emit('token.metrics-updated', {
          tokenAddress,
          metrics: currentMetrics,
          assessment,
        });

        return assessment;
      } catch (error) {
        this.logger.error(`Failed to analyze monitored token ${tokenAddress}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(analysisPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    this.logger.log(`Real-time analysis completed: ${successful}/${this.monitoredTokens.size} successful`);
  }

  // Store historical metrics for ML analysis
  private async storeMetrics(metrics: any): Promise<void> {
    const entity = new TokenMetricsEntity();
    Object.assign(entity, metrics);
    await this.metricsRepository.save(entity);
  }

  private startMonitoring(): void {
    this.isMonitoring = true;
    this.logger.log('Real-time monitoring started');
  }

  private stopMonitoring(): void {
    this.isMonitoring = false;
    this.logger.log('Real-time monitoring stopped');
  }
}
