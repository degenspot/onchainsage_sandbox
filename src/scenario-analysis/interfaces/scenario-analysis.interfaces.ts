export interface MarketCondition {
  symbol: string;
  price: number;
  volatility: number;
  volume: number;
  timestamp: Date;
}

export interface TradingStrategy {
  id: string;
  name: string;
  type: 'long' | 'short' | 'neutral';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface ScenarioParameters {
  name: string;
  description: string;
  duration: number; // in days
  marketConditions: MarketCondition[];
  strategies: TradingStrategy[];
}

export interface ScenarioResult {
  scenarioId: string;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  winRate: number;
  profitFactor: number;
  riskMetrics: RiskMetrics;
}

export interface RiskMetrics {
  var95: number; // Value at Risk 95%
  var99: number; // Value at Risk 99%
  expectedShortfall: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
}

export interface StressTestScenario {
  name: string;
  type: 'market_crash' | 'volatility_spike' | 'interest_rate_change' | 'liquidity_crisis';
  severity: 'mild' | 'moderate' | 'severe';
  parameters: Record<string, number>;
}

export interface AlertConfiguration {
  id: string;
  name: string;
  riskMetric: keyof RiskMetrics;
  threshold: number;
  condition: 'above' | 'below';
  enabled: boolean;
}

export interface VisualizationData {
  scenarioId: string;
  timeSeries: TimeSeriesPoint[];
  riskDistribution: DistributionPoint[];
  performanceMetrics: PerformanceMetric[];
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  metric: string;
}

export interface DistributionPoint {
  value: number;
  probability: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  benchmark?: number;
}