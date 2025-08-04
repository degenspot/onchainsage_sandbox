import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CustomAlert, NotificationChannel } from './entities/custom-alert.entity';
import { AlertHistory } from './entities/alert-history.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async sendAlertNotifications(alert: CustomAlert, historyRecord: AlertHistory): Promise<void> {
    const notificationPromises = alert.notificationChannels.map(channel =>
      this.sendNotification(channel, alert, historyRecord)
    );

    const results = await Promise.allSettled(notificationPromises);
    
    // Update notification results in history
    const notificationResults: any = {};
    alert.notificationChannels.forEach((channel, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        notificationResults[channel] = { sent: true };
      } else {
        notificationResults[channel] = { 
          sent: false, 
          error: result.reason?.message || 'Unknown error' 
        };
      }
    });

    historyRecord.notificationResults = notificationResults;
    // Note: You would need to inject the repository to save this update
    // For now, we'll just log the results
    this.logger.log(`Notification results for alert ${alert.id}:`, notificationResults);
  }

  private async sendNotification(
    channel: NotificationChannel, 
    alert: CustomAlert, 
    historyRecord: AlertHistory
  ): Promise<void> {
    const message = this.formatAlertMessage(alert, historyRecord);

    switch (channel) {
      case NotificationChannel.EMAIL:
        await this.sendEmailNotification(alert, message);
        break;
      case NotificationChannel.SMS:
        await this.sendSmsNotification(alert, message);
        break;
      case NotificationChannel.PUSH:
        await this.sendPushNotification(alert, message);
        break;
      case NotificationChannel.WEBHOOK:
        await this.sendWebhookNotification(alert, message);
        break;
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  private async sendEmailNotification(alert: CustomAlert, message: string): Promise<void> {
    const emailConfig = alert.notificationConfig.email;
    if (!emailConfig) {
      throw new Error('Email configuration not found');
    }

    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    const emailData = {
      to: emailConfig,
      subject: `Alert: ${alert.name}`,
      text: message,
      html: this.formatEmailHtml(alert, message),
    };

    try {
      // Mock email sending - replace with actual email service
      this.logger.log(`Sending email to ${emailConfig}: ${message}`);
      
      // Example with SendGrid:
      // await this.sendGridService.send(emailData);
      
      // Example with AWS SES:
      // await this.sesService.sendEmail(emailData);
      
    } catch (error) {
      this.logger.error('Failed to send email notification:', error);
      throw error;
    }
  }

  private async sendSmsNotification(alert: CustomAlert, message: string): Promise<void> {
    const phoneConfig = alert.notificationConfig.phone;
    if (!phoneConfig) {
      throw new Error('Phone configuration not found');
    }

    // TODO: Integrate with actual SMS service (Twilio, AWS SNS, etc.)
    const smsData = {
      to: phoneConfig,
      message: message,
    };

    try {
      // Mock SMS sending - replace with actual SMS service
      this.logger.log(`Sending SMS to ${phoneConfig}: ${message}`);
      
      // Example with Twilio:
      // await this.twilioService.sendSms(smsData);
      
      // Example with AWS SNS:
      // await this.snsService.sendSms(smsData);
      
    } catch (error) {
      this.logger.error('Failed to send SMS notification:', error);
      throw error;
    }
  }

  private async sendPushNotification(alert: CustomAlert, message: string): Promise<void> {
    const pushToken = alert.notificationConfig.pushToken;
    if (!pushToken) {
      throw new Error('Push token not found');
    }

    // TODO: Integrate with actual push notification service (Firebase, OneSignal, etc.)
    const pushData = {
      token: pushToken,
      title: `Alert: ${alert.name}`,
      body: message,
      data: {
        alertId: alert.id,
        alertType: alert.alertType,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      // Mock push notification - replace with actual push service
      this.logger.log(`Sending push notification to ${pushToken}: ${message}`);
      
      // Example with Firebase:
      // await this.firebaseService.sendPushNotification(pushData);
      
      // Example with OneSignal:
      // await this.oneSignalService.sendPushNotification(pushData);
      
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      throw error;
    }
  }

  private async sendWebhookNotification(alert: CustomAlert, message: string): Promise<void> {
    const webhookUrl = alert.notificationConfig.webhookUrl;
    if (!webhookUrl) {
      throw new Error('Webhook URL not found');
    }

    const webhookData = {
      alert: {
        id: alert.id,
        name: alert.name,
        type: alert.alertType,
        condition: alert.condition,
        parameters: alert.parameters,
      },
      message,
      timestamp: new Date().toISOString(),
      triggerData: {}, // This would contain the actual trigger data
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(webhookUrl, webhookData, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OnChainSage-Alerts/1.0',
          },
          timeout: 10000, // 10 second timeout
        })
      );

      if (response.status >= 400) {
        throw new Error(`Webhook returned status ${response.status}`);
      }

      this.logger.log(`Webhook notification sent to ${webhookUrl}`);
    } catch (error) {
      this.logger.error('Failed to send webhook notification:', error);
      throw error;
    }
  }

  private formatAlertMessage(alert: CustomAlert, historyRecord: AlertHistory): string {
    const triggerData = historyRecord.triggerData;
    
    switch (alert.alertType) {
      case 'price':
        return `🚨 Price Alert: ${alert.parameters.symbol} is now $${triggerData.currentValue?.toFixed(2)} (Threshold: $${triggerData.threshold})`;
      
      case 'volume':
        return `📊 Volume Alert: ${alert.parameters.symbol} volume is ${this.formatVolume(triggerData.currentValue)} (Threshold: ${this.formatVolume(triggerData.threshold)})`;
      
      case 'narrative':
        return `📰 Narrative Alert: "${alert.parameters.narrativeName}" is trending with score ${triggerData.currentValue?.trendingScore?.toFixed(2)}`;
      
      case 'whale_activity':
        return `🐋 Whale Alert: ${alert.parameters.whaleAddress} moved $${this.formatCurrency(triggerData.currentValue?.movementAmount)}`;
      
      default:
        return `Alert: ${alert.name} - ${alert.description}`;
    }
  }

  private formatEmailHtml(alert: CustomAlert, message: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; }
            .header { color: #856404; font-weight: bold; margin-bottom: 10px; }
            .details { margin-top: 15px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="alert">
            <div class="header">🚨 OnChainSage Alert</div>
            <div>${message}</div>
            <div class="details">
              <strong>Alert:</strong> ${alert.name}<br>
              <strong>Type:</strong> ${alert.alertType}<br>
              <strong>Condition:</strong> ${alert.condition}<br>
              <strong>Time:</strong> ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private formatVolume(volume: number): string {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  }

  private formatCurrency(amount: number): string {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  }
} 