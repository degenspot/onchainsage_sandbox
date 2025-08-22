import { Injectable, Logger } from '@nestjs/common';
import { TechnicalIndicators } from '../interfaces/trading-signal.interface';

interface PriceData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

@Injectable()
export class TechnicalAnalysisService {
  private readonly logger = new Logger(TechnicalAnalysisService.name);

  async calculateIndicators(priceData: PriceData[]): Promise<TechnicalIndicators> {
    if (priceData.length < 50) {
      throw new Error('Insufficient price data for technical analysis');
    }

    const closes = priceData.map(p => p.close);
    const highs = priceData.map(p => p.high);
    const lows = priceData.map(p => p.low);

    const rsi = this.calculateRSI(closes);
    const macd = this.calculateMACD(closes);
    const ema20 = this.calculateEMA(closes, 20);
    const ema50 = this.calculateEMA(closes, 50);
    const bollinger = this.calculateBollingerBands(closes, 20, 2);
    const support = this.findSupport(lows);
    const resistance = this.findResistance(highs);

    return {
      rsi,
      macd,
      ema20,
      ema50,
      bollinger,
      support,
      resistance,
    };
  }

  async generateTechnicalScore(indicators: TechnicalIndicators, currentPrice: number): Promise<number> {
    let score = 50; // Start neutral

    // RSI scoring
    if (indicators.rsi < 30) score += 20; // Oversold - bullish
    else if (indicators.rsi > 70) score -= 20; // Overbought - bearish
    else if (indicators.rsi > 40 && indicators.rsi < 60) score += 5; // Neutral zone

    // MACD scoring
    if (indicators.macd > 0) score += 15; // Bullish momentum
    else score -= 15; // Bearish momentum

    // EMA crossover scoring
    if (indicators.ema20 > indicators.ema50) score += 10; // Golden cross tendency
    else score -= 10; // Death cross tendency

    // Price vs EMA scoring
    if (currentPrice > indicators.ema20) score += 10; // Above short-term trend
    if (currentPrice > indicators.ema50) score += 5; // Above long-term trend

    // Bollinger Bands scoring
    const bollinger = indicators.bollinger;
    if (currentPrice < bollinger.lower) score += 15; // Near lower band - potential bounce
    else if (currentPrice > bollinger.upper) score -= 15; // Near upper band - potential reversal
    
    // Support/Resistance scoring
    const distanceToSupport = (currentPrice - indicators.support) / currentPrice;
    const distanceToResistance = (indicators.resistance - currentPrice) / currentPrice;
    
    if (distanceToSupport < 0.02) score += 10; // Near support
    if (distanceToResistance < 0.02) score -= 10; // Near resistance

    return Math.max(0, Math.min(100, score));
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI for the most recent period
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): number {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12 - ema26;
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2) {
    const sma = prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
    
    const squaredDiffs = prices.slice(-period).map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + (standardDeviation * multiplier),
      middle: sma,
      lower: sma - (standardDeviation * multiplier),
    };
  }

  private findSupport(lows: number[]): number {
    // Simplified support calculation - find recent significant low
    const recentLows = lows.slice(-50); // Last 50 periods
    return Math.min(...recentLows);
  }

  private findResistance(highs: number[]): number {
    // Simplified resistance calculation - find recent significant high
    const recentHighs = highs.slice(-50); // Last 50 periods
    return Math.max(...recentHighs);
  }
}