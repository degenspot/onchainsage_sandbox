import { Injectable, Logger } from '@nestjs/common';
import { AlertConfiguration, RiskMetrics } from '../interfaces/scenario-analysis.interfaces';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private alertConfigurations: Map<string, AlertConfiguration[]> = new Map();

  async createAlert(userId: string, alertConfig: AlertConfiguration): Promise<AlertConfiguration> {
    this.logger.log(`Creating alert: ${alertConfig.name} for user: ${userId}`);
    
    const userAlerts = this.alertConfigurations.get(userId) || [];
    userAlerts.push(alertConfig);
    this.alertConfigurations.set(userId, userAlerts);
    
    return alertConfig;
  }

  async checkAlerts(userId: string, riskMetrics: RiskMetrics): Promise<any[]> {
    const userAlerts = this.alertConfigurations.get(userId) || [];
    const triggeredAlerts: any[] = [];

    for (const alert of userAlerts) {
      if (!alert.enabled) continue;

      const metricValue = riskMetrics[alert.riskMetric];
      const isTriggered = this.evaluateAlertCondition(metricValue, alert.threshold, alert.condition);

      if (isTriggered) {
        const triggeredAlert = {
          alertId: alert.id,
          alertName: alert.name,
          riskMetric: alert.riskMetric,
          currentValue: metricValue,
          threshold: alert.threshold,
          condition: alert.condition,
          triggeredAt: new Date(),
          severity: this.calculateAlertSeverity(metricValue, alert.threshold, alert.condition),
        };

        triggeredAlerts.push(triggeredAlert);
        await this.sendAlert(triggeredAlert);
      }
    }

    return triggeredAlerts;
  }

  private evaluateAlertCondition(value: number, threshold: number, condition: 'above' | 'below'): boolean {
    return condition === 'above' ? value > threshold : value < threshold;
  }

  private calculateAlertSeverity(value: number, threshold: number, condition: 'above' | 'below'): 'low' | 'medium' | 'high' {
    const deviation = condition === 'above' ? 
      (value - threshold) / threshold : 
      (threshold - value) / threshold;

    if (deviation > 0.5) return 'high';
    if (deviation > 0.2) return 'medium';
    return 'low';
  }

  private async sendAlert(alert: any): Promise<void> {
    this.logger.warn(`ALERT TRIGGERED: ${alert.alertName} - ${alert.riskMetric}: ${alert.currentValue} ${alert.condition} ${alert.threshold}`);
    
    // Here you would integrate with your notification system
    // For example: email, SMS, webhook, etc.
    
    // Example webhook call:
    // await this.httpService.post('webhook-url', alert).toPromise();
  }

  async getUserAlerts(userId: string): Promise<AlertConfiguration[]> {
    return this.alertConfigurations.get(userId) || [];
  }

  async updateAlert(userId: string, alertId: string, updates: Partial<AlertConfiguration>): Promise<AlertConfiguration> {
    const userAlerts = this.alertConfigurations.get(userId) || [];
    const alertIndex = userAlerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex === -1) {
      throw new Error('Alert not found');
    }

    userAlerts[alertIndex] = { ...userAlerts[alertIndex], ...updates };
    this.alertConfigurations.set(userId, userAlerts);
    
    return userAlerts[alertIndex];
  }

  async deleteAlert(userId: string, alertId: string): Promise<void> {
    const userAlerts = this.alertConfigurations.get(userId) || [];
    const filteredAlerts = userAlerts.filter(alert => alert.id !== alertId);
    this.alertConfigurations.set(userId, filteredAlerts);
  }

  async getDefaultAlertTemplates(): Promise<AlertConfiguration[]> {
    return [
      {
        id: 'high-var-alert',
        name: 'High VaR Alert',
        riskMetric: 'var95',
        threshold: 0.05, // 5%
        condition: 'above',
        enabled: true,
      },
      {
        id: 'max-drawdown-alert',
        name: 'Maximum Drawdown Alert',
        riskMetric: 'maxDrawdown',
        threshold: 0.15, // 15%
        condition: 'above',
        enabled: true,
      },
      {
        id: 'low-alpha-alert',
        name: 'Low Alpha Alert',
        riskMetric: 'alpha',
        threshold: 0,
        condition: 'below',
        enabled: false,
      },
      {
        id: 'high-beta-alert',
        name: 'High Beta Alert',
        riskMetric: 'beta',
        threshold: 1.5,
        condition: 'above',
        enabled: false,
      },
    ];
  }
}