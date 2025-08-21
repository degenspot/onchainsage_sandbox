export interface TokenMetrics {
  tokenAddress: string;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  holderCount: number;
  topHolderPercentage: number;
  contractAge: number;
  transactionCount: number;
  timestamp: Date;
}

export interface RiskFactors {
  liquidityWithdrawal: number;
  contractChanges: number;
  tradingPatterns: number;
  holderDistribution: number;
  priceVolatility: number;
}

export interface RiskAssessment {
  tokenAddress: string;
  overallRiskScore: number; // 0-100 (100 = highest risk)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: RiskFactors;
  anomalies: string[];
  recommendation: string;
  confidence: number;
  timestamp: Date;
}

export interface AlertConfig {
  riskThreshold: number;
  enableRealTimeAlerts: boolean;
  alertChannels: ('email' | 'webhook' | 'database')[];
}