import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface BusinessMetric {
  name: string;
  value: number;
  unit: string;
  category: string;
  timestamp: Date;
  metadata?: any;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private metrics: Map<string, Metric[]> = new Map();
  private businessMetrics: BusinessMetric[] = [];

  constructor(private configService: ConfigService) {}

  async initialize(): Promise<void> {
    // Initialize metrics collection
    this.startMetricsCollection();
    this.logger.log('Metrics service initialized');
  }

  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect business metrics every 60 seconds
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 60000);
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      await this.recordMetric({
        name: 'memory_usage_bytes',
        value: memoryUsage.heapUsed,
        type: 'gauge',
        timestamp: new Date(),
        tags: { type: 'heap' },
      });

      await this.recordMetric({
        name: 'memory_usage_bytes',
        value: memoryUsage.rss,
        type: 'gauge',
        timestamp: new Date(),
        tags: { type: 'rss' },
      });

      await this.recordMetric({
        name: 'cpu_usage_microseconds',
        value: cpuUsage.user,
        type: 'counter',
        timestamp: new Date(),
        tags: { type: 'user' },
      });

      await this.recordMetric({
        name: 'cpu_usage_microseconds',
        value: cpuUsage.system,
        type: 'counter',
        timestamp: new Date(),
        tags: { type: 'system' },
      });

    } catch (error) {
      this.logger.error('Failed to collect system metrics', error);
    }
  }

  private async collectBusinessMetrics(): Promise<void> {
    // Collect custom business metrics
    // This is where you'd implement your specific business logic metrics
    
    await this.recordBusinessMetric({
      name: 'active_users',
      value: Math.floor(Math.random() * 1000), // Mock data
      unit: 'count',
      category: 'engagement',
      timestamp: new Date(),
    });

    await this.recordBusinessMetric({
      name: 'api_requests_per_minute',
      value: Math.floor(Math.random() * 500), // Mock data
      unit: 'requests/min',
      category: 'traffic',
      timestamp: new Date(),
    });
  }

  async recordMetric(metric: Metric): Promise<void> {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const metricArray = this.metrics.get(metric.name);
    metricArray.push(metric);

    // Keep only last 1000 data points per metric
    if (metricArray.length > 1000) {
      metricArray.splice(0, metricArray.length - 1000);
    }
  }

  async recordBusinessMetric(metric: BusinessMetric): Promise<void> {
    this.businessMetrics.push(metric);

    // Keep only last 10000 business metrics
    if (this.businessMetrics.length > 10000) {
      this.businessMetrics = this.businessMetrics.slice(-10000);
    }
  }

  async recordPerformanceMetric(operation: string, duration: number, metadata?: any): Promise<void> {
    await this.recordMetric({
      name: 'operation_duration_ms',
      value: duration,
      type: 'histogram',
      timestamp: new Date(),
      tags: { operation, ...metadata },
    });
  }

  async incrementCounter(name: string, tags?: Record<string, string>): Promise<void> {
    await this.recordMetric({
      name,
      value: 1,
      type: 'counter',
      timestamp: new Date(),
      tags,
    });
  }

  async incrementErrorCounter(errorType: string, context?: string): Promise<void> {
    await this.incrementCounter('errors_total', {
      error_type: errorType,
      context: context || 'unknown',
    });
  }

  async getMetrics(name?: string, startTime?: Date, endTime?: Date): Promise<Metric[]> {
    if (name) {
      let metrics = this.metrics.get(name) || [];
      
      if (startTime) {
        metrics = metrics.filter(m => m.timestamp >= startTime);
      }
      
      if (endTime) {
        metrics = metrics.filter(m => m.timestamp <= endTime);
      }
      
      return metrics;
    }

    // Return all metrics if no name specified
    const allMetrics = [];
    for (const metricArray of this.metrics.values()) {
      allMetrics.push(...metricArray);
    }

    return allMetrics;
  }

  async getBusinessMetrics(filters?: {
    category?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<BusinessMetric[]> {
    let filteredMetrics = [...this.businessMetrics];

    if (filters?.category) {
      filteredMetrics = filteredMetrics.filter(m => m.category === filters.category);
    }

    if (filters?.startTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= filters.startTime);
    }

    if (filters?.endTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp <= filters.endTime);
    }

    const limit = filters?.limit || 1000;
    return filteredMetrics.slice(-limit);
  }

  async getDashboardData(): Promise<any> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentMetrics = await this.getMetrics(undefined, oneHourAgo, now);
    const recentBusinessMetrics = await this.getBusinessMetrics({ startTime: oneHourAgo });

    return {
      systemMetrics: {
        memory: recentMetrics.filter(m => m.name === 'memory_usage_bytes'),
        cpu: recentMetrics.filter(m => m.name === 'cpu_usage_microseconds'),
        errors: recentMetrics.filter(m => m.name === 'errors_total'),
      },
      businessMetrics: recentBusinessMetrics,
      summary: {
        totalRequests: recentMetrics.filter(m => m.name === 'api_requests_per_minute').length,
        errorRate: this.calculateErrorRate(recentMetrics),
        avgResponseTime: this.calculateAvgResponseTime(recentMetrics),
      },
    };
  }

  private calculateErrorRate(metrics: Metric[]): number {
    const errorMetrics = metrics.filter(m => m.name === 'errors_total');
    const totalRequests = metrics.filter(m => m.name === 'api_requests_per_minute')
      .reduce((sum, m) => sum + m.value, 0);
    
    if (totalRequests === 0) return 0;
    
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
    return (totalErrors / totalRequests) * 100;
  }

  private calculateAvgResponseTime(metrics: Metric[]): number {
    const performanceMetrics = metrics.filter(m => m.name === 'operation_duration_ms');
    
    if (performanceMetrics.length === 0) return 0;
    
    const totalTime = performanceMetrics.reduce((sum, m) => sum + m.value, 0);
    return totalTime / performanceMetrics.length;
  }
}
