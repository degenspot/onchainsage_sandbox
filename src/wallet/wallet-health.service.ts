import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { WalletHealth, RiskLevel } from './entities/wallet-health.entity';
import { WalletService } from './wallet.service';
import { RiskAnalysisService } from './risk-analysis.service';
import { WalletHealthResponseDto } from './dto/wallet-health-response.dto';

@Injectable()
export class WalletHealthService {
  constructor(
    @InjectRepository(WalletHealth)
    private walletHealthRepository: Repository<WalletHealth>,
    private walletService: WalletService,
    private riskAnalysisService: RiskAnalysisService,
  ) {}

  async getWalletHealth(address: string): Promise<WalletHealthResponseDto> {
    const wallet = await this.walletService.getWalletByAddress(address);
    
    // Get latest health data or analyze current state
    let latestHealth = await this.walletHealthRepository.findOne({
      where: { walletId: wallet.id },
      order: { timestamp: 'DESC' },
    });

    // If no recent data, analyze current wallet state
    if (!latestHealth || this.isHealthDataStale(latestHealth.timestamp)) {
      latestHealth = await this.analyzeWalletHealth(wallet.id, address);
    }

    const alerts = await this.walletService.getWalletAlerts(address);

    return {
      id: wallet.id,
      address: wallet.address,
      ensName: wallet.ensName,
      overallScore: Number(latestHealth.overallScore),
      exposureScore: Number(latestHealth.exposureScore),
      diversificationScore: Number(latestHealth.diversificationScore),
      liquidityScore: Number(latestHealth.liquidityScore),
      riskLevel: latestHealth.riskLevel,
      totalValue: Number(latestHealth.totalValue),
      tokenBreakdown: latestHealth.tokenBreakdown,
      recommendations: latestHealth.recommendations,
      alerts: alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        isRead: alert.isRead,
        createdAt: alert.createdAt,
      })),
    };
  }

  async getHealthHistory(address: string, days: number) {
    const wallet = await this.walletService.getWalletByAddress(address);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return await this.walletHealthRepository.find({
      where: { 
        walletId: wallet.id,
        timestamp: MoreThan(fromDate)
      },
      order: { timestamp: 'ASC' },
    });
  }

  private async analyzeWalletHealth(walletId: string, address: string): Promise<WalletHealth> {
    // Get current wallet data from blockchain
    const walletData = await this.riskAnalysisService.getWalletData(address);
    const analysis = await this.riskAnalysisService.analyzeRisk(walletData);

    const healthRecord = this.walletHealthRepository.create({
      walletId,
      overallScore: analysis.overallScore,
      exposureScore: analysis.exposureScore,
      diversificationScore: analysis.diversificationScore,
      liquidityScore: analysis.liquidityScore,
      riskLevel: analysis.riskLevel,
      totalValue: analysis.totalValue,
      tokenBreakdown: analysis.tokenBreakdown,
      recommendations: analysis.recommendations,
    });

    return await this.walletHealthRepository.save(healthRecord);
  }

  private isHealthDataStale(timestamp: Date): boolean {
    const now = new Date();
    const diffInMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);
    return diffInMinutes > 30; // Consider data stale after 30 minutes
  }
}