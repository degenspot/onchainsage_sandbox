import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CustomAlert, AlertStatus } from './entities/custom-alert.entity';
import { AlertHistory, AlertTriggerStatus } from './entities/alert-history.entity';
import { AlertConfiguration } from './entities/alert-configuration.entity';
import { CreateAlertDto, UpdateAlertDto } from './dto';
import { AlertPerformanceDto } from './dto/update-alert.dto';

@Injectable()
export class CustomAlertsService {
  private readonly logger = new Logger(CustomAlertsService.name);

  constructor(
    @InjectRepository(CustomAlert)
    private customAlertRepository: Repository<CustomAlert>,
    @InjectRepository(AlertHistory)
    private alertHistoryRepository: Repository<AlertHistory>,
    @InjectRepository(AlertConfiguration)
    private alertConfigurationRepository: Repository<AlertConfiguration>,
  ) {}

  async createAlert(userId: string, createAlertDto: CreateAlertDto): Promise<CustomAlert> {
    const alert = this.customAlertRepository.create({
      ...createAlertDto,
      userId,
      sharedId: createAlertDto.isShared ? uuidv4() : null,
    });

    const savedAlert = await this.customAlertRepository.save(alert);
    this.logger.log(`Created alert ${savedAlert.id} for user ${userId}`);
    return savedAlert;
  }

  async getUserAlerts(userId: string, status?: AlertStatus): Promise<CustomAlert[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.customAlertRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getAlertById(userId: string, alertId: string): Promise<CustomAlert> {
    const alert = await this.customAlertRepository.findOne({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return alert;
  }

  async updateAlert(userId: string, alertId: string, updateAlertDto: UpdateAlertDto): Promise<CustomAlert> {
    const alert = await this.getAlertById(userId, alertId);
    
    Object.assign(alert, updateAlertDto);
    const updatedAlert = await this.customAlertRepository.save(alert);
    
    this.logger.log(`Updated alert ${alertId} for user ${userId}`);
    return updatedAlert;
  }

  async deleteAlert(userId: string, alertId: string): Promise<void> {
    const alert = await this.getAlertById(userId, alertId);
    await this.customAlertRepository.remove(alert);
    this.logger.log(`Deleted alert ${alertId} for user ${userId}`);
  }

  async toggleAlertStatus(userId: string, alertId: string, enabled: boolean): Promise<CustomAlert> {
    const alert = await this.getAlertById(userId, alertId);
    alert.isEnabled = enabled;
    alert.status = enabled ? AlertStatus.ACTIVE : AlertStatus.PAUSED;
    
    return this.customAlertRepository.save(alert);
  }

  async getAlertHistory(userId: string, alertId?: string, limit: number = 50): Promise<AlertHistory[]> {
    const where: any = { userId };
    if (alertId) {
      where.alertId = alertId;
    }

    return this.alertHistoryRepository.find({
      where,
      order: { triggeredAt: 'DESC' },
      take: limit,
    });
  }

  async getAlertPerformance(userId: string, alertId: string): Promise<AlertPerformanceDto> {
    const alert = await this.getAlertById(userId, alertId);
    const history = await this.getAlertHistory(userId, alertId);

    const totalTriggers = history.length;
    const successfulTriggers = history.filter(h => h.status === AlertTriggerStatus.TRIGGERED).length;
    const falsePositives = history.filter(h => h.status === AlertTriggerStatus.FALSE_POSITIVE).length;
    const missedAlerts = history.filter(h => h.status === AlertTriggerStatus.MISSED).length;

    const successRate = totalTriggers > 0 ? (successfulTriggers / totalTriggers) * 100 : 0;

    return {
      totalTriggers,
      successfulTriggers,
      falsePositives,
      missedAlerts,
      averageResponseTime: 0, // TODO: Calculate from notification results
      lastTriggeredAt: alert.lastTriggeredAt,
      successRate,
    };
  }

  async shareAlert(userId: string, alertId: string): Promise<{ sharedId: string }> {
    const alert = await this.getAlertById(userId, alertId);
    
    if (!alert.sharedId) {
      alert.sharedId = uuidv4();
      alert.isShared = true;
      await this.customAlertRepository.save(alert);
    }

    return { sharedId: alert.sharedId };
  }

  async importSharedAlert(userId: string, sharedId: string, name?: string): Promise<CustomAlert> {
    const originalAlert = await this.customAlertRepository.findOne({
      where: { sharedId, isShared: true },
    });

    if (!originalAlert) {
      throw new NotFoundException('Shared alert not found');
    }

    const newAlert = this.customAlertRepository.create({
      ...originalAlert,
      id: undefined,
      userId,
      name: name || `${originalAlert.name} (Imported)`,
      isShared: false,
      sharedId: null,
      triggerCount: 0,
      lastTriggeredAt: null,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return this.customAlertRepository.save(newAlert);
  }

  async exportAlertConfiguration(userId: string, alertId: string): Promise<any> {
    const alert = await this.getAlertById(userId, alertId);
    
    return {
      name: alert.name,
      description: alert.description,
      alertType: alert.alertType,
      condition: alert.condition,
      parameters: alert.parameters,
      notificationChannels: alert.notificationChannels,
      notificationConfig: alert.notificationConfig,
      exportDate: new Date(),
      version: '1.0',
    };
  }

  async getPublicAlertConfigurations(category?: string): Promise<AlertConfiguration[]> {
    const where: any = { isPublic: true };
    if (category) {
      where.category = category;
    }

    return this.alertConfigurationRepository.find({
      where,
      order: { usageCount: 'DESC', rating: 'DESC' },
    });
  }

  async createAlertFromTemplate(userId: string, templateId: string, customizations: any): Promise<CustomAlert> {
    const template = await this.alertConfigurationRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const alertData = {
      name: customizations.name || template.name,
      description: customizations.description || template.description,
      alertType: template.alertType,
      condition: template.condition,
      parameters: { ...template.defaultParameters, ...customizations.parameters },
      notificationChannels: customizations.notificationChannels || template.supportedChannels,
      notificationConfig: customizations.notificationConfig || {},
      userId,
    };

    return this.createAlert(userId, alertData);
  }

  async getAlertStatistics(userId: string): Promise<any> {
    const alerts = await this.getUserAlerts(userId);
    const history = await this.getAlertHistory(userId);

    const totalAlerts = alerts.length;
    const activeAlerts = alerts.filter(a => a.status === AlertStatus.ACTIVE).length;
    const totalTriggers = alerts.reduce((sum, alert) => sum + alert.triggerCount, 0);
    const recentTriggers = history.filter(h => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return h.triggeredAt > oneDayAgo;
    }).length;

    return {
      totalAlerts,
      activeAlerts,
      totalTriggers,
      recentTriggers,
      alertsByType: this.groupAlertsByType(alerts),
    };
  }

  private groupAlertsByType(alerts: CustomAlert[]): Record<string, number> {
    return alerts.reduce((acc, alert) => {
      acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
} 