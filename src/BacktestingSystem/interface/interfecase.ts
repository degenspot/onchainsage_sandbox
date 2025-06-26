export interface MarketData {
    timestamp: Date;
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }
  
  export interface Signal {
    type: 'BUY' | 'SELL' | 'HOLD';
    timestamp: Date;
    price: number;
    quantity: number;
    confidence: number;
  }
  
  export interface Trade {
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    entryPrice: number;
    exitPrice?: number;
    entryTime: Date;
    exitTime?: Date;
    pnl?: number;
    commission: number;
  }
  
  export interface Portfolio {
    cash: number;
    positions: Map<string, number>;
    totalValue: number;
    trades: Trade[];
  }
  
  export interface StrategyConfig {
    name: string;
    parameters: Record<string, any>;
    riskManagement: {
      maxPositionSize: number;
      stopLoss?: number;
      takeProfit?: number;
      maxDrawdown: number;
    };
    commission: number;
  }
  
  export interface BacktestResult {
    strategyName: string;
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    profitFactor: number;
    calmarRatio: number;
    trades: Trade[];
    equityCurve: Array<{ timestamp: Date; value: number }>;
  }
  
  export interface OptimizationResult {
    parameters: Record<string, any>;
    performance: BacktestResult;
    score: number;
  }
  