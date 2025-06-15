import { Injectable, Logger } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { CommunityHealthData, HealthStatus } from '../interfaces/community-data.interface';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(private readonly telegramService: TelegramService) {}

  async processHealthAlerts(healthData: CommunityHealthData): Promise<void> {
    if (healthData.alerts.length === 0) return;

    const alertMessage = this.formatAlertMessage(healthData);
    
    // Send alerts to administrators or monitoring channels
    await this.sendAlert(alertMessage, healthData);
  }

  private formatAlertMessage(healthData: CommunityHealthData): string {
    const { communityId, platform, healthScore, healthStatus, alerts } = healthData;
    
    return `
🚨 <b>Community Health Alert</b> 🚨

<b>Community:</b> ${communityId}
<b>Platform:</b> ${platform.toUpperCase()}
<b>Health Score:</b> ${healthScore}/100 (${healthStatus.toUpperCase()})
<b>Timestamp:</b> ${healthData.timestamp.toISOString()}

<b>Alerts:</b>
${alerts.map(alert => `• ${alert}`).join('\n')}

<b>Key Metrics:</b>
• Members: ${healthData.metrics.memberCount}
• Active Members: ${healthData.metrics.activeMembers}
• Engagement Rate: ${healthData.metrics.engagementRate.toFixed(2)}%
• Messages: ${healthData.metrics.messageCount}
    `.trim();
  }

  private async sendAlert(message: string, healthData: CommunityHealthData): Promise<void> {
    try {
      // For Telegram communities, send alert to the same chat
      if (healthData.platform === 'telegram') {
        await this.telegramService.sendMessage(healthData.communityId, message);
      }
      
      // Could also send to dedicated monitoring channels or external services
      this.logger.warn(`Community health alert: ${healthData.communityId} - ${healthData.healthStatus}`);
    } catch (error) {
      this.logger.error(`Failed to send health alert: ${error.message}`);
    }
  }
}
