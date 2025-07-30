import { Injectable } from '@nestjs/common';
import { RiskLevel } from './entities/wallet-health.entity';

interface TokenData {
  symbol: string;
  balance: string;
  value: number;
  address: string;
}

interface WalletData {
  tokens: TokenData[];
  totalValue: number;
}

@Injectable()
export class RiskAnalysisService {
  private suspiciousTokens = new Set([
    // Add known scam/suspicious token addresses
    '0x123...', // Example addresses
  ]);

  async getWalletData(address: string): Promise<WalletData> {
    // Integrate with services like Moralis, Alchemy, or similar
    // This is a mock implementation
    return {
      tokens: [
        { symbol: 'ETH', balance: '10.5', value: 25000, address: '0x...' },
        { symbol: 'USDC', balance: '5000', value: 5000, address: '0x...' },
        { symbol: 'WBTC', balance: '0.5', value: 15000, address: '0x...' },
      ],
      totalValue: 45000,
    };
  }

  async analyzeRisk(walletData: WalletData) {
    const { tokens, totalValue } = walletData;
    
    // Calculate diversification score
    const diversificationScore = this.calculateDiversificationScore(tokens);
    
    // Calculate exposure score
    const exposureScore = this.calculateExposureScore(tokens);
    
    // Calculate liquidity score
    const liquidityScore = this.calculateLiquidityScore(tokens);
    
    // Overall score is weighted average
    const overallScore = (diversificationScore * 0.4 + exposureScore * 0.3 + liquidityScore * 0.3);
    
    const riskLevel = this.determineRiskLevel(overallScore);
    
    const tokenBreakdown = tokens.map(token => ({
      symbol: token.symbol,
      balance: token.balance,
      value: token.value,
      percentage: (token.value / totalValue) * 100,
      riskScore: this.calculateTokenRiskScore(token),
      isSuspicious: this.suspiciousTokens.has(token.address),
    }));

    const recommendations = this.generateRecommendations(
      overallScore,
      diversificationScore,
      exposureScore,
      liquidityScore,
      tokenBreakdown
    );

    return {
      overallScore,
      exposureScore,
      diversificationScore,
      liquidityScore,
      riskLevel,
      totalValue,
      tokenBreakdown,
      recommendations,
    };
  }

  private calculateDiversificationScore(tokens: TokenData[]): number {
    // Higher score for more diverse holdings
    const tokenCount = tokens.length;
    if (tokenCount <= 1) return 20;
    if (tokenCount <= 3) return 50;
    if (tokenCount <= 5) return 75;
    return 90;
  }

  private calculateExposureScore(tokens: TokenData[]): number {
    // Check for concentration risk
    const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
    const maxPercentage = Math.max(...tokens.map(token => (token.value / totalValue) * 100));
    
    if (maxPercentage > 80) return 20;
    if (maxPercentage > 60) return 40;
    if (maxPercentage > 40) return 65;
    return 85;
  }

  private calculateLiquidityScore(tokens: TokenData[]): number {
    // Mock liquidity scoring based on token types
    const liquidTokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI'];
    const liquidValue = tokens
      .filter(token => liquidTokens.includes(token.symbol))
      .reduce((sum, token) => sum + token.value, 0);
    
    const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
    const liquidityRatio = liquidValue / totalValue;
    
    return liquidityRatio * 100;
  }

  private calculateTokenRiskScore(token: TokenData): number {
    // Mock risk scoring
    const riskScores = {
      'ETH': 10,
      'USDC': 5,
      'USDT': 8,
      'WBTC': 15,
      'DAI': 12,
    };
    
    return riskScores[token.symbol] || 50; // Default medium risk
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.LOW;
    if (score >= 60) return RiskLevel.MEDIUM;
    if (score >= 40) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  private generateRecommendations(
    overallScore: number,
    diversificationScore: number,
    exposureScore: number,
    liquidityScore: number,
    tokenBreakdown: any[]
  ) {
    const recommendations = [];

    if (diversificationScore < 60) {
      recommendations.push({
        type: 'diversification',
        severity: 'medium',
        message: 'Your portfolio lacks diversification',
        action: 'Consider adding different types of assets to reduce risk'
      });
    }

    if (exposureScore < 50) {
      recommendations.push({
        type: 'concentration',
        severity: 'high',
        message: 'High concentration risk detected',
        action: 'Reduce your largest position to improve risk distribution'
      });
    }

    if (liquidityScore < 40) {
      recommendations.push({
        type: 'liquidity',
        severity: 'medium',
        message: 'Low liquidity in your portfolio',
        action: 'Consider adding more liquid assets like ETH or stablecoins'
      });
    }

    const suspiciousTokens = tokenBreakdown.filter(token => token.isSuspicious);
    if (suspiciousTokens.length > 0) {
      recommendations.push({
        type: 'security',
        severity: 'critical',
        message: 'Suspicious tokens detected in your wallet',
        action: 'Review and consider removing suspicious token holdings'
      });
    }

    return recommendations;
  }
}
