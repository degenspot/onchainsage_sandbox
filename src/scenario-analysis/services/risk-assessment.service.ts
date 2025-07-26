import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskAssessment } from '../entities/risk-assessment.entity';
import { RiskMetrics } from '../interfaces/scenario-analysis.interfaces';

@Injectable()
export class RiskAssessmentService {
  private readonly logger = new Logger(RiskAssessmentService.name);

  constructor(
    @InjectRepository(RiskAssessment)
    private riskAssessmentRepository: Repository<RiskAssessment>,
  ) {}

  async calculateRiskMetrics(strategyResults: any, marketData: any[]): Promise<RiskMetrics> {
    this.logger.log('Calculating risk metrics');
    
    const returns = this.extractReturns(strategyResults, marketData);
    
    const var95 = this.calculateVaR(returns, 0.95);
    const var99 = this.calculateVaR(returns, 0.99);
    const expectedShortfall = this.calculateExpectedShortfall(returns, 0.95);
    const maxDrawdown = this.calculateMaxDrawdown(returns);
    const beta = this.calculateBeta(returns, this.getMarketReturns(marketData));
    const alpha = this.calculateAlpha(returns, beta, this.getMarketReturns(marketData));

    return {
      var95,
      var99,
      expectedShortfall,
      maxDrawdown,
      beta,
      alpha,
    };
  }

  private extractReturns(strategyResults: any, marketData: any[]): number[] {
    // Extract daily returns from strategy results
    // This is a simplified implementation
    return marketData.map((_, index) => {
      if (index === 0) return 0;
      return (Math.random() - 0.5) * 0.02; // Simulated returns for demo
    });
  }

  private calculateVaR(returns: number[], confidenceLevel: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    return -sortedReturns[index]; // VaR is typically expressed as positive value
  }

  private calculateExpectedShortfall(returns: number[], confidenceLevel: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const cutoffIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, cutoffIndex);
    const averageTailReturn = tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
    return -averageTailReturn;
  }

  private calculateMaxDrawdown(returns: number[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;

    for (const ret of returns) {
      cumulative += ret;
      peak = Math.max(peak, cumulative);
      const drawdown = peak - cumulative;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }

  private calculateBeta(portfolioReturns: number[], marketReturns: number[]): number {
    const n = Math.min(portfolioReturns.length, marketReturns.length);
    const portfolioMean = portfolioReturns.slice(0, n).reduce((sum, ret) => sum + ret, 0) / n;
    const marketMean = marketReturns.slice(0, n).reduce((sum, ret) => sum + ret, 0) / n;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < n; i++) {
      covariance += (portfolioReturns[i] - portfolioMean) * (marketReturns[i] - marketMean);
      marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
    }

    return covariance / marketVariance;
  }

  private calculateAlpha(portfolioReturns: number[], beta: number, marketReturns: number[]): number {
    const riskFreeRate = 0.02 / 365; // 2% annual risk-free rate, daily
    const portfolioMean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
    const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;
    
    return portfolioMean - riskFreeRate - beta * (marketMean - riskFreeRate);
  }

  private getMarketReturns(marketData: any[]): number[] {
    // Extract market returns (simplified)
    return marketData.map((_, index) => {
      if (index === 0) return 0;
      return (Math.random() - 0.5) * 0.015; // Simulated market returns
    });
  }

  async saveRiskAssessment(scenarioId: string, riskMetrics: RiskMetrics): Promise<RiskAssessment> {
    const assessment = this.riskAssessmentRepository.create({
      scenarioId,
      ...riskMetrics,
      calculatedAt: new Date(),
    });

    return this.riskAssessmentRepository.save(assessment);
  }

  async getRiskAssessment(scenarioId: string): Promise<RiskAssessment> {
    return this.riskAssessmentRepository.findOne({ where: { scenarioId } });
  }
}