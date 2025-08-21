import { Injectable, Logger } from '@nestjs/common';
import { TokenMetrics, RiskFactors, RiskAssessment } from '../interfaces/token-risk.interface';

@Injectable()
export class MLRiskAnalyzerService {
  private readonly logger = new Logger(MLRiskAnalyzerService.name);

  // ML model weights (in production, these would be loaded from trained model)
  private readonly modelWeights = {
    liquidityWithdrawal: 0.35,
    contractChanges: 0.25,
    tradingPatterns: 0.20,
    holderDistribution: 0.15,
    priceVolatility: 0.05
  };

  async analyzeToken(
    currentMetrics: TokenMetrics,
    historicalMetrics: TokenMetrics[]
  ): Promise<RiskAssessment> {
    try {
      const riskFactors = await this.calculateRiskFactors(currentMetrics, historicalMetrics);
      const overallRiskScore = this.calculateOverallRisk(riskFactors);
      const anomalies = this.detectAnomalies(currentMetrics, historicalMetrics);
      
      const assessment: RiskAssessment = {
        tokenAddress: currentMetrics.tokenAddress,
        overallRiskScore,
        riskLevel: this.determineRiskLevel(overallRiskScore),
        riskFactors,
        anomalies,
        recommendation: this.generateRecommendation(overallRiskScore, anomalies),
        confidence: this.calculateConfidence(historicalMetrics.length, anomalies.length),
        timestamp: new Date()
      };

      this.logger.log(`Risk assessment completed for ${currentMetrics.tokenAddress}: ${overallRiskScore}`);
      return assessment;
    } catch (error) {
      this.logger.error(`Risk analysis failed for ${currentMetrics.tokenAddress}:`, error);
      throw error;
    }
  }

  private async calculateRiskFactors(
    current: TokenMetrics,
    historical: TokenMetrics[]
  ): Promise<RiskFactors> {
    const liquidityRisk = this.analyzeLiquidityWithdrawal(current, historical);
    const contractRisk = this.analyzeContractChanges(current, historical);
    const tradingRisk = this.analyzeTradingPatterns(current, historical);
    const holderRisk = this.analyzeHolderDistribution(current);
    const volatilityRisk = this.analyzePriceVolatility(current, historical);

    return {
      liquidityWithdrawal: liquidityRisk,
      contractChanges: contractRisk,
      tradingPatterns: tradingRisk,
      holderDistribution: holderRisk,
      priceVolatility: volatilityRisk
    };
  }

  private analyzeLiquidityWithdrawal(current: TokenMetrics, historical: TokenMetrics[]): number {
    if (historical.length < 2) return 0;

    const recentHistory = historical.slice(-7); // Last 7 data points
    const avgHistoricalLiquidity = recentHistory.reduce((sum, m) => sum + m.liquidity, 0) / recentHistory.length;
    
    const liquidityDrop = (avgHistoricalLiquidity - current.liquidity) / avgHistoricalLiquidity;
    
    // High risk if liquidity dropped more than 50%
    if (liquidityDrop > 0.5) return 95;
    if (liquidityDrop > 0.3) return 75;
    if (liquidityDrop > 0.15) return 50;
    
    return Math.max(0, liquidityDrop * 100);
  }

  private analyzeContractChanges(current: TokenMetrics, historical: TokenMetrics[]): number {
    // In a real implementation, this would check for contract upgrades, 
    // proxy changes, ownership transfers, etc.
    // For now, we'll use transaction count spikes as a proxy
    
    if (historical.length < 5) return 0;

    const recentHistory = historical.slice(-5);
    const avgTxCount = recentHistory.reduce((sum, m) => sum + m.transactionCount, 0) / recentHistory.length;
    const txSpike = (current.transactionCount - avgTxCount) / avgTxCount;

    // Sudden spike in transactions might indicate contract manipulation
    if (txSpike > 3) return 80; // 300% increase
    if (txSpike > 2) return 60;
    if (txSpike > 1) return 40;

    return 0;
  }

  private analyzeTradingPatterns(current: TokenMetrics, historical: TokenMetrics[]): number {
    if (historical.length < 3) return 0;

    const recentHistory = historical.slice(-3);
    const avgVolume = recentHistory.reduce((sum, m) => sum + m.volume24h, 0) / recentHistory.length;
    
    const volumeAnomaly = Math.abs(current.volume24h - avgVolume) / avgVolume;
    const priceVolatility = Math.abs(current.priceChange24h);

    // Combine volume anomaly and price volatility
    let risk = 0;
    
    // Unusual volume patterns
    if (volumeAnomaly > 5) risk += 40; // 500% volume change
    else if (volumeAnomaly > 2) risk += 25;
    else if (volumeAnomaly > 1) risk += 15;

    // Price volatility
    if (priceVolatility > 80) risk += 35; // 80% price change
    else if (priceVolatility > 50) risk += 25;
    else if (priceVolatility > 30) risk += 15;

    return Math.min(100, risk);
  }

  private analyzeHolderDistribution(current: TokenMetrics): number {
    // High concentration in top holders is risky
    if (current.topHolderPercentage > 80) return 90;
    if (current.topHolderPercentage > 60) return 70;
    if (current.topHolderPercentage > 40) return 50;
    if (current.topHolderPercentage > 25) return 30;
    
    return 10; // Some baseline risk
  }

  private analyzePriceVolatility(current: TokenMetrics, historical: TokenMetrics[]): number {
    if (historical.length < 5) return 0;

    const priceChanges = historical.slice(-5).map(h => h.priceChange24h);
    const volatility = this.calculateStandardDeviation(priceChanges);
    
    // High volatility indicates instability
    if (volatility > 50) return 80;
    if (volatility > 30) return 60;
    if (volatility > 20) return 40;
    if (volatility > 10) return 20;
    
    return 0;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private calculateOverallRisk(riskFactors: RiskFactors): number {
    const weightedRisk = 
      riskFactors.liquidityWithdrawal * this.modelWeights.liquidityWithdrawal +
      riskFactors.contractChanges * this.modelWeights.contractChanges +
      riskFactors.tradingPatterns * this.modelWeights.tradingPatterns +
      riskFactors.holderDistribution * this.modelWeights.holderDistribution +
      riskFactors.priceVolatility * this.modelWeights.priceVolatility;

    return Math.round(Math.min(100, Math.max(0, weightedRisk)));
  }

  private detectAnomalies(current: TokenMetrics, historical: TokenMetrics[]): string[] {
    const anomalies: string[] = [];

    if (historical.length >= 2) {
      const recent = historical[historical.length - 1];
      
      // Liquidity anomalies
      const liquidityDrop = (recent.liquidity - current.liquidity) / recent.liquidity;
      if (liquidityDrop > 0.5) {
        anomalies.push(`Severe liquidity withdrawal detected: ${(liquidityDrop * 100).toFixed(1)}% decrease`);
      }

      // Volume anomalies
      const volumeChange = (current.volume24h - recent.volume24h) / recent.volume24h;
      if (Math.abs(volumeChange) > 3) {
        anomalies.push(`Unusual trading volume: ${(volumeChange * 100).toFixed(1)}% change`);
      }

      // Price anomalies
      if (Math.abs(current.priceChange24h) > 70) {
        anomalies.push(`Extreme price movement: ${current.priceChange24h.toFixed(1)}%`);
      }
    }

    // Holder concentration
    if (current.topHolderPercentage > 70) {
      anomalies.push(`High holder concentration: ${current.topHolderPercentage.toFixed(1)}% in top wallets`);
    }

    return anomalies;
  }

  private determineRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 35) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendation(riskScore: number, anomalies: string[]): string {
    if (riskScore >= 80) {
      return 'CRITICAL: Immediate exit recommended. Multiple red flags detected suggesting possible rug pull.';
    }
    if (riskScore >= 60) {
      return 'HIGH RISK: Exercise extreme caution. Consider reducing position or exiting entirely.';
    }
    if (riskScore >= 35) {
      return 'MEDIUM RISK: Monitor closely. Consider risk management strategies.';
    }
    return 'LOW RISK: Token appears stable, but continue monitoring.';
  }

  private calculateConfidence(historicalDataPoints: number, anomalyCount: number): number {
    let confidence = 0.5; // Base confidence

    // More historical data increases confidence
    confidence += Math.min(0.4, historicalDataPoints * 0.05);

    // More anomalies detected increases confidence in assessment
    confidence += Math.min(0.1, anomalyCount * 0.02);

    return Math.round(confidence * 100) / 100;
  }
}