import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskAlert, AlertType } from './entities/risk-alert.entity';
import { RiskLevel } from './entities/wallet-health.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(RiskAlert)
    private riskAlertRepository: Repository<RiskAlert>,
  ) {}

  async createRiskAlert(
    walletId: string,
    type: AlertType,
    title: string,
    description: string,
    severity: RiskLevel,
    metadata?: any
  ): Promise<RiskAlert> {
    const alert = this.riskAlertRepository.create({
      walletId,
      type,
      title,
      description,
      severity,
      metadata,
    });

    return await this.riskAlertRepository.save(alert);
  }

  async sendRiskAlert(alert: RiskAlert) {
    // Implement your notification logic here
    // Email, push notifications, webhooks, etc.
    console.log(`Risk Alert: ${alert.title} - ${alert.description}`);
  }
}