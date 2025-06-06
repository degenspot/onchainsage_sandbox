import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { LoggingService } from './logging.service';
import { AlertingService } from './alerting.service';
import { MetricsService } from './metrics.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private monitoringService: MonitoringService,
    private loggingService: LoggingService,
    private alertingService: AlertingService,
    private metricsService: MetricsService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    return await this.metricsService.getDashboardData();
  }

  @Get('metrics')
  async getMetrics(
    @Query('name') name?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    
    return await this.metricsService.getMetrics(name, startDate, endDate);
  }

  @Get('business-metrics')
  async getBusinessMetrics(
    @Query('category') category?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('limit') limit?: string,
  ) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    
    return await this.metricsService.getBusinessMetrics({
      category,
      startTime: startDate,
      endTime: endDate,
      limit: limitNum,
    });
  }

  @Get('logs')
  async getLogs(
    @Query('level') level?: string,
    @Query('context') context?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('limit') limit?: string,
  ) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    
    return await this.loggingService.getLogStream({
      level,
      context,
      startDate,
      endDate,
      limit: limitNum,
    });
  }

  @Get('alerts')
  async getAlerts(
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('limit') limit?: string,
  ) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    
    return await this.alertingService.getAlertHistory({
      type,
      severity,
      startDate,
      endDate,
      limit: limitNum,
    });
  }
}

