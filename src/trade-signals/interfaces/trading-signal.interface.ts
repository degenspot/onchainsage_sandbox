export interface SocialSentiment {
  tokenAddress: string;
  platform: 'twitter' | 'reddit' | 'telegram' | 'discord';
  sentiment: number; // -1 to 1 (negative to positive)
  volume: number; // Number of mentions
  influencerScore: number; // 0-100
  timestamp: Date;
}

export interface OnChainMetrics {
  tokenAddress: string;
  price: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  holders: number;
  transactions24h: number;
  priceChange24h: number;
  volumeChange24h: number;
  timestamp: Date;
}

export interface TechnicalIndicators {
  rsi: number; // Relative Strength Index
  macd: number; // MACD signal
  ema20: number; // 20-period EMA
  ema50: number; // 50-period EMA
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  support: number;
  resistance: number;
}

export interface SignalParameters {
  name: string;
  description: string;
  weights: {
    sentiment: number; // 0-1
    technical: number; // 0-1
    onChain: number; // 0-1
    volume: number; // 0-1
  };
  thresholds: {
    buySignal: number; // 0-100
    sellSignal: number; // 0-100
    strongBuy: number; // 0-100
    strongSell: number; // 0-100
  };
  filters: {
    minVolume: number;
    minMarketCap: number;
    maxVolatility: number;
    minLiquidity: number;
  };
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
}

export interface TradingSignal {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  signal: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL' | 'HOLD';
  confidence: number; // 0-100
  price: number;
  strength: number; // 0-100
  components: {
    sentimentScore: number;
    technicalScore: number;
    onChainScore: number;
    volumeScore: number;
  };
  reasoning: string[];
  parameters: string; // Parameter set ID used
  timestamp: Date;
  expiresAt: Date;
}

export interface BacktestResult {
  id: string;
  parameterSetId: string;
  startDate: Date;
  endDate: Date;
  totalTrades: number;
  winRate: number; // Percentage
  totalReturn: number; // Percentage
  maxDrawdown: number; // Percentage
  sharpeRatio: number;
  avgHoldingTime: number; // Hours
  trades: BacktestTrade[];
  createdAt: Date;
}

export interface BacktestTrade {
  tokenAddress: string;
  entrySignal: TradingSignal;
  exitSignal?: TradingSignal;
  entryPrice: number;
  exitPrice?: number;
  entryTime: Date;
  exitTime?: Date;
  pnl: number; // Profit/Loss percentage
  status: 'OPEN' | 'CLOSED' | 'STOPPED_OUT';
}
