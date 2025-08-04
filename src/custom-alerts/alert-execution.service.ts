import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomAlert, AlertType, AlertCondition } from './entities/custom-alert.entity';
import { AlertHistory, AlertTriggerStatus } from './entities/alert-history.entity';
import { NotificationService } from './notification.service';

@Injectable()
export class AlertExecutionService {
  private readonly logger = new Logger(AlertExecutionService.name);

  constructor(
    @InjectRepository(CustomAlert)
    private customAlertRepository: Repository<CustomAlert>,
    @InjectRepository(AlertHistory)
    private alertHistoryRepository: Repository<AlertHistory>,
    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkAllAlerts() {
    const activeAlerts = await this.customAlertRepository.find({
      where: { status: 'active', isEnabled: true },
    });

    this.logger.log(`Checking ${activeAlerts.length} active alerts`);

    for (const alert of activeAlerts) {
      try {
        await this.checkAlert(alert);
      } catch (error) {
        this.logger.error(`Error checking alert ${alert.id}:`, error);
      }
    }
  }

  private async checkAlert(alert: CustomAlert): Promise<void> {
    const shouldTrigger = await this.evaluateAlertCondition(alert);
    
    if (shouldTrigger) {
      await this.triggerAlert(alert);
    }
  }

  private async evaluateAlertCondition(alert: CustomAlert): Promise<boolean> {
    switch (alert.alertType) {
      case AlertType.PRICE:
        return this.checkPriceCondition(alert);
      case AlertType.VOLUME:
        return this.checkVolumeCondition(alert);
      case AlertType.NARRATIVE:
        return this.checkNarrativeCondition(alert);
      case AlertType.WHALE_ACTIVITY:
        return this.checkWhaleActivityCondition(alert);
      default:
        return false;
    }
  }

  private async checkPriceCondition(alert: CustomAlert): Promise<boolean> {
    const { symbol, threshold, percentage, timeWindow } = alert.parameters;
    
    if (!symbol) return false;

    try {
      // TODO: Integrate with actual price data service
      const currentPrice = await this.getCurrentPrice(symbol);
      const previousPrice = await this.getPreviousPrice(symbol, timeWindow || 5);

      switch (alert.condition) {
        case AlertCondition.ABOVE:
          return currentPrice > (threshold || 0);
        case AlertCondition.BELOW:
          return currentPrice < (threshold || 0);
        case AlertCondition.PERCENTAGE_CHANGE:
          const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;
          return Math.abs(percentChange) >= (percentage || 5);
        case AlertCondition.ABSOLUTE_CHANGE:
          const absoluteChange = Math.abs(currentPrice - previousPrice);
          return absoluteChange >= (threshold || 0);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error checking price condition for ${symbol}:`, error);
      return false;
    }
  }

  private async checkVolumeCondition(alert: CustomAlert): Promise<boolean> {
    const { symbol, volumeThreshold, timeWindow } = alert.parameters;
    
    if (!symbol) return false;

    try {
      // TODO: Integrate with actual volume data service
      const currentVolume = await this.getCurrentVolume(symbol);
      const averageVolume = await this.getAverageVolume(symbol, timeWindow || 24);

      switch (alert.condition) {
        case AlertCondition.VOLUME_SPIKE:
          return currentVolume > (averageVolume * (volumeThreshold || 2));
        case AlertCondition.ABOVE:
          return currentVolume > (volumeThreshold || 0);
        case AlertCondition.BELOW:
          return currentVolume < (volumeThreshold || 0);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error checking volume condition for ${symbol}:`, error);
      return false;
    }
  }

  private async checkNarrativeCondition(alert: CustomAlert): Promise<boolean> {
    const { narrativeName, sentimentThreshold } = alert.parameters;
    
    if (!narrativeName) return false;

    try {
      // TODO: Integrate with actual narrative data service
      const narrativeData = await this.getNarrativeData(narrativeName);
      
      switch (alert.condition) {
        case AlertCondition.NARRATIVE_TRENDING:
          return narrativeData.trendingScore > (sentimentThreshold || 0.7);
        case AlertCondition.NARRATIVE_SENTIMENT:
          return Math.abs(narrativeData.sentimentScore) > (sentimentThreshold || 0.5);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error checking narrative condition for ${narrativeName}:`, error);
      return false;
    }
  }

  private async checkWhaleActivityCondition(alert: CustomAlert): Promise<boolean> {
    const { whaleAddress, threshold } = alert.parameters;
    
    if (!whaleAddress) return false;

    try {
      // TODO: Integrate with actual whale tracking service
      const whaleActivity = await this.getWhaleActivity(whaleAddress);
      
      switch (alert.condition) {
        case AlertCondition.WHALE_MOVEMENT:
          return whaleActivity.movementAmount > (threshold || 1000000); // $1M default
        case AlertCondition.ABOVE:
          return whaleActivity.balance > (threshold || 0);
        case AlertCondition.BELOW:
          return whaleActivity.balance < (threshold || 0);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error checking whale activity for ${whaleAddress}:`, error);
      return false;
    }
  }

  private async triggerAlert(alert: CustomAlert): Promise<void> {
    // Check if alert was recently triggered to avoid spam
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
    if (alert.lastTriggeredAt && 
        Date.now() - alert.lastTriggeredAt.getTime() < cooldownPeriod) {
      return;
    }

    // Update alert trigger count and timestamp
    alert.triggerCount += 1;
    alert.lastTriggeredAt = new Date();
    await this.customAlertRepository.save(alert);

    // Create alert history record
    const historyRecord = this.alertHistoryRepository.create({
      alertId: alert.id,
      userId: alert.userId,
      alertName: alert.name,
      status: AlertTriggerStatus.TRIGGERED,
      triggerData: await this.getTriggerData(alert),
      notificationResults: {},
      triggeredAt: new Date(),
    });

    await this.alertHistoryRepository.save(historyRecord);

    // Send notifications
    await this.notificationService.sendAlertNotifications(alert, historyRecord);
  }

  private async getTriggerData(alert: CustomAlert): Promise<any> {
    // This would contain the actual data that triggered the alert
    switch (alert.alertType) {
      case AlertType.PRICE:
        return {
          currentValue: await this.getCurrentPrice(alert.parameters.symbol),
          threshold: alert.parameters.threshold,
          symbol: alert.parameters.symbol,
        };
      case AlertType.VOLUME:
        return {
          currentValue: await this.getCurrentVolume(alert.parameters.symbol),
          threshold: alert.parameters.volumeThreshold,
          symbol: alert.parameters.symbol,
        };
      case AlertType.NARRATIVE:
        return {
          currentValue: await this.getNarrativeData(alert.parameters.narrativeName),
          threshold: alert.parameters.sentimentThreshold,
          narrativeName: alert.parameters.narrativeName,
        };
      case AlertType.WHALE_ACTIVITY:
        return {
          currentValue: await this.getWhaleActivity(alert.parameters.whaleAddress),
          threshold: alert.parameters.threshold,
          whaleAddress: alert.parameters.whaleAddress,
        };
      default:
        return {};
    }
  }

  // Mock data methods - these would be replaced with actual service calls
  private async getCurrentPrice(symbol: string): Promise<number> {
    // TODO: Integrate with price data service
    return Math.random() * 1000;
  }

  private async getPreviousPrice(symbol: string, minutes: number): Promise<number> {
    // TODO: Integrate with price data service
    return Math.random() * 1000;
  }

  private async getCurrentVolume(symbol: string): Promise<number> {
    // TODO: Integrate with volume data service
    return Math.random() * 1000000;
  }

  private async getAverageVolume(symbol: string, hours: number): Promise<number> {
    // TODO: Integrate with volume data service
    return Math.random() * 500000;
  }

  private async getNarrativeData(narrativeName: string): Promise<any> {
    // TODO: Integrate with narrative service
    return {
      trendingScore: Math.random(),
      sentimentScore: (Math.random() - 0.5) * 2,
    };
  }

  private async getWhaleActivity(whaleAddress: string): Promise<any> {
    // TODO: Integrate with whale tracking service
    return {
      balance: Math.random() * 10000000,
      movementAmount: Math.random() * 5000000,
    };
  }
} 