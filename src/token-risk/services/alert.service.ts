import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RiskAssessment, AlertConfig } from '../interfaces/token-risk.interface';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async triggerAlert(assessment: RiskAssessment, config: AlertConfig = this.getDefaultConfig()): Promise<void> {
    if (!config.enableRealTimeAlerts || assessment.overallRiskScore < config.riskThreshold) {
      return;
    }

    this.logger.warn(`HIGH RISK ALERT: ${assessment.tokenAddress} - Score: ${assessment.overallRiskScore}`);

    // Emit event for real-time notifications
    this.eventEmitter.emit('token.high-risk-detected', assessment);

    // Send alerts through configured channels
    const alertPromises = config.alertChannels.map(channel => {
      switch (channel) {
        case 'email':
          return this.sendEmailAlert(assessment);
        case 'webhook':
          return this.sendWebhookAlert(assessment);
        case 'database':
          return this.saveAlertToDatabase(assessment);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(alertPromises);
  }

  private async sendEmailAlert(assessment: RiskAssessment): Promise<void> {
    // Implementation would integrate with email service (SendGrid, AWS SES, etc.)
    this.logger.log(`Email alert sent for ${assessment.tokenAddress}`);
  }

  private async sendWebhookAlert(assessment: RiskAssessment): Promise<void> {
    // Implementation would send HTTP POST to configured webhook URL
    this.logger.log(`Webhook alert sent for ${assessment.tokenAddress}`);
  }

  private async saveAlertToDatabase(assessment: RiskAssessment): Promise<void> {
    // Implementation would save to alerts table
    this.logger.log(`Database alert saved for ${assessment.tokenAddress}`);
  }

  private getDefaultConfig(): AlertConfig {
    return {
      riskThreshold: 70,
      enableRealTimeAlerts: true,
      alertChannels: ['database', 'webhook'],
    };
  }
}