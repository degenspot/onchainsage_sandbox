import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: any;
  correlationId?: string;
}

@Injectable()
export class LoggingService {
  private winstonLogger: winston.Logger;
  private readonly nestLogger = new Logger(LoggingService.name);

  constructor(private configService: ConfigService) {}

  async initialize(): Promise<void> {
    const logLevel = this.configService.get('LOG_LEVEL', 'info');
    const logDir = this.configService.get('LOG_DIR', './logs');

    this.winstonLogger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.prettyPrint()
      ),
      defaultMeta: {
        service: this.configService.get('SERVICE_NAME', 'labs-service'),
        environment: this.configService.get('NODE_ENV', 'development'),
        version: this.configService.get('APP_VERSION', '1.0.0'),
      },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        
        // File transport for all logs
        new DailyRotateFile({
          filename: `${logDir}/application-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          maxSize: '100m',
        }),
        
        // Separate file for errors
        new DailyRotateFile({
          filename: `${logDir}/error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxFiles: '30d',
          maxSize: '100m',
        }),
      ],
    });

    this.nestLogger.log('Winston logging initialized');
  }

  async logInfo(message: string, context?: string, metadata?: any): Promise<void> {
    this.winstonLogger.info(message, {
      context,
      metadata,
      correlationId: this.getCorrelationId(),
    });
  }

  async logError(error: Error, context?: string, metadata?: any): Promise<void> {
    this.winstonLogger.error(error.message, {
      context,
      metadata,
      stack: error.stack,
      correlationId: this.getCorrelationId(),
    });
  }

  async logWarning(message: string, context?: string, metadata?: any): Promise<void> {
    this.winstonLogger.warn(message, {
      context,
      metadata,
      correlationId: this.getCorrelationId(),
    });
  }

  async logDebug(message: string, context?: string, metadata?: any): Promise<void> {
    this.winstonLogger.debug(message, {
      context,
      metadata,
      correlationId: this.getCorrelationId(),
    });
  }

  private getCorrelationId(): string {
    // In a real application, this would be extracted from request context
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async getLogStream(filters?: {
    level?: string;
    context?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<LogEntry[]> {
    // In production, this would query your log aggregation service
    // For now, return mock data
    return [
      {
        level: 'info',
        message: 'Application started',
        timestamp: new Date().toISOString(),
        context: 'Bootstrap',
      },
    ];
  }
}
