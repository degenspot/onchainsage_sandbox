import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from './logging.service';
import { AlertingService } from './alerting.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private configService: ConfigService,
    private loggingService: LoggingService,
    private alertingService: AlertingService,
    private metricsService: MetricsService,
  ) {}

  async initializeMonitoring(): Promise<void> {
    try {
      // Initialize all monitoring components
      await this.loggingService.initialize();
      await this.alertingService.initialize();
      await this.metricsService.initialize();
      
      this.logger.log('Monitoring system initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize monitoring system', error);
      throw error;
    }
  }

  async trackPerformance(operation: string, duration: number, metadata?: any): Promise<void> {
    await this.metricsService.recordPerformanceMetric(operation, duration, metadata);
    
    // Alert if performance is degraded
    if (duration > this.configService.get('PERFORMANCE_THRESHOLD', 5000)) {
      await this.alertingService.sendAlert({
        type: 'performance',
        severity: 'warning',
        message: `Slow operation detected: ${operation} took ${duration}ms`,
        metadata,
      });
    }
  }

  async trackError(error: Error, context?: string): Promise<void> {
    await this.loggingService.logError(error, context);
    await this.metricsService.incrementErrorCounter(error.name, context);
    
    // Send critical error alerts
    if (this.isCriticalError(error)) {
      await this.alertingService.sendAlert({
        type: 'error',
        severity: 'critical',
        message: `Critical error: ${error.message}`,
        metadata: { context, stack: error.stack },
      });
    }
  }

  private isCriticalError(error: Error): boolean {
    const criticalErrors = ['DatabaseConnectionError', 'OutOfMemoryError', 'SecurityError'];
    return criticalErrors.some(criticalError => error.name.includes(criticalError));
  }
}