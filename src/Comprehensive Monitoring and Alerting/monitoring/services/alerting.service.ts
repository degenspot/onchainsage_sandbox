import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface Alert {
  type: 'error' | 'performance' | 'security' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata?: any;
  timestamp?: Date;
  source?: string;
}

export interface AlertChannel {
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: any;
  enabled: boolean;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private alertChannels: AlertChannel[] = [];
  private alertHistory: Alert[] = [];

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async initialize(): Promise<void> {
    this.alertChannels = [
      {
        name: 'slack',
        type: 'slack',
        config: {
          webhookUrl: this.configService.get('SLACK_WEBHOOK_URL'),
          channel: this.configService.get('SLACK_CHANNEL', '#alerts'),
        },
        enabled: !!this.configService.get('SLACK_WEBHOOK_URL'),
      },
      {
        name: 'email',
        type: 'email',
        config: {
          smtpHost: this.configService.get('SMTP_HOST'),
          smtpPort: this.configService.get('SMTP_PORT'),
          recipients: this.configService.get('ALERT_EMAIL_RECIPIENTS', '').split(','),
        },
        enabled: !!this.configService.get('SMTP_HOST'),
      },
      {
        name: 'webhook',
        type: 'webhook',
        config: {
          url: this.configService.get('ALERT_WEBHOOK_URL'),
          headers: {
            'Authorization': `Bearer ${this.configService.get('ALERT_WEBHOOK_TOKEN')}`,
            'Content-Type': 'application/json',
          },
        },
        enabled: !!this.configService.get('ALERT_WEBHOOK_URL'),
      },
    ];

    this.logger.log(`Initialized ${this.alertChannels.filter(c => c.enabled).length} alert channels`);
  }

  async sendAlert(alert: Alert): Promise<void> {
    alert.timestamp = new Date();
    alert.source = this.configService.get('SERVICE_NAME', 'labs-service');
    
    this.alertHistory.push(alert);
    
    // Keep only last 1000 alerts in memory
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }

    const enabledChannels = this.alertChannels.filter(channel => 
      channel.enabled && this.shouldSendToChannel(alert, channel)
    );

    const promises = enabledChannels.map(channel => this.sendToChannel(alert, channel));
    
    try {
      await Promise.allSettled(promises);
      this.logger.log(`Alert sent to ${enabledChannels.length} channels: ${alert.message}`);
    } catch (error) {
      this.logger.error('Failed to send alerts', error);
    }
  }

  private shouldSendToChannel(alert: Alert, channel: AlertChannel): boolean {
    // Implement channel-specific filtering logic
    if (channel.type === 'email' && alert.severity === 'low') {
      return false; // Don't spam email with low severity alerts
    }
    
    if (channel.type === 'sms' && alert.severity !== 'critical') {
      return false; // Only send SMS for critical alerts
    }

    return true;
  }

  private async sendToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    try {
      switch (channel.type) {
        case 'slack':
          await this.sendSlackAlert(alert, channel);
          break;
        case 'email':
          await this.sendEmailAlert(alert, channel);
          break;
        case 'webhook':
          await this.sendWebhookAlert(alert, channel);
          break;
        case 'sms':
          await this.sendSmsAlert(alert, channel);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to send alert to ${channel.name}`, error);
    }
  }

  private async sendSlackAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    const payload = {
      channel: channel.config.channel,
      username: 'Labs Monitor',
      icon_emoji: this.getSeverityEmoji(alert.severity),
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        title: `${alert.type.toUpperCase()} Alert`,
        text: alert.message,
        fields: [
          {
            title: 'Severity',
            value: alert.severity,
            short: true,
          },
          {
            title: 'Source',
            value: alert.source,
            short: true,
          },
          {
            title: 'Timestamp',
            value: alert.timestamp.toISOString(),
            short: true,
          },
        ],
        footer: 'Labs Monitoring System',
        ts: Math.floor(alert.timestamp.getTime() / 1000),
      }],
    };

    await firstValueFrom(
      this.httpService.post(channel.config.webhookUrl, payload)
    );
  }

  private async sendEmailAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    // In production, integrate with your email service (SendGrid, SES, etc.)
    this.logger.log(`Email alert would be sent: ${alert.message}`);
  }

  private async sendWebhookAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    await firstValueFrom(
      this.httpService.post(
        channel.config.url,
        {
          alert,
          service: this.configService.get('SERVICE_NAME'),
          environment: this.configService.get('NODE_ENV'),
        },
        { headers: channel.config.headers }
      )
    );
  }

  private async sendSmsAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    this.logger.log(`SMS alert would be sent: ${alert.message}`);
  }

  private getSeverityEmoji(severity: string): string {
    const emojiMap = {
      low: ':blue_circle:',
      medium: ':yellow_circle:',
      high: ':orange_circle:',
      critical: ':red_circle:',
    };
    return emojiMap[severity] || ':question:';
  }

  private getSeverityColor(severity: string): string {
    const colorMap = {
      low: '#36a64f',
      medium: '#ffcc00',
      high: '#ff9900',
      critical: '#ff0000',
    };
    return colorMap[severity] || '#cccccc';
  }

  async getAlertHistory(filters?: {
    type?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<Alert[]> {
    let filteredAlerts = [...this.alertHistory];

    if (filters?.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
    }

    if (filters?.severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
    }

    if (filters?.startDate) {
      filteredAlerts = filteredAlerts.filter(alert => alert.timestamp >= filters.startDate);
    }

    if (filters?.endDate) {
      filteredAlerts = filteredAlerts.filter(alert => alert.timestamp <= filters.endDate);
    }

    const limit = filters?.limit || 100;
    return filteredAlerts.slice(-limit);
  }
}
